import type { Place } from '@/route/caminoRoute';
import type { RoutePosition } from '@/route/routePosition';

export interface MapPoint {
    x: number;
    y: number;
}

export interface ProjectedMap {
    width: number;
    height: number;
    points: Map<string, MapPoint>;
}

/**
 * The route runs almost due west, so a true-scale map is a thin strip. North-south distances are
 * stretched to keep the bends visible on a phone.
 */
const VERTICAL_STRETCH = 3;

export function projectPlaces(
    places: readonly Place[],
    width: number,
    padding: number,
): ProjectedMap {
    if (places.length === 0) throw new Error('Nothing to project');
    const lats = places.map((place) => place.lat);
    const lons = places.map((place) => place.lon);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lonScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);

    const spanX = (maxLon - minLon) * lonScale || 1;
    const scale = (width - 2 * padding) / spanX;
    const height = (maxLat - minLat) * VERTICAL_STRETCH * scale + 2 * padding;

    const points = new Map<string, MapPoint>();
    for (const place of places) {
        points.set(place.id, {
            x: padding + (place.lon - minLon) * lonScale * scale,
            y: padding + (maxLat - place.lat) * VERTICAL_STRETCH * scale,
        });
    }
    return { width, height, points };
}

/** Where the pilgrim stands: on the straight line between the last and the next place. */
export function getPositionPoint(map: ProjectedMap, position: RoutePosition): MapPoint {
    const from = map.points.get(position.lastPlace.id);
    if (!from) throw new Error(`Place ${position.lastPlace.id} is not on the map`);
    const to = position.nextPlace ? map.points.get(position.nextPlace.id) : undefined;
    if (!to) return from;
    return {
        x: from.x + (to.x - from.x) * position.legProgress,
        y: from.y + (to.y - from.y) * position.legProgress,
    };
}
