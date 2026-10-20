import { execFileSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import { deriveAppNames } from './appNames.ts';
import type { VercelClient } from './vercelApi.ts';
import { createVercelClient } from './vercelApi.ts';

export interface WaitForDeploymentInput {
    appName: string;
    branch: string;
    commitSha: string;
}

export interface WaitOptions {
    sleep: (ms: number) => Promise<void>;
    intervalMs: number;
    maxAttempts: number;
}

export type DeploymentOutcome =
    | { state: 'READY'; url: string }
    | { state: 'ERROR' | 'CANCELED'; url: string; log: string[] }
    | { state: 'TIMEOUT' };

// Right after a push the branch's latest deployment can still be the previous commit's, so wait
// for the deployment of the pushed commit itself.
export async function waitForDeployment(
    client: VercelClient,
    { appName, branch, commitSha }: WaitForDeploymentInput,
    { sleep, intervalMs, maxAttempts }: WaitOptions,
): Promise<DeploymentOutcome> {
    const { vercelProject } = deriveAppNames(appName);
    const project = await client.getProject(vercelProject);
    if (!project) {
        throw new Error(
            `Vercel project ${vercelProject} not found. Run npm run lab:vercel-project.`,
        );
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const deployment = await client.getLatestDeployment(project.id, branch);
        if (deployment?.meta?.githubCommitSha === commitSha) {
            const url = `https://${deployment.url}`;
            if (deployment.readyState === 'READY') {
                return { state: 'READY', url };
            }
            if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
                const events = await client.getDeploymentEvents(deployment.id);
                const log = events.flatMap((event) => (event.text ? [event.text] : []));
                return { state: deployment.readyState, url, log };
            }
        }
        if (attempt < maxAttempts) {
            await sleep(intervalMs);
        }
    }
    return { state: 'TIMEOUT' };
}

async function main(): Promise<number> {
    const appName = process.argv[2];
    if (!appName) {
        throw new Error('Usage: waitForDeployment.ts <appName>');
    }
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
        throw new Error('VERCEL_TOKEN is not set');
    }
    const git = (...args: string[]): string =>
        execFileSync('git', args, { encoding: 'utf8' }).trim();
    const client = createVercelClient({ token, teamId: process.env.VERCEL_TEAM_ID });

    const outcome = await waitForDeployment(
        client,
        { appName, branch: git('branch', '--show-current'), commitSha: git('rev-parse', 'HEAD') },
        { sleep: (ms) => setTimeout(ms), intervalMs: 10_000, maxAttempts: 90 },
    );
    if (outcome.state === 'READY') {
        process.stdout.write(`READY ${outcome.url}\n`);
        return 0;
    }
    if (outcome.state === 'TIMEOUT') {
        process.stdout.write('TIMEOUT no finished deployment of this commit after 15 minutes\n');
        return 1;
    }
    // Vercel cancels a build when the ignored build step finds no change in the app.
    process.stdout.write(`${outcome.state} ${outcome.url}\n${outcome.log.slice(-60).join('\n')}\n`);
    return 1;
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    main()
        .then((code) => {
            process.exitCode = code;
        })
        .catch((error: unknown) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 2;
        });
}
