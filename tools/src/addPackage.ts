import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import type { CheckResult } from './checkPackage.ts';
import { checkPackagesWithRegistry, formatReport } from './checkPackage.ts';

export interface AddPackagesDeps {
    check: (specs: string[]) => Promise<CheckResult[]>;
    install: (args: string[]) => Promise<number>;
    log: (line: string) => void;
}

const usage = 'Usage: npm run lab:add -- <package[@range]>... [-D] [-w <workspace>]';

// Only flags that cannot change where or how npm installs are allowed: anything else (such as
// `--registry`) could install something other than what the check looked at.
function extractSpecs(args: string[]): string[] {
    const specs: string[] = [];
    for (let index = 0; index < args.length; index++) {
        const arg = args[index] ?? '';
        if (arg === '-D' || arg === '--save-dev' || arg.startsWith('--workspace=')) {
            continue;
        }
        if (arg === '-w' || arg === '--workspace') {
            // npm does not take a value starting with `-`, so it would parse it as another flag.
            const workspace = args[index + 1];
            if (workspace === undefined || workspace.startsWith('-')) {
                throw new Error(usage);
            }
            index++;
            continue;
        }
        if (arg.startsWith('-')) {
            throw new Error(`${usage}\nFlag "${arg}" is not allowed.`);
        }
        specs.push(arg);
    }
    return specs;
}

// `npm run lab:add` installs only packages that pass the dependency check. There is deliberately
// no override: when a check fails, the user installs the package themselves outside the sandbox.
export async function addPackages(
    args: string[],
    { check, install, log }: AddPackagesDeps,
): Promise<number> {
    const specs = extractSpecs(args);
    if (specs.length === 0) {
        throw new Error(usage);
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
