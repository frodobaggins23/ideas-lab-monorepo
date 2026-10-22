export const LANGUAGES = ['en', 'cs'] as const;
export type Language = (typeof LANGUAGES)[number];

export const STORAGE_KEY = 'groundNow.language';

export function isLanguage(value: unknown): value is Language {
    return LANGUAGES.some((language) => language === value);
}

/** A saved choice wins; otherwise the first browser language we support; otherwise English. */
export function resolveLanguage(stored: string | null, preferred: readonly string[]): Language {
    if (isLanguage(stored)) return stored;
    for (const tag of preferred) {
        const base = tag.toLowerCase().split('-')[0];
        if (isLanguage(base)) return base;
    }
    return 'en';
}
