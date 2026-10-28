import { Fragment } from 'react';

import { Swatch } from '@/components/Swatch';
import { CARD_INFO, type Ingredient, ingredientLight, mixIngredients } from '@/mixing/cards';
import { nameLight } from '@/mixing/colorNames';
import { isClipped, type Light } from '@/mixing/light';

function describeLight(light: Light): string {
    const name = nameLight(light);
    if (name) return name;
    if (isClipped(light)) return 'Too bright: the screen clips it';
    return `Red ${light.r}%, green ${light.g}%, blue ${light.b}%`;
}

export function IngredientChip({ ingredient }: { ingredient: Ingredient }): React.JSX.Element {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
            <Swatch light={ingredientLight(ingredient)} className="h-3 w-3 rounded-full" />
            {CARD_INFO[ingredient.kind].label}
            {ingredient.level < 100 && <span className="text-slate-400">{ingredient.level}%</span>}
        </span>
    );
}

export function RecipeLine({ ingredients }: { ingredients: Ingredient[] }): React.JSX.Element {
    const light = mixIngredients(ingredients);
    return (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {ingredients.map((ingredient, index) => (
                <Fragment key={ingredient.kind}>
                    {index > 0 && <span className="text-slate-500">+</span>}
                    <IngredientChip ingredient={ingredient} />
                </Fragment>
            ))}
            <span className="text-slate-500">=</span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
                <Swatch light={light} className="h-5 w-5" />
                {describeLight(light)}
            </span>
        </div>
    );
}
