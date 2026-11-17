export interface MapPoint {
    x: number;
    y: number;
}

export interface GeoBounds {
    west: number;
    east: number;
    south: number;
    north: number;
}

export interface MapProjection {
    width: number;
    height: number;
    project: (lat: number, lon: number) => MapPoint;
}

/**
 * Equirectangular projection of a small area. The route runs almost due west, so north-south
 * distances are stretched a little to keep its bends visible on a phone.
 */
export function createProjection(
    bounds: GeoBounds,
    width: number,
    verticalStretch = 1,
): MapProjection {
    const middleLat = (bounds.north + bounds.south) / 2;
    const lonScale = Math.cos((middleLat * Math.PI) / 180);
    const scale = width / ((bounds.east - bounds.west) * lonScale);
    const height = (bounds.north - bounds.south) * verticalStretch * scale;

    return {
        width,
        height,
        project: (lat, lon) => ({
            x: (lon - bounds.west) * lonScale * scale,
            y: (bounds.north - lat) * verticalStretch * scale,
        }),
    };
}

function format(point: MapPoint): string {
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
}

function lerp(from: MapPoint, to: MapPoint, t: number): MapPoint {
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

interface CubicSegment {
    start: MapPoint;
    control1: MapPoint;
    control2: MapPoint;
    end: MapPoint;
}

function pointAt(points: readonly MapPoint[], index: number): MapPoint {
    const clamped = Math.min(Math.max(index, 0), points.length - 1);
    const found = points[clamped];
    if (!found) throw new Error('A route needs at least one point');
    return found;
}

/** Catmull-Rom segment from points[index] to points[index + 1], as a cubic Bézier. */
function routeSegment(points: readonly MapPoint[], index: number): CubicSegment {
    const before = pointAt(points, index - 1);
    const start = pointAt(points, index);
    const end = pointAt(points, index + 1);
    const after = pointAt(points, index + 2);
    return {
        start,
        control1: { x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 },
        control2: { x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 },
        end,
    };
}

/** The first part of a segment, up to t (de Casteljau). */
function splitSegment(segment: CubicSegment, t: number): CubicSegment {
    const a = lerp(segment.start, segment.control1, t);
    const b = lerp(segment.control1, segment.control2, t);
    const c = lerp(segment.control2, segment.end, t);
    const d = lerp(a, b, t);
    const e = lerp(b, c, t);
    return { start: segment.start, control1: a, control2: d, end: lerp(d, e, t) };
}

function toCurve(segment: CubicSegment): string {
    return ` C ${format(segment.control1)} ${format(segment.control2)} ${format(segment.end)}`;
}

/** A smooth SVG path through all points. */
export function smoothRoutePath(points: readonly MapPoint[]): string {
    return walkedRoutePath(points, points.length - 1, 0);
}

/** The smooth path from the first point to `t` (0..1) of the way after points[index]. */
export function walkedRoutePath(points: readonly MapPoint[], index: number, t: number): string {
    let path = `M ${format(pointAt(points, 0))}`;
    for (let segment = 0; segment < index; segment += 1) {
        path += toCurve(routeSegment(points, segment));
    }
    if (t > 0 && index < points.length - 1) {
        path += toCurve(splitSegment(routeSegment(points, index), t));
    }
    return path;
}

/** The point on the smooth path `t` (0..1) of the way after points[index]. */
export function pointOnRoute(points: readonly MapPoint[], index: number, t: number): MapPoint {
    if (t <= 0 || index >= points.length - 1) return pointAt(points, index);
    return splitSegment(routeSegment(points, index), t).end;
}
