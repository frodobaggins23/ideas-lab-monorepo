import { useI18n } from '@/i18n/context';
import { LANGUAGES } from '@/i18n/language';

export function LanguageSwitcher(): React.JSX.Element {
    const { language, setLanguage, t } = useI18n();

    return (
        <div
            role="group"
            aria-label={t.languageLabel}
            className="flex rounded-full bg-white/50 p-0.5 text-xs font-semibold text-slate-600"
        >
            {LANGUAGES.map((code) => (
                <button
                    key={code}
                    type="button"
                    lang={code}
                    aria-pressed={code === language}
                    onClick={() => setLanguage(code)}
                    className={`rounded-full px-3 py-1.5 uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
                        code === language ? 'bg-slate-700 text-white' : ''
                    }`}
                >
                    {code}
                </button>
            ))}
        </div>
    );
}
