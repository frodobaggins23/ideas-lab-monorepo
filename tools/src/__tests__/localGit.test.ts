import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createLocalGit } from '../localGit.ts';

function makeRepo() {
    const root = mkdtempSync(join(tmpdir(), 'lab-local-git-'));
    const git = (args: string[], env: Record<string, string> = {}): string =>
        execFileSync('git', args, {
            cwd: root,
            encoding: 'utf8',
            env: { ...process.env, ...env },
        }).trim();
    git(['init', '-q', '-b', 'main']);
    git(['config', 'user.email', 'dev@example.com']);
    git(['config', 'user.name', 'Dev Example']);
    const commit = (message: string, authorDate: string, committerDate: string): string => {
        git(['add', '-A']);
        git(['commit', '-q', '--allow-empty', '-m', message], {
            GIT_AUTHOR_DATE: authorDate,
            GIT_COMMITTER_DATE: committerDate,
        });
        return git(['rev-parse', 'HEAD']);
    };
    return { root, git, commit };
}

describe('createLocalGit', () => {
    it('reads a commit with its exact message, parents and dates including the timezone', () => {
        const { root, git, commit } = makeRepo();
        writeFileSync(join(root, 'a.txt'), 'one\n');
        const first = commit(
            'chore: first',
            '2026-10-20T23:04:55+02:00',
            '2026-10-20T23:04:55+02:00',
        );
        writeFileSync(join(root, 'a.txt'), 'two\n');
        const second = commit(
            'feat: second\n\nBody line.',
            '2026-10-21T08:00:00-05:30',
            '2026-10-21T15:00:00+00:00',
        );

        const data = createLocalGit(root).readCommit(second);

        expect(data).toEqual({
            tree: git(['rev-parse', `${second}^{tree}`]),
            parents: [first],
            author: {
                name: 'Dev Example',
                email: 'dev@example.com',
                date: '2026-10-21T08:00:00-05:30',
            },
            committer: {
                name: 'Dev Example',
                email: 'dev@example.com',
                date: '2026-10-21T15:00:00+00:00',
            },
            message: 'feat: second\n\nBody line.\n',
            extraHeaders: [],
        });
    });

    it('lists added, modified, deleted and mode-changed files between two commits', () => {
        const { root, git, commit } = makeRepo();
        writeFileSync(join(root, 'keep.txt'), 'old\n');
        writeFileSync(join(root, 'gone.txt'), 'bye\n');
        writeFileSync(join(root, 'run.sh'), 'echo hi\n');
        const first = commit(
            'chore: first',
            '2026-10-20T10:00:00+00:00',
            '2026-10-20T10:00:00+00:00',
        );
        writeFileSync(join(root, 'keep.txt'), 'new\n');
        mkdirSync(join(root, 'dir'));
        writeFileSync(join(root, 'dir', 'added.txt'), 'added\n');
        rmSync(join(root, 'gone.txt'));
        chmodSync(join(root, 'run.sh'), 0o755);
        const second = commit(
            'feat: change',
            '2026-10-20T11:00:00+00:00',
            '2026-10-20T11:00:00+00:00',
        );
        const blob = (path: string): string => git(['rev-parse', `${second}:${path}`]);

        const entries = createLocalGit(root).changedEntries(first, second);

        expect(entries).toEqual([
            { path: 'dir/added.txt', mode: '100644', sha: blob('dir/added.txt') },
            { path: 'gone.txt', mode: '100644', sha: null },
            { path: 'keep.txt', mode: '100644', sha: blob('keep.txt') },
            { path: 'run.sh', mode: '100755', sha: blob('run.sh') },
        ]);
    });

    it('lists commits oldest first and answers ancestry and existence questions', () => {
        const { root, git, commit } = makeRepo();
        const date = '2026-10-20T10:00:00+00:00';
        const base = commit('chore: base', date, date);
        const one = commit('feat: one', date, date);
        const two = commit('feat: two', date, date);
        const local = createLocalGit(root);

        expect(local.commitsBetween(base, two)).toEqual([one, two]);
        expect(local.isAncestor(base, two)).toBe(true);
        expect(local.isAncestor(two, base)).toBe(false);
        expect(local.hasCommit(two)).toBe(true);
        expect(local.hasCommit('0123456789abcdef0123456789abcdef01234567')).toBe(false);
        expect(local.headSha()).toBe(two);
        expect(local.currentBranch()).toBe('main');
        expect(local.treeOf(two)).toBe(git(['rev-parse', `${two}^{tree}`]));

        git(['checkout', '-q', '--detach']);
        expect(local.currentBranch()).toBeUndefined();
    });

    it('returns blob contents as base64', () => {
        const { root, git, commit } = makeRepo();
        writeFileSync(join(root, 'a.txt'), 'hello\n');
        const sha = commit('chore: a', '2026-10-20T10:00:00+00:00', '2026-10-20T10:00:00+00:00');

        const content = createLocalGit(root).blobBase64(git(['rev-parse', `${sha}:a.txt`]));

        expect(Buffer.from(content, 'base64').toString('utf8')).toBe('hello\n');
    });
});
