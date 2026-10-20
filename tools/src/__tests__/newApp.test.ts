import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scaffoldApp } from '../newApp.ts';

function makeWorkspace(): { root: string; templateDir: string } {
    const root = mkdtempSync(join(tmpdir(), 'lab-newapp-'));
    const templateDir = join(root, 'template');
    mkdirSync(join(templateDir, 'src'), { recursive: true });
    writeFileSync(join(templateDir, 'package.json'), '{ "name": "__PACKAGE_NAME__" }');
    writeFileSync(join(templateDir, 'src', 'App.tsx'), '<h1>__APP_TITLE__</h1>');
    writeFileSync(join(templateDir, 'env.example'), '# env for __APP_TITLE__');
    return { root, templateDir };
}

describe('scaffoldApp', () => {
    it('copies the template into apps/<name> with placeholders replaced', () => {
        const { root, templateDir } = makeWorkspace();

        const created = scaffoldApp({ appName: 'budgetBuddy', root, templateDir });

        expect(created).toBe(join(root, 'apps', 'budgetBuddy'));
        expect(readFileSync(join(created, 'package.json'), 'utf8')).toBe(
            '{ "name": "@lab/budget-buddy" }',
        );
        expect(readFileSync(join(created, 'src', 'App.tsx'), 'utf8')).toBe('<h1>Budget Buddy</h1>');
        expect(existsSync(join(created, '.env.example'))).toBe(true);
    });

    it('refuses to overwrite an existing app', () => {
        const { root, templateDir } = makeWorkspace();
        scaffoldApp({ appName: 'budgetBuddy', root, templateDir });

        expect(() => scaffoldApp({ appName: 'budgetBuddy', root, templateDir })).toThrowError(
            /already exists/,
        );
    });

    it('rejects an invalid name without writing anything', () => {
        const { root, templateDir } = makeWorkspace();

        expect(() => scaffoldApp({ appName: 'Bad-Name', root, templateDir })).toThrowError(
            /camelCase/,
        );
        expect(existsSync(join(root, 'apps'))).toBe(false);
    });
});
