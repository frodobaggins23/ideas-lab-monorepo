import { useEffect, useState } from 'react';

import {
    parseProgress,
    type Progress,
    PROGRESS_STORAGE_KEY,
    recordWays,
} from '@/challenges/progress';

function loadProgress(): Progress {
    try {
        return parseProgress(localStorage.getItem(PROGRESS_STORAGE_KEY));
    } catch (error) {
        console.warn('Saved progress is unavailable', error);
        return {};
    }
}

function saveProgress(progress: Progress): void {
    try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.warn('Could not save progress', error);
    }
}

export function useProgress(): {
    progress: Progress;
    record: (challengeId: string, keys: string[]) => void;
    reset: () => void;
} {
    const [progress, setProgress] = useState<Progress>(loadProgress);

    useEffect(() => saveProgress(progress), [progress]);

    return {
        progress,
        record: (challengeId, keys) =>
            setProgress((current) => recordWays(current, challengeId, keys)),
        reset: () => setProgress({}),
    };
}
