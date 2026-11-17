import { Pilgrim } from '@/components/Pilgrim';
import { CAMINO_PLACES, type Place } from '@/route/caminoRoute';
import {
    FRENCH_BORDER,
    type GeoPoint,
    LAND_OUTLINE,
    MAP_BOUNDS,
    MOUNTAINS,
    REGION_LABELS,
} from '@/route/geography';
import {
    createProjection,
    type MapPoint,
    pointOnRoute,
    smoothRoutePath,
    walkedRoutePath,
} from '@/route/mapProjection';
import type { RoutePosition } from '@/route/routePosition';

interface RouteMapProps {
    position: RoutePosition;
}

const map = createProjection(MAP_BOUNDS, 1000, 1.7);
const project = (point: GeoPoint): MapPoint => map.project(point.lat, point.lon);

function toPoints(points: readonly GeoPoint[]): string {
    return points
        .map(project)
        .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
        .join(' ');
}

const routePoints = CAMINO_PLACES.map(project);
const fullRoutePath = smoothRoutePath(routePoints);
const landPoints = toPoints(LAND_OUTLINE);
const borderPoints = toPoints(FRENCH_BORDER);

interface PlaceLabel {
    dx: number;
    dy: number;
    anchor: 'start' | 'middle' | 'end';
}

/**
 * Hand-placed labels for the cities, so they stay clear of the route, each other and the pilgrim
 * standing at the start or the finish. Other places show their name on hover.
 */
const PLACE_LABELS: Record<string, PlaceLabel> = {
    roncesvalles: { dx: -18, dy: -4, anchor: 'end' },
    pamplona: { dx: -18, dy: 10, anchor: 'end' },
    logrono: { dx: 0, dy: 36, anchor: 'middle' },
    burgos: { dx: 0, dy: 36, anchor: 'middle' },
    leon: { dx: 0, dy: -20, anchor: 'middle' },
    astorga: { dx: 0, dy: 36, anchor: 'middle' },
    ponferrada: { dx: -12, dy: 34, anchor: 'end' },
    sarria: { dx: 0, dy: -20, anchor: 'middle' },
    santiago: { dx: 0, dy: 44, anchor: 'middle' },
};

const labelHalo = {
    stroke: 'white',
    strokeWidth: 6,
    strokeLinejoin: 'round' as const,
    paintOrder: 'stroke',
};

function Mountain({ point }: { point: MapPoint }): React.JSX.Element {
    const { x, y } = point;
    return (
        <g aria-hidden="true">
            <path
                d={`M ${x - 26} ${y + 10} L ${x - 10} ${y - 10} L ${x + 4} ${y + 10} Z`}
                className="fill-[#d9c9a3]"
            />
            <path
                d={`M ${x - 12} ${y + 10} L ${x + 6} ${y - 18} L ${x + 24} ${y + 10} Z`}
                className="fill-[#c8b48a]"
            />
            <path
                d={`M ${x + 1} ${y - 10} L ${x + 6} ${y - 18} L ${x + 11} ${y - 10} L ${x + 6} ${y - 7} Z`}
                className="fill-white"
            />
        </g>
    );
}

function PlaceMarker({ place, isReached }: { place: Place; isReached: boolean }) {
    const { x, y } = project(place);
    const colors = isReached ? 'fill-amber-400 stroke-amber-700' : 'fill-white stroke-slate-500';

    if (place.id === 'santiago') {
        // The goal: a gold star on the Camino blue.
        const star = Array.from({ length: 10 }, (_, index) => {
            const radius = index % 2 === 0 ? 11 : 4.5;
            const angle = (Math.PI / 5) * index - Math.PI / 2;
            return `${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`;
        }).join(' ');
        return (
            <g>
                <circle
                    cx={x}
                    cy={y}
                    r="17"
                    strokeWidth="3"
                    className="fill-blue-800 stroke-white"
                />
                <polygon points={star} className="fill-amber-300" />
            </g>
        );
    }
    if (place.kind === 'landmark') {
        return (
            <rect
                x={x - 6}
                y={y - 6}
                width="12"
                height="12"
                transform={`rotate(45 ${x} ${y})`}
                strokeWidth="2.5"
                className={colors}
            />
        );
    }
    return (
        <circle
            cx={x}
            cy={y}
            r={place.kind === 'city' ? 8 : 5.5}
            strokeWidth="2.5"
            className={colors}
        />
    );
}

export function RouteMap({ position }: RouteMapProps): React.JSX.Element {
    const pilgrimPoint = pointOnRoute(routePoints, position.lastIndex, position.legProgress);
    const walkedPath = walkedRoutePath(routePoints, position.lastIndex, position.legProgress);
    const compass = { x: map.width - 40, y: map.height - 50 };

    return (
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg
                viewBox={`0 0 ${map.width} ${map.height.toFixed(0)}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`Mapa Camina. Poutník je ${position.km} km od Roncesvalles, u místa ${position.lastPlace.name}.`}
            >
                <defs>
                    <pattern id="waves" width="48" height="24" patternUnits="userSpaceOnUse">
                        <path
                            d="M 4 14 q 8 -6 16 0 t 16 0"
                            fill="none"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="stroke-sky-300/70"
                        />
                    </pattern>
                    <radialGradient id="land" cx="55%" cy="70%" r="75%">
                        <stop offset="0%" stopColor="#f7f0dc" />
                        <stop offset="100%" stopColor="#ece0bf" />
                    </radialGradient>
                </defs>

                {/* sea, land and borders */}
                <rect width={map.width} height={map.height} className="fill-sky-100" />
                <rect width={map.width} height={map.height} fill="url(#waves)" />
                <polygon
                    points={landPoints}
                    fill="url(#land)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="stroke-sky-300"
                />
                <polyline
                    points={borderPoints}
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    className="stroke-stone-400"
                />
                {MOUNTAINS.map((mountain) => (
                    <Mountain key={`${mountain.lat},${mountain.lon}`} point={project(mountain)} />
                ))}
                {REGION_LABELS.map((label) => {
                    const { x, y } = project(label);
                    const isSea = label.kind === 'sea';
                    return (
                        <text
                            key={label.text}
                            x={x}
                            y={y}
                            textAnchor={label.anchor ?? 'middle'}
                            className={
                                isSea
                                    ? 'fill-sky-600/70 text-[24px] italic'
                                    : 'fill-stone-400 text-[20px] font-semibold tracking-[0.3em]'
                            }
                        >
                            {label.text}
                        </text>
                    );
                })}

                {/* the route: walked part glows, the rest is a dotted trail */}
                <path
                    d={fullRoutePath}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="stroke-white/80"
                />
                <path
                    d={fullRoutePath}
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray="1 9"
                    strokeLinecap="round"
                    className="stroke-amber-800/70"
                />
                <path
                    d={walkedPath}
                    fill="none"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="stroke-amber-300/50"
                />
                <path
                    d={walkedPath}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="stroke-amber-500"
                />

                {CAMINO_PLACES.map((place) => (
                    <g key={place.id}>
                        <title>{`${place.name} (${place.km} km)`}</title>
                        <PlaceMarker place={place} isReached={place.km <= position.km} />
                    </g>
                ))}
                {CAMINO_PLACES.map((place) => {
                    const label = PLACE_LABELS[place.id];
                    if (!label) return null;
                    const { x, y } = project(place);
                    return (
                        <text
                            key={place.id}
                            x={x + label.dx}
                            y={y + label.dy}
                            textAnchor={label.anchor}
                            className="fill-slate-800 text-[26px] font-semibold"
                            {...labelHalo}
                        >
                            {place.id === 'santiago' ? 'Santiago' : place.name}
                        </text>
                    );
                })}

                <g transform={`translate(${compass.x} ${compass.y})`} aria-hidden="true">
                    <circle r="22" className="fill-white/80 stroke-stone-300" strokeWidth="2" />
                    <path d="M 0 -16 L 6 4 L 0 0 L -6 4 Z" className="fill-slate-700" />
                    <text
                        y="17"
                        textAnchor="middle"
                        className="fill-slate-700 text-[13px] font-bold"
                    >
                        S
                    </text>
                </g>

                <Pilgrim x={pilgrimPoint.x} y={pilgrimPoint.y} />
            </svg>
            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 px-4 py-2 text-xs text-slate-600">
                <span>● město</span>
                <span>◆ zajímavé místo</span>
                <span className="text-blue-800">★ cíl</span>
                <span className="text-amber-600">━ ušlá trasa</span>
            </figcaption>
        </figure>
    );
}
