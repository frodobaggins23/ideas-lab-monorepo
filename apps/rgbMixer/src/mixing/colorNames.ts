import { isSameLight, type Light } from '@/mixing/light';

const NAMED_COLORS: { name: string; light: Light }[] = [
    { name: 'Black', light: { r: 0, g: 0, b: 0 } },
    { name: 'Red', light: { r: 100, g: 0, b: 0 } },
    { name: 'Green', light: { r: 0, g: 100, b: 0 } },
    { name: 'Blue', light: { r: 0, g: 0, b: 100 } },
    { name: 'Yellow', light: { r: 100, g: 100, b: 0 } },
    { name: 'Cyan', light: { r: 0, g: 100, b: 100 } },
    { name: 'Magenta', light: { r: 100, g: 0, b: 100 } },
    { name: 'White', light: { r: 100, g: 100, b: 100 } },
    { name: 'Orange', light: { r: 100, g: 50, b: 0 } },
    { name: 'Brown', light: { r: 50, g: 25, b: 0 } },
    { name: 'Pink', light: { r: 100, g: 75, b: 75 } },
    { name: 'Rose', light: { r: 100, g: 0, b: 50 } },
    { name: 'Violet', light: { r: 50, g: 0, b: 100 } },
    { name: 'Purple', light: { r: 50, g: 0, b: 50 } },
    { name: 'Teal', light: { r: 0, g: 50, b: 50 } },
    { name: 'Olive', light: { r: 50, g: 50, b: 0 } },
    { name: 'Chartreuse', light: { r: 50, g: 100, b: 0 } },
    { name: 'Spring green', light: { r: 0, g: 100, b: 50 } },
    { name: 'Azure', light: { r: 0, g: 50, b: 100 } },
    { name: 'Sky blue', light: { r: 50, g: 75, b: 100 } },
    { name: 'Maroon', light: { r: 50, g: 0, b: 0 } },
    { name: 'Dark green', light: { r: 0, g: 50, b: 0 } },
    { name: 'Navy', light: { r: 0, g: 0, b: 50 } },
    { name: 'Dark gray', light: { r: 25, g: 25, b: 25 } },
    { name: 'Gray', light: { r: 50, g: 50, b: 50 } },
    { name: 'Light gray', light: { r: 75, g: 75, b: 75 } },
];

export function nameLight(light: Light): string | null {
    return NAMED_COLORS.find((named) => isSameLight(named.light, light))?.name ?? null;
}
