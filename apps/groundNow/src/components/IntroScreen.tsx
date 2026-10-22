import { Button } from '@lab/ui';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface IntroScreenProps {
    onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps): React.JSX.Element {
    const { t } = useTranslation();

    return (
        <main className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-100 via-sky-100 to-teal-100 px-6 py-10 text-center text-slate-800">
            <div className="absolute right-4 top-4">
                <LanguageSwitcher />
            </div>
            <div
                className="relative mb-10 flex h-40 w-40 items-center justify-center"
                aria-hidden="true"
            >
                <span className="breathe absolute inset-0 rounded-full bg-indigo-300/50" />
                <span className="breathe absolute inset-5 rounded-full bg-indigo-400/50 [animation-delay:-1s]" />
                <span className="absolute inset-10 rounded-full bg-indigo-500 shadow-lg shadow-indigo-300" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('intro.title')}</h1>
            <p className="mt-4 max-w-sm text-lg text-slate-600">{t('intro.body')}</p>
            <p className="mt-3 max-w-sm text-sm text-slate-500">{t('intro.note')}</p>
            <Button
                onClick={onStart}
                className="mt-10 w-full max-w-xs rounded-full !py-4 text-lg shadow-lg shadow-indigo-300"
            >
                {t('intro.begin')}
            </Button>
        </main>
    );
}
