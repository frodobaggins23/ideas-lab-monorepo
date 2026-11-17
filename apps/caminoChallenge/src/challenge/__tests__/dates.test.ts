import { describe, expect, it } from 'vitest';

import { addDays, daysBetween, formatDate, isIsoDate, toIsoDate } from '@/challenge/dates';

describe('dates', () => {
    it('formats a local date without shifting it to UTC', () => {
        expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    });

    it('accepts only real calendar dates', () => {
        expect(isIsoDate('2026-02-28')).toBe(true);
        expect(isIsoDate('2026-02-31')).toBe(false);
        expect(isIsoDate('2026-2-3')).toBe(false);
        expect(isIsoDate(20260203)).toBe(false);
    });

    it('counts whole days across a daylight saving change', () => {
        expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
        expect(daysBetween('2026-03-30', '2026-03-28')).toBe(-2);
    });

    it('adds days across a month end', () => {
        expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    });

    it('formats dates the Czech way', () => {
        expect(formatDate('2026-11-07')).toBe('7. 11. 2026');
    });
});
