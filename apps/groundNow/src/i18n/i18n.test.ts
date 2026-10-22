import { afterEach, describe, expect, it, vi } from 'vitest';

import { createI18n, resources, STORAGE_KEY } from './i18n';

function keysOf(value: object, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, child]) =>
        typeof child === 'object' && child !== null
            ? keysOf(child, `${prefix}${key}.`)
            : [`${prefix}${key}`],
    );
}

/** Plural suffixes legitimately differ between languages; compare the base keys. */
const baseKeys = (value: object) =>
    [
        ...new Set(keysOf(value).map((key) => key.replace(/_(zero|one|two|few|many|other)$/, ''))),
    ].sort();

afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('translations', () => {
    it('define the same keys in English and Czech', () => {
        expect(baseKeys(resources.cs.translation)).toEqual(baseKeys(resources.en.translation));
    });

    it('pick the Czech plural form for the sense count', () => {
        const t = createI18n().getFixedT('cs');
        expect(t('senses.see.prefix', { count: 5 })).toBe('věcí, které');
        expect(t('senses.hear.prefix', { count: 3 })).toBe('věci, které');
        expect(t('senses.taste.prefix', { count: 1 })).toBe('chuť, kterou');
    });

    it('pick the English singular for one item', () => {
        const t = createI18n().getFixedT('en');
        expect(t('senses.taste.prefix', { count: 1 })).toBe('thing you can');
        expect(t('senses.smell.prefix', { count: 2 })).toBe('things you can');
    });

    it('interpolate values', () => {
        expect(createI18n().getFixedT('cs')('sense.step', { current: 2, total: 5 })).toBe(
            'Krok 2 z 5',
        );
    });
});

describe('language detection', () => {
    it('uses a Czech browser language', () => {
        vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['cs-CZ', 'en-US']);
        expect(createI18n().resolvedLanguage).toBe('cs');
    });

    it('prefers the saved choice over the browser language', () => {
        localStorage.setItem(STORAGE_KEY, 'en');
        vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['cs-CZ']);
        expect(createI18n().resolvedLanguage).toBe('en');
    });

    it('falls back to English for unsupported languages', () => {
        vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']);
        expect(createI18n().resolvedLanguage).toBe('en');
    });
});
