import { Button } from '@lab/ui';

interface IntroScreenProps {
    onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps): React.JSX.Element {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-100 via-sky-100 to-teal-100 px-6 py-10 text-center text-slate-800">
            <div
                className="relative mb-10 flex h-40 w-40 items-center justify-center"
                aria-hidden="true"
            >
                <span className="breathe absolute inset-0 rounded-full bg-indigo-300/50" />
                <span className="breathe absolute inset-5 rounded-full bg-indigo-400/50 [animation-delay:-1s]" />
                <span className="absolute inset-10 rounded-full bg-indigo-500 shadow-lg shadow-indigo-300" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
                You are here. You are safe enough.
            </h1>
            <p className="mt-4 max-w-sm text-lg text-slate-600">
                Let&rsquo;s bring your attention back to the present, one sense at a time. It takes
                about two minutes.
            </p>
            <p className="mt-3 max-w-sm text-sm text-slate-500">
                There are no right answers. Approximate is perfectly fine, and you never need to
                repeat a step.
            </p>
            <Button
                onClick={onStart}
                className="mt-10 w-full max-w-xs rounded-full !py-4 text-lg shadow-lg shadow-indigo-300"
            >
                Begin grounding
            </Button>
        </main>
    );
}
