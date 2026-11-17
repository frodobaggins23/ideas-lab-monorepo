import { Container } from '@lab/ui';
import { useState } from 'react';

import { toIsoDate } from '@/challenge/dates';
import {
    canStartRound,
    type EntryInput,
    getBestRound,
    getCompletedRounds,
    getCurrentRound,
    summarizeRound,
} from '@/challenge/rounds';
import { useChallenge } from '@/challenge/useChallenge';
import { EntryForm } from '@/components/EntryForm';
import { EntryList } from '@/components/EntryList';
import { PlaceList } from '@/components/PlaceList';
import { RoundHistory } from '@/components/RoundHistory';
import { RouteMap } from '@/components/RouteMap';
import { StartRound } from '@/components/StartRound';
import { StatsPanel } from '@/components/StatsPanel';
import type { Place } from '@/route/caminoRoute';
import { getNewlyReachedPlaces, getRoutePosition } from '@/route/routePosition';

export function App(): React.JSX.Element {
    const { state, start, add, remove, abandon } = useChallenge();
    const [arrivals, setArrivals] = useState<Place[]>([]);
    const today = toIsoDate(new Date());

    const current = getCurrentRound(state);
    const summary = current ? summarizeRound(current, state.rounds.length, today) : null;
    const position = getRoutePosition(summary?.totalKm ?? 0);
    const completed = getCompletedRounds(state, today);
    const best = getBestRound(completed);
    const isCurrentCompleted = summary?.completedOn != null;

    function handleAdd(input: EntryInput): void {
        const before = summary?.totalKm ?? 0;
        setArrivals(getNewlyReachedPlaces(before, before + input.km));
        add(input);
    }

    function handleAbandon(): void {
        if (window.confirm('Opravdu zahodit rozjeté kolo i jeho záznamy?')) {
            setArrivals([]);
            abandon();
        }
    }

    const lastArrival = arrivals.at(-1);

    return (
        <Container className="space-y-5 pb-16">
            <header>
                <p className="text-sm font-semibold tracking-wide text-amber-600 uppercase">
                    Kilometrová výzva
                </p>
                <h1 className="text-3xl font-bold text-slate-900">Camino Challenge</h1>
                <p className="mt-1 text-slate-600">
                    Ujdi 770 km Camina Francés z Roncesvalles do Santiaga de Compostela co
                    nejrychleji.
                </p>
            </header>

            {lastArrival && (
                <div
                    role="status"
                    className="flex items-start justify-between gap-3 rounded-2xl bg-amber-100 p-4 text-amber-900"
                >
                    <p>
                        <strong>📍 {arrivals.map((place) => place.name).join(', ')}</strong>
                        <span className="block text-sm">{lastArrival.note}</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => setArrivals([])}
                        className="rounded-md px-2 text-amber-700 hover:bg-amber-200"
                        aria-label="Zavřít"
                    >
                        ✕
                    </button>
                </div>
            )}

            {summary && (
                <StatsPanel
                    summary={summary}
                    position={position}
                    bestDays={best?.dayNumber ?? null}
                />
            )}

            <RouteMap position={position} />

            {isCurrentCompleted && summary && (
                <div className="rounded-2xl bg-indigo-600 p-5 text-white">
                    <p className="text-2xl font-bold">🎉 Santiago! Compostela je tvoje.</p>
                    <p className="mt-1">
                        {summary.number}. kolo jsi dokončil(a) za {summary.dayNumber} dní
                        {best?.round.id === summary.round.id ? ', to je nový rekord!' : '.'}
                    </p>
                </div>
            )}

            {current && !isCurrentCompleted && (
                <EntryForm key={current.id} round={current} today={today} onAdd={handleAdd} />
            )}

            {canStartRound(state) && (
                <StartRound
                    key={state.rounds.length}
                    today={today}
                    roundNumber={state.rounds.length + 1}
                    onStart={(startedOn) => {
                        setArrivals([]);
                        start(startedOn);
                    }}
                />
            )}

            {current && <EntryList entries={current.entries} onRemove={remove} />}

            <PlaceList walkedKm={position.km} />

            <RoundHistory completed={completed} bestRoundId={best?.round.id ?? null} />

            {current && !isCurrentCompleted && (
                <button
                    type="button"
                    onClick={handleAbandon}
                    className="text-sm text-slate-500 underline hover:text-red-600"
                >
                    Vzdát kolo a začít znovu
                </button>
            )}
        </Container>
    );
}
