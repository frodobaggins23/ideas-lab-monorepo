import { useMemo, useReducer } from 'react';

import { groundingSteps } from '@/data/groundingSteps';
import type { GroundingSessionState } from '@/state/groundingSession';
import { createInitialState, markFound } from '@/state/groundingSession';
import type { GroundingStep } from '@/types/groundingStep';

type Action = { type: 'found' } | { type: 'reset' };

export interface GroundingSession {
    readonly steps: readonly GroundingStep[];
    readonly currentStep: GroundingStep | undefined;
    readonly stepIndex: number;
    readonly remaining: number;
    readonly isComplete: boolean;
    readonly progress: number;
    readonly markFound: () => void;
    readonly reset: () => void;
}

function reducer(state: GroundingSessionState, action: Action): GroundingSessionState {
    switch (action.type) {
        case 'found':
            return markFound(state, groundingSteps);
        case 'reset':
            return createInitialState(groundingSteps);
    }
}

export function useGroundingSession(): GroundingSession {
    const [state, dispatch] = useReducer(reducer, groundingSteps, createInitialState);
    const currentStep = groundingSteps[state.stepIndex];

    const totalItems = useMemo(() => groundingSteps.reduce((sum, step) => sum + step.count, 0), []);
    const itemsDone = useMemo(() => {
        const doneInPriorSteps = groundingSteps
            .slice(0, state.stepIndex)
            .reduce((sum, step) => sum + step.count, 0);
        const doneInCurrentStep = currentStep ? currentStep.count - state.remaining : 0;
        return doneInPriorSteps + doneInCurrentStep;
    }, [state.stepIndex, state.remaining, currentStep]);

    return {
        steps: groundingSteps,
        currentStep,
        stepIndex: state.stepIndex,
        remaining: state.remaining,
        isComplete: state.isComplete,
        progress: totalItems === 0 ? 1 : itemsDone / totalItems,
        markFound: () => dispatch({ type: 'found' }),
        reset: () => dispatch({ type: 'reset' }),
    };
}
