import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import type { AuditCounts, PackageFacts } from './evaluatePackage.ts';

const execFileAsync = promisify(execFile);
const installScriptNames = ['preinstall', 'install', 'postinstall'];

export interface CommandResult {
    stdout: string;
    code: number;
}

export type CommandRunner = (
    command: string,
    args: string[],
    options?: { cwd?: string },
) => Promise<CommandResult>;

export interface Lockfile {
    packages?: Record<string, { hasInstallScript?: boolean }>;
}

export interface PackageFactsDeps {
    run: CommandRunner;
    fetchFn: typeof fetch;
    readLockfile: (directory: string) => Promise<Lockfile>;
    makeTempDir: () => Promise<string>;
    removeDir: (directory: string) => Promise<void>;
}

interface NpmView {
    name: string;
    latestPublishedAt: string;
    deprecated: string | undefined;
    hasOwnInstallScripts: boolean;
}

interface RawNpmView {
    name: string;
    'dist-tags'?: Record<string, string>;
    time?: Record<string, string>;
    deprecated?: string;
    scripts?: Record<string, string>;
}

export function parseNpmView(json: string): NpmView {
    const parsed = JSON.parse(json) as RawNpmView | RawNpmView[];
    // A version range can match several versions; npm then returns an array, newest last.
    const view = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
    if (!view) {
        throw new Error('npm view returned no versions');
    }
    const latestVersion = view['dist-tags']?.latest;
    const latestPublishedAt = latestVersion ? view.time?.[latestVersion] : undefined;
    if (!latestPublishedAt) {
        throw new Error(`Could not determine the latest release date of ${view.name}`);
    }
    return {
        name: view.name,
        latestPublishedAt,
        deprecated: view.deprecated,
        hasOwnInstallScripts: installScriptNames.some((script) => view.scripts?.[script]),
    };
}

export function parseAuditCounts(json: string): AuditCounts {
    const { metadata } = JSON.parse(json) as {
        metadata?: { vulnerabilities?: Partial<AuditCounts> };
    };
    const counts = metadata?.vulnerabilities;
    if (!counts) {
        throw new Error('npm audit output has no vulnerability summary');
    }
    return {
        critical: counts.critical ?? 0,
        high: counts.high ?? 0,
        moderate: counts.moderate ?? 0,
        low: counts.low ?? 0,
    };
}

export function lockfileHasInstallScripts(lockfile: Lockfile): boolean {
    return Object.values(lockfile.packages ?? {}).some((entry) => entry.hasInstallScript === true);
}

async function fetchWeeklyDownloads(name: string, fetchFn: typeof fetch): Promise<number> {
    const response = await fetchFn(`https://api.npmjs.org/downloads/point/last-week/${name}`);
    if (!response.ok) {
        throw new Error(`Could not read download counts for ${name} (HTTP ${response.status})`);
    }
    const { downloads } = (await response.json()) as { downloads: number };
    return downloads;
}

export async function gatherPackageFacts(
    spec: string,
    deps: PackageFactsDeps,
): Promise<PackageFacts> {
    const { run, fetchFn, readLockfile, makeTempDir, removeDir } = deps;

    const view = await run('npm', ['view', spec, '--json']);
    if (view.code !== 0) {
        throw new Error(`npm view ${spec} failed: ${view.stdout.slice(0, 300)}`);
    }
    const registry = parseNpmView(view.stdout);
    const weeklyDownloads = await fetchWeeklyDownloads(registry.name, fetchFn);

    const directory = await makeTempDir();
    try {
        const install = await run(
            'npm',
            ['install', spec, '--ignore-scripts', '--no-fund', '--no-audit'],
            { cwd: directory },
        );
        if (install.code !== 0) {
            throw new Error(
                `The dry-run install of ${spec} failed: ${install.stdout.slice(0, 300)}`,
            );
        }
        // npm audit exits non-zero when it finds vulnerabilities, so only the output matters.
        const audit = await run('npm', ['audit', '--json'], { cwd: directory });
        const signatures = await run('npm', ['audit', 'signatures'], { cwd: directory });
        const lockfile = await readLockfile(directory);

        return {
            name: registry.name,
            weeklyDownloads,
            latestPublishedAt: registry.latestPublishedAt,
            deprecated: registry.deprecated,
            hasInstallScripts: registry.hasOwnInstallScripts || lockfileHasInstallScripts(lockfile),
            audit: parseAuditCounts(audit.stdout),
            signaturesValid: signatures.code === 0,
        };
    } finally {
        await removeDir(directory);
    }
}

export const realPackageFactsDeps: PackageFactsDeps = {
    async run(command, args, options) {
        try {
            const { stdout } = await execFileAsync(command, args, {
                cwd: options?.cwd,
                maxBuffer: 32 * 1024 * 1024,
                timeout: 5 * 60 * 1000,
            });
            return { stdout, code: 0 };
        } catch (error) {
            const failure = error as { stdout?: string; stderr?: string; code?: number };
            return {
                stdout: failure.stdout || failure.stderr || String(error),
                code: typeof failure.code === 'number' ? failure.code : 1,
            };
        }
    },
    fetchFn: fetch,
    async readLockfile(directory) {
        return JSON.parse(await readFile(join(directory, 'package-lock.json'), 'utf8')) as Lockfile;
    },
    makeTempDir: () => mkdtemp(join(tmpdir(), 'lab-dep-check-')),
    removeDir: (directory) => rm(directory, { recursive: true, force: true }),
};
