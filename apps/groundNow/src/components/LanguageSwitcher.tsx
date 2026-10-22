import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@/i18n/i18n';

export function LanguageSwitcher(): React.JSX.Element {
    const { t, i18n } = useTranslation();

    return (
        <div
            role="group"
            aria-label={t('languageLabel')}
            className="flex rounded-full bg-white/50 p-0.5 text-xs font-semibold text-slate-600"
        >
            {LANGUAGES.map((code) => (
                <button
                    key={code}
                    type="button"
                    lang={code}
                    aria-pressed={code === i18n.resolvedLanguage}
                    onClick={() => void i18n.changeLanguage(code)}
                    className={`rounded-full px-3 py-1.5 uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
                        code === i18n.resolvedLanguage ? 'bg-slate-700 text-white' : ''
                    }`}
                >
                    {code}
                </button>
            ))}
        </div>
    );
}
