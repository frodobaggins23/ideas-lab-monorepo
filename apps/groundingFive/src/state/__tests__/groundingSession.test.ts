import { describe, expect, it } from 'vitest';

import type { GroundingStep } from '@/types/groundingStep';

import { createInitialState, markFound } from '../groundingSession';

const steps: readonly GroundingStep[] = [
    { id: 'a', sense: 'A', count: 2, instruction: '', icon: '', gradient: '' },
    { id: 'b', sense: 'B', count: 1, instruction: '', icon: '', gradient: '' },
];

describe('createInitialState', () => {
    it('starts at the first step with its full count', () => {
        expect(createInitialState(steps)).toEqual({
            stepIndex: 0,
            remaining: 2,
            isComplete: false,
        });
    });

    it('is complete immediately when there are no steps', () => {
        expect(createInitialState([])).toEqual({ stepIndex: 0, remaining: 0, isComplete: true });
    });
});

describe('markFound', () => {
    it('decrements the remaining count within a step', () => {
        const state = createInitialState(steps);
        const next = markFound(state, steps);
        expect(next).toEqual({ stepIndex: 0, remaining: 1, isComplete: false });
    });

    it('advances to the next step once the count reaches zero', () => {
        const afterFirstFind = markFound(createInitialState(steps), steps);
        const afterSecondFind = markFound(afterFirstFind, steps);
        expect(afterSecondFind).toEqual({ stepIndex: 1, remaining: 1, isComplete: false });
    });

    it('marks the session complete after the last step finishes', () => {
        const afterStepA = markFound(markFound(createInitialState(steps), steps), steps);
        const afterStepB = markFound(afterStepA, steps);
        expect(afterStepB).toEqual({ stepIndex: 1, remaining: 0, isComplete: true });
    });

    it('does nothing once the session is already complete', () => {
        let state = createInitialState(steps);
        for (let i = 0; i < 3; i += 1) {
            state = markFound(state, steps);
        }
        const finalState = markFound(state, steps);
        expect(finalState).toEqual(state);
    });
});
