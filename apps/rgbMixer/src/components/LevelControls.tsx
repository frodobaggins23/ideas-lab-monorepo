import { Swatch } from '@/components/Swatch';
import type { BoardCard } from '@/mixing/board';
import { CARD_INFO, type CardKind } from '@/mixing/cards';
import { type Level, LEVELS } from '@/mixing/light';

interface LevelControlsProps {
    cards: BoardCard[];
    onChange: (kind: CardKind, level: Level) => void;
}

export function LevelControls({ cards, onChange }: LevelControlsProps): React.JSX.Element {
    return (
        <div className="grid gap-2">
            {cards.map((card) => {
                const { label, light } = CARD_INFO[card.kind];
                return (
                    <div key={card.kind} className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-sm">
                            <Swatch light={light} className="h-3.5 w-3.5 rounded-full" />
                            {label}
                        </span>
                        <div
                            role="radiogroup"
                            aria-label={`${label} brightness`}
                            className="flex overflow-hidden rounded-lg ring-1 ring-white/15"
                        >
                            {LEVELS.map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    role="radio"
                                    aria-checked={card.level === level}
                                    onClick={() => onChange(card.kind, level)}
                                    className={`w-12 py-1.5 text-xs font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset ${
                                        card.level === level
                                            ? 'bg-white text-slate-900'
                                            : 'text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    {level}%
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
