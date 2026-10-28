import { addLights, type Level, type Light, scaleLight } from '@/mixing/light';

export type CardKind = 'red' | 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow';

export const PRIMARY_KINDS: CardKind[] = ['red', 'green', 'blue'];
/** Cyan, magenta and yellow cards are lights that are already mixed from two primaries. */
export const ALL_KINDS: CardKind[] = [...PRIMARY_KINDS, 'cyan', 'magenta', 'yellow'];

export const CARD_INFO: Record<CardKind, { label: string; light: Light }> = {
    red: { label: 'Red', light: { r: 100, g: 0, b: 0 } },
    green: { label: 'Green', light: { r: 0, g: 100, b: 0 } },
    blue: { label: 'Blue', light: { r: 0, g: 0, b: 100 } },
    cyan: { label: 'Cyan', light: { r: 0, g: 100, b: 100 } },
    magenta: { label: 'Magenta', light: { r: 100, g: 0, b: 100 } },
    yellow: { label: 'Yellow', light: { r: 100, g: 100, b: 0 } },
};

export interface Ingredient {
    kind: CardKind;
    level: Level;
}

export function ingredientLight({ kind, level }: Ingredient): Light {
    return scaleLight(CARD_INFO[kind].light, level);
}

export function mixIngredients(ingredients: Ingredient[]): Light {
    return addLights(ingredients.map(ingredientLight));
}

/** Identifies a combination of cards regardless of order or brightness, e.g. `red+cyan`. */
export function wayKey(kinds: CardKind[]): string {
    return ALL_KINDS.filter((kind) => kinds.includes(kind)).join('+');
}

export function describeWay(key: string): string {
    return ALL_KINDS.filter((kind) => key.split('+').includes(kind))
        .map((kind) => CARD_INFO[kind].label)
        .join(' + ');
}
