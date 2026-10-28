import { describe, expect, it } from 'vitest';

import { describeWay, mixIngredients, wayKey } from '@/mixing/cards';
import { nameLight } from '@/mixing/colorNames';
import { isClipped, toCssColor } from '@/mixing/light';

describe('mixIngredients', () => {
    it('adds light channel by channel', () => {
        expect(
            mixIngredients([
                { kind: 'red', level: 100 },
                { kind: 'green', level: 50 },
            ]),
        ).toEqual({ r: 100, g: 50, b: 0 });
    });

    it('lets stacked lights go over 100 percent', () => {
        const light = mixIngredients([
            { kind: 'cyan', level: 100 },
            { kind: 'yellow', level: 100 },
        ]);
        expect(light).toEqual({ r: 100, g: 200, b: 100 });
        expect(isClipped(light)).toBe(true);
        expect(nameLight(light)).toBeNull();
    });
});

describe('toCssColor', () => {
    it('maps percent to 0-255 and clips at full brightness', () => {
        expect(toCssColor({ r: 50, g: 25, b: 0 })).toBe('rgb(128 64 0)');
        expect(toCssColor({ r: 100, g: 200, b: 0 })).toBe('rgb(255 255 0)');
    });
});

describe('wayKey', () => {
    it('ignores the order of cards', () => {
        expect(wayKey(['yellow', 'blue'])).toBe('blue+yellow');
        expect(describeWay('blue+yellow')).toBe('Blue + Yellow');
    });
});
