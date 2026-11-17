import { formatDate } from '@/challenge/dates';
import { type Entry, sortEntries } from '@/challenge/rounds';

interface EntryListProps {
    entries: readonly Entry[];
    onRemove: (entryId: string) => void;
}

export function EntryList({ entries, onRemove }: EntryListProps): React.JSX.Element {
    const newestFirst = sortEntries(entries).reverse();

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Záznamy kola</h2>
            {newestFirst.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                    Zatím žádné kilometry. První krok je nejtěžší!
                </p>
            ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                    {newestFirst.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between py-2">
                            <span className="text-slate-600">{formatDate(entry.date)}</span>
                            <span className="flex items-center gap-3">
                                <span className="font-semibold tabular-nums">
                                    {entry.km.toLocaleString('cs-CZ')} km
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(entry.id)}
                                    className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                                    aria-label={`Smazat záznam ${entry.km} km z ${formatDate(entry.date)}`}
                                >
                                    ✕
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
