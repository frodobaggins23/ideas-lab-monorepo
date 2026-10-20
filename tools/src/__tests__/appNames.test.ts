import { describe, expect, it } from 'vitest';

import { deriveAppNames, parseGithubRepo } from '../appNames.ts';

describe('deriveAppNames', () => {
    it('derives folder, package, project and branch names from a camelCase name', () => {
        expect(deriveAppNames('budgetBuddy')).toEqual({
            folder: 'budgetBuddy',
            directory: 'apps/budgetBuddy',
            packageName: '@lab/budget-buddy',
            vercelProject: 'lab-budget-buddy',
            branch: 'feat/budgetBuddy',
        });
    });

    it('handles single words and digits', () => {
        expect(deriveAppNames('chess2Go').vercelProject).toBe('lab-chess2-go');
        expect(deriveAppNames('notes').vercelProject).toBe('lab-notes');
    });

    it.each(['BudgetBuddy', 'budget-buddy', 'budget_buddy', '1budget', '', 'a b'])(
        'rejects the invalid name %j',
        (name) => {
            expect(() => deriveAppNames(name)).toThrowError(/camelCase/);
        },
    );

    it('rejects names that would make the Vercel project name too long', () => {
        expect(() => deriveAppNames(`a${'b'.repeat(100)}`)).toThrowError(/too long/);
    });
});

describe('parseGithubRepo', () => {
    it.each([
        'git@github.com:owner/repo.git',
        'https://github.com/owner/repo.git',
        'https://github.com/owner/repo',
    ])('extracts owner/repo from %s', (remote) => {
        expect(parseGithubRepo(remote)).toBe('owner/repo');
    });

    it('rejects a remote that is not on GitHub', () => {
        expect(() => parseGithubRepo('git@gitlab.com:owner/repo.git')).toThrowError(/GitHub/);
    });
});
