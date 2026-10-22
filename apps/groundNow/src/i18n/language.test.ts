import { describe, expect, it } from 'vitest';

import { resolveLanguage } from './language';

describe('resolveLanguage', () => {
    it('prefers the saved choice over browser settings', () => {
        expect(resolveLanguage('en', ['cs-CZ'])).toBe('en');
    });

    it('ignores an invalid saved value', () => {
        expect(resolveLanguage('de', ['cs'])).toBe('cs');
    });

    it('uses the first supported browser language', () => {
        expect(resolveLanguage(null, ['de-DE', 'cs-CZ', 'en-US'])).toBe('cs');
    });

    it('falls back to English', () => {
        expect(resolveLanguage(null, ['de-DE', 'fr'])).toBe('en');
        expect(resolveLanguage(null, [])).toBe('en');
    });
});
