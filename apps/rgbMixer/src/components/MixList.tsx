import { RecipeLine } from '@/components/RecipeLine';
import type { Mix } from '@/mixing/board';

export function MixList({ mixes }: { mixes: Mix[] }): React.JSX.Element {
    return (
        <section aria-live="polite">
            <h3 className="text-sm font-semibold text-slate-300">Colors on the board</h3>
            {mixes.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                    Nothing is mixed yet. Drag the cards so they overlap.
                </p>
            ) : (
                <ul className="mt-2 space-y-2">
                    {mixes.map((mix) => (
                        <li key={mix.key}>
                            <RecipeLine ingredients={mix.ingredients} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
