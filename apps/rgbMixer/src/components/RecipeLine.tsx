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

/** A hidden operator still takes its width on phones, so stacked chips line up. */
function Operator({ symbol, isHidden = false }: { symbol: string; isHidden?: boolean }) {
    return (
        <span
            aria-hidden={isHidden}
            className={`w-3 text-center font-normal text-slate-500 ${isHidden ? 'invisible sm:hidden' : ''}`}
        >
            {symbol}
        </span>
    );
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
        // Phones stack one part per row; wrapping an inline equation splits it at odd places.
        <div className="flex flex-col items-start gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
            {ingredients.map((ingredient, index) => (
                <span key={ingredient.kind} className="inline-flex items-center gap-1.5">
                    <Operator symbol="+" isHidden={index === 0} />
                    <IngredientChip ingredient={ingredient} />
                </span>
            ))}
            <span className="inline-flex items-center gap-1.5 font-semibold">
                <Operator symbol="=" />
                <Swatch light={light} className="h-5 w-5" />
                {describeLight(light)}
            </span>
        </div>
    );
}
