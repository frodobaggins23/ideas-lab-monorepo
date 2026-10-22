import { describe, expect, it, vi } from 'vitest';

import type { GithubClient } from '../githubApi.ts';
import type { ChangedEntry, CommitData, LocalGit } from '../localGit.ts';
import { pushBranch } from '../pushBranch.ts';

const person = { name: 'Dev', email: 'dev@example.com', date: '2026-10-22T10:00:00+02:00' };

function commitData(tree: string, parents: string[], extraHeaders: string[] = []): CommitData {
    return { tree, parents, author: person, committer: person, message: 'feat: x\n', extraHeaders };
}

// Local history: m0 (already on GitHub as main) <- c1 <- c2 (HEAD of feat/a).
const commits: Record<string, CommitData> = {
    m0: commitData('tm0', []),
    c1: commitData('t1', ['m0']),
    c2: commitData('t2', ['c1']),
};
const changes: Record<string, ChangedEntry[]> = {
    c1: [
        { path: 'a.txt', mode: '100644', sha: 'b1' },
        { path: 'old.txt', mode: '100644', sha: null },
    ],
    c2: [
        { path: 'a.txt', mode: '100755', sha: 'b1' },
        { path: 'b.txt', mode: '100644', sha: 'b2' },
    ],
};
const ancestors: Record<string, string[]> = { m0: [], c1: ['m0'], c2: ['c1', 'm0'] };

function fakeGit(overrides: Partial<LocalGit> = {}): LocalGit {
    return {
        currentBranch: () => 'feat/a',
        headSha: () => 'c2',
        hasCommit: (sha) => sha in commits,
        isAncestor: (ancestor, descendant) => ancestors[descendant]?.includes(ancestor) ?? false,
        commitsBetween: (base) => (base === 'm0' ? ['c1', 'c2'] : base === 'c1' ? ['c2'] : []),
        readCommit: (sha) => commits[sha] ?? commitData('', []),
        changedEntries: (_parent, sha) => changes[sha] ?? [],
        treeOf: (sha) => commits[sha]?.tree ?? '',
        blobBase64: (sha) => (sha === 'b1' ? 'YQ==' : 'Yg=='),
        ...overrides,
    };
}

interface FakeGithubOptions {
    remoteHeads?: Record<string, string>;
    treeIds?: string[];
    commitIds?: string[];
}

function fakeGithub({
    remoteHeads = { main: 'm0' },
    treeIds = ['t1', 't2'],
    commitIds = ['c1', 'c2'],
}: FakeGithubOptions = {}) {
    return {
        getDefaultBranch: vi.fn(async () => 'main'),
        getBranchHead: vi.fn(async (branch: string) => remoteHeads[branch]),
        createBlob: vi.fn(async (content: string) => (content === 'YQ==' ? 'b1' : 'b2')),
        createTree: vi.fn(async () => treeIds.shift() ?? ''),
        createCommit: vi.fn(async () => commitIds.shift() ?? ''),
        createBranch: vi.fn(async () => {}),
        updateBranch: vi.fn(async () => {}),
    } satisfies GithubClient;
}

function expectNothingWritten(github: ReturnType<typeof fakeGithub>): void {
    expect(github.createBlob).not.toHaveBeenCalled();
    expect(github.createTree).not.toHaveBeenCalled();
    expect(github.createCommit).not.toHaveBeenCalled();
    expect(github.createBranch).not.toHaveBeenCalled();
    expect(github.updateBranch).not.toHaveBeenCalled();
}

describe('pushBranch', () => {
    it('recreates a new branch commit by commit on top of the default branch', async () => {
        const github = fakeGithub();

        const result = await pushBranch(fakeGit(), github);

        expect(result).toEqual({ status: 'pushed', branch: 'feat/a', head: 'c2', commits: 2 });
        expect(github.createBlob.mock.calls).toEqual([['YQ=='], ['Yg==']]);
        expect(github.createTree.mock.calls).toEqual([
            [
                'tm0',
                [
                    { path: 'a.txt', mode: '100644', type: 'blob', sha: 'b1' },
                    { path: 'old.txt', mode: '100644', type: 'blob', sha: null },
                ],
            ],
            [
                't1',
                [
                    { path: 'a.txt', mode: '100755', type: 'blob', sha: 'b1' },
                    { path: 'b.txt', mode: '100644', type: 'blob', sha: 'b2' },
                ],
            ],
        ]);
        expect(github.createCommit).toHaveBeenNthCalledWith(1, {
            message: 'feat: x\n',
            tree: 't1',
            parents: ['m0'],
            author: person,
            committer: person,
        });
        expect(github.createBranch).toHaveBeenCalledWith('feat/a', 'c2');
        expect(github.updateBranch).not.toHaveBeenCalled();
    });

    it('fast-forwards an existing branch with only the commits it is missing', async () => {
        const github = fakeGithub({
            remoteHeads: { main: 'm0', 'feat/a': 'c1' },
            treeIds: ['t2'],
            commitIds: ['c2'],
        });

        const result = await pushBranch(fakeGit(), github);

        expect(result.commits).toBe(1);
        expect(github.updateBranch).toHaveBeenCalledWith('feat/a', 'c2');
        expect(github.createBranch).not.toHaveBeenCalled();
    });

    it('does nothing when the branch is already up to date', async () => {
        const github = fakeGithub({ remoteHeads: { main: 'm0', 'feat/a': 'c2' } });

        const result = await pushBranch(fakeGit(), github);

        expect(result).toEqual({ status: 'up-to-date', branch: 'feat/a', head: 'c2', commits: 0 });
        expectNothingWritten(github);
    });

    it('refuses a detached HEAD and the default branch', async () => {
        const github = fakeGithub();

        await expect(
            pushBranch(fakeGit({ currentBranch: () => undefined }), github),
        ).rejects.toThrowError(/detached/);
        await expect(
            pushBranch(fakeGit({ currentBranch: () => 'main' }), github),
        ).rejects.toThrowError(/default branch/);
        expectNothingWritten(github);
    });

    it('refuses anything that is not a fast-forward', async () => {
        const github = fakeGithub({ remoteHeads: { main: 'm0', 'feat/a': 'someone-elses' } });

        await expect(pushBranch(fakeGit(), github)).rejects.toThrowError(/fast-forward/);
        expectNothingWritten(github);
    });

    it('refuses commits that cannot be recreated identically, before writing anything', async () => {
        const signed = fakeGit({
            readCommit: (sha) =>
                sha === 'c2'
                    ? commitData('t2', ['c1'], ['gpgsig'])
                    : (commits[sha] ?? commitData('', [])),
        });
        const submodule = fakeGit({
            changedEntries: () => [{ path: 'vendor/lib', mode: '160000', sha: 'x' }],
        });
        const github = fakeGithub();

        await expect(pushBranch(signed, github)).rejects.toThrowError(/gpgsig/);
        await expect(pushBranch(submodule, github)).rejects.toThrowError(/submodule/);
        expectNothingWritten(github);
    });

    it('never moves the branch when a recreated commit or tree comes back with another id', async () => {
        const wrongCommit = fakeGithub({ commitIds: ['c1', 'other'] });
        const wrongTree = fakeGithub({ treeIds: ['t1', 'other'] });

        await expect(pushBranch(fakeGit(), wrongCommit)).rejects.toThrowError(/c2.*other/);
        await expect(pushBranch(fakeGit(), wrongTree)).rejects.toThrowError(/tree/);
        for (const github of [wrongCommit, wrongTree]) {
            expect(github.createBranch).not.toHaveBeenCalled();
            expect(github.updateBranch).not.toHaveBeenCalled();
        }
    });

    it('reuses the parent tree for a commit without file changes', async () => {
        const empty = fakeGit({
            changedEntries: (_parent, sha) => (sha === 'c2' ? [] : (changes[sha] ?? [])),
            treeOf: (sha) => (sha === 'c2' ? 't1' : (commits[sha]?.tree ?? '')),
        });
        const github = fakeGithub({ treeIds: ['t1'] });

        await pushBranch(empty, github);

        expect(github.createTree).toHaveBeenCalledTimes(1);
    });
});
