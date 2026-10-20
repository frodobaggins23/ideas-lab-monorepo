import type { GroundingStep } from '@/types/groundingStep';

export interface GroundingSessionState {
    readonly stepIndex: number;
    readonly remaining: number;
    readonly isComplete: boolean;
}

export function createInitialState(steps: readonly GroundingStep[]): GroundingSessionState {
    const firstStep = steps[0];
    return {
        stepIndex: 0,
        remaining: firstStep ? firstStep.count : 0,
        isComplete: steps.length === 0,
    };
}

export function markFound(
    state: GroundingSessionState,
    steps: readonly GroundingStep[],
): GroundingSessionState {
    if (state.isComplete || state.remaining <= 0) {
        return state;
    }

    const remaining = state.remaining - 1;
    if (remaining > 0) {
        return { ...state, remaining };
    }

    const nextIndex = state.stepIndex + 1;
    const nextStep = steps[nextIndex];
    if (!nextStep) {
        return { ...state, remaining: 0, isComplete: true };
    }

    return { stepIndex: nextIndex, remaining: nextStep.count, isComplete: false };
}
