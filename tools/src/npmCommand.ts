const installSubcommands = new Set(['install', 'i', 'add']);
const flagsWithValue = new Set(['-w', '--workspace', '--prefix', '--registry']);

// Splits on unquoted shell separators (&&, ||, ;, |) and unquoted whitespace. Redirections
// (`> file`, `2>&1`, `&> file`, `< file`) are dropped together with their target.
function tokenizeSegments(command: string): string[][] {
    const segments: string[][] = [[]];
    let current = '';
    let quote: string | undefined;
    let skipNextToken = false;

    const endToken = (): void => {
        if (current && skipNextToken) {
            skipNextToken = false;
        } else if (current) {
            segments[segments.length - 1]?.push(current);
        }
        current = '';
    };

    for (let index = 0; index < command.length; index++) {
        const character = command.charAt(index);
        if (quote) {
            if (character === quote) {
                quote = undefined;
            } else {
                current += character;
            }
        } else if (character === '"' || character === "'") {
            quote = character;
        } else if (character === '>' || character === '<') {
            // A leading file descriptor number (`2>`) belongs to the redirection.
            if (/^\d+$/.test(current)) {
                current = '';
            } else {
                endToken();
            }
            while (command[index + 1] === '>' || command[index + 1] === '&') {
                index++;
            }
            skipNextToken = true;
        } else if (character === '&' && command[index + 1] === '>') {
            endToken();
        } else if (/\s/.test(character)) {
            endToken();
        } else if (character === ';' || character === '&' || character === '|') {
            endToken();
            skipNextToken = false;
            if (segments[segments.length - 1]?.length) {
                segments.push([]);
            }
        } else {
            current += character;
        }
    }
    endToken();
    return segments.filter((segment) => segment.length > 0);
}

export function extractInstallPackages(command: string): string[] {
    const packages: string[] = [];

    for (const [program, subcommand, ...rest] of tokenizeSegments(command)) {
        if (program !== 'npm' || !subcommand || !installSubcommands.has(subcommand)) {
            continue;
        }
        for (let index = 0; index < rest.length; index++) {
            const token = rest[index];
            if (token === undefined) {
                continue;
            }
            if (token.startsWith('-')) {
                if (flagsWithValue.has(token)) {
                    index++;
                }
                continue;
            }
            packages.push(token);
        }
    }
    return packages;
}

// A plain `name`, `name@range` or `@scope/name[@range]` resolved from the npm registry.
export function isRegistrySpec(spec: string): boolean {
    return /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(@[^\s:/]+)?$/i.test(spec);
}
