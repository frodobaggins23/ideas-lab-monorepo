/** Reads a distance typed by the user; Czech keyboards use a decimal comma. NaN if unreadable. */
export function parseKm(text: string): number {
    const normalized = text.trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
    return Number(normalized);
}
