import { formatDate } from '@/challenge/dates';
import type { RoundSummary } from '@/challenge/rounds';
import { TOTAL_KM } from '@/route/caminoRoute';
import type { RoutePosition } from '@/route/routePosition';

interface StatsPanelProps {
    summary: RoundSummary;
    position: RoutePosition;
    bestDays: number | null;
}

function formatKm(km: number): string {
    return km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{value}</dd>
            {hint && <dd className="mt-1 text-xs text-slate-500">{hint}</dd>}
        </div>
    );
}

export function StatsPanel({ summary, position, bestDays }: StatsPanelProps): React.JSX.Element {
    const percent = Math.min((summary.totalKm / TOTAL_KM) * 100, 100);
    const isCompleted = summary.completedOn !== null;

    return (
        <section aria-label="Statistiky kola" className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
                <StatCard
                    label={isCompleted ? 'Dokončeno za' : 'Den výzvy'}
                    value={isCompleted ? `${summary.dayNumber} d` : `${summary.dayNumber}.`}
                    hint={`od ${formatDate(summary.round.startedOn)}`}
                />
                <StatCard
                    label="Ušlé km"
                    value={formatKm(summary.totalKm)}
                    hint={`z ${TOTAL_KM} km`}
                />
                <StatCard
                    label="Zbývá"
                    value={`${formatKm(summary.remainingKm)} km`}
                    hint={
                        summary.projectedFinishOn
                            ? `tímto tempem v cíli ${formatDate(summary.projectedFinishOn)}`
                            : undefined
                    }
                />
                <StatCard
                    label="Průměr"
                    value={`${formatKm(summary.averageKmPerDay)} km`}
                    hint={bestDays ? `na den · rekord ${bestDays} dní` : 'na den'}
                />
            </dl>

            <div>
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Roncesvalles</span>
                    <span className="font-semibold text-slate-900">{percent.toFixed(1)} %</span>
                    <span>Santiago</span>
                </div>
                <div
                    className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Postup k Santiagu"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(percent)}
                >
                    <div
                        className="h-full rounded-full bg-amber-500 transition-[width] duration-700"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <p className="mt-2 text-sm text-slate-700">
                    {position.nextPlace ? (
                        <>
                            Poslední zastávka <strong>{position.lastPlace.name}</strong>. Další je{' '}
                            <strong>{position.nextPlace.name}</strong> za{' '}
                            {formatKm(position.nextPlace.km - position.km)} km.
                        </>
                    ) : (
                        <>
                            Jsi v cíli, v <strong>Santiagu de Compostela</strong>!
                        </>
                    )}
                </p>
            </div>
        </section>
    );
}
