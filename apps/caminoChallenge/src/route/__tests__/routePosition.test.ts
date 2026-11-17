import { describe, expect, it } from 'vitest';

import { CAMINO_PLACES, type Place, TOTAL_KM } from '@/route/caminoRoute';
import { getNewlyReachedPlaces, getRoutePosition } from '@/route/routePosition';

function place(id: string, km: number, lat: number, lon: number): Place {
    return { id, name: id, km, lat, lon, kind: 'town', note: '' };
}

const places = [place('a', 0, 43, -2), place('b', 10, 43, -3), place('c', 30, 42, -3)];

describe('camino route data', () => {
    it('runs from Roncesvalles to Santiago in increasing distance', () => {
        expect(CAMINO_PLACES[0]?.name).toBe('Roncesvalles');
        expect(CAMINO_PLACES.at(-1)?.km).toBe(TOTAL_KM);
        const distances = CAMINO_PLACES.map((p) => p.km);
        expect(distances).toEqual([...distances].sort((x, y) => x - y));
        expect(new Set(CAMINO_PLACES.map((p) => p.id)).size).toBe(CAMINO_PLACES.length);
    });
});

describe('getRoutePosition', () => {
    it('starts at the first place', () => {
        const position = getRoutePosition(0, places);
        expect(position.lastPlace.id).toBe('a');
        expect(position.nextPlace?.id).toBe('b');
        expect(position.legProgress).toBe(0);
    });

    it('interpolates between places', () => {
        const position = getRoutePosition(20, places);
        expect(position.lastPlace.id).toBe('b');
        expect(position.lastIndex).toBe(1);
        expect(position.nextPlace?.id).toBe('c');
        expect(position.legProgress).toBe(0.5);
    });

    it('stops at the finish even past the route length', () => {
        const position = getRoutePosition(TOTAL_KM + 50);
        expect(position.km).toBe(TOTAL_KM);
        expect(position.lastPlace.id).toBe('santiago');
        expect(position.nextPlace).toBeNull();
    });
});

describe('getNewlyReachedPlaces', () => {
    it('lists places passed by the new distance, including one hit exactly', () => {
        expect(getNewlyReachedPlaces(0, 30, places).map((p) => p.id)).toEqual(['b', 'c']);
        expect(getNewlyReachedPlaces(10, 29, places)).toEqual([]);
    });
});
