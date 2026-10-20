import { Button } from '@lab/ui';

export interface CompletionScreenProps {
    readonly onRestart: () => void;
}

export function CompletionScreen({ onRestart }: CompletionScreenProps): React.JSX.Element {
    return (
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-indigo-400 to-sky-500 px-6 py-12 text-center text-white shadow-xl sm:px-10">
            <span className="text-6xl" aria-hidden="true">
                🌿
            </span>
            <div>
                <p className="text-2xl font-semibold">You made it through</p>
                <p className="mt-2 text-white/90">
                    Notice how you feel right now. You can repeat this whenever you need to.
                </p>
            </div>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={onRestart}>
                Start again
            </Button>
        </div>
    );
}
