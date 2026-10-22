// Minimal GitHub REST client for pushing a branch through the Git Data API. git's own transport
// cannot push from the Claude Code sandbox: git sends the masked GH_TOKEN base64-encoded in a
// Basic auth header, where the proxy cannot replace it. The proxy replaces it in this client's
// plain Bearer header. See "Pushing from the sandbox" in docs/agentSetup/claude/README.md.
const defaultBaseUrl = 'https://api.github.com';

export interface GitPerson {
    name: string;
    email: string;
    date: string;
}

export interface TreeEntry {
    path: string;
    mode: string;
    type: 'blob';
    sha: string | null;
}

export interface CreateCommitInput {
    message: string;
    tree: string;
    parents: string[];
    author: GitPerson;
    committer: GitPerson;
}

export interface GithubClientOptions {
    token: string;
    repo: string;
    baseUrl?: string;
    fetchFn?: typeof fetch;
}

export class GithubApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'GithubApiError';
        this.status = status;
    }
}

export interface GithubClient {
    getDefaultBranch(): Promise<string>;
    getBranchHead(branch: string): Promise<string | undefined>;
    createBlob(base64Content: string): Promise<string>;
    createTree(baseTree: string, entries: TreeEntry[]): Promise<string>;
    createCommit(input: CreateCommitInput): Promise<string>;
    createBranch(branch: string, sha: string): Promise<void>;
    updateBranch(branch: string, sha: string): Promise<void>;
}

function branchPath(branch: string): string {
    return branch.split('/').map(encodeURIComponent).join('/');
}

export function createGithubClient(options: GithubClientOptions): GithubClient {
    const { token, repo, baseUrl = defaultBaseUrl, fetchFn = fetch } = options;

    async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const headers = new Headers({
            authorization: `Bearer ${token}`,
            accept: 'application/vnd.github+json',
        });
        if (body !== undefined) {
            headers.set('content-type', 'application/json');
        }
        const response = await fetchFn(`${baseUrl}/repos/${repo}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!response.ok) {
            throw await toApiError(response);
        }
        return (await response.json()) as T;
    }

    return {
        async getDefaultBranch() {
            const { default_branch } = await request<{ default_branch: string }>('GET', '');
            return default_branch;
        },
        async getBranchHead(branch) {
            try {
                const ref = await request<{ object: { sha: string } }>(
                    'GET',
                    `/git/ref/heads/${branchPath(branch)}`,
                );
                return ref.object.sha;
            } catch (error) {
                if (error instanceof GithubApiError && error.status === 404) {
                    return undefined;
                }
                throw error;
            }
        },
        async createBlob(base64Content) {
            const blob = await request<{ sha: string }>('POST', '/git/blobs', {
                content: base64Content,
                encoding: 'base64',
            });
            return blob.sha;
        },
        async createTree(baseTree, entries) {
            const tree = await request<{ sha: string }>('POST', '/git/trees', {
                base_tree: baseTree,
                tree: entries,
            });
            return tree.sha;
        },
        async createCommit(input) {
            const commit = await request<{ sha: string }>('POST', '/git/commits', input);
            return commit.sha;
        },
        async createBranch(branch, sha) {
            await request('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha });
        },
        async updateBranch(branch, sha) {
            await request('PATCH', `/git/refs/heads/${branchPath(branch)}`, { sha, force: false });
        },
    };
}

async function toApiError(response: Response): Promise<GithubApiError> {
    const fallback = `GitHub API responded with HTTP ${response.status}`;
    try {
        const payload = (await response.json()) as { message?: string };
        return new GithubApiError(response.status, payload.message ?? fallback);
    } catch {
        return new GithubApiError(response.status, fallback);
    }
}
