import { describe, expect, it } from 'vitest';

import { FILL_MS, fillDelayMs, SETTLE_MS } from './animation';

describe('fillDelayMs', () => {
    it('starts the first circle immediately', () => {
        expect(fillDelayMs(0, 5)).toBe(0);
    });

    it('lets the last circle finish exactly when the settle time ends', () => {
        expect(fillDelayMs(4, 5) + FILL_MS).toBe(SETTLE_MS);
    });

    it('handles a single circle', () => {
        expect(fillDelayMs(0, 1)).toBe(0);
    });
});
