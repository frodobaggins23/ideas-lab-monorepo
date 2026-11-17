import { describe, expect, it, vi } from 'vitest';

import { EMPTY_STATE } from '@/challenge/rounds';
import { parseChallengeState } from '@/challenge/storage';

describe('parseChallengeState', () => {
    it('round-trips a saved state', () => {
        const state = {
            rounds: [
                {
                    id: 'a',
                    startedOn: '2026-01-01',
                    entries: [{ id: 'e', date: '2026-01-02', km: 10 }],
                },
            ],
        };
        expect(parseChallengeState(JSON.stringify(state))).toEqual(state);
    });

    it('starts empty without saved data', () => {
        expect(parseChallengeState(null)).toBe(EMPTY_STATE);
    });

    it('ignores unreadable JSON', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(parseChallengeState('{oops')).toBe(EMPTY_STATE);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('drops invalid rounds and entries but keeps the valid ones', () => {
        const raw = JSON.stringify({
            rounds: [
                { id: 'bad', startedOn: 'not a date', entries: [] },
                {
                    id: 'ok',
                    startedOn: '2026-01-01',
                    entries: [
                        { id: 'e1', date: '2026-01-02', km: 5 },
                        { id: 'e2', date: '2026-01-02', km: -5 },
                        { id: 'e3', date: '2026-01-02', km: '5' },
                    ],
                },
            ],
        });
        expect(parseChallengeState(raw)).toEqual({
            rounds: [
                {
                    id: 'ok',
                    startedOn: '2026-01-01',
                    entries: [{ id: 'e1', date: '2026-01-02', km: 5 }],
                },
            ],
        });
    });

    it('ignores data of another shape', () => {
        expect(parseChallengeState('[1,2]')).toBe(EMPTY_STATE);
        expect(parseChallengeState('{"rounds":"x"}')).toBe(EMPTY_STATE);
    });
});
