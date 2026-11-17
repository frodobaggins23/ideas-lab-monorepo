import { CAMINO_PLACES } from '@/route/caminoRoute';

interface PlaceListProps {
    walkedKm: number;
}

export function PlaceList({ walkedKm }: PlaceListProps): React.JSX.Element {
    const reachedCount = CAMINO_PLACES.filter((place) => place.km <= walkedKm).length;

    return (
        <details className="rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-lg font-semibold">
                Zastávky na trase{' '}
                <span className="text-sm font-normal text-slate-500">
                    ({reachedCount}/{CAMINO_PLACES.length})
                </span>
            </summary>
            <ol className="mt-3 space-y-2">
                {CAMINO_PLACES.map((place) => {
                    const isReached = place.km <= walkedKm;
                    return (
                        <li key={place.id} className="flex gap-3">
                            <span
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${isReached ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                                aria-hidden="true"
                            >
                                {isReached ? '✓' : ''}
                            </span>
                            <span className={isReached ? '' : 'text-slate-500'}>
                                <span className="font-medium">{place.name}</span>{' '}
                                <span className="text-xs text-slate-500 tabular-nums">
                                    {place.km} km
                                </span>
                                <span className="block text-sm text-slate-500">{place.note}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </details>
    );
}
