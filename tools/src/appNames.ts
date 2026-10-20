const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
const maxVercelProjectNameLength = 100;

export interface AppNames {
    folder: string;
    directory: string;
    packageName: string;
    vercelProject: string;
    branch: string;
}

export function deriveAppNames(name: string): AppNames {
    if (!camelCasePattern.test(name)) {
        throw new Error(
            `App name "${name}" must be camelCase (letters and digits, e.g. budgetBuddy)`,
        );
    }
    const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const vercelProject = `lab-${kebab}`;
    if (vercelProject.length > maxVercelProjectNameLength) {
        throw new Error(`App name "${name}" is too long for a Vercel project name`);
    }
    return {
        folder: name,
        directory: `apps/${name}`,
        packageName: `@lab/${kebab}`,
        vercelProject,
        branch: `feat/${name}`,
    };
}

export function parseGithubRepo(remoteUrl: string): string {
    const match = /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?$/.exec(remoteUrl.trim());
    if (!match?.[1]) {
        throw new Error(`Remote "${remoteUrl}" is not a GitHub repository`);
    }
    return match[1];
}
