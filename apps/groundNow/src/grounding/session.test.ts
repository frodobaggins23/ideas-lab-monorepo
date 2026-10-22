import { describe, expect, it } from 'vitest';

import { SENSES } from './senses';
import { initialState, type SessionAction, sessionReducer, type SessionState } from './session';

const run = (state: SessionState, ...types: SessionAction['type'][]) =>
    types.reduce((acc, type) => sessionReducer(acc, { type }), state);

describe('sessionReducer', () => {
    it('follows the 5-4-3-2-1 order', () => {
        expect(SENSES.map((sense) => sense.count)).toEqual([5, 4, 3, 2, 1]);
    });

    it('starts on the first sense, not yet completed', () => {
        expect(run(initialState, 'start')).toEqual({
            phase: 'sense',
            senseIndex: 0,
            completed: false,
        });
    });

    it('marks a sense completed with a single action', () => {
        expect(run(initialState, 'start', 'complete').completed).toBe(true);
    });

    it('only moves on once the sense is completed', () => {
        expect(run(initialState, 'start', 'next')).toEqual(run(initialState, 'start'));
        expect(run(initialState, 'start', 'complete', 'next')).toEqual({
            phase: 'sense',
            senseIndex: 1,
            completed: false,
        });
    });

    it('finishes after the last sense', () => {
        const steps = SENSES.flatMap(() => ['complete', 'next'] as const);
        expect(run(initialState, 'start', ...steps).phase).toBe('done');
    });

    it('goes back to the intro from the first sense', () => {
        expect(run(initialState, 'start', 'complete', 'back')).toEqual(initialState);
    });

    it('goes back one sense and resets its completion', () => {
        expect(run(initialState, 'start', 'complete', 'next', 'complete', 'back')).toEqual({
            phase: 'sense',
            senseIndex: 0,
            completed: false,
        });
    });

    it('ignores sense actions outside the sense phase', () => {
        expect(run(initialState, 'complete', 'next', 'back')).toEqual(initialState);
    });

    it('restarts from the done screen', () => {
        const steps = SENSES.flatMap(() => ['complete', 'next'] as const);
        expect(run(initialState, 'start', ...steps, 'restart')).toEqual(initialState);
    });
});
