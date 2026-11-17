import { describe, expect, it } from 'vitest';

import { parseKm } from '@/challenge/parseKm';

describe('parseKm', () => {
    it.each([
        ['12', 12],
        ['12.5', 12.5],
        [' 12,5 ', 12.5],
    ])('reads %s', (text, km) => {
        expect(parseKm(text)).toBe(km);
    });

    it.each(['', 'abc', '-3', '1e3', '12,5,1'])('rejects %j', (text) => {
        expect(parseKm(text)).toBeNaN();
    });
});
