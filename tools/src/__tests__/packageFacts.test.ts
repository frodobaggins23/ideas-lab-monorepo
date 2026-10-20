import { describe, expect, it } from 'vitest';

import type { CommandRunner } from '../packageFacts.ts';
import {
    gatherPackageFacts,
    lockfileHasInstallScripts,
    parseAuditCounts,
    parseNpmView,
} from '../packageFacts.ts';

describe('parseNpmView', () => {
    it('reads the latest release date, deprecation and own install scripts', () => {
        const view = JSON.stringify({
            name: 'zustand',
            version: '5.0.1',
            'dist-tags': { latest: '5.0.2' },
            time: { '5.0.1': '2026-01-01T00:00:00Z', '5.0.2': '2026-09-01T00:00:00Z' },
            scripts: { postinstall: 'node x.js', test: 'vitest' },
        });

        expect(parseNpmView(view)).toEqual({
            name: 'zustand',
            latestPublishedAt: '2026-09-01T00:00:00Z',
            deprecated: undefined,
            hasOwnInstallScripts: true,
        });
    });

    it('reports the deprecation message of the resolved version', () => {
        const view = JSON.stringify({
            name: 'old',
            'dist-tags': { latest: '1.0.0' },
            time: { '1.0.0': '2020-01-01T00:00:00Z' },
            deprecated: 'use new',
        });

        expect(parseNpmView(view).deprecated).toBe('use new');
    });

    it('throws when the registry has no release time', () => {
        expect(() => parseNpmView(JSON.stringify({ name: 'x', 'dist-tags': {} }))).toThrowError(
            /release/,
        );
    });
});

describe('parseAuditCounts', () => {
    it('reads the vulnerability totals from npm audit --json', () => {
        const audit = JSON.stringify({
            metadata: {
                vulnerabilities: { info: 0, low: 1, moderate: 2, high: 3, critical: 4, total: 10 },
            },
        });

        expect(parseAuditCounts(audit)).toEqual({ critical: 4, high: 3, moderate: 2, low: 1 });
    });
});

describe('lockfileHasInstallScripts', () => {
    it('is true when any locked package declares hasInstallScript', () => {
        const lock = {
            packages: {
                '': {},
                'node_modules/a': {},
                'node_modules/b': { hasInstallScript: true },
            },
        };

        expect(lockfileHasInstallScripts(lock)).toBe(true);
    });

    it('is false otherwise', () => {
        expect(lockfileHasInstallScripts({ packages: { '': {}, 'node_modules/a': {} } })).toBe(
            false,
        );
    });
});

describe('gatherPackageFacts', () => {
    const view = JSON.stringify({
        name: 'zustand',
        'dist-tags': { latest: '5.0.2' },
        time: { '5.0.2': '2026-09-01T00:00:00Z' },
    });
    const audit = JSON.stringify({
        metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 } },
    });

    function runner(
        overrides: Record<string, { stdout: string; code: number }> = {},
    ): CommandRunner {
        const responses: Record<string, { stdout: string; code: number }> = {
            'npm view': { stdout: view, code: 0 },
            'npm install': { stdout: '', code: 0 },
            'npm audit': { stdout: audit, code: 0 },
            'npm audit signatures': { stdout: '', code: 0 },
            ...overrides,
        };
        return async (command, args) => {
            const isSignatures = args[0] === 'audit' && args[1] === 'signatures';
            const response = responses[`${command} ${isSignatures ? 'audit signatures' : args[0]}`];
            if (!response) {
                throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
            }
            return response;
        };
    }

    const deps = (run: CommandRunner) => ({
        run,
        fetchFn: (async () =>
            new Response(JSON.stringify({ downloads: 5_000_000 }))) as unknown as typeof fetch,
        readLockfile: async () => ({ packages: { '': {} } }),
        makeTempDir: async () => '/tmp/dryrun',
        removeDir: async () => {},
    });

    it('combines registry, download, audit and signature results', async () => {
        const facts = await gatherPackageFacts('zustand', deps(runner()));

        expect(facts).toEqual({
            name: 'zustand',
            weeklyDownloads: 5_000_000,
            latestPublishedAt: '2026-09-01T00:00:00Z',
            deprecated: undefined,
            hasInstallScripts: false,
            audit: { critical: 0, high: 0, moderate: 0, low: 0 },
            signaturesValid: true,
        });
    });

    it('marks signatures invalid when npm audit signatures exits non-zero', async () => {
        const facts = await gatherPackageFacts(
            'zustand',
            deps(runner({ 'npm audit signatures': { stdout: '', code: 1 } })),
        );

        expect(facts.signaturesValid).toBe(false);
    });

    it('still reads findings when npm audit exits non-zero because of vulnerabilities', async () => {
        const vulnerable = JSON.stringify({
            metadata: { vulnerabilities: { low: 0, moderate: 0, high: 2, critical: 0 } },
        });

        const facts = await gatherPackageFacts(
            'zustand',
            deps(runner({ 'npm audit': { stdout: vulnerable, code: 1 } })),
        );

        expect(facts.audit.high).toBe(2);
    });

    it('fails loudly when the dry-run install fails', async () => {
        await expect(
            gatherPackageFacts(
                'zustand',
                deps(runner({ 'npm install': { stdout: 'ETARGET', code: 1 } })),
            ),
        ).rejects.toThrowError(/dry-run install/i);
    });
});
