import { pathToFileURL } from 'node:url';

import { deriveAppNames } from './appNames.ts';
import type { VercelClient, VercelDeploymentSummary } from './vercelApi.ts';
import { createVercelClient } from './vercelApi.ts';

const logTailLines = 40;

function formatTime(timestamp: number): string {
    return `${new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function formatDeployment(deployment: VercelDeploymentSummary): string[] {
    const sha = (deployment.meta?.githubCommitSha ?? '-------').slice(0, 7);
    const line = [
        formatTime(deployment.createdAt),
        deployment.readyState.padEnd(8),
        sha,
        deployment.branch ?? '-',
        `https://${deployment.url}`,
    ].join('  ');
    return deployment.errorMessage ? [line, `    ${deployment.errorMessage}`] : [line];
}

export async function describeDeployments(
    client: VercelClient,
    appName: string,
    limit = 10,
): Promise<string[]> {
    const { vercelProject } = deriveAppNames(appName);
    const project = await client.getProject(vercelProject);
    if (!project) {
        throw new Error(
            `Vercel project ${vercelProject} not found. Run npm run lab:vercel-project.`,
        );
    }

    const deployments = await client.listDeployments(project.id, limit);
    const newest = deployments[0];
    if (!newest) {
        return [
            `No deployments yet for ${vercelProject}. Vercel only deploys pushes made after the project exists.`,
        ];
    }

    const lines = deployments.flatMap(formatDeployment);
    if (newest.readyState === 'ERROR' || newest.readyState === 'CANCELED') {
        const events = await client.getDeploymentEvents(newest.id);
        const log = events.flatMap((event) => (event.text ? [event.text] : []));
        lines.push('', `Build log of ${newest.id} (last ${logTailLines} lines):`);
        lines.push(...log.slice(-logTailLines));
    }
    return lines;
}

async function main(): Promise<void> {
    const appName = process.argv[2];
    if (!appName) {
        throw new Error('Usage: vercelStatus.ts <appName>');
    }
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
        throw new Error('VERCEL_TOKEN is not set');
    }
    const client = createVercelClient({ token, teamId: process.env.VERCEL_TEAM_ID });
    const lines = await describeDeployments(client, appName);
    process.stdout.write(`${lines.join('\n')}\n`);
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
