import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { deriveAppNames } from './appNames.ts';

export interface ScaffoldAppInput {
    appName: string;
    root: string;
    templateDir: string;
}

function toTitle(appName: string): string {
    const spaced = appName.replace(/[A-Z]/g, (letter) => ` ${letter}`);
    return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}`;
}

export function scaffoldApp({ appName, root, templateDir }: ScaffoldAppInput): string {
    const names = deriveAppNames(appName);
    const targetDir = join(root, names.directory);
    if (existsSync(targetDir)) {
        throw new Error(`App "${appName}" already exists at ${names.directory}`);
    }

    const replacements: Record<string, string> = {
        __PACKAGE_NAME__: names.packageName,
        __APP_TITLE__: toTitle(appName),
    };

    const entries = readdirSync(templateDir, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
        // Real env files are never copied; the template for one is `env.example`.
        if (!entry.isFile() || entry.name.startsWith('.env')) {
            continue;
        }
        const sourcePath = join(entry.parentPath, entry.name);
        const relativePath = sourcePath.slice(templateDir.length + 1);
        const targetPath = join(targetDir, relativePath);

        let content = readFileSync(sourcePath, 'utf8');
        for (const [placeholder, value] of Object.entries(replacements)) {
            content = content.replaceAll(placeholder, value);
        }
        mkdirSync(dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, content);
    }
    return targetDir;
}

function main(): void {
    const appName = process.argv[2];
    if (!appName) {
        throw new Error('Usage: newApp.ts <appName>');
    }
    const toolsDir = join(dirname(fileURLToPath(import.meta.url)), '..');
    const root = join(toolsDir, '..');
    const created = scaffoldApp({
        appName,
        root,
        templateDir: join(toolsDir, 'templates', 'app'),
    });
    process.stdout.write(`Created ${created}\n`);

    // Registers the new workspace in package-lock.json, which Vercel's install requires. Run here
    // because agents may not call `npm install` directly (see `lab:add` in CLAUDE.md).
    execFileSync('npm', ['install'], { cwd: root, stdio: 'inherit' });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
    try {
        main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
