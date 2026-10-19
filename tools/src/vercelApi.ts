// Minimal Vercel REST client for deploying lab apps. Vercel's CLI cannot run in the Claude Code
// sandbox (it rejects the masked VERCEL_TOKEN placeholder), so these few calls replace it.
// See "Vercel" in the root CLAUDE.md before extending this file.
const defaultBaseUrl = 'https://api.vercel.com';

export type VercelDeploymentState =
    'QUEUED' | 'INITIALIZING' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

export interface VercelProject {
    id: string;
    name: string;
    rootDirectory?: string | null;
}

export interface VercelDeployment {
    id: string;
    url: string;
    readyState: VercelDeploymentState;
}

export interface VercelDeploymentEvent {
    type: string;
    text?: string;
}

export interface CreateProjectInput {
    name: string;
    rootDirectory: string;
    gitRepository: { type: 'github'; repo: string };
    commandForIgnoringBuildStep?: string;
}

export interface VercelClientOptions {
    token: string;
    teamId?: string;
    baseUrl?: string;
    fetchFn?: typeof fetch;
}

export class VercelApiError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = 'VercelApiError';
        this.status = status;
        this.code = code;
    }
}

export interface VercelClient {
    getProject(idOrName: string): Promise<VercelProject | undefined>;
    createProject(input: CreateProjectInput): Promise<VercelProject>;
    makePreviewsPublic(projectId: string): Promise<void>;
    getLatestDeployment(projectId: string, branch: string): Promise<VercelDeployment | undefined>;
    getDeploymentEvents(deploymentId: string): Promise<VercelDeploymentEvent[]>;
}

export function createVercelClient(options: VercelClientOptions): VercelClient {
    const { token, teamId, baseUrl = defaultBaseUrl, fetchFn = fetch } = options;

    async function request<T>(
        method: string,
        path: string,
        query: Record<string, string | undefined> = {},
        body?: unknown,
    ): Promise<T> {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params.set(key, value);
            }
        }
        if (teamId) {
            params.set('teamId', teamId);
        }
        const queryString = params.toString();
        const url = `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;

        const headers = new Headers({ authorization: `Bearer ${token}` });
        if (body !== undefined) {
            headers.set('content-type', 'application/json');
        }
        const response = await fetchFn(url, {
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
        async getProject(idOrName) {
            try {
                return await request<VercelProject>(
                    'GET',
                    `/v9/projects/${encodeURIComponent(idOrName)}`,
                );
            } catch (error) {
                if (error instanceof VercelApiError && error.status === 404) {
                    return undefined;
                }
                throw error;
            }
        },
        createProject(input) {
            return request<VercelProject>('POST', '/v11/projects', undefined, {
                framework: 'vite',
                ...input,
            });
        },
        async makePreviewsPublic(projectId) {
            await request('PATCH', `/v9/projects/${encodeURIComponent(projectId)}`, undefined, {
                ssoProtection: null,
            });
        },
        async getLatestDeployment(projectId, branch) {
            const { deployments } = await request<{ deployments: VercelDeployment[] }>(
                'GET',
                '/v6/deployments',
                { projectId, branch, limit: '1' },
            );
            return deployments[0];
        },
        getDeploymentEvents(deploymentId) {
            return request<VercelDeploymentEvent[]>(
                'GET',
                `/v3/deployments/${encodeURIComponent(deploymentId)}/events`,
            );
        },
    };
}

async function toApiError(response: Response): Promise<VercelApiError> {
    const fallback = `Vercel API responded with HTTP ${response.status}`;
    try {
        const payload = (await response.json()) as { error?: { code?: string; message?: string } };
        return new VercelApiError(
            response.status,
            payload.error?.code ?? 'unknown',
            payload.error?.message ?? fallback,
        );
    } catch {
        return new VercelApiError(response.status, 'unknown', fallback);
    }
}
