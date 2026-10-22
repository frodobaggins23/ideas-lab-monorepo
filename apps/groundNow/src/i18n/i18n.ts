import i18next, { type i18n } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import cs from './locales/cs.json';
import en from './locales/en.json';

export const LANGUAGES = ['en', 'cs'] as const;
export type Language = (typeof LANGUAGES)[number];

export const STORAGE_KEY = 'groundNow.language';

export const resources = { en: { translation: en }, cs: { translation: cs } } as const;

/** A saved choice wins, then the browser language (cs-CZ counts as cs), then English. */
export function createI18n(): i18n {
    const instance = i18next.createInstance();
    void instance
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources,
            supportedLngs: LANGUAGES,
            nonExplicitSupportedLngs: true,
            fallbackLng: 'en',
            detection: {
                order: ['localStorage', 'navigator'],
                lookupLocalStorage: STORAGE_KEY,
                caches: ['localStorage'],
            },
            interpolation: { escapeValue: false },
            react: { useSuspense: false },
        });
    return instance;
}

function syncDocumentLanguage(language: string): void {
    document.documentElement.lang = language;
}

/** Call once before rendering: react-i18next keeps the instance globally, so no provider is needed. */
export function initI18n(): i18n {
    const instance = createI18n();
    syncDocumentLanguage(instance.resolvedLanguage ?? 'en');
    instance.on('languageChanged', syncDocumentLanguage);
    return instance;
}
