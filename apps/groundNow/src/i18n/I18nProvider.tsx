import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { I18nContext } from './context';
import { cs } from './cs';
import { en } from './en';
import { type Language, resolveLanguage, STORAGE_KEY } from './language';
import type { Messages } from './messages';

const MESSAGES: Record<Language, Messages> = { en, cs };

function readStoredLanguage(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        // Storage can be blocked (private mode); the browser language still works.
        return null;
    }
}

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [language, setLanguageState] = useState<Language>(() =>
        resolveLanguage(readStoredLanguage(), navigator.languages),
    );

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((next: Language) => {
        setLanguageState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Not persisting is acceptable: the choice still applies for this visit.
        }
    }, []);

    const value = useMemo(
        () => ({ language, setLanguage, t: MESSAGES[language] }),
        [language, setLanguage],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
