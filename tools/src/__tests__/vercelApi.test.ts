import { describe, expect, it, vi } from 'vitest';

import { createVercelClient, VercelApiError } from '../vercelApi.ts';

type FetchCall = { url: string; init: RequestInit };

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

function setup(responses: Response[]) {
    const calls: FetchCall[] = [];
    const queue = [...responses];
    const fetchFn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        const next = queue.shift();
        if (!next) {
            throw new Error('Unexpected extra fetch call');
        }
        return next;
    }) as unknown as typeof fetch;
    return { calls, fetchFn };
}

describe('createVercelClient', () => {
    it('sends the bearer token and appends teamId when configured', async () => {
        const { calls, fetchFn } = setup([jsonResponse({ id: 'prj_1', name: 'lab-a' })]);
        const client = createVercelClient({ token: 'secret', teamId: 'team_1', fetchFn });

        await client.getProject('lab-a');

        expect(calls[0]?.url).toBe('https://api.vercel.com/v9/projects/lab-a?teamId=team_1');
        expect(new Headers(calls[0]?.init.headers).get('authorization')).toBe('Bearer secret');
    });

    it('throws a VercelApiError carrying status and code for a failed response', async () => {
        const { fetchFn } = setup([
            jsonResponse({ error: { code: 'forbidden', message: 'Not authorized' } }, 403),
        ]);
        const client = createVercelClient({ token: 't', fetchFn });

        const error = await client.getProject('lab-a').catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(VercelApiError);
        expect(error).toMatchObject({ status: 403, code: 'forbidden', message: 'Not authorized' });
    });

    it('returns undefined from getProject when the project does not exist', async () => {
        const { fetchFn } = setup([
            jsonResponse({ error: { code: 'not_found', message: 'Not found' } }, 404),
        ]);
        const client = createVercelClient({ token: 't', fetchFn });

        expect(await client.getProject('lab-missing')).toBeUndefined();
    });

    it('creates a git-linked Vite project with root directory and ignore-build command', async () => {
        const { calls, fetchFn } = setup([jsonResponse({ id: 'prj_1', name: 'lab-budget-buddy' })]);
        const client = createVercelClient({ token: 't', fetchFn });

        await client.createProject({
            name: 'lab-budget-buddy',
            rootDirectory: 'apps/budgetBuddy',
            gitRepository: { type: 'github', repo: 'owner/lab' },
            commandForIgnoringBuildStep: 'npx nx ...',
        });

        expect(calls[0]?.init.method).toBe('POST');
        expect(calls[0]?.url).toBe('https://api.vercel.com/v11/projects');
        expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({
            name: 'lab-budget-buddy',
            framework: 'vite',
            rootDirectory: 'apps/budgetBuddy',
            gitRepository: { type: 'github', repo: 'owner/lab' },
            commandForIgnoringBuildStep: 'npx nx ...',
        });
    });

    it('turns off deployment protection so previews are public', async () => {
        const { calls, fetchFn } = setup([jsonResponse({ id: 'prj_1' })]);
        const client = createVercelClient({ token: 't', fetchFn });

        await client.makePreviewsPublic('prj_1');

        expect(calls[0]?.init.method).toBe('PATCH');
        expect(calls[0]?.url).toBe('https://api.vercel.com/v9/projects/prj_1');
        expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ ssoProtection: null });
    });

    it('returns the latest deployment of a branch, or undefined when there is none', async () => {
        const { calls, fetchFn } = setup([
            jsonResponse({
                deployments: [{ id: 'dpl_1', url: 'a.vercel.app', readyState: 'READY' }],
            }),
            jsonResponse({ deployments: [] }),
        ]);
        const client = createVercelClient({ token: 't', fetchFn });

        const latest = await client.getLatestDeployment('prj_1', 'feat/budgetBuddy');
        const none = await client.getLatestDeployment('prj_1', 'feat/other');

        expect(latest?.id).toBe('dpl_1');
        expect(none).toBeUndefined();
        expect(calls[0]?.url).toBe(
            'https://api.vercel.com/v6/deployments?projectId=prj_1&branch=feat%2FbudgetBuddy&limit=1',
        );
    });

    it('fetches build events for a deployment', async () => {
        const { calls, fetchFn } = setup([jsonResponse([{ type: 'stdout', text: 'building' }])]);
        const client = createVercelClient({ token: 't', fetchFn });

        const events = await client.getDeploymentEvents('dpl_1');

        expect(events).toEqual([{ type: 'stdout', text: 'building' }]);
        expect(calls[0]?.url).toBe('https://api.vercel.com/v3/deployments/dpl_1/events');
    });
});
