import {
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import { BOARD_SIZE, type BoardCard, boardCells, CARD_SIZE } from '@/mixing/board';
import { CARD_INFO, type CardKind, mixIngredients } from '@/mixing/cards';
import { toCssColor } from '@/mixing/light';

interface MixBoardProps {
    cards: BoardCard[];
    onMove: (kind: CardKind, x: number, y: number) => void;
}

interface Drag {
    kind: CardKind;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
}

const ARROW_DIRECTIONS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

export function MixBoard({ cards, onMove }: MixBoardProps): React.JSX.Element {
    const boardRef = useRef<HTMLDivElement>(null);
    const drag = useRef<Drag | null>(null);
    const [boardWidth, setBoardWidth] = useState(0);
    const [frontKind, setFrontKind] = useState<CardKind | null>(null);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;
        const observer = new ResizeObserver(([entry]) =>
            setBoardWidth(entry?.contentRect.width ?? 0),
        );
        observer.observe(board);
        return () => observer.disconnect();
    }, []);

    const unit = boardWidth / BOARD_SIZE;
    // Whole-pixel edges keep neighbouring cells flush, without hairline gaps between them.
    const px = (units: number) => Math.round(units * unit);
    const rect = (x: number, y: number, width: number, height: number): CSSProperties => ({
        left: px(x),
        top: px(y),
        width: px(x + width) - px(x),
        height: px(y + height) - px(y),
    });

    const startDrag = (event: PointerEvent<HTMLButtonElement>, card: BoardCard) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
            kind: card.kind,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: card.x,
            originY: card.y,
        };
        setFrontKind(card.kind);
    };

    const continueDrag = (event: PointerEvent<HTMLButtonElement>) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId || unit === 0) return;
        onMove(
            current.kind,
            current.originX + (event.clientX - current.startX) / unit,
            current.originY + (event.clientY - current.startY) / unit,
        );
    };

    const endDrag = () => {
        drag.current = null;
    };

    const nudge = (event: KeyboardEvent<HTMLButtonElement>, card: BoardCard) => {
        const direction = ARROW_DIRECTIONS[event.key];
        if (!direction) return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 2;
        setFrontKind(card.kind);
        onMove(card.kind, card.x + direction[0] * step, card.y + direction[1] * step);
    };

    const stacked = [
        ...cards.filter((card) => card.kind !== frontKind),
        ...cards.filter((card) => card.kind === frontKind),
    ];

    return (
        <div
            ref={boardRef}
            className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl bg-black ring-1 ring-white/15 select-none"
        >
            {unit > 0 &&
                boardCells(cards).map((cell) => (
                    <div
                        key={`${cell.x}:${cell.y}`}
                        aria-hidden="true"
                        className="absolute"
                        style={{
                            ...rect(cell.x, cell.y, cell.width, cell.height),
                            backgroundColor: toCssColor(mixIngredients(cell.cards)),
                        }}
                    />
                ))}
            {unit > 0 &&
                stacked.map((card) => (
                    <button
                        key={card.kind}
                        type="button"
                        aria-label={`${CARD_INFO[card.kind].label} light at ${card.level}%. Drag it, or use the arrow keys to move it.`}
                        className="absolute cursor-grab border-2 border-white/40 outline-none hover:border-white/70 focus-visible:border-white active:cursor-grabbing"
                        style={rect(card.x, card.y, CARD_SIZE, CARD_SIZE)}
                        onPointerDown={(event) => startDrag(event, card)}
                        onPointerMove={continueDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={(event) => nudge(event, card)}
                    >
                        <span className="absolute top-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] leading-none font-medium text-white">
                            {CARD_INFO[card.kind].label} {card.level}%
                        </span>
                    </button>
                ))}
        </div>
    );
}
