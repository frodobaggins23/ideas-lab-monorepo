import { Button } from '@lab/ui';
import { useState } from 'react';

import { type Challenge, CHALLENGES } from '@/challenges/challenges';
import { foundWays, isCompleted, matchingWays, type Progress } from '@/challenges/progress';
import { useProgress } from '@/challenges/useProgress';
import { Playground } from '@/components/Playground';
import { Swatch } from '@/components/Swatch';
import { type BoardCard, boardMixes, spreadLayout } from '@/mixing/board';
import { describeWay } from '@/mixing/cards';
import { nameLight } from '@/mixing/colorNames';

function challengeAt(index: number): Challenge {
    const challenge = CHALLENGES[index];
    if (!challenge) throw new Error(`No challenge #${index + 1}`);
    return challenge;
}

function challengeTitle(challenge: Challenge): string {
    const name = (nameLight(challenge.target) ?? 'this color').toLowerCase();
    if (challenge.waysRequired === 1) return `Make ${name}`;
    return `Make ${name} in ${challenge.waysRequired} different ways`;
}

function firstOpenIndex(progress: Progress): number {
    const index = CHALLENGES.findIndex((challenge) => !isCompleted(progress, challenge));
    return index === -1 ? 0 : index;
}

export function ChallengesPage(): React.JSX.Element {
    const { progress, record, reset } = useProgress();
    const [index, setIndex] = useState(() => firstOpenIndex(progress));
    const challenge = challengeAt(index);
    const [cards, setCards] = useState(() => spreadLayout(challenge.kinds));
    const [isHintShown, setIsHintShown] = useState(false);

    const found = foundWays(progress, challenge);
    const isSolved = isCompleted(progress, challenge);
    const solvedCount = CHALLENGES.filter((item) => isCompleted(progress, item)).length;
    const isLast = index === CHALLENGES.length - 1;

    const openChallenge = (nextIndex: number) => {
        setIndex(nextIndex);
        setCards(spreadLayout(challengeAt(nextIndex).kinds));
        setIsHintShown(false);
    };

    const updateCards = (next: BoardCard[]) => {
        setCards(next);
        record(challenge.id, matchingWays(challenge, boardMixes(next)));
    };

    const resetProgress = () => {
        if (!window.confirm('Forget all solved challenges?')) return;
        reset();
        openChallenge(0);
    };

    return (
        <div className="space-y-6">
            <nav aria-label="Challenges">
                <p className="mb-2 text-sm text-slate-400">
                    Solved {solvedCount} of {CHALLENGES.length}
                </p>
                <ol className="grid grid-cols-7 gap-2 sm:grid-cols-13">
                    {CHALLENGES.map((item, itemIndex) => {
                        const isDone = isCompleted(progress, item);
                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    aria-label={`Challenge ${itemIndex + 1}: ${challengeTitle(item)}${isDone ? ', solved' : ''}`}
                                    aria-current={itemIndex === index ? 'step' : undefined}
                                    onClick={() => openChallenge(itemIndex)}
                                    className={`relative flex aspect-square w-full items-center justify-center rounded-lg text-xs font-semibold ring-offset-2 ring-offset-slate-950 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                        itemIndex === index ? 'ring-2 ring-white' : ''
                                    }`}
                                >
                                    <Swatch
                                        light={item.target}
                                        className="absolute inset-0 h-full w-full rounded-lg"
                                    />
                                    <span className="relative rounded bg-black/60 px-1 text-white">
                                        {isDone ? '✓' : itemIndex + 1}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            <section className="space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-start gap-4">
                    <Swatch light={challenge.target} className="h-16 w-16 rounded-xl" />
                    <div className="min-w-0">
                        <p className="text-xs tracking-wide text-slate-400 uppercase">
                            Challenge {index + 1} of {CHALLENGES.length}
                        </p>
                        <h2 className="text-xl font-semibold">{challengeTitle(challenge)}</h2>
                        <p className="mt-1 text-sm text-slate-300">
                            {challenge.waysRequired === 1
                                ? 'Overlap cards until one spot turns exactly this color.'
                                : 'Each way must use a different set of cards. Rearrange the cards after each find.'}
                        </p>
                    </div>
                </div>

                {challenge.waysRequired > 1 && (
                    <div className="text-sm">
                        <p className="text-slate-300">
                            Found {Math.min(found.length, challenge.waysRequired)} of{' '}
                            {challenge.waysRequired}
                        </p>
                        {found.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-2">
                                {found.map((key) => (
                                    <li
                                        key={key}
                                        className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-emerald-200 ring-1 ring-emerald-300/30"
                                    >
                                        ✓ {describeWay(key)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {isSolved && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-400/15 p-3 text-emerald-100 ring-1 ring-emerald-300/30"
                    >
                        <p className="font-semibold">
                            {challenge.waysRequired === 1
                                ? `Solved with ${describeWay(found[0] ?? '')}!`
                                : 'Solved! You found enough ways.'}
                        </p>
                        {!isLast && (
                            <Button onClick={() => openChallenge(index + 1)}>Next challenge</Button>
                        )}
                    </div>
                )}

                <div>
                    <Button variant="secondary" onClick={() => setIsHintShown((shown) => !shown)}>
                        {isHintShown ? 'Hide hint' : 'Show hint'}
                    </Button>
                    {isHintShown && <p className="mt-2 text-sm text-slate-300">{challenge.hint}</p>}
                </div>
            </section>

            <Playground cards={cards} onCardsChange={updateCards} />

            <div className="flex justify-end">
                <Button variant="secondary" onClick={resetProgress}>
                    Reset progress
                </Button>
            </div>
        </div>
    );
}
