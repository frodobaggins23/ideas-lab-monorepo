import { SENSES } from './senses';

export type Phase = 'intro' | 'sense' | 'done';

export interface SessionState {
    phase: Phase;
    senseIndex: number;
    /** The user confirmed the current sense; the settling animation plays. */
    completed: boolean;
}

export type SessionAction =
    | { type: 'start' }
    | { type: 'complete' }
    | { type: 'next' }
    | { type: 'back' }
    | { type: 'restart' };

export const initialState: SessionState = { phase: 'intro', senseIndex: 0, completed: false };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
        case 'start':
            return { phase: 'sense', senseIndex: 0, completed: false };
        case 'complete':
            if (state.phase !== 'sense') return state;
            return { ...state, completed: true };
        case 'next':
            if (state.phase !== 'sense' || !state.completed) return state;
            if (state.senseIndex === SENSES.length - 1) {
                return { phase: 'done', senseIndex: state.senseIndex, completed: false };
            }
            return { phase: 'sense', senseIndex: state.senseIndex + 1, completed: false };
        case 'back':
            if (state.phase !== 'sense') return state;
            if (state.senseIndex === 0) return initialState;
            return { phase: 'sense', senseIndex: state.senseIndex - 1, completed: false };
        case 'restart':
            return initialState;
    }
}
