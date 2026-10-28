import { describe, expect, it } from 'vitest';

import {
    BOARD_SIZE,
    type BoardCard,
    boardCells,
    boardMixes,
    CARD_SIZE,
    moveCard,
    recipeLayout,
    setCardLevel,
    spreadLayout,
} from '@/mixing/board';
import { ALL_KINDS, PRIMARY_KINDS } from '@/mixing/cards';

const card = (kind: BoardCard['kind'], x: number, y: number, level: BoardCard['level'] = 100) => ({
    kind,
    level,
    x,
    y,
});

describe('boardCells', () => {
    it('returns one cell for a lone card', () => {
        expect(boardCells([card('red', 10, 20)])).toEqual([
            { x: 10, y: 20, width: CARD_SIZE, height: CARD_SIZE, cards: [card('red', 10, 20)] },
        ]);
    });

    it('covers the overlap of two cards with a cell that has both', () => {
        const red = card('red', 0, 0);
        const green = card('green', 20, 0);
        const shared = boardCells([red, green]).filter((cell) => cell.cards.length === 2);
        expect(shared).toEqual([{ x: 20, y: 0, width: 10, height: 30, cards: [red, green] }]);
    });

    it('does not mix cards that only touch at an edge', () => {
        const cells = boardCells([card('red', 0, 0), card('green', CARD_SIZE, 0)]);
        expect(cells.every((cell) => cell.cards.length === 1)).toBe(true);
    });
});

describe('boardMixes', () => {
    it('lists each visible overlap once with its added light', () => {
        const mixes = boardMixes([card('red', 0, 0), card('green', 20, 0), card('blue', 10, 10)]);
        expect(mixes.map((mix) => [mix.key, mix.light])).toEqual([
            ['green+blue', { r: 0, g: 100, b: 100 }],
            ['red+blue', { r: 100, g: 0, b: 100 }],
            ['red+green', { r: 100, g: 100, b: 0 }],
            ['red+green+blue', { r: 100, g: 100, b: 100 }],
        ]);
    });

    it('uses each card brightness', () => {
        const [mix] = boardMixes([card('red', 0, 0, 50), card('green', 10, 10, 25)]);
        expect(mix?.light).toEqual({ r: 50, g: 25, b: 0 });
    });

    it('omits overlaps hidden under a third card', () => {
        // Blue sits exactly on green, so wherever red meets green it also meets blue.
        const mixes = boardMixes([card('red', 0, 0), card('green', 10, 0), card('blue', 10, 0)]);
        expect(mixes.map((mix) => mix.key)).toEqual(['green+blue', 'red+green+blue']);
    });
});

describe('moveCard', () => {
    it('keeps the card inside the board and on whole units', () => {
        const cards = [card('red', 0, 0)];
        expect(moveCard(cards, 'red', -5, 200.4)).toEqual([card('red', 0, BOARD_SIZE - CARD_SIZE)]);
        expect(moveCard(cards, 'red', 12.6, 3.2)).toEqual([card('red', 13, 3)]);
    });
});

describe('setCardLevel', () => {
    it('changes only the chosen card', () => {
        const cards = [card('red', 0, 0), card('blue', 50, 50)];
        expect(setCardLevel(cards, 'blue', 25)).toEqual([
            card('red', 0, 0),
            card('blue', 50, 50, 25),
        ]);
    });
});

describe('layouts', () => {
    it.each([PRIMARY_KINDS, ALL_KINDS])('spreads %j without any overlap', (...kinds) => {
        expect(boardMixes(spreadLayout(kinds))).toEqual([]);
    });

    it('overlaps the recipe cards and parks the rest apart', () => {
        const cards = recipeLayout(ALL_KINDS, [
            { kind: 'blue', level: 50 },
            { kind: 'yellow', level: 50 },
        ]);
        expect(boardMixes(cards).map((mix) => [mix.key, mix.light])).toEqual([
            ['blue+yellow', { r: 50, g: 50, b: 50 }],
        ]);
    });
});
