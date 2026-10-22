import { describe, expect, it } from 'vitest';

import { SENSES } from './senses';
import { initialState, isSenseComplete, sessionReducer, type SessionState } from './session';

const run = (state: SessionState, ...types: Parameters<typeof sessionReducer>[1]['type'][]) =>
    types.reduce((acc, type) => sessionReducer(acc, { type }), state);

describe('sessionReducer', () => {
    it('follows the 5-4-3-2-1 order', () => {
        expect(SENSES.map((sense) => sense.count)).toEqual([5, 4, 3, 2, 1]);
    });

    it('starts on the first sense with nothing noticed', () => {
        expect(run(initialState, 'start')).toEqual({ phase: 'sense', senseIndex: 0, noticed: 0 });
    });

    it('counts noticed items and caps at the sense count', () => {
        const state = run(
            initialState,
            'start',
            'notice',
            'notice',
            'notice',
            'notice',
            'notice',
            'notice',
        );
        expect(state.noticed).toBe(5);
        expect(isSenseComplete(state)).toBe(true);
    });

    it('does not go below zero when undoing', () => {
        expect(run(initialState, 'start', 'unnotice').noticed).toBe(0);
    });

    it('lets the user move on before the sense is complete', () => {
        const state = run(initialState, 'start', 'notice', 'next');
        expect(state).toEqual({ phase: 'sense', senseIndex: 1, noticed: 0 });
    });

    it('finishes after the last sense', () => {
        const state = run(initialState, 'start', 'next', 'next', 'next', 'next', 'next');
        expect(state.phase).toBe('done');
    });

    it('goes back to the intro from the first sense', () => {
        expect(run(initialState, 'start', 'back')).toEqual(initialState);
    });

    it('ignores sense actions outside the sense phase', () => {
        expect(run(initialState, 'notice', 'next', 'back')).toEqual(initialState);
    });

    it('restarts from the done screen', () => {
        expect(
            run(initialState, 'start', 'next', 'next', 'next', 'next', 'next', 'restart'),
        ).toEqual(initialState);
    });
});
