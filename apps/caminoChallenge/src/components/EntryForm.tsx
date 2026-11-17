import { Button } from '@lab/ui';
import { type FormEvent, useId, useState } from 'react';

import type { IsoDate } from '@/challenge/dates';
import { parseKm } from '@/challenge/parseKm';
import { type EntryInput, type Round, validateEntry } from '@/challenge/rounds';

interface EntryFormProps {
    round: Round;
    today: IsoDate;
    onAdd: (input: EntryInput) => void;
}

const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none';

export function EntryForm({ round, today, onAdd }: EntryFormProps): React.JSX.Element {
    const [date, setDate] = useState<IsoDate>(today);
    const [kmText, setKmText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const dateId = useId();
    const kmId = useId();
    const errorId = useId();

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const input = { date, km: parseKm(kmText) };
        const message = validateEntry(round, input, today);
        setError(message);
        if (message) return;
        onAdd(input);
        setKmText('');
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-4"
            aria-describedby={error ? errorId : undefined}
            noValidate
        >
            <h2 className="text-lg font-semibold">Přidat ušlé kilometry</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                    <label htmlFor={kmId} className="text-sm font-medium text-slate-700">
                        Kilometry
                    </label>
                    <input
                        id={kmId}
                        inputMode="decimal"
                        placeholder="např. 12,5"
                        value={kmText}
                        onChange={(event) => setKmText(event.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor={dateId} className="text-sm font-medium text-slate-700">
                        Datum
                    </label>
                    <input
                        id={dateId}
                        type="date"
                        value={date}
                        min={round.startedOn}
                        max={today}
                        onChange={(event) => setDate(event.target.value)}
                        className={inputClass}
                    />
                </div>
                <Button type="submit" className="col-span-2 py-2.5 sm:col-span-1">
                    Přidat
                </Button>
            </div>
            {error && (
                <p id={errorId} role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </form>
    );
}
