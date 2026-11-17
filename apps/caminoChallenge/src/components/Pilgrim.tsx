interface PilgrimProps {
    x: number;
    y: number;
}

/** A pilgrim with a hat, backpack and staff, standing with the feet on (x, y). */
export function Pilgrim({ x, y }: PilgrimProps): React.JSX.Element {
    return (
        <g transform={`translate(${x} ${y}) scale(1.6)`} aria-hidden="true">
            <g className="pilgrim-walk">
                <ellipse cx="0" cy="0" rx="14" ry="4" className="fill-slate-900/20" />
                {/* staff */}
                <line
                    x1="14"
                    y1="-54"
                    x2="14"
                    y2="0"
                    strokeWidth="3"
                    className="stroke-amber-900"
                />
                <circle cx="14" cy="-50" r="3" className="fill-amber-500" />
                {/* legs */}
                <line
                    x1="-4"
                    y1="-18"
                    x2="-8"
                    y2="0"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="stroke-slate-700"
                />
                <line
                    x1="4"
                    y1="-18"
                    x2="7"
                    y2="0"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="stroke-slate-700"
                />
                {/* backpack */}
                <rect x="-16" y="-40" width="10" height="20" rx="3" className="fill-amber-700" />
                {/* body */}
                <path d="M -9 -42 Q 0 -46 9 -42 L 8 -16 L -8 -16 Z" className="fill-indigo-600" />
                {/* scallop shell on the chest */}
                <circle cx="1" cy="-32" r="3.5" className="fill-amber-300" />
                {/* arm holding the staff */}
                <line
                    x1="6"
                    y1="-38"
                    x2="14"
                    y2="-30"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-indigo-600"
                />
                {/* head and hat */}
                <circle cx="0" cy="-50" r="7" className="fill-orange-200" />
                <ellipse cx="0" cy="-55" rx="13" ry="3.5" className="fill-amber-800" />
                <path d="M -7 -55 Q 0 -66 7 -55 Z" className="fill-amber-800" />
            </g>
        </g>
    );
}
