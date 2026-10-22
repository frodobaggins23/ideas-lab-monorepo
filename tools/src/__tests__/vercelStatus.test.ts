import { describe, expect, it, vi } from 'vitest';

import type { VercelClient, VercelDeploymentSummary } from '../vercelApi.ts';
import { describeDeployments } from '../vercelStatus.ts';

const project = { id: 'prj_1', name: 'lab-budget-buddy' };

function summary(overrides: Partial<VercelDeploymentSummary>): VercelDeploymentSummary {
    return {
        id: 'dpl_1',
        url: 'a.vercel.app',
        readyState: 'READY',
        createdAt: Date.UTC(2026, 9, 21, 5, 28),
        branch: 'feat/budgetBuddy',
        meta: { githubCommitSha: 'a335650afd9cf6dab830ce3b1a7cce210255b579' },
        ...overrides,
    };
}

function fakeClient(deployments: VercelDeploymentSummary[], log: string[] = []) {
    return {
        getProject: vi.fn(async () => project),
        listDeployments: vi.fn(async () => deployments),
        getDeploymentEvents: vi.fn(async () => log.map((text) => ({ type: 'stdout', text }))),
    } satisfies Partial<VercelClient> as unknown as VercelClient & {
        getProject: ReturnType<typeof vi.fn>;
        getDeploymentEvents: ReturnType<typeof vi.fn>;
    };
}

describe('describeDeployments', () => {
    it('lists deployments newest first with time, state, commit, branch, URL and error', async () => {
        const client = fakeClient([
            summary({
                id: 'dpl_2',
                readyState: 'CANCELED',
                url: 'b.vercel.app',
                errorMessage: 'The Ignored Build Step command returned exit code 0.',
            }),
            summary({ createdAt: Date.UTC(2026, 9, 20, 23, 0) }),
        ]);

        const lines = await describeDeployments(client, 'budgetBuddy');

        expect(lines.slice(0, 3)).toEqual([
            '2026-10-21 05:28 UTC  CANCELED  a335650  feat/budgetBuddy  https://b.vercel.app',
            '    The Ignored Build Step command returned exit code 0.',
            '2026-10-20 23:00 UTC  READY     a335650  feat/budgetBuddy  https://a.vercel.app',
        ]);
    });

    it('appends the end of the build log when the newest deployment failed', async () => {
        const log = Array.from({ length: 50 }, (_, index) => `line ${index + 1}`);
        const client = fakeClient([summary({ id: 'dpl_9', readyState: 'ERROR' })], log);

        const lines = await describeDeployments(client, 'budgetBuddy');

        expect(client.getDeploymentEvents).toHaveBeenCalledWith('dpl_9');
        expect(lines).toContain('Build log of dpl_9 (last 40 lines):');
        expect(lines.at(-1)).toBe('line 50');
        expect(lines).not.toContain('line 10');
    });

    it('does not fetch a build log when the newest deployment succeeded', async () => {
        const client = fakeClient([summary({})]);

        await describeDeployments(client, 'budgetBuddy');

        expect(client.getDeploymentEvents).not.toHaveBeenCalled();
    });

    it('explains an empty list', async () => {
        const client = fakeClient([]);

        expect(await describeDeployments(client, 'budgetBuddy')).toEqual([
            'No deployments yet for lab-budget-buddy. Vercel only deploys pushes made after the project exists.',
        ]);
    });

    it('fails when the Vercel project does not exist', async () => {
        const client = fakeClient([]);
        client.getProject.mockResolvedValueOnce(undefined);

        await expect(describeDeployments(client, 'budgetBuddy')).rejects.toThrowError(
            /lab:vercel-project/,
        );
    });
});
