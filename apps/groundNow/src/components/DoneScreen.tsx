import { Button } from '@lab/ui';

interface DoneScreenProps {
    onRestart: () => void;
}

export function DoneScreen({ onRestart }: DoneScreenProps): React.JSX.Element {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-teal-100 via-emerald-100 to-sky-100 px-6 py-10 text-center text-slate-800">
            <div
                className="breathe mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-teal-500 text-5xl text-white shadow-lg shadow-teal-300"
                aria-hidden="true"
            >
                ✓
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
                You&rsquo;re back in the present.
            </h1>
            <p className="mt-4 max-w-sm text-lg text-slate-600">
                Thoughts may still be around, and that&rsquo;s okay. You don&rsquo;t have to push
                them away or solve them. Carry on with what matters to you.
            </p>
            <p className="mt-3 max-w-sm text-sm text-slate-500">
                If it feels overwhelming, consider reaching out to a therapist or someone you trust.
            </p>
            <Button
                variant="secondary"
                onClick={onRestart}
                className="mt-10 w-full max-w-xs rounded-full !py-4 text-lg"
            >
                Back to start
            </Button>
        </main>
    );
}
