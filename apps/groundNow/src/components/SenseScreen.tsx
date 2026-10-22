import { Button } from '@lab/ui';
import { type CSSProperties, type Dispatch, useEffect, useState } from 'react';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FILL_MS, fillDelayMs, SETTLE_MS } from '@/grounding/animation';
import { getSense, SENSES } from '@/grounding/senses';
import type { SessionAction, SessionState } from '@/grounding/session';
import { useI18n } from '@/i18n/context';

interface SenseScreenProps {
    state: SessionState;
    dispatch: Dispatch<SessionAction>;
}

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SenseScreen({ state, dispatch }: SenseScreenProps): React.JSX.Element {
    const { t } = useI18n();
    const sense = getSense(state.senseIndex);
    const text = t.senses[sense.id];
    const isLast = state.senseIndex === SENSES.length - 1;
    const [settled, setSettled] = useState(false);

    // The pause is the point: the next sense is offered only after the circles finish filling.
    useEffect(() => {
        if (!state.completed) return;
        const timer = window.setTimeout(
            () => setSettled(true),
            prefersReducedMotion() ? 0 : SETTLE_MS,
        );
        return () => window.clearTimeout(timer);
    }, [state.completed]);

    const status = !state.completed ? t.sense.hint : settled ? t.sense.settled : t.sense.breathing;

    return (
        <main
            className={`flex min-h-dvh flex-col bg-gradient-to-b px-6 pb-8 pt-6 text-slate-800 ${sense.background}`}
        >
            <header className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'back' })}
                    className="-ml-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                    {t.sense.back}
                </button>
                <ol
                    className="flex gap-1.5"
                    aria-label={t.sense.step(state.senseIndex + 1, SENSES.length)}
                >
                    {SENSES.map((item, index) => (
                        <li
                            key={item.id}
                            className={`h-2 w-6 rounded-full ${index <= state.senseIndex ? 'bg-slate-700' : 'bg-slate-700/20'}`}
                        />
                    ))}
                </ol>
                <LanguageSwitcher />
            </header>

            <section className="flex flex-1 flex-col items-center justify-center text-center">
                <p
                    className={`text-[8rem] font-bold leading-none ${sense.accent}`}
                    aria-hidden="true"
                >
                    {sense.count}
                </p>
                <h1 className="mt-2 text-3xl font-semibold">
                    <span className="sr-only">{sense.count} </span>
                    {text.prefix} <span className={`uppercase ${sense.accent}`}>{text.verb}</span>
                </h1>
                <p className="mt-4 max-w-sm text-lg text-slate-700">{text.prompt}</p>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                    {t.sense.examplesLabel}: {text.examples}.
                </p>

                <div
                    className="mt-10 flex flex-wrap justify-center gap-4"
                    role="img"
                    aria-label={t.sense.circles}
                >
                    {Array.from({ length: sense.count }, (_, index) => {
                        const timing = {
                            '--fill-delay': `${fillDelayMs(index, sense.count)}ms`,
                            '--fill-ms': `${FILL_MS}ms`,
                        } as CSSProperties;
                        return (
                            <span
                                key={index}
                                style={timing}
                                className="relative h-12 w-12 rounded-full border-2 border-slate-500/40 bg-white/40"
                            >
                                {state.completed && (
                                    <>
                                        <span
                                            className={`dot-ripple absolute inset-0 rounded-full ${sense.dotFilled}`}
                                        />
                                        <span
                                            className={`dot-fill absolute -inset-0.5 rounded-full ${sense.dotFilled}`}
                                        />
                                    </>
                                )}
                            </span>
                        );
                    })}
                </div>
                <p className="mt-5 min-h-6 text-sm text-slate-600" aria-live="polite">
                    {status}
                </p>
            </section>

            <footer className="mx-auto flex min-h-14 w-full max-w-sm flex-col justify-end">
                {!state.completed && (
                    <Button
                        onClick={() => dispatch({ type: 'complete' })}
                        className="rounded-full !py-4 text-lg shadow-lg"
                    >
                        {t.sense.action}
                    </Button>
                )}
                {settled && (
                    <Button
                        onClick={() => dispatch({ type: 'next' })}
                        className="settle-in rounded-full !py-4 text-lg shadow-lg"
                    >
                        {isLast ? t.sense.finish : t.sense.next}
                    </Button>
                )}
            </footer>
        </main>
    );
}
