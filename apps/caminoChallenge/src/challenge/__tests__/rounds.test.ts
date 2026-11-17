import { describe, expect, it } from 'vitest';

import {
    abandonCurrentRound,
    addEntry,
    canStartRound,
    type ChallengeState,
    EMPTY_STATE,
    getBestRound,
    getCompletedRounds,
    getCompletionDate,
    removeEntry,
    type Round,
    startRound,
    summarizeRound,
    validateEntry,
} from '@/challenge/rounds';

function round(startedOn: string, entries: [string, number][], id = 'r'): Round {
    return {
        id,
        startedOn,
        entries: entries.map(([date, km], index) => ({ id: `${id}-${index}`, date, km })),
    };
}

describe('summarizeRound', () => {
    it('counts the start day as day 1', () => {
        const summary = summarizeRound(round('2026-11-17', []), 1, '2026-11-17');
        expect(summary.dayNumber).toBe(1);
        expect(summary.totalKm).toBe(0);
        expect(summary.remainingKm).toBe(770);
        expect(summary.projectedFinishOn).toBeNull();
    });

    it('sums kilometres without floating point noise', () => {
        const summary = summarizeRound(
            round('2026-11-01', [
                ['2026-11-01', 0.1],
                ['2026-11-02', 0.2],
            ]),
            1,
            '2026-11-02',
        );
        expect(summary.totalKm).toBe(0.3);
    });

    it('projects the finish date from the average so far', () => {
        // 77 km in 10 days -> 770 km in 100 days.
        const summary = summarizeRound(round('2026-01-01', [['2026-01-05', 77]]), 1, '2026-01-10');
        expect(summary.dayNumber).toBe(10);
        expect(summary.averageKmPerDay).toBe(7.7);
        expect(summary.projectedFinishOn).toBe('2026-04-10');
    });

    it('freezes the day count on the day the route is completed', () => {
        const summary = summarizeRound(
            round('2026-01-01', [
                ['2026-01-02', 400],
                ['2026-01-04', 370],
            ]),
            1,
            '2026-03-01',
        );
        expect(summary.completedOn).toBe('2026-01-04');
        expect(summary.dayNumber).toBe(4);
        expect(summary.remainingKm).toBe(0);
        expect(summary.projectedFinishOn).toBeNull();
    });
});

describe('getCompletionDate', () => {
    it('uses the date of the entry that crosses 770 km, whatever the order of adding', () => {
        const completed = round('2026-01-01', [
            ['2026-01-09', 100],
            ['2026-01-02', 700],
        ]);
        expect(getCompletionDate(completed)).toBe('2026-01-09');
    });

    it('is null while the route is unfinished', () => {
        expect(getCompletionDate(round('2026-01-01', [['2026-01-02', 769.9]]))).toBeNull();
    });
});

describe('round lifecycle', () => {
    const today = '2026-02-01';

    it('starts the first round and adds entries to the current one', () => {
        let state = startRound(EMPTY_STATE, 'a', '2026-01-01');
        state = addEntry(state, { id: 'e1', date: '2026-01-02', km: 12.345 });
        expect(state.rounds).toHaveLength(1);
        expect(state.rounds[0]?.entries).toEqual([{ id: 'e1', date: '2026-01-02', km: 12.3 }]);
        expect(removeEntry(state, 'e1').rounds[0]?.entries).toEqual([]);
    });

    it('allows a new round only after the current one is completed', () => {
        const running: ChallengeState = { rounds: [round('2026-01-01', [['2026-01-02', 10]])] };
        expect(canStartRound(running)).toBe(false);
        expect(() => startRound(running, 'b', today)).toThrow();

        const done: ChallengeState = { rounds: [round('2026-01-01', [['2026-01-20', 770]])] };
        expect(canStartRound(done)).toBe(true);
        expect(startRound(done, 'b', today).rounds.map((r) => r.id)).toEqual(['r', 'b']);
    });

    it('never changes completed rounds when editing the current one', () => {
        const first = round('2026-01-01', [['2026-01-20', 770]], 'first');
        let state = startRound({ rounds: [first] }, 'second', '2026-01-21');
        state = addEntry(state, { id: 'x', date: '2026-01-22', km: 5 });
        state = removeEntry(state, 'first-0');
        expect(state.rounds[0]).toBe(first);
    });

    it('abandons only an unfinished current round', () => {
        const done: ChallengeState = { rounds: [round('2026-01-01', [['2026-01-20', 770]])] };
        expect(abandonCurrentRound(done)).toBe(done);
        const running = startRound(done, 'b', today);
        expect(abandonCurrentRound(running).rounds).toHaveLength(1);
    });
});

describe('history', () => {
    const state: ChallengeState = {
        rounds: [
            round('2026-01-01', [['2026-01-30', 770]], 'one'),
            round('2026-02-01', [['2026-02-20', 770]], 'two'),
            round('2026-03-01', [['2026-03-20', 770]], 'three'),
            round('2026-04-01', [['2026-04-02', 10]], 'running'),
        ],
    };

    it('lists completed rounds newest first with their number', () => {
        const completed = getCompletedRounds(state, '2026-04-10');
        expect(completed.map((summary) => [summary.number, summary.dayNumber])).toEqual([
            [3, 20],
            [2, 20],
            [1, 30],
        ]);
    });

    it('picks the fastest round, the earlier one on a tie', () => {
        const best = getBestRound(getCompletedRounds(state, '2026-04-10'));
        expect(best?.round.id).toBe('two');
        expect(getBestRound([])).toBeNull();
    });
});

describe('validateEntry', () => {
    const current = round('2026-01-10', [['2026-01-10', 5]]);
    const today = '2026-01-20';

    it('accepts a positive distance within the round', () => {
        expect(validateEntry(current, { date: '2026-01-15', km: 12.5 }, today)).toBeNull();
    });

    it.each([
        [{ date: '2026-01-15', km: 0 }, 'kladný'],
        [{ date: '2026-01-15', km: Number.NaN }, 'kladný'],
        [{ date: '2026-01-15', km: 151 }, 'Maximum'],
        [{ date: '2026-01-09', km: 5 }, 'před začátkem'],
        [{ date: '2026-01-21', km: 5 }, 'budoucnosti'],
        [{ date: 'yesterday', km: 5 }, 'platné datum'],
    ])('rejects %o', (input, message) => {
        expect(validateEntry(current, input, today)).toContain(message);
    });

    it('rejects entries without a running round', () => {
        expect(validateEntry(null, { date: today, km: 5 }, today)).not.toBeNull();
        const done = round('2026-01-01', [['2026-01-05', 770]]);
        expect(validateEntry(done, { date: today, km: 5 }, today)).toContain('dokončené');
    });
});
