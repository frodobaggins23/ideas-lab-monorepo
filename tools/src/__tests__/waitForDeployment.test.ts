import { describe, expect, it, vi } from 'vitest';

import type { VercelClient, VercelDeployment, VercelDeploymentEvent } from '../vercelApi.ts';
import { waitForDeployment } from '../waitForDeployment.ts';

const project = { id: 'prj_1', name: 'lab-budget-buddy' };
const input = { appName: 'budgetBuddy', branch: 'feat/budgetBuddy', commitSha: 'abc123' };

function deployment(
    readyState: VercelDeployment['readyState'],
    commitSha = 'abc123',
): VercelDeployment {
    return {
        id: 'dpl_1',
        url: 'lab-budget-buddy-git-feat.vercel.app',
        readyState,
        meta: { githubCommitSha: commitSha },
    };
}

function fakeClient(
    deployments: (VercelDeployment | undefined)[],
    events: VercelDeploymentEvent[] = [],
) {
    const latest = vi.fn<VercelClient['getLatestDeployment']>();
    for (const next of deployments) {
        latest.mockResolvedValueOnce(next);
    }
    return {
        getProject: vi.fn(async () => project),
        getLatestDeployment: latest,
        getDeploymentEvents: vi.fn(async () => events),
    } satisfies Partial<VercelClient> as unknown as VercelClient & {
        getLatestDeployment: typeof latest;
    };
}

const options = { sleep: vi.fn(async () => {}), intervalMs: 10, maxAttempts: 5 };

describe('waitForDeployment', () => {
    it('returns the preview URL once the deployment of the commit is ready', async () => {
        const client = fakeClient([deployment('READY')]);

        const outcome = await waitForDeployment(client, input, options);

        expect(outcome).toEqual({
            state: 'READY',
            url: 'https://lab-budget-buddy-git-feat.vercel.app',
        });
        expect(client.getLatestDeployment).toHaveBeenCalledWith('prj_1', 'feat/budgetBuddy');
    });

    it('keeps waiting while the deployment is missing, from an older commit or still building', async () => {
        const sleep = vi.fn(async () => {});
        const client = fakeClient([
            undefined,
            deployment('READY', 'older'),
            deployment('BUILDING'),
            deployment('READY'),
        ]);

        const outcome = await waitForDeployment(client, input, { ...options, sleep });

        expect(outcome.state).toBe('READY');
        expect(sleep).toHaveBeenCalledTimes(3);
        expect(sleep).toHaveBeenCalledWith(10);
    });

    it('returns the build log when the deployment failed', async () => {
        const client = fakeClient(
            [deployment('ERROR')],
            [
                { type: 'stdout', text: 'Running build' },
                { type: 'delimiter' },
                { type: 'stderr', text: 'error TS2322: Type mismatch' },
            ],
        );

        const outcome = await waitForDeployment(client, input, options);

        expect(outcome).toEqual({
            state: 'ERROR',
            url: 'https://lab-budget-buddy-git-feat.vercel.app',
            log: ['Running build', 'error TS2322: Type mismatch'],
        });
    });

    it('gives up after the maximum number of attempts', async () => {
        const client = fakeClient([]);

        const outcome = await waitForDeployment(client, input, options);

        expect(outcome).toEqual({ state: 'TIMEOUT' });
        expect(client.getLatestDeployment).toHaveBeenCalledTimes(5);
    });

    it('fails when the Vercel project does not exist yet', async () => {
        const client = fakeClient([]);
        vi.mocked(client.getProject).mockResolvedValueOnce(undefined);

        await expect(waitForDeployment(client, input, options)).rejects.toThrowError(
            /lab:vercel-project/,
        );
    });
});
