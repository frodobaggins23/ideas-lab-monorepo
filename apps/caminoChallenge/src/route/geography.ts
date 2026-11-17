import type { GeoBounds } from '@/route/mapProjection';

export interface GeoPoint {
    lat: number;
    lon: number;
}

export interface GeoLabel extends GeoPoint {
    text: string;
    kind: 'sea' | 'region';
    /** Labels at the map edge end at their point instead of centring on it. */
    anchor?: 'middle' | 'end';
}

/** The part of northern Spain drawn on the map. */
export const MAP_BOUNDS: GeoBounds = { west: -9.4, east: -0.9, south: 42.0, north: 43.85 };

function point(lat: number, lon: number): GeoPoint {
    return { lat, lon };
}

/**
 * Simplified coastline from south-west France round Galicia to the Portuguese border, closed far
 * outside the map so the polygon fills all the land in view.
 */
export const LAND_OUTLINE: readonly GeoPoint[] = [
    point(44.6, -1.25),
    point(43.7, -1.45),
    point(43.48, -1.56),
    point(43.37, -1.79),
    point(43.32, -1.98),
    point(43.3, -2.2),
    point(43.45, -2.75),
    point(43.38, -3.0),
    point(43.38, -3.22),
    point(43.45, -3.45),
    point(43.47, -3.78),
    point(43.39, -4.4),
    point(43.42, -4.75),
    point(43.47, -5.06),
    point(43.55, -5.66),
    point(43.66, -5.85),
    point(43.59, -5.93),
    point(43.57, -6.15),
    point(43.55, -6.54),
    point(43.54, -7.04),
    point(43.66, -7.36),
    point(43.67, -7.6),
    point(43.79, -7.69),
    point(43.77, -7.87),
    point(43.48, -8.24),
    point(43.37, -8.4),
    point(43.32, -8.81),
    point(43.13, -9.18),
    point(42.95, -9.18),
    point(42.88, -9.27),
    point(42.82, -9.1),
    point(42.77, -9.06),
    point(42.55, -9.02),
    point(42.6, -8.85),
    point(42.49, -8.87),
    point(42.4, -8.8),
    point(42.43, -8.65),
    point(42.26, -8.78),
    point(42.24, -8.72),
    point(42.12, -8.85),
    point(41.9, -8.87),
    point(41.5, -8.87),
    point(41.5, 0.5),
    point(44.6, 0.5),
];

/** Simplified Spanish-French border in the western Pyrenees. */
export const FRENCH_BORDER: readonly GeoPoint[] = [
    point(43.37, -1.79),
    point(43.25, -1.6),
    point(43.12, -1.45),
    point(43.05, -1.3),
    point(42.95, -0.9),
];

/**
 * Ranges the route crosses or passes, drawn as small peaks. Placed away from the route and its
 * labels rather than exactly on the summits.
 */
export const MOUNTAINS: readonly GeoPoint[] = [
    // Pyrenees
    point(43.18, -1.55),
    point(43.22, -1.1),
    point(42.85, -1.05),
    // Cantabrian mountains and Picos de Europa
    point(43.18, -4.85),
    point(43.08, -5.3),
    point(43.0, -5.85),
    point(42.95, -6.35),
    // Montes de León
    point(42.2, -6.7),
    // Os Ancares
    point(42.83, -6.85),
    // Sierra de la Demanda and Montes de Oca
    point(42.12, -2.95),
    point(42.08, -3.3),
];

export const REGION_LABELS: readonly GeoLabel[] = [
    { lat: 43.68, lon: -4.3, text: 'Kantabrijské moře', kind: 'sea' },
    { lat: 42.2, lon: -7.7, text: 'GALICIE', kind: 'region' },
    { lat: 42.12, lon: -5.0, text: 'MESETA', kind: 'region' },
    { lat: 43.62, lon: -0.98, text: 'FRANCIE', kind: 'region', anchor: 'end' },
];
