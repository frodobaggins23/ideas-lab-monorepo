import { Pilgrim } from '@/components/Pilgrim';
import { CAMINO_PLACES, type Place } from '@/route/caminoRoute';
import { getPositionPoint, type MapPoint, projectPlaces } from '@/route/mapProjection';
import type { RoutePosition } from '@/route/routePosition';

interface RouteMapProps {
    position: RoutePosition;
}

const MAP_WIDTH = 1000;
/** Leaves room for the pilgrim at Roncesvalles, the northernmost point. */
const MAP_PADDING = 110;
const LABEL_EDGE = 160;
const map = projectPlaces(CAMINO_PLACES, MAP_WIDTH, MAP_PADDING);

/**
 * Labels go above the place unless the route, a neighbouring label or the pilgrim standing at the
 * start or finish is in the way.
 */
const LABELS_BELOW = new Set([
    'roncesvalles',
    'pamplona',
    'burgos',
    'astorga',
    'sarria',
    'santiago',
]);

/** Keeps labels near the map edges inside the picture. */
function labelAnchor(x: number): 'start' | 'middle' | 'end' {
    if (x < LABEL_EDGE) return 'start';
    if (x > MAP_WIDTH - LABEL_EDGE) return 'end';
    return 'middle';
}

function pointOf(place: Place): MapPoint {
    const point = map.points.get(place.id);
    if (!point) throw new Error(`Place ${place.id} is not on the map`);
    return point;
}

function toPolyline(points: readonly MapPoint[]): string {
    return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

/** Only cities get a permanent label; the rest would overlap on a phone. */
function hasLabel(place: Place): boolean {
    return place.kind === 'city' || place.km === 0;
}

const fullRoute = toPolyline(CAMINO_PLACES.map(pointOf));

export function RouteMap({ position }: RouteMapProps): React.JSX.Element {
    const pilgrimPoint = getPositionPoint(map, position);
    const walkedPoints = [
        ...CAMINO_PLACES.filter((place) => place.km <= position.km).map(pointOf),
        pilgrimPoint,
    ];
    const labelledPlaces = CAMINO_PLACES.filter(hasLabel);

    return (
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-sky-50">
            <svg
                viewBox={`0 0 ${MAP_WIDTH} ${map.height.toFixed(0)}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`Mapa Camina. Poutník je ${position.km} km od Roncesvalles, u místa ${position.lastPlace.name}.`}
            >
                <polyline
                    points={fullRoute}
                    fill="none"
                    strokeWidth="6"
                    strokeDasharray="4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-slate-400"
                />
                <polyline
                    points={toPolyline(walkedPoints)}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-amber-500"
                />
                {CAMINO_PLACES.map((place) => {
                    const point = pointOf(place);
                    const isReached = place.km <= position.km;
                    const fill = isReached ? 'fill-amber-500' : 'fill-white';
                    return (
                        <g key={place.id}>
                            <title>{`${place.name} (${place.km} km)`}</title>
                            {place.kind === 'landmark' ? (
                                <rect
                                    x={point.x - 8}
                                    y={point.y - 8}
                                    width="16"
                                    height="16"
                                    transform={`rotate(45 ${point.x} ${point.y})`}
                                    strokeWidth="3"
                                    className={`stroke-indigo-700 ${fill}`}
                                />
                            ) : (
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={place.kind === 'city' ? 11 : 7}
                                    strokeWidth="3"
                                    className={`stroke-indigo-700 ${fill}`}
                                />
                            )}
                        </g>
                    );
                })}
                {labelledPlaces.map((place) => {
                    const point = pointOf(place);
                    const isBelow = LABELS_BELOW.has(place.id);
                    const anchor = labelAnchor(point.x);
                    const offsetX = { start: -16, middle: 0, end: 16 }[anchor];
                    return (
                        <text
                            key={place.id}
                            x={point.x + offsetX}
                            y={isBelow ? point.y + 50 : point.y - 24}
                            textAnchor={anchor}
                            className="fill-slate-700 text-[28px] font-semibold"
                        >
                            {place.id === 'santiago' ? 'Santiago' : place.name}
                        </text>
                    );
                })}
                <Pilgrim x={pilgrimPoint.x} y={pilgrimPoint.y} />
            </svg>
            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
                <span>● město</span>
                <span>◆ zajímavé místo</span>
                <span className="text-amber-600">━ ušlá trasa</span>
            </figcaption>
        </figure>
    );
}
