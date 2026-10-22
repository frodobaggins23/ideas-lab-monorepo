import { Button } from '@lab/ui';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface DoneScreenProps {
    onRestart: () => void;
}

export function DoneScreen({ onRestart }: DoneScreenProps): React.JSX.Element {
    const { t } = useTranslation();

    return (
        <main className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-teal-100 via-emerald-100 to-sky-100 px-6 py-10 text-center text-slate-800">
            <div className="absolute right-4 top-4">
                <LanguageSwitcher />
            </div>
            <div
                className="breathe mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-teal-500 text-5xl text-white shadow-lg shadow-teal-300"
                aria-hidden="true"
            >
                ✓
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('done.title')}</h1>
            <p className="mt-4 max-w-sm text-lg text-slate-600">{t('done.body')}</p>
            <p className="mt-3 max-w-sm text-sm text-slate-500">{t('done.note')}</p>
            <Button
                variant="secondary"
                onClick={onRestart}
                className="mt-10 w-full max-w-xs rounded-full !py-4 text-lg"
            >
                {t('done.restart')}
            </Button>
        </main>
    );
}
