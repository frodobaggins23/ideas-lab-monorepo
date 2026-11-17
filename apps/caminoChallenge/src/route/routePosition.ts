import { CAMINO_PLACES, type Place, TOTAL_KM } from '@/route/caminoRoute';

export interface RoutePosition {
    /** Walked distance clamped to the route length. */
    km: number;
    /** Last place reached (Roncesvalles at the start). */
    lastPlace: Place;
    /** Next place ahead, or null in Santiago. */
    nextPlace: Place | null;
    /** 0..1 progress between lastPlace and nextPlace. */
    legProgress: number;
}

function clampKm(km: number): number {
    return Math.min(Math.max(km, 0), TOTAL_KM);
}

export function getRoutePosition(
    walkedKm: number,
    places: readonly Place[] = CAMINO_PLACES,
): RoutePosition {
    const first = places[0];
    if (!first) throw new Error('The route needs at least one place');

    const km = clampKm(walkedKm);
    let lastPlace = first;
    let nextPlace: Place | null = null;
    for (const place of places) {
        if (place.km <= km) {
            lastPlace = place;
        } else {
            nextPlace = place;
            break;
        }
    }

    const legLength = nextPlace ? nextPlace.km - lastPlace.km : 0;
    const legProgress = nextPlace && legLength > 0 ? (km - lastPlace.km) / legLength : 0;
    return { km, lastPlace, nextPlace, legProgress };
}

export function getReachedPlaces(
    walkedKm: number,
    places: readonly Place[] = CAMINO_PLACES,
): Place[] {
    return places.filter((place) => place.km <= walkedKm);
}

/** Places passed by going from `beforeKm` to `afterKm`, in route order. */
export function getNewlyReachedPlaces(
    beforeKm: number,
    afterKm: number,
    places: readonly Place[] = CAMINO_PLACES,
): Place[] {
    return places.filter((place) => place.km > beforeKm && place.km <= afterKm);
}
