import { describe, expect, it, vi } from 'vitest';

import { createGithubClient, GithubApiError } from '../githubApi.ts';

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
    const client = createGithubClient({ token: 'secret', repo: 'owner/lab', fetchFn });
    return { calls, client };
}

const body = (call: FetchCall | undefined): unknown => JSON.parse(String(call?.init.body));

describe('createGithubClient', () => {
    it('sends the bearer token and reads the default branch', async () => {
        const { calls, client } = setup([jsonResponse({ default_branch: 'main' })]);

        expect(await client.getDefaultBranch()).toBe('main');
        expect(calls[0]?.url).toBe('https://api.github.com/repos/owner/lab');
        expect(new Headers(calls[0]?.init.headers).get('authorization')).toBe('Bearer secret');
    });

    it('returns the head of a branch, keeping slashes in the branch name', async () => {
        const { calls, client } = setup([jsonResponse({ object: { sha: 'abc' } })]);

        expect(await client.getBranchHead('feat/budgetBuddy')).toBe('abc');
        expect(calls[0]?.url).toBe(
            'https://api.github.com/repos/owner/lab/git/ref/heads/feat/budgetBuddy',
        );
    });

    it('returns undefined for a branch that does not exist', async () => {
        const { client } = setup([jsonResponse({ message: 'Not Found' }, 404)]);

        expect(await client.getBranchHead('feat/new')).toBeUndefined();
    });

    it('throws a GithubApiError with status and message for other failures', async () => {
        const { client } = setup([jsonResponse({ message: 'Bad credentials' }, 401)]);

        const error = await client.getDefaultBranch().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(GithubApiError);
        expect(error).toMatchObject({ status: 401, message: 'Bad credentials' });
    });

    it('creates blobs, trees and commits and returns their ids', async () => {
        const { calls, client } = setup([
            jsonResponse({ sha: 'blob1' }, 201),
            jsonResponse({ sha: 'tree1' }, 201),
            jsonResponse({ sha: 'commit1' }, 201),
        ]);
        const person = { name: 'A', email: 'a@x', date: '2026-10-22T10:00:00+02:00' };

        expect(await client.createBlob('aGk=')).toBe('blob1');
        expect(
            await client.createTree('base', [
                { path: 'a.txt', mode: '100644', type: 'blob', sha: 'blob1' },
                { path: 'gone.txt', mode: '100644', type: 'blob', sha: null },
            ]),
        ).toBe('tree1');
        expect(
            await client.createCommit({
                message: 'feat: x\n',
                tree: 'tree1',
                parents: ['p1'],
                author: person,
                committer: person,
            }),
        ).toBe('commit1');

        expect(calls[0]?.url).toBe('https://api.github.com/repos/owner/lab/git/blobs');
        expect(body(calls[0])).toEqual({ content: 'aGk=', encoding: 'base64' });
        expect(body(calls[1])).toEqual({
            base_tree: 'base',
            tree: [
                { path: 'a.txt', mode: '100644', type: 'blob', sha: 'blob1' },
                { path: 'gone.txt', mode: '100644', type: 'blob', sha: null },
            ],
        });
        expect(body(calls[2])).toMatchObject({ message: 'feat: x\n', parents: ['p1'] });
    });

    it('creates a branch, and moves an existing one without ever forcing', async () => {
        const { calls, client } = setup([jsonResponse({}, 201), jsonResponse({})]);

        await client.createBranch('feat/a', 'sha1');
        await client.updateBranch('feat/a', 'sha2');

        expect(calls[0]?.init.method).toBe('POST');
        expect(calls[0]?.url).toBe('https://api.github.com/repos/owner/lab/git/refs');
        expect(body(calls[0])).toEqual({ ref: 'refs/heads/feat/a', sha: 'sha1' });
        expect(calls[1]?.init.method).toBe('PATCH');
        expect(calls[1]?.url).toBe('https://api.github.com/repos/owner/lab/git/refs/heads/feat/a');
        expect(body(calls[1])).toEqual({ sha: 'sha2', force: false });
    });
});
