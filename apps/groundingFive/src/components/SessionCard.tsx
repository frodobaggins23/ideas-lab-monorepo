import { Button } from '@lab/ui';

import type { GroundingStep } from '@/types/groundingStep';

export interface SessionCardProps {
    readonly step: GroundingStep;
    readonly remaining: number;
    readonly onFound: () => void;
}

export function SessionCard({ step, remaining, onFound }: SessionCardProps): React.JSX.Element {
    const foundCount = step.count - remaining;

    return (
        <div
            className={`flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br ${step.gradient} px-6 py-10 text-center text-white shadow-xl sm:px-10`}
        >
            <span className="text-6xl" aria-hidden="true">
                {step.icon}
            </span>
            <div>
                <p className="text-sm font-semibold tracking-wide text-white/80 uppercase">
                    {step.sense}
                </p>
                <p className="mt-2 text-xl font-medium text-balance sm:text-2xl">
                    {step.instruction}
                </p>
            </div>
            <div className="flex gap-2" aria-hidden="true">
                {Array.from({ length: step.count }, (_, index) => (
                    <span
                        key={index}
                        className={`h-3 w-3 rounded-full transition-colors ${
                            index < foundCount ? 'bg-white' : 'bg-white/30'
                        }`}
                    />
                ))}
            </div>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={onFound}>
                Found one ({remaining} left)
            </Button>
        </div>
    );
}
