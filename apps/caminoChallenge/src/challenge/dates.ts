/** Calendar dates are stored as local `YYYY-MM-DD` strings, so a day never shifts by time zone. */
export type IsoDate = string;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(date: Date): IsoDate {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toUtcMs(isoDate: IsoDate): number | null {
    const match = ISO_DATE_PATTERN.exec(isoDate);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    if (year === undefined || month === undefined || day === undefined) return null;
    const ms = Date.UTC(year, month - 1, day);
    // Date.UTC rolls over invalid days (2026-02-31), so compare back to reject them.
    const check = new Date(ms);
    if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    return ms;
}

export function isIsoDate(value: unknown): value is IsoDate {
    return typeof value === 'string' && toUtcMs(value) !== null;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
    const fromMs = toUtcMs(from);
    const toMs = toUtcMs(to);
    if (fromMs === null || toMs === null) throw new Error(`Invalid date: ${from} or ${to}`);
    return Math.round((toMs - fromMs) / DAY_MS);
}

export function addDays(isoDate: IsoDate, days: number): IsoDate {
    const ms = toUtcMs(isoDate);
    if (ms === null) throw new Error(`Invalid date: ${isoDate}`);
    return new Date(ms + days * DAY_MS).toISOString().slice(0, 10);
}

export function formatDate(isoDate: IsoDate): string {
    const match = ISO_DATE_PATTERN.exec(isoDate);
    if (!match) return isoDate;
    const [, year, month, day] = match;
    return `${Number(day)}. ${Number(month)}. ${year}`;
}
