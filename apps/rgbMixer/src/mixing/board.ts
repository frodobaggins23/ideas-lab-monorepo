import { ALL_KINDS, type CardKind, type Ingredient, mixIngredients, wayKey } from '@/mixing/cards';
import type { Level, Light } from '@/mixing/light';

/** The board is a square of BOARD_SIZE units; cards are CARD_SIZE units wide and tall. */
export const BOARD_SIZE = 100;
export const CARD_SIZE = 30;

export interface BoardCard extends Ingredient {
    x: number;
    y: number;
}

export interface Cell {
    x: number;
    y: number;
    width: number;
    height: number;
    cards: BoardCard[];
}

export interface Mix {
    key: string;
    ingredients: Ingredient[];
    light: Light;
}

const SPREAD_SLOTS_FEW: [number, number][] = [
    [8, 8],
    [62, 8],
    [35, 62],
];
const SPREAD_SLOTS_MANY: [number, number][] = [
    [4, 12],
    [35, 12],
    [66, 12],
    [4, 58],
    [35, 58],
    [66, 58],
];
const CLUSTER_SLOTS: [number, number][] = [
    [10, 10],
    [28, 10],
    [19, 26],
];
const PARKING_SLOTS: [number, number][] = [
    [68, 2],
    [68, 35],
    [68, 68],
    [2, 68],
    [35, 68],
];

function slotAt(slots: [number, number][], index: number): [number, number] {
    const slot = slots[index];
    if (!slot) throw new Error(`No board slot for card #${index + 1}`);
    return slot;
}

function clampPosition(value: number): number {
    return Math.min(Math.max(Math.round(value), 0), BOARD_SIZE - CARD_SIZE);
}

function covers(card: BoardCard, x: number, y: number): boolean {
    return x > card.x && x < card.x + CARD_SIZE && y > card.y && y < card.y + CARD_SIZE;
}

function edges(starts: number[]): number[] {
    const all = starts.flatMap((start) => [start, start + CARD_SIZE]);
    return [...new Set(all)].sort((a, b) => a - b);
}

function spans(values: number[]): [number, number][] {
    return values.slice(1).map((end, index) => [values[index] ?? end, end]);
}

/** Splits the board along every card edge; each cell is covered by the same set of cards. */
export function boardCells(cards: BoardCard[]): Cell[] {
    const cells: Cell[] = [];
    for (const [x0, x1] of spans(edges(cards.map((card) => card.x)))) {
        for (const [y0, y1] of spans(edges(cards.map((card) => card.y)))) {
            const covering = cards.filter((card) => covers(card, (x0 + x1) / 2, (y0 + y1) / 2));
            if (covering.length === 0) continue;
            cells.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0, cards: covering });
        }
    }
    return cells;
}

/** Distinct visible overlaps of two or more cards, fewest cards first. */
export function boardMixes(cards: BoardCard[]): Mix[] {
    const mixes = new Map<string, Mix>();
    for (const cell of boardCells(cards)) {
        if (cell.cards.length < 2) continue;
        const key = wayKey(cell.cards.map((card) => card.kind));
        if (mixes.has(key)) continue;
        const ingredients = sortIngredients(cell.cards);
        mixes.set(key, { key, ingredients, light: mixIngredients(ingredients) });
    }
    return [...mixes.values()].sort(
        (a, b) => a.ingredients.length - b.ingredients.length || a.key.localeCompare(b.key),
    );
}

function sortIngredients(cards: BoardCard[]): Ingredient[] {
    return ALL_KINDS.flatMap((kind) =>
        cards.filter((card) => card.kind === kind).map(({ level }) => ({ kind, level })),
    );
}

export function moveCard(cards: BoardCard[], kind: CardKind, x: number, y: number): BoardCard[] {
    return cards.map((card) =>
        card.kind === kind ? { ...card, x: clampPosition(x), y: clampPosition(y) } : card,
    );
}

export function setCardLevel(cards: BoardCard[], kind: CardKind, level: Level): BoardCard[] {
    return cards.map((card) => (card.kind === kind ? { ...card, level } : card));
}

/** Cards at full brightness, apart from each other, so nothing is mixed yet. */
export function spreadLayout(kinds: CardKind[]): BoardCard[] {
    const slots = kinds.length <= SPREAD_SLOTS_FEW.length ? SPREAD_SLOTS_FEW : SPREAD_SLOTS_MANY;
    return kinds.map((kind, index) => {
        const [x, y] = slotAt(slots, index);
        return { kind, level: 100, x, y };
    });
}

/** Recipe cards overlap in a cluster; the remaining cards are parked out of the way. */
export function recipeLayout(kinds: CardKind[], recipe: Ingredient[]): BoardCard[] {
    let parked = 0;
    return kinds.map((kind) => {
        const recipeIndex = recipe.findIndex((ingredient) => ingredient.kind === kind);
        const ingredient = recipe[recipeIndex];
        if (ingredient) {
            const [x, y] = slotAt(CLUSTER_SLOTS, recipeIndex);
            return { ...ingredient, x, y };
        }
        const [x, y] = slotAt(PARKING_SLOTS, parked++);
        return { kind, level: 100, x, y };
    });
}
