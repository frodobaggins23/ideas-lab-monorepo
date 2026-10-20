import { describe, expect, it, vi } from 'vitest';

import { ensureLabProject, ignoreBuildCommand } from '../createVercelProject.ts';
import type { VercelClient, VercelProject } from '../vercelApi.ts';

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
    it('builds when there is no previous deployment and skips only when nothing relevant changed', () => {
        expect(ignoreBuildCommand).toContain('VERCEL_GIT_PREVIOUS_SHA');
        expect(ignoreBuildCommand).toContain('../../libs');
        expect(ignoreBuildCommand).toContain('../../package-lock.json');
    });
});
