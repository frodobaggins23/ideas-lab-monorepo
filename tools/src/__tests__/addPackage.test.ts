import { describe, expect, it, vi } from 'vitest';

import { addPackages } from '../addPackage.ts';
import type { CheckResult } from '../checkPackage.ts';

const pass = (spec: string): CheckResult => ({
    spec,
    evaluation: { passed: true, failures: [], warnings: [] },
});
const fail = (spec: string, reason: string): CheckResult => ({
    spec,
    evaluation: { passed: false, failures: [reason], warnings: [] },
});

function setup(results: CheckResult[], installCode = 0) {
    const lines: string[] = [];
    const deps = {
        check: vi.fn(async () => results),
        install: vi.fn(async () => installCode),
        log: (line: string) => lines.push(line),
    };
    return { deps, output: () => lines.join('\n') };
}

describe('addPackages', () => {
    it('installs with the original arguments when every package passes', async () => {
        const { deps } = setup([pass('date-fns')]);

        const code = await addPackages(['date-fns', '-w', '@lab/x'], deps);

        expect(code).toBe(0);
        expect(deps.check).toHaveBeenCalledWith(['date-fns']);
        expect(deps.install).toHaveBeenCalledWith(['date-fns', '-w', '@lab/x']);
    });

    it('does not install when a check fails and gives the user the command to run themselves', async () => {
        const { deps, output } = setup([fail('http-server', 'Latest release is too old')]);

        const code = await addPackages(['http-server', '-D'], deps);

        expect(code).toBe(1);
        expect(deps.install).not.toHaveBeenCalled();
        expect(output()).toContain('http-server: FAIL');
        expect(output()).toContain('Latest release is too old');
        expect(output()).toContain('npm install --save-exact http-server -D');
        expect(output()).toContain('outside the sandbox');
    });

    it('does not install anything when only one of several packages fails', async () => {
        const { deps } = setup([pass('date-fns'), fail('http-server', 'too old')]);

        const code = await addPackages(['date-fns', 'http-server'], deps);

        expect(code).toBe(1);
        expect(deps.install).not.toHaveBeenCalled();
    });

    it('returns the exit code of a failing install', async () => {
        const { deps } = setup([pass('a')], 3);

        expect(await addPackages(['a'], deps)).toBe(3);
    });

    it.each([
        { flags: ['--save-dev', '-w', '@lab/x'] },
        { flags: ['-D', '--workspace', '@lab/x'] },
        { flags: ['--workspace=@lab/x'] },
    ])('accepts the allowed flags $flags', async ({ flags }) => {
        const { deps } = setup([pass('date-fns')]);

        const code = await addPackages(['date-fns', ...flags], deps);

        expect(code).toBe(0);
        expect(deps.check).toHaveBeenCalledWith(['date-fns']);
    });

    // Any other flag could change where or how npm installs (e.g. a different registry), which
    // the check would not see.
    it.each([
        { args: ['react', '--registry=https://evil.example'] },
        { args: ['react', '--registry', 'https://evil.example'] },
        { args: ['react', '--ignore-scripts=false'] },
        { args: ['react', '--prefix', '/tmp/x'] },
        { args: ['react', '--force'] },
        { args: ['react', '-w'] },
        { args: ['react', '-w', '--registry=https://evil.example'] },
    ])('rejects $args and installs nothing', async ({ args }) => {
        const { deps } = setup([pass('react')]);

        await expect(addPackages(args, deps)).rejects.toThrowError(/Usage/);
        expect(deps.check).not.toHaveBeenCalled();
        expect(deps.install).not.toHaveBeenCalled();
    });

    it('rejects a call that names no package and installs nothing', async () => {
        const { deps } = setup([]);

        await expect(addPackages(['-D'], deps)).rejects.toThrowError(/Usage/);
        expect(deps.check).not.toHaveBeenCalled();
        expect(deps.install).not.toHaveBeenCalled();
    });
});
