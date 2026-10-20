import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import type { CheckResult } from './checkPackage.ts';
import { checkPackagesWithRegistry, formatReport } from './checkPackage.ts';
import { extractInstallPackages } from './npmCommand.ts';

export interface AddPackagesDeps {
    check: (specs: string[]) => Promise<CheckResult[]>;
    install: (args: string[]) => Promise<number>;
    log: (line: string) => void;
}

// `npm run lab:add` installs only packages that pass the dependency check. There is deliberately
// no override: when a check fails, the user installs the package themselves outside the sandbox.
export async function addPackages(
    args: string[],
    { check, install, log }: AddPackagesDeps,
): Promise<number> {
    const specs = extractInstallPackages(`npm install ${args.join(' ')}`);
    if (specs.length === 0) {
        throw new Error('Usage: npm run lab:add -- <package[@range]>... [-D] [-w <workspace>]');
    }

    const results = await check(specs);
    log(formatReport(results));

    if (results.some((result) => !result.evaluation.passed)) {
        log('');
        log('Nothing was installed. Tell the user which check failed and let them decide.');
        log('If they approve, they run this themselves in a terminal outside the sandbox:');
        log(`npm install --save-exact ${args.join(' ')}`);
        return 1;
    }

    return install(args);
}

function runNpmInstall(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = spawn('npm', ['install', '--save-exact', ...args], { stdio: 'inherit' });
        child.on('error', reject);
        child.on('exit', (code) => resolve(code ?? 1));
    });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    addPackages(process.argv.slice(2), {
        check: checkPackagesWithRegistry,
        install: runNpmInstall,
        log: (line) => process.stdout.write(`${line}\n`),
    })
        .then((code) => {
            process.exitCode = code;
        })
        .catch((error: unknown) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 2;
        });
}
