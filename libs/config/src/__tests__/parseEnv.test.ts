import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseEnv } from '../parseEnv';

const shape = {
    VITE_API_URL: z.url(),
    VITE_FLAG: z.enum(['on', 'off']).default('off'),
};

describe('parseEnv', () => {
    it('returns typed values for a valid source', () => {
        const env = parseEnv(shape, { VITE_API_URL: 'https://example.com', VITE_FLAG: 'on' });

        expect(env).toEqual({ VITE_API_URL: 'https://example.com', VITE_FLAG: 'on' });
    });

    it('applies defaults for optional variables', () => {
        const env = parseEnv(shape, { VITE_API_URL: 'https://example.com' });

        expect(env.VITE_FLAG).toBe('off');
    });

    it('throws an error naming the missing variable', () => {
        expect(() => parseEnv(shape, {})).toThrowError(/VITE_API_URL/);
    });

    it('throws an error naming every invalid variable', () => {
        expect(() => parseEnv(shape, { VITE_API_URL: 'nope', VITE_FLAG: 'maybe' })).toThrowError(
            /VITE_API_URL[\s\S]*VITE_FLAG/,
        );
    });
});
