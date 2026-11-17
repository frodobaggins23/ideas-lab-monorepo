import { formatDate } from '@/challenge/dates';
import type { RoundSummary } from '@/challenge/rounds';

interface RoundHistoryProps {
    completed: readonly RoundSummary[];
    bestRoundId: string | null;
}

export function RoundHistory({ completed, bestRoundId }: RoundHistoryProps): React.JSX.Element {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Dokončená kola</h2>
            {completed.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                    Zatím žádné. Tvůj první čas do Santiaga se objeví tady.
                </p>
            ) : (
                <ol className="mt-2 divide-y divide-slate-100">
                    {completed.map((summary) => {
                        const isBest = summary.round.id === bestRoundId;
                        return (
                            <li
                                key={summary.round.id}
                                className="flex items-center justify-between gap-3 py-2"
                            >
                                <span>
                                    <span className="font-medium">{summary.number}. kolo</span>
                                    <span className="block text-xs text-slate-500">
                                        {formatDate(summary.round.startedOn)} –{' '}
                                        {summary.completedOn && formatDate(summary.completedOn)}
                                    </span>
                                </span>
                                <span className="text-right">
                                    <span className="font-semibold tabular-nums">
                                        {summary.dayNumber} dní
                                    </span>
                                    {isBest && (
                                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                            🏆 rekord
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
