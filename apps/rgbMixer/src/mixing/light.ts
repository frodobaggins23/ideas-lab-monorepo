/** Channel intensities in percent. Stacked lights can exceed 100; screens clip at 100. */
export interface Light {
    r: number;
    g: number;
    b: number;
}

export const LEVELS = [25, 50, 75, 100] as const;
export type Level = (typeof LEVELS)[number];

export const DARK: Light = { r: 0, g: 0, b: 0 };

export function scaleLight(light: Light, level: Level): Light {
    return { r: (light.r * level) / 100, g: (light.g * level) / 100, b: (light.b * level) / 100 };
}

export function addLights(lights: Light[]): Light {
    return lights.reduce(
        (sum, light) => ({
            r: sum.r + light.r,
            g: sum.g + light.g,
            b: sum.b + light.b,
        }),
        DARK,
    );
}

export function isSameLight(a: Light, b: Light): boolean {
    return a.r === b.r && a.g === b.g && a.b === b.b;
}

export function isClipped(light: Light): boolean {
    return light.r > 100 || light.g > 100 || light.b > 100;
}

export function toCssColor(light: Light): string {
    const channel = (value: number) => Math.round((Math.min(value, 100) / 100) * 255);
    return `rgb(${channel(light.r)} ${channel(light.g)} ${channel(light.b)})`;
}
