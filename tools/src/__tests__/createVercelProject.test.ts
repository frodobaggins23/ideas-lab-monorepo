import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { ensureLabProject, ignoreBuildCommand } from '../createVercelProject.ts';
import type { VercelClient, VercelProject } from '../vercelApi.ts';

function git(args: string[], cwd: string): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

// Sets up a workspace shaped like the real repo (apps/testApp, libs, package-lock.json,
// tsconfig.base.json) with one commit, and optionally a second commit that only touches the app.
function makeWorkspace(withSecondCommit: boolean): {
    root: string;
    appDir: string;
    firstSha: string;
} {
    const root = mkdtempSync(join(tmpdir(), 'lab-ignore-build-'));
    const appDir = join(root, 'apps', 'testApp');
    mkdirSync(appDir, { recursive: true });
    mkdirSync(join(root, 'libs'), { recursive: true });
    writeFileSync(join(root, 'package-lock.json'), '{}');
    writeFileSync(join(root, 'tsconfig.base.json'), '{}');
    writeFileSync(join(appDir, 'file.txt'), 'a');

    git(['init', '-q'], root);
    git(['config', 'user.email', 'test@example.com'], root);
    git(['config', 'user.name', 'Test'], root);
    git(['add', '-A'], root);
    git(['commit', '-q', '-m', 'first'], root);
    const firstSha = git(['rev-parse', 'HEAD'], root);

    if (withSecondCommit) {
        writeFileSync(join(appDir, 'file.txt'), 'b');
        git(['add', '-A'], root);
        git(['commit', '-q', '-m', 'second'], root);
    }

    return { root, appDir, firstSha };
}

// Mirrors how Vercel invokes the ignore command: from within apps/<name>, with
// VERCEL_GIT_PREVIOUS_SHA set (or unset, for a brand-new project's first deployment).
function runIgnoreCommand(appDir: string, previousSha: string | undefined): number {
    try {
        execFileSync('sh', ['-c', ignoreBuildCommand], {
            cwd: appDir,
            env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: previousSha ?? '' },
        });
        return 0;
    } catch (error) {
        return (error as { status: number }).status;
    }
}

const repo = 'owner/ideas-lab';

function fakeClient(existing?: VercelProject) {
    const created: VercelProject = { id: 'prj_new', name: 'lab-budget-buddy' };
    return {
        getProject: vi.fn(async () => existing),
        createProject: vi.fn(async () => created),
        makePreviewsPublic: vi.fn(async () => {}),
    } satisfies Partial<VercelClient> as unknown as VercelClient & {
        createProject: ReturnType<typeof vi.fn>;
        makePreviewsPublic: ReturnType<typeof vi.fn>;
    };
}

describe('ensureLabProject', () => {
    it('creates a git-linked project with the derived names and makes previews public', async () => {
        const client = fakeClient();

        const result = await ensureLabProject(client, { appName: 'budgetBuddy', repo });

        expect(result).toEqual({
            created: true,
            project: { id: 'prj_new', name: 'lab-budget-buddy' },
        });
        expect(client.createProject).toHaveBeenCalledWith({
            name: 'lab-budget-buddy',
            rootDirectory: 'apps/budgetBuddy',
            gitRepository: { type: 'github', repo },
            commandForIgnoringBuildStep: ignoreBuildCommand,
        });
        expect(client.makePreviewsPublic).toHaveBeenCalledWith('prj_new');
    });

    it('does nothing when the project already exists', async () => {
        const existing = { id: 'prj_old', name: 'lab-budget-buddy' };
        const client = fakeClient(existing);

        const result = await ensureLabProject(client, { appName: 'budgetBuddy', repo });

        expect(result).toEqual({ created: false, project: existing });
        expect(client.createProject).not.toHaveBeenCalled();
        expect(client.makePreviewsPublic).not.toHaveBeenCalled();
    });

    it('rejects an invalid app name before calling the API', async () => {
        const client = fakeClient();

        await expect(ensureLabProject(client, { appName: 'Bad-Name', repo })).rejects.toThrowError(
            /camelCase/,
        );
        expect(client.createProject).not.toHaveBeenCalled();
    });
});

describe('ignoreBuildCommand', () => {
    it('references the inputs that should force a build', () => {
        expect(ignoreBuildCommand).toContain('VERCEL_GIT_PREVIOUS_SHA');
        expect(ignoreBuildCommand).toContain('../../libs');
        expect(ignoreBuildCommand).toContain('../../package-lock.json');
    });

    it("builds (exit 1) on a project's first deployment, when there is no previous sha", () => {
        const { appDir } = makeWorkspace(false);
        expect(runIgnoreCommand(appDir, undefined)).toBe(1);
    });

    it('skips the build (exit 0) when nothing changed since the previous deployment', () => {
        const { appDir, firstSha } = makeWorkspace(false);
        expect(runIgnoreCommand(appDir, firstSha)).toBe(0);
    });

    it('builds (exit 1) when the app changed since the previous deployment', () => {
        const { appDir, firstSha } = makeWorkspace(true);
        expect(runIgnoreCommand(appDir, firstSha)).toBe(1);
    });
});
