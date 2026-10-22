/** How long one circle takes to fill with colour. */
export const FILL_MS = 1400;
/** Total time before the user may move on to the next sense. */
export const SETTLE_MS = 3000;

/** Circles fill one after another so the whole sequence lasts SETTLE_MS. */
export function fillDelayMs(index: number, count: number): number {
    if (count <= 1) return 0;
    return Math.round((index * (SETTLE_MS - FILL_MS)) / (count - 1));
}
