import { describe, expect, it } from 'vitest';

import { extractInstallPackages, isRegistrySpec } from '../npmCommand.ts';

describe('extractInstallPackages', () => {
    it.each([
        ['npm install zustand', ['zustand']],
        ['npm i zustand', ['zustand']],
        ['npm add zustand', ['zustand']],
        ['npm install -D vitest @types/node', ['vitest', '@types/node']],
        ['npm install zustand@^5.0.0 --save-exact', ['zustand@^5.0.0']],
        ['npm install recharts -w @lab/lab-example', ['recharts']],
        ['npm install recharts --workspace=@lab/lab-example', ['recharts']],
        ['cd apps/x && npm install date-fns && npm run build', ['date-fns']],
        ['npm install a; npm install b', ['a', 'b']],
        ['npm install github:owner/repo', ['github:owner/repo']],
        ['npm install ./local/dir', ['./local/dir']],
        ['npm install zustand 2>&1', ['zustand']],
        ['npm install zustand 2>&1 | tail -4', ['zustand']],
        ['npm install zustand > out.log', ['zustand']],
        ['npm install zustand >> out.log 2> err.log', ['zustand']],
        ['npm install zustand &> out.log', ['zustand']],
        ['npm install zustand < in.txt', ['zustand']],
        ['npm install "foo@>=1.0.0"', ['foo@>=1.0.0']],
    ])('finds the packages in %j', (command, expected) => {
        expect(extractInstallPackages(command)).toEqual(expected);
    });

    it.each([
        'npm install',
        'npm ci',
        'npm install --ignore-scripts',
        'npm run build',
        'npx nx run-many -t test',
        'echo "npm install foo"',
    ])('finds nothing in %j', (command) => {
        expect(extractInstallPackages(command)).toEqual([]);
    });
});

describe('isRegistrySpec', () => {
    it.each(['zustand', 'zustand@^5.0.0', '@types/node', '@types/node@22'])(
        'treats %s as a registry package',
        (spec) => {
            expect(isRegistrySpec(spec)).toBe(true);
        },
    );

    it.each([
        './dir',
        '../dir',
        '/abs',
        'file:../x',
        'github:o/r',
        'git+https://x/y.git',
        'https://x/y.tgz',
        'o/r',
        'npm:other@1',
    ])('treats %s as a non-registry source', (spec) => {
        expect(isRegistrySpec(spec)).toBe(false);
    });
});
