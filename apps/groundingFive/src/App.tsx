import { Container } from '@lab/ui';

import { CompletionScreen } from '@/components/CompletionScreen';
import { ProgressBar } from '@/components/ProgressBar';
import { SessionCard } from '@/components/SessionCard';
import { useGroundingSession } from '@/hooks/useGroundingSession';

export function App(): React.JSX.Element {
    const { currentStep, remaining, isComplete, progress, markFound, reset } =
        useGroundingSession();

    return (
        <div className="flex min-h-screen items-center bg-slate-50">
            <Container className="flex flex-col gap-8">
                <header className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                        5-4-3-2-1 Grounding
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        A gentle sensory exercise to calm racing thoughts.
                    </p>
                </header>

                <ProgressBar progress={progress} />

                {isComplete || !currentStep ? (
                    <CompletionScreen onRestart={reset} />
                ) : (
                    <SessionCard step={currentStep} remaining={remaining} onFound={markFound} />
                )}
            </Container>
        </div>
    );
}
