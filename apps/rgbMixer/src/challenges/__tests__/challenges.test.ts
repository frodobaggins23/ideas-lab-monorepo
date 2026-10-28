import { describe, expect, it } from 'vitest';

import { type Challenge, CHALLENGES } from '@/challenges/challenges';
import { EXAMPLE_GROUPS } from '@/learn/examples';
import { type CardKind, type Ingredient, mixIngredients, wayKey } from '@/mixing/cards';
import { nameLight } from '@/mixing/colorNames';
import { isSameLight, LEVELS } from '@/mixing/light';

/** Every pick of two or more cards, e.g. red + green, red + blue, red + green + blue. */
function cardCombinations(kinds: CardKind[]): CardKind[][] {
    let combinations: CardKind[][] = [[]];
    for (const kind of kinds) {
        const withKind = combinations.map((combination) => [...combination, kind]);
        combinations = [...combinations, ...withKind];
    }
    return combinations.filter((combination) => combination.length >= 2);
}

/** Every brightness setting of the cards, e.g. red 25% + green 25%, red 25% + green 50%, ... */
function brightnessSettings(kinds: CardKind[]): Ingredient[][] {
    let recipes: Ingredient[][] = [[]];
    for (const kind of kinds) {
        const longer: Ingredient[][] = [];
        for (const recipe of recipes) {
            for (const level of LEVELS) {
                longer.push([...recipe, { kind, level }]);
            }
        }
        recipes = longer;
    }
    return recipes;
}

function canMake(challenge: Challenge, kinds: CardKind[]): boolean {
    return brightnessSettings(kinds).some((recipe) =>
        isSameLight(mixIngredients(recipe), challenge.target),
    );
}

/** The card combinations that can produce the target at some brightness. */
function solvableWays(challenge: Challenge): string[] {
    const ways = cardCombinations(challenge.kinds).filter((kinds) => canMake(challenge, kinds));
    return ways.map(wayKey);
}

describe('CHALLENGES', () => {
    it.each(CHALLENGES)('$id has a named target', (challenge) => {
        expect(nameLight(challenge.target)).not.toBeNull();
    });

    it.each(CHALLENGES)('$id can be solved in enough ways', (challenge) => {
        expect(solvableWays(challenge).length).toBeGreaterThanOrEqual(challenge.waysRequired);
    });

    it('has unique ids', () => {
        expect(new Set(CHALLENGES.map((challenge) => challenge.id)).size).toBe(CHALLENGES.length);
    });
});

describe('EXAMPLE_GROUPS', () => {
    it('only shows recipes whose result has a name', () => {
        const unnamed = EXAMPLE_GROUPS.flatMap((group) => group.recipes).filter(
            (recipe) => nameLight(mixIngredients(recipe)) === null,
        );
        expect(unnamed).toEqual([]);
    });

    it('fits every recipe into the board cluster', () => {
        const recipes = EXAMPLE_GROUPS.flatMap((group) => group.recipes);
        expect(recipes.every((recipe) => recipe.length >= 2 && recipe.length <= 3)).toBe(true);
    });
});
