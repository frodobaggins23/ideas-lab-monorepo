import { describe, expect, it, vi } from 'vitest';

import { checkPackages, formatReport } from '../checkPackage.ts';
import type { PackageFacts } from '../evaluatePackage.ts';

const now = new Date('2026-10-19T00:00:00Z');
const allowlist = ['react', '@tanstack/react-query'];
const workspaces = ['@lab/ui', '@lab/config'];

const healthy: PackageFacts = {
    name: 'recharts',
    weeklyDownloads: 2_000_000,
    latestPublishedAt: '2026-09-01T00:00:00Z',
    deprecated: undefined,
    hasInstallScripts: false,
    audit: { critical: 0, high: 0, moderate: 0, low: 0 },
    signaturesValid: true,
};

describe('checkPackages', () => {
    it.each([
        'react',
        'react@19.1.0',
        '@tanstack/react-query',
        '@tanstack/react-query@^5',
        '@lab/ui',
    ])('skips %s without querying the registry', async (spec) => {
        const gather = vi.fn();

        const [result] = await checkPackages([spec], { allowlist, workspaces, gather, now });

        expect(result?.evaluation.passed).toBe(true);
        expect(gather).not.toHaveBeenCalled();
    });

    // The @lab scope is not ours on the public registry, so a name without a local workspace
    // would be downloaded from whoever owns the scope there.
    it.each(['@lab/evil', '@lab/evil@1.0.0'])(
        'fails %s when no workspace has that name, without querying the registry',
        async (spec) => {
            const gather = vi.fn();

            const [result] = await checkPackages([spec], { allowlist, workspaces, gather, now });

            expect(result?.evaluation.passed).toBe(false);
            expect(result?.evaluation.failures).toEqual([
                expect.stringMatching(/not a workspace in this repo/),
            ]);
            expect(gather).not.toHaveBeenCalled();
        },
    );

    it('fails a non-registry source without querying the registry', async () => {
        const gather = vi.fn();

        const [result] = await checkPackages(['github:owner/repo'], {
            allowlist,
            workspaces,
            gather,
            now,
        });

        expect(result?.evaluation.passed).toBe(false);
        expect(result?.evaluation.failures).toEqual([expect.stringMatching(/npm registry/)]);
        expect(gather).not.toHaveBeenCalled();
    });

    it('evaluates an unlisted registry package from its gathered facts', async () => {
        const gather = vi.fn(async () => ({ ...healthy, weeklyDownloads: 10 }));

        const [result] = await checkPackages(['recharts'], { allowlist, workspaces, gather, now });

        expect(gather).toHaveBeenCalledWith('recharts');
        expect(result?.evaluation.passed).toBe(false);
    });
});

describe('formatReport', () => {
    it('lists each package with its failures and warnings', () => {
        const report = formatReport([
            { spec: 'a', evaluation: { passed: true, failures: [], warnings: ['careful'] } },
            { spec: 'b', evaluation: { passed: false, failures: ['too small'], warnings: [] } },
        ]);

        expect(report).toContain('a: PASS');
        expect(report).toContain('careful');
        expect(report).toContain('b: FAIL');
        expect(report).toContain('too small');
    });
});
