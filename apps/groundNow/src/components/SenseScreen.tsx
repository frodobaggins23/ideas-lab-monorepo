import { Button } from '@lab/ui';
import type { Dispatch } from 'react';

import { getSense, SENSES } from '@/grounding/senses';
import { isSenseComplete, type SessionAction, type SessionState } from '@/grounding/session';

interface SenseScreenProps {
    state: SessionState;
    dispatch: Dispatch<SessionAction>;
}

export function SenseScreen({ state, dispatch }: SenseScreenProps): React.JSX.Element {
    const sense = getSense(state.senseIndex);
    const complete = isSenseComplete(state);
    const isLast = state.senseIndex === SENSES.length - 1;
    const remaining = sense.count - state.noticed;

    return (
        <main
            className={`flex min-h-dvh flex-col bg-gradient-to-b px-6 pb-8 pt-6 text-slate-800 transition-colors ${sense.background}`}
        >
            <header className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'back' })}
                    className="-ml-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                    ← Back
                </button>
                <ol
                    className="flex gap-2"
                    aria-label={`Step ${state.senseIndex + 1} of ${SENSES.length}`}
                >
                    {SENSES.map((item, index) => (
                        <li
                            key={item.id}
                            className={`h-2 w-8 rounded-full ${index <= state.senseIndex ? 'bg-slate-700' : 'bg-slate-700/20'}`}
                        />
                    ))}
                </ol>
            </header>

            <section className="flex flex-1 flex-col items-center justify-center text-center">
                <p
                    className={`text-[8rem] font-bold leading-none ${sense.accent}`}
                    aria-hidden="true"
                >
                    {sense.count}
                </p>
                <h1 className="mt-2 text-3xl font-semibold">
                    things you can <span className={`uppercase ${sense.accent}`}>{sense.verb}</span>
                </h1>
                <p className="mt-4 max-w-sm text-lg text-slate-700">{sense.prompt}</p>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                    For example: {sense.examples}.
                </p>

                <div
                    className="mt-8 flex flex-wrap justify-center gap-3"
                    role="group"
                    aria-label="Noticed items"
                >
                    {Array.from({ length: sense.count }, (_, index) => (
                        <span
                            key={index}
                            className={`h-9 w-9 rounded-full border-2 transition-all duration-300 ${
                                index < state.noticed
                                    ? `scale-110 ${sense.dotFilled}`
                                    : 'border-slate-500/40 bg-white/40'
                            }`}
                        />
                    ))}
                </div>
                <p className="mt-3 h-6 text-sm text-slate-600" aria-live="polite">
                    {complete
                        ? 'Lovely. Take a slow breath.'
                        : `${state.noticed} of ${sense.count} noticed. Tap each time you find one.`}
                </p>
            </section>

            <footer className="mx-auto flex w-full max-w-sm flex-col gap-3">
                {complete ? (
                    <Button
                        onClick={() => dispatch({ type: 'next' })}
                        className="rounded-full !py-4 text-lg shadow-lg"
                    >
                        {isLast ? 'Finish' : 'Next sense'}
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={() => dispatch({ type: 'notice' })}
                            className="rounded-full !py-4 text-lg shadow-lg"
                        >
                            I noticed one ({remaining} left)
                        </Button>
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'next' })}
                            className="rounded-full py-2 text-sm font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                            Good enough, move on
                        </button>
                    </>
                )}
                {state.noticed > 0 && (
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'unnotice' })}
                        className="rounded-full py-1 text-xs text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                        Undo last tap
                    </button>
                )}
            </footer>
        </main>
    );
}
