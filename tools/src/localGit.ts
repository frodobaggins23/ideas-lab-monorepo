import { execFileSync } from 'node:child_process';

import type { GitPerson } from './githubApi.ts';

export interface CommitData {
    tree: string;
    parents: string[];
    author: GitPerson;
    committer: GitPerson;
    message: string;
    // Headers other than tree, parent, author and committer (for example gpgsig or encoding).
    // A commit with any of them cannot be recreated identically through the API.
    extraHeaders: string[];
}

export interface ChangedEntry {
    path: string;
    mode: string;
    sha: string | null;
}

export interface LocalGit {
    currentBranch(): string | undefined;
    headSha(): string;
    hasCommit(sha: string): boolean;
    isAncestor(ancestor: string, descendant: string): boolean;
    commitsBetween(base: string, head: string): string[];
    readCommit(sha: string): CommitData;
    changedEntries(parent: string, sha: string): ChangedEntry[];
    treeOf(sha: string): string;
    blobBase64(sha: string): string;
}

const deletedSha = /^0+$/;

// "Dev <dev@example.com> 1792530295 +0200" -> ISO 8601 with the original offset, which the
// GitHub API keeps, so a recreated commit gets the same id.
function parsePerson(value: string): GitPerson {
    const match = /^(.*) <(.*)> (\d+) ([+-])(\d{2})(\d{2})$/.exec(value);
    if (!match) {
        throw new Error(`Cannot parse commit identity "${value}"`);
    }
    const [, name = '', email = '', seconds = '0', sign = '+', hours = '00', minutes = '00'] =
        match;
    const offsetSeconds = (sign === '-' ? -1 : 1) * (Number(hours) * 3600 + Number(minutes) * 60);
    const local = new Date((Number(seconds) + offsetSeconds) * 1000).toISOString().slice(0, 19);
    return { name, email, date: `${local}${sign}${hours}:${minutes}` };
}

function parseCommit(raw: string): CommitData {
    const separator = raw.indexOf('\n\n');
    const headerLines = (separator === -1 ? raw : raw.slice(0, separator)).split('\n');
    const message = separator === -1 ? '' : raw.slice(separator + 2);

    const data: CommitData = {
        tree: '',
        parents: [],
        author: { name: '', email: '', date: '' },
        committer: { name: '', email: '', date: '' },
        message,
        extraHeaders: [],
    };
    for (const line of headerLines) {
        if (line.startsWith(' ')) {
            continue;
        }
        const space = line.indexOf(' ');
        const key = line.slice(0, space);
        const value = line.slice(space + 1);
        if (key === 'tree') {
            data.tree = value;
        } else if (key === 'parent') {
            data.parents.push(value);
        } else if (key === 'author') {
            data.author = parsePerson(value);
        } else if (key === 'committer') {
            data.committer = parsePerson(value);
        } else {
            data.extraHeaders.push(key);
        }
    }
    return data;
}

// `git diff-tree -z` output: ":<old mode> <new mode> <old sha> <new sha> <status>\0<path>\0".
function parseDiffTree(output: string): ChangedEntry[] {
    const tokens = output.split('\0').filter((token) => token !== '');
    const entries: ChangedEntry[] = [];
    for (let index = 0; index + 1 < tokens.length; index += 2) {
        const [oldMode = '', newMode = '', , newSha = ''] = (tokens[index] ?? '')
            .slice(1)
            .split(' ');
        const path = tokens[index + 1] ?? '';
        const isDeleted = deletedSha.test(newSha);
        entries.push({ path, mode: isDeleted ? oldMode : newMode, sha: isDeleted ? null : newSha });
    }
    return entries;
}

export function createLocalGit(cwd: string): LocalGit {
    const git = (args: string[]): string =>
        execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const succeeds = (args: string[]): boolean => {
        try {
            git(args);
            return true;
        } catch {
            return false;
        }
    };

    return {
        currentBranch() {
            try {
                return git(['symbolic-ref', '--short', '-q', 'HEAD']).trim() || undefined;
            } catch {
                return undefined;
            }
        },
        headSha() {
            return git(['rev-parse', 'HEAD']).trim();
        },
        hasCommit(sha) {
            return succeeds(['cat-file', '-e', `${sha}^{commit}`]);
        },
        isAncestor(ancestor, descendant) {
            return succeeds(['merge-base', '--is-ancestor', ancestor, descendant]);
        },
        commitsBetween(base, head) {
            return git(['rev-list', '--reverse', '--topo-order', head, `^${base}`])
                .split('\n')
                .filter(Boolean);
        },
        readCommit(sha) {
            return parseCommit(git(['cat-file', 'commit', sha]));
        },
        changedEntries(parent, sha) {
            return parseDiffTree(git(['diff-tree', '-r', '--no-renames', '-z', parent, sha]));
        },
        treeOf(sha) {
            return git(['rev-parse', `${sha}^{tree}`]).trim();
        },
        blobBase64(sha) {
            return execFileSync('git', ['cat-file', 'blob', sha], { cwd }).toString('base64');
        },
    };
}
