import { LevelControls } from '@/components/LevelControls';
import { MixBoard } from '@/components/MixBoard';
import { MixList } from '@/components/MixList';
import { type BoardCard, boardMixes, moveCard, setCardLevel } from '@/mixing/board';

interface PlaygroundProps {
    cards: BoardCard[];
    onCardsChange: (cards: BoardCard[]) => void;
}

export function Playground({ cards, onCardsChange }: PlaygroundProps): React.JSX.Element {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <MixBoard
                cards={cards}
                onMove={(kind, x, y) => onCardsChange(moveCard(cards, kind, x, y))}
            />
            <div className="space-y-6">
                <section>
                    <h3 className="mb-2 text-sm font-semibold text-slate-300">Brightness</h3>
                    <LevelControls
                        cards={cards}
                        onChange={(kind, level) => onCardsChange(setCardLevel(cards, kind, level))}
                    />
                </section>
                <MixList mixes={boardMixes(cards)} />
            </div>
        </div>
    );
}
