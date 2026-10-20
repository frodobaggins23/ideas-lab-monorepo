import { describe, expect, it } from 'vitest';

import type { PackageFacts } from '../evaluatePackage.ts';
import { evaluatePackage } from '../evaluatePackage.ts';

const now = new Date('2026-10-19T00:00:00Z');

const healthy: PackageFacts = {
    name: 'zustand',
    weeklyDownloads: 5_000_000,
    latestPublishedAt: '2026-09-01T00:00:00Z',
    deprecated: undefined,
    hasInstallScripts: false,
    audit: { critical: 0, high: 0, moderate: 0, low: 0 },
    signaturesValid: true,
};

describe('evaluatePackage', () => {
    it('passes a healthy package without findings', () => {
        expect(evaluatePackage(healthy, now)).toEqual({ passed: true, failures: [], warnings: [] });
    });

    it('blocks a package under 100k weekly downloads', () => {
        const result = evaluatePackage({ ...healthy, weeklyDownloads: 99_999 }, now);

        expect(result.passed).toBe(false);
        expect(result.failures).toEqual([expect.stringMatching(/99,999.*100,000/)]);
    });

    it('accepts exactly 100k weekly downloads', () => {
        expect(evaluatePackage({ ...healthy, weeklyDownloads: 100_000 }, now).passed).toBe(true);
    });

    it('blocks a package whose latest release is older than 12 months', () => {
        const result = evaluatePackage(
            { ...healthy, latestPublishedAt: '2025-10-18T00:00:00Z' },
            now,
        );

        expect(result.passed).toBe(false);
        expect(result.failures).toEqual([expect.stringMatching(/12 months/)]);
    });

    it('accepts a release from exactly 12 months ago', () => {
        const result = evaluatePackage(
            { ...healthy, latestPublishedAt: '2025-10-19T00:00:00Z' },
            now,
        );

        expect(result.passed).toBe(true);
    });

    it('blocks a deprecated package and quotes the message', () => {
        const result = evaluatePackage({ ...healthy, deprecated: 'use other-pkg instead' }, now);

        expect(result.passed).toBe(false);
        expect(result.failures).toEqual([expect.stringContaining('use other-pkg instead')]);
    });

    it.each([
        ['critical', { critical: 1, high: 0, moderate: 0, low: 0 }],
        ['high', { critical: 0, high: 2, moderate: 0, low: 0 }],
    ])('blocks on %s audit findings', (_label, audit) => {
        const result = evaluatePackage({ ...healthy, audit }, now);

        expect(result.passed).toBe(false);
        expect(result.failures).toEqual([expect.stringMatching(/audit/i)]);
    });

    it('only warns on moderate and low audit findings', () => {
        const result = evaluatePackage(
            { ...healthy, audit: { critical: 0, high: 0, moderate: 3, low: 1 } },
            now,
        );

        expect(result.passed).toBe(true);
        expect(result.warnings).toEqual([expect.stringMatching(/3 moderate.*1 low/)]);
    });

    it('blocks when registry signatures do not verify', () => {
        const result = evaluatePackage({ ...healthy, signaturesValid: false }, now);

        expect(result.passed).toBe(false);
        expect(result.failures).toEqual([expect.stringMatching(/signature/i)]);
    });

    it('warns about install scripts without blocking', () => {
        const result = evaluatePackage({ ...healthy, hasInstallScripts: true }, now);

        expect(result.passed).toBe(true);
        expect(result.warnings).toEqual([expect.stringMatching(/install script/i)]);
    });

    it('reports every failure at once', () => {
        const result = evaluatePackage(
            { ...healthy, weeklyDownloads: 10, deprecated: 'gone', signaturesValid: false },
            now,
        );

        expect(result.failures).toHaveLength(3);
    });
});
