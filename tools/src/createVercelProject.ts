import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { deriveAppNames, parseGithubRepo } from './appNames.ts';
import type { VercelClient, VercelProject } from './vercelApi.ts';
import { createVercelClient } from './vercelApi.ts';

// Exit 0 skips the build, exit 1 builds. Builds when there is no previous deployment, and
// otherwise only when the app, the shared libs or the dependency lockfile changed.
export const ignoreBuildCommand =
    '[ -z "$VERCEL_GIT_PREVIOUS_SHA" ] || git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ../../libs ../../package-lock.json ../../tsconfig.base.json';

export interface EnsureLabProjectInput {
    appName: string;
    repo: string;
}

export interface EnsureLabProjectResult {
    created: boolean;
    project: VercelProject;
}

export async function ensureLabProject(
    client: VercelClient,
    { appName, repo }: EnsureLabProjectInput,
): Promise<EnsureLabProjectResult> {
    const names = deriveAppNames(appName);

    const existing = await client.getProject(names.vercelProject);
    if (existing) {
        return { created: false, project: existing };
    }

    const project = await client.createProject({
        name: names.vercelProject,
        rootDirectory: names.directory,
        gitRepository: { type: 'github', repo },
        commandForIgnoringBuildStep: ignoreBuildCommand,
    });
    await client.makePreviewsPublic(project.id);
    return { created: true, project };
}

async function main(): Promise<void> {
    const appName = process.argv[2];
    if (!appName) {
        throw new Error('Usage: createVercelProject.ts <appName>');
    }
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
        throw new Error('VERCEL_TOKEN is not set');
    }
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
    const client = createVercelClient({ token, teamId: process.env.VERCEL_TEAM_ID });

    const result = await ensureLabProject(client, { appName, repo: parseGithubRepo(remote) });
    process.stdout.write(
        `${JSON.stringify({ created: result.created, name: result.project.name })}\n`,
    );
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
