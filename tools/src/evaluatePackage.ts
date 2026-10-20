export interface AuditCounts {
    critical: number;
    high: number;
    moderate: number;
    low: number;
}

export interface PackageFacts {
    name: string;
    weeklyDownloads: number;
    latestPublishedAt: string;
    deprecated: string | undefined;
    hasInstallScripts: boolean;
    audit: AuditCounts;
    signaturesValid: boolean;
}

export interface Evaluation {
    passed: boolean;
    failures: string[];
    warnings: string[];
}

const minWeeklyDownloads = 100_000;
const maxReleaseAgeMonths = 12;

function formatCounts(counts: [number, string][]): string {
    return counts
        .filter(([count]) => count > 0)
        .map(([count, label]) => `${count} ${label}`)
        .join(' and ');
}

export function evaluatePackage(facts: PackageFacts, now: Date): Evaluation {
    const failures: string[] = [];
    const warnings: string[] = [];

    if (facts.weeklyDownloads < minWeeklyDownloads) {
        failures.push(
            `Weekly downloads ${facts.weeklyDownloads.toLocaleString('en-US')} are below the minimum of ${minWeeklyDownloads.toLocaleString('en-US')}`,
        );
    }

    const cutoff = new Date(now);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - maxReleaseAgeMonths);
    if (new Date(facts.latestPublishedAt) < cutoff) {
        failures.push(
            `Latest release (${facts.latestPublishedAt.slice(0, 10)}) is older than ${maxReleaseAgeMonths} months`,
        );
    }

    if (facts.deprecated !== undefined) {
        failures.push(`Package is deprecated: ${facts.deprecated}`);
    }

    const blocking = formatCounts([
        [facts.audit.critical, 'critical'],
        [facts.audit.high, 'high'],
    ]);
    if (blocking) {
        failures.push(`npm audit found ${blocking} vulnerabilities in the dependency tree`);
    }
    const minor = formatCounts([
        [facts.audit.moderate, 'moderate'],
        [facts.audit.low, 'low'],
    ]);
    if (minor) {
        warnings.push(`npm audit also found ${minor} vulnerabilities`);
    }

    if (!facts.signaturesValid) {
        failures.push('Registry signature verification failed for the dependency tree');
    }

    if (facts.hasInstallScripts) {
        failures.push(
            'The package or its dependencies run install scripts (possibly a native build)',
        );
    }

    return { passed: failures.length === 0, failures, warnings };
}
