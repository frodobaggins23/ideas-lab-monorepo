import { useEffect, useState } from 'react';

import type { IsoDate } from '@/challenge/dates';
import {
    abandonCurrentRound,
    addEntry,
    type ChallengeState,
    EMPTY_STATE,
    type EntryInput,
    removeEntry,
    startRound,
} from '@/challenge/rounds';
import { parseChallengeState, STORAGE_KEY } from '@/challenge/storage';

function loadState(): ChallengeState {
    try {
        return parseChallengeState(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
        console.warn('Saved challenge is unavailable', error);
        return EMPTY_STATE;
    }
}

function saveState(state: ChallengeState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Could not save the challenge', error);
    }
}

export interface ChallengeActions {
    start: (startedOn: IsoDate) => void;
    add: (input: EntryInput) => void;
    remove: (entryId: string) => void;
    abandon: () => void;
}

export function useChallenge(): { state: ChallengeState } & ChallengeActions {
    const [state, setState] = useState<ChallengeState>(loadState);

    useEffect(() => saveState(state), [state]);

    return {
        state,
        start: (startedOn) =>
            setState((current) => startRound(current, crypto.randomUUID(), startedOn)),
        add: (input) =>
            setState((current) => addEntry(current, { id: crypto.randomUUID(), ...input })),
        remove: (entryId) => setState((current) => removeEntry(current, entryId)),
        abandon: () => setState(abandonCurrentRound),
    };
}
