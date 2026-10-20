import { describe, expect, it } from 'vitest';

import { isRegistrySpec } from '../npmCommand.ts';

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
