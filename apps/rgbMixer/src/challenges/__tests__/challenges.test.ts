import { describe, expect, it } from 'vitest';

import { type Challenge, CHALLENGES } from '@/challenges/challenges';
import { EXAMPLE_GROUPS } from '@/learn/examples';
import { type CardKind, type Ingredient, mixIngredients, wayKey } from '@/mixing/cards';
import { nameLight } from '@/mixing/colorNames';
import { isSameLight, LEVELS } from '@/mixing/light';

function subsets(kinds: CardKind[]): CardKind[][] {
    return kinds.reduce<CardKind[][]>(
        (all, kind) => [...all, ...all.map((subset) => [...subset, kind])],
        [[]],
    );
}

function levelChoices(kinds: CardKind[]): Ingredient[][] {
    return kinds.reduce<Ingredient[][]>(
        (all, kind) => all.flatMap((chosen) => LEVELS.map((level) => [...chosen, { kind, level }])),
        [[]],
    );
}

/** Every combination of two or more cards that can produce the target at some brightness. */
function solvableWays(challenge: Challenge): string[] {
    return subsets(challenge.kinds)
        .filter((subset) => subset.length >= 2)
        .filter((subset) =>
            levelChoices(subset).some((recipe) =>
                isSameLight(mixIngredients(recipe), challenge.target),
            ),
        )
        .map(wayKey);
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
