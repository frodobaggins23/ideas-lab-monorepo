import { Button } from '@lab/ui';
import { type FormEvent, useId, useState } from 'react';

import { isIsoDate, type IsoDate } from '@/challenge/dates';

interface StartRoundProps {
    today: IsoDate;
    roundNumber: number;
    onStart: (startedOn: IsoDate) => void;
}

export function StartRound({ today, roundNumber, onStart }: StartRoundProps): React.JSX.Element {
    const [startedOn, setStartedOn] = useState<IsoDate>(today);
    const dateId = useId();
    const isValid = isIsoDate(startedOn) && startedOn <= today;

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (isValid) onStart(startedOn);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-end"
        >
            <div className="flex-1">
                <label htmlFor={dateId} className="text-sm font-medium text-slate-700">
                    Začátek {roundNumber}. kola
                </label>
                <input
                    id={dateId}
                    type="date"
                    value={startedOn}
                    max={today}
                    onChange={(event) => setStartedOn(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
            </div>
            <Button type="submit" disabled={!isValid} className="py-2.5">
                Vyrazit z Roncesvalles
            </Button>
        </form>
    );
}
