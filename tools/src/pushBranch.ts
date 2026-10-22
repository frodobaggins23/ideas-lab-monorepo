import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { parseGithubRepo } from './appNames.ts';
import type { GithubClient, TreeEntry } from './githubApi.ts';
import { createGithubClient } from './githubApi.ts';
import type { ChangedEntry, CommitData, LocalGit } from './localGit.ts';
import { createLocalGit } from './localGit.ts';

// Pushes the current branch by recreating its commits through the GitHub API, because git's own
// transport cannot authenticate from the Claude Code sandbox (see githubApi.ts). Every recreated
// commit must come back with its local id, so GitHub ends up with exactly the local history; the
// branch is only moved after all of them did.

const submoduleMode = '160000';

export interface PushResult {
    status: 'pushed' | 'up-to-date';
    branch: string;
    head: string;
    commits: number;
}

interface PlannedCommit {
    sha: string;
    data: CommitData;
    parentTree: string;
    expectedTree: string;
    entries: ChangedEntry[];
}

function planCommit(git: LocalGit, sha: string): PlannedCommit {
    const data = git.readCommit(sha);
    if (data.extraHeaders.length > 0) {
        throw new Error(
            `Commit ${sha} has ${data.extraHeaders.join(', ')}, which the GitHub API cannot recreate. Nothing was pushed.`,
        );
    }
    const [parent] = data.parents;
    if (!parent) {
        throw new Error(`Commit ${sha} has no parent. Nothing was pushed.`);
    }
    const entries = git.changedEntries(parent, sha);
    const submodule = entries.find((entry) => entry.mode === submoduleMode);
    if (submodule) {
        throw new Error(
            `Commit ${sha} changes the submodule ${submodule.path}, which is not supported. Nothing was pushed.`,
        );
    }
    return { sha, data, parentTree: git.treeOf(parent), expectedTree: git.treeOf(sha), entries };
}

async function findBase(
    git: LocalGit,
    github: GithubClient,
    branch: string,
    head: string,
    remoteHead: string | undefined,
    defaultBranch: string,
): Promise<string> {
    if (remoteHead) {
        if (!git.hasCommit(remoteHead) || !git.isAncestor(remoteHead, head)) {
            throw new Error(
                `${branch} on GitHub (${remoteHead.slice(0, 7)}) is not an ancestor of HEAD, so this push is not a fast-forward. Nothing was pushed.`,
            );
        }
        return remoteHead;
    }
    const defaultHead = await github.getBranchHead(defaultBranch);
    if (!defaultHead || !git.hasCommit(defaultHead)) {
        throw new Error(
            `The local repository does not have the head of ${defaultBranch} on GitHub (${defaultHead ?? 'none'}). Update ${defaultBranch} first. Nothing was pushed.`,
        );
    }
    return defaultHead;
}

async function recreateCommit(
    github: GithubClient,
    git: LocalGit,
    commit: PlannedCommit,
    uploadedBlobs: Set<string>,
): Promise<void> {
    for (const entry of commit.entries) {
        if (entry.sha === null || uploadedBlobs.has(entry.sha)) {
            continue;
        }
        const blob = await github.createBlob(git.blobBase64(entry.sha));
        if (blob !== entry.sha) {
            throw new Error(
                `${entry.path} in commit ${commit.sha} came back as blob ${blob} instead of ${entry.sha}. The branch was not moved.`,
            );
        }
        uploadedBlobs.add(entry.sha);
    }

    const treeEntries: TreeEntry[] = commit.entries.map(({ path, mode, sha }) => ({
        path,
        mode,
        type: 'blob',
        sha,
    }));
    const tree =
        treeEntries.length > 0
            ? await github.createTree(commit.parentTree, treeEntries)
            : commit.parentTree;
    if (tree !== commit.expectedTree) {
        throw new Error(
            `The tree of commit ${commit.sha} came back as ${tree} instead of ${commit.expectedTree}. The branch was not moved.`,
        );
    }

    const { message, parents, author, committer } = commit.data;
    const created = await github.createCommit({ message, tree, parents, author, committer });
    if (created !== commit.sha) {
        throw new Error(`Commit ${commit.sha} came back as ${created}. The branch was not moved.`);
    }
}

export async function pushBranch(git: LocalGit, github: GithubClient): Promise<PushResult> {
    const branch = git.currentBranch();
    if (!branch) {
        throw new Error('HEAD is detached: check out the branch to push.');
    }
    const defaultBranch = await github.getDefaultBranch();
    if (branch === defaultBranch) {
        throw new Error(
            `Refusing to push the default branch ${defaultBranch}: open a pull request instead.`,
        );
    }

    const head = git.headSha();
    const remoteHead = await github.getBranchHead(branch);
    if (remoteHead === head) {
        return { status: 'up-to-date', branch, head, commits: 0 };
    }

    const base = await findBase(git, github, branch, head, remoteHead, defaultBranch);
    const plan = git.commitsBetween(base, head).map((sha) => planCommit(git, sha));

    const uploadedBlobs = new Set<string>();
    for (const commit of plan) {
        await recreateCommit(github, git, commit, uploadedBlobs);
    }

    if (remoteHead) {
        await github.updateBranch(branch, head);
    } else {
        await github.createBranch(branch, head);
    }
    return { status: 'pushed', branch, head, commits: plan.length };
}

async function main(): Promise<void> {
    const token = process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GH_TOKEN is not set');
    }
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
    const github = createGithubClient({ token, repo: parseGithubRepo(remote) });

    const result = await pushBranch(createLocalGit(process.cwd()), github);
    const short = result.head.slice(0, 7);
    if (result.status === 'up-to-date') {
        process.stdout.write(`${result.branch} is already up to date on GitHub (${short}).\n`);
        return;
    }
    process.stdout.write(`Pushed ${result.commits} commit(s) to ${result.branch} (${short}).\n`);

    try {
        execFileSync('git', ['update-ref', `refs/remotes/origin/${result.branch}`, result.head]);
    } catch (error) {
        console.warn(
            `Pushed, but could not update origin/${result.branch} locally: ${error instanceof Error ? error.message : error}`,
        );
    }
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
