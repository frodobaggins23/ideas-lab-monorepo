import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Evaluation, PackageFacts } from './evaluatePackage.ts';
import { evaluatePackage } from './evaluatePackage.ts';
import { isRegistrySpec } from './npmCommand.ts';
import { gatherPackageFacts, realPackageFactsDeps } from './packageFacts.ts';

export interface CheckResult {
    spec: string;
    evaluation: Evaluation;
}

export interface CheckPackagesDeps {
    allowlist: string[];
    gather: (spec: string) => Promise<PackageFacts>;
    now: Date;
}

function packageName(spec: string): string {
    return /^(@[^/]+\/[^@]+|[^@]+)/.exec(spec)?.[1] ?? spec;
}

function isPreApproved(spec: string, allowlist: string[]): boolean {
    const name = packageName(spec);
    return name.startsWith('@lab/') || allowlist.includes(name);
}

export async function checkPackages(
    specs: string[],
    { allowlist, gather, now }: CheckPackagesDeps,
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    for (const spec of specs) {
        if (!isRegistrySpec(spec)) {
            results.push({
                spec,
                evaluation: {
                    passed: false,
                    failures: [
                        `"${spec}" does not come from the npm registry and cannot be checked`,
                    ],
                    warnings: [],
                },
            });
        } else if (isPreApproved(spec, allowlist)) {
            results.push({ spec, evaluation: { passed: true, failures: [], warnings: [] } });
        } else {
            results.push({ spec, evaluation: evaluatePackage(await gather(spec), now) });
        }
    }
    return results;
}

export function formatReport(results: CheckResult[]): string {
    return results
        .map(({ spec, evaluation }) => {
            const lines = [`${spec}: ${evaluation.passed ? 'PASS' : 'FAIL'}`];
            lines.push(...evaluation.failures.map((failure) => `  - ${failure}`));
            lines.push(...evaluation.warnings.map((warning) => `  - warning: ${warning}`));
            return lines.join('\n');
        })
        .join('\n');
}

export function readAllowlist(): string[] {
    const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'dependencyAllowlist.json');
    return (JSON.parse(readFileSync(file, 'utf8')) as { packages: string[] }).packages;
}

export function checkPackagesWithRegistry(specs: string[]): Promise<CheckResult[]> {
    return checkPackages(specs, {
        allowlist: readAllowlist(),
        gather: (spec) => gatherPackageFacts(spec, realPackageFactsDeps),
        now: new Date(),
    });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    const specs = process.argv.slice(2);
    if (specs.length === 0) {
        console.error('Usage: checkPackage.ts <package[@range]>...');
        process.exitCode = 2;
    } else {
        checkPackagesWithRegistry(specs)
            .then((results) => {
                process.stdout.write(`${formatReport(results)}\n`);
                process.exitCode = results.every((result) => result.evaluation.passed) ? 0 : 1;
            })
            .catch((error: unknown) => {
                console.error(error instanceof Error ? error.message : error);
                process.exitCode = 2;
            });
    }
}
