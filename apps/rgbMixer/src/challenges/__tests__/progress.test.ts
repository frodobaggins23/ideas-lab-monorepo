import { describe, expect, it, vi } from 'vitest';

import type { Challenge } from '@/challenges/challenges';
import {
    isCompleted,
    matchingWays,
    parseProgress,
    type Progress,
    recordWays,
} from '@/challenges/progress';
import { boardMixes } from '@/mixing/board';

const grayInTwoWays: Challenge = {
    id: 'gray-ways',
    target: { r: 50, g: 50, b: 50 },
    kinds: ['red', 'green', 'blue', 'cyan'],
    waysRequired: 2,
    hint: '',
};

describe('matchingWays', () => {
    it('returns the overlaps that produce the target', () => {
        const mixes = boardMixes([
            { kind: 'red', level: 50, x: 0, y: 0 },
            { kind: 'cyan', level: 50, x: 20, y: 0 },
            { kind: 'green', level: 50, x: 60, y: 60 },
            { kind: 'blue', level: 50, x: 70, y: 70 },
        ]);
        expect(matchingWays(grayInTwoWays, mixes)).toEqual(['red+cyan']);
    });
});

describe('recordWays', () => {
    it('adds new ways and completes the challenge once enough are found', () => {
        const once = recordWays({}, grayInTwoWays.id, ['red+cyan']);
        expect(isCompleted(once, grayInTwoWays)).toBe(false);
        const twice = recordWays(once, grayInTwoWays.id, ['red+cyan', 'red+green+blue']);
        expect(twice).toEqual({ 'gray-ways': ['red+cyan', 'red+green+blue'] });
        expect(isCompleted(twice, grayInTwoWays)).toBe(true);
    });

    it('keeps the same object when nothing is new', () => {
        const progress: Progress = { 'gray-ways': ['red+cyan'] };
        expect(recordWays(progress, 'gray-ways', ['red+cyan'])).toBe(progress);
        expect(recordWays(progress, 'gray-ways', [])).toBe(progress);
    });
});

describe('parseProgress', () => {
    it('reads saved progress', () => {
        expect(parseProgress('{"brown":["red+green"]}')).toEqual({ brown: ['red+green'] });
    });

    it('drops invalid entries', () => {
        expect(parseProgress('{"brown":"red+green","pink":["red+green+blue",3]}')).toEqual({
            pink: ['red+green+blue'],
        });
        expect(parseProgress('[1,2]')).toEqual({});
        expect(parseProgress(null)).toEqual({});
    });

    it('warns and starts fresh on unreadable data', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(parseProgress('{oops')).toEqual({});
        expect(warn).toHaveBeenCalledOnce();
        warn.mockRestore();
    });
});
