import { isIsoDate } from '@/challenge/dates';
import { type ChallengeState, EMPTY_STATE, type Entry, type Round } from '@/challenge/rounds';

export const STORAGE_KEY = 'caminoChallenge.state.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown): Entry | null {
    if (!isRecord(value)) return null;
    const { id, date, km } = value;
    if (typeof id !== 'string' || !isIsoDate(date)) return null;
    if (typeof km !== 'number' || !Number.isFinite(km) || km <= 0) return null;
    return { id, date, km };
}

function parseRound(value: unknown): Round | null {
    if (!isRecord(value)) return null;
    const { id, startedOn, entries } = value;
    if (typeof id !== 'string' || !isIsoDate(startedOn) || !Array.isArray(entries)) return null;
    return {
        id,
        startedOn,
        entries: entries.map(parseEntry).filter((entry): entry is Entry => entry !== null),
    };
}

/** Saved data comes from the browser and may be stale or edited, so keep only valid parts. */
export function parseChallengeState(raw: string | null): ChallengeState {
    if (!raw) return EMPTY_STATE;
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        console.warn('Ignoring unreadable saved challenge');
        return EMPTY_STATE;
    }
    if (!isRecord(data) || !Array.isArray(data.rounds)) return EMPTY_STATE;
    return {
        rounds: data.rounds.map(parseRound).filter((round): round is Round => round !== null),
    };
}
