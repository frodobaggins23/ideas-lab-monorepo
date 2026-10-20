export interface ProgressBarProps {
    readonly progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps): React.JSX.Element {
    const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

    return (
        <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-800/10 dark:bg-white/10"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}
