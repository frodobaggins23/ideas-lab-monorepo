import type { Challenge } from '@/challenges/challenges';
import type { Mix } from '@/mixing/board';
import { isSameLight } from '@/mixing/light';

/** Way keys found so far, per challenge id. */
export type Progress = Record<string, string[]>;

export const PROGRESS_STORAGE_KEY = 'rgbMixer.progress.v1';

export function matchingWays(challenge: Challenge, mixes: Mix[]): string[] {
    return mixes.filter((mix) => isSameLight(mix.light, challenge.target)).map((mix) => mix.key);
}

/** Returns the same object when nothing new was found, so React can skip the update. */
export function recordWays(progress: Progress, challengeId: string, keys: string[]): Progress {
    const found = progress[challengeId] ?? [];
    const added = keys.filter((key) => !found.includes(key));
    if (added.length === 0) return progress;
    return { ...progress, [challengeId]: [...found, ...added] };
}

export function foundWays(progress: Progress, challenge: Challenge): string[] {
    return progress[challenge.id] ?? [];
}

export function isCompleted(progress: Progress, challenge: Challenge): boolean {
    return foundWays(progress, challenge).length >= challenge.waysRequired;
}

/** Stored data comes from the browser and may be stale or edited, so keep only valid entries. */
export function parseProgress(raw: string | null): Progress {
    if (!raw) return {};
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        console.warn('Ignoring unreadable saved progress');
        return {};
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
    const progress: Progress = {};
    for (const [id, keys] of Object.entries(data)) {
        if (!Array.isArray(keys)) continue;
        progress[id] = keys.filter((key): key is string => typeof key === 'string');
    }
    return progress;
}
