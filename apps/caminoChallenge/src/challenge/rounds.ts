import { addDays, daysBetween, isIsoDate, type IsoDate } from '@/challenge/dates';
import { TOTAL_KM } from '@/route/caminoRoute';

export interface Entry {
    id: string;
    date: IsoDate;
    km: number;
}

export interface Round {
    id: string;
    startedOn: IsoDate;
    entries: Entry[];
}

/** Rounds oldest first; the last one is the current round. */
export interface ChallengeState {
    rounds: Round[];
}

export interface RoundSummary {
    round: Round;
    number: number;
    totalKm: number;
    remainingKm: number;
    /** 1 on the start day; frozen at the finish day once completed. */
    dayNumber: number;
    completedOn: IsoDate | null;
    averageKmPerDay: number;
    /** Finish date if the current daily average holds, or null without data. */
    projectedFinishOn: IsoDate | null;
}

export interface EntryInput {
    date: IsoDate;
    km: number;
}

/** No one walks more than this in a day; larger values are typos. */
export const MAX_KM_PER_ENTRY = 150;

export const EMPTY_STATE: ChallengeState = { rounds: [] };

function roundKm(km: number): number {
    return Math.round(km * 10) / 10;
}

export function getTotalKm(entries: readonly Entry[]): number {
    return roundKm(entries.reduce((sum, entry) => sum + entry.km, 0));
}

/** Entries by date; entries of the same day keep the order they were added in. */
export function sortEntries(entries: readonly Entry[]): Entry[] {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

/** The date of the entry that pushed the total to the full route length. */
export function getCompletionDate(round: Round): IsoDate | null {
    let total = 0;
    for (const entry of sortEntries(round.entries)) {
        total = roundKm(total + entry.km);
        if (total >= TOTAL_KM) return entry.date;
    }
    return null;
}

export function summarizeRound(round: Round, number: number, today: IsoDate): RoundSummary {
    const totalKm = getTotalKm(round.entries);
    const completedOn = getCompletionDate(round);
    const endDate = completedOn ?? today;
    const dayNumber = Math.max(daysBetween(round.startedOn, endDate) + 1, 1);
    const averageKmPerDay = roundKm(totalKm / dayNumber);

    let projectedFinishOn: IsoDate | null = null;
    if (!completedOn && totalKm > 0) {
        const projectedDays = Math.ceil((TOTAL_KM / totalKm) * dayNumber);
        projectedFinishOn = addDays(round.startedOn, projectedDays - 1);
    }

    return {
        round,
        number,
        totalKm,
        remainingKm: roundKm(Math.max(TOTAL_KM - totalKm, 0)),
        dayNumber,
        completedOn,
        averageKmPerDay,
        projectedFinishOn,
    };
}

export function getCurrentRound(state: ChallengeState): Round | null {
    return state.rounds.at(-1) ?? null;
}

/** Completed rounds, newest first. */
export function getCompletedRounds(state: ChallengeState, today: IsoDate): RoundSummary[] {
    return state.rounds
        .map((round, index) => summarizeRound(round, index + 1, today))
        .filter((summary) => summary.completedOn !== null)
        .reverse();
}

/** The fastest completed round; the earlier one wins a tie. */
export function getBestRound(completed: readonly RoundSummary[]): RoundSummary | null {
    let best: RoundSummary | null = null;
    for (const summary of completed) {
        if (!best || summary.dayNumber <= best.dayNumber) best = summary;
    }
    return best;
}

export function canStartRound(state: ChallengeState): boolean {
    const current = getCurrentRound(state);
    return !current || getCompletionDate(current) !== null;
}

export function startRound(state: ChallengeState, id: string, startedOn: IsoDate): ChallengeState {
    if (!canStartRound(state)) throw new Error('Finish the current round first');
    return { rounds: [...state.rounds, { id, startedOn, entries: [] }] };
}

/** Returns an error message for the user, or null when the entry can be added. */
export function validateEntry(
    round: Round | null,
    input: EntryInput,
    today: IsoDate,
): string | null {
    if (!round) return 'Nejdřív začni kolo.';
    if (getCompletionDate(round)) return 'Toto kolo je už dokončené.';
    if (!Number.isFinite(input.km) || input.km <= 0) return 'Zadej kladný počet kilometrů.';
    if (input.km > MAX_KM_PER_ENTRY) return `Maximum je ${MAX_KM_PER_ENTRY} km na jeden záznam.`;
    if (!isIsoDate(input.date)) return 'Zadej platné datum.';
    if (input.date < round.startedOn) return 'Datum je před začátkem kola.';
    if (input.date > today) return 'Datum nesmí být v budoucnosti.';
    return null;
}

function updateCurrentRound(
    state: ChallengeState,
    update: (round: Round) => Round,
): ChallengeState {
    const current = getCurrentRound(state);
    if (!current) return state;
    return { rounds: [...state.rounds.slice(0, -1), update(current)] };
}

export function addEntry(state: ChallengeState, entry: Entry): ChallengeState {
    return updateCurrentRound(state, (round) => ({
        ...round,
        entries: [...round.entries, { ...entry, km: roundKm(entry.km) }],
    }));
}

export function removeEntry(state: ChallengeState, entryId: string): ChallengeState {
    return updateCurrentRound(state, (round) => ({
        ...round,
        entries: round.entries.filter((entry) => entry.id !== entryId),
    }));
}

/** Drops an unfinished current round, so the walker can start over. */
export function abandonCurrentRound(state: ChallengeState): ChallengeState {
    const current = getCurrentRound(state);
    if (!current || getCompletionDate(current)) return state;
    return { rounds: state.rounds.slice(0, -1) };
}
