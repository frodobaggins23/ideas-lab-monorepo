import { getSense, SENSES } from './senses';

export type Phase = 'intro' | 'sense' | 'done';

export interface SessionState {
    phase: Phase;
    senseIndex: number;
    noticed: number;
}

export type SessionAction =
    | { type: 'start' }
    | { type: 'notice' }
    | { type: 'unnotice' }
    | { type: 'next' }
    | { type: 'back' }
    | { type: 'restart' };

export const initialState: SessionState = { phase: 'intro', senseIndex: 0, noticed: 0 };

export function isSenseComplete(state: SessionState): boolean {
    return state.phase === 'sense' && state.noticed >= getSense(state.senseIndex).count;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
        case 'start':
            return { phase: 'sense', senseIndex: 0, noticed: 0 };
        case 'notice': {
            if (state.phase !== 'sense') return state;
            const max = getSense(state.senseIndex).count;
            return { ...state, noticed: Math.min(state.noticed + 1, max) };
        }
        case 'unnotice':
            if (state.phase !== 'sense') return state;
            return { ...state, noticed: Math.max(state.noticed - 1, 0) };
        case 'next':
            if (state.phase !== 'sense') return state;
            if (state.senseIndex === SENSES.length - 1) {
                return { phase: 'done', senseIndex: state.senseIndex, noticed: 0 };
            }
            return { phase: 'sense', senseIndex: state.senseIndex + 1, noticed: 0 };
        case 'back':
            if (state.phase !== 'sense') return state;
            if (state.senseIndex === 0) return initialState;
            return { phase: 'sense', senseIndex: state.senseIndex - 1, noticed: 0 };
        case 'restart':
            return initialState;
    }
}
