import { Button } from '@lab/ui';
import { useRef, useState } from 'react';

import { Playground } from '@/components/Playground';
import { RecipeLine } from '@/components/RecipeLine';
import { EXAMPLE_GROUPS } from '@/learn/examples';
import { recipeLayout, spreadLayout } from '@/mixing/board';
import { ALL_KINDS, type Ingredient, PRIMARY_KINDS, wayKey } from '@/mixing/cards';

const recipeKey = (recipe: Ingredient[]) =>
    `${wayKey(recipe.map((ingredient) => ingredient.kind))}@${recipe.map((ingredient) => ingredient.level).join('-')}`;

export function LearnPage(): React.JSX.Element {
    const boardRef = useRef<HTMLElement>(null);
    const [hasMixedCards, setHasMixedCards] = useState(false);
    const [cards, setCards] = useState(() => spreadLayout(PRIMARY_KINDS));

    const toggleMixedCards = () => {
        const next = !hasMixedCards;
        setHasMixedCards(next);
        setCards(spreadLayout(next ? ALL_KINDS : PRIMARY_KINDS));
    };

    const tryRecipe = (recipe: Ingredient[]) => {
        const needsMixedCards = recipe.some(({ kind }) => !PRIMARY_KINDS.includes(kind));
        const useMixedCards = hasMixedCards || needsMixedCards;
        setHasMixedCards(useMixedCards);
        setCards(recipeLayout(useMixedCards ? ALL_KINDS : PRIMARY_KINDS, recipe));
        boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="space-y-10">
            <section ref={boardRef} className="scroll-mt-4 space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Mixing light</h2>
                    <p className="mt-1 text-slate-300">
                        Every color on a screen is made from red, green and blue light. Where lights
                        overlap they add up, so the mix is brighter than each light alone. Drag the
                        cards to overlap them.
                    </p>
                </div>
                <Playground cards={cards} onCardsChange={setCards} />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={hasMixedCards}
                        onChange={toggleMixedCards}
                        className="h-4 w-4 accent-indigo-500"
                    />
                    Add cyan, magenta and yellow cards (lights that are already mixed)
                </label>
            </section>

            {EXAMPLE_GROUPS.map((group) => (
                <section key={group.id} className="space-y-3">
                    <div>
                        <h2 className="text-lg font-semibold">{group.title}</h2>
                        <p className="mt-1 text-sm text-slate-400">{group.description}</p>
                    </div>
                    <ul className="divide-y divide-white/10 rounded-xl bg-white/5 ring-1 ring-white/10">
                        {group.recipes.map((recipe) => (
                            <li
                                key={recipeKey(recipe)}
                                className="flex items-center justify-between gap-3 px-3 py-2.5"
                            >
                                <RecipeLine ingredients={recipe} />
                                <Button
                                    variant="secondary"
                                    className="shrink-0 px-3 py-1"
                                    onClick={() => tryRecipe(recipe)}
                                >
                                    Try it
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            <section className="rounded-xl bg-amber-400/10 p-4 text-sm text-amber-100 ring-1 ring-amber-300/20">
                <h2 className="font-semibold">Why is red + green not brown?</h2>
                <p className="mt-1">
                    Paint mixes the other way. Each paint absorbs some light, so mixing paints
                    removes light and the result gets darker. Lights add up and get brighter. That
                    is why red and green light make yellow here.
                </p>
            </section>
        </div>
    );
}
