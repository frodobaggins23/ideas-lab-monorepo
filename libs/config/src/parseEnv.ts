import { z } from 'zod';

export function parseEnv<T extends z.ZodRawShape>(
    shape: T,
    source: Record<string, unknown>,
): z.infer<z.ZodObject<T>> {
    const result = z.object(shape).safeParse(source);
    if (result.success) {
        return result.data;
    }

    const problems = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
    throw new Error(`Invalid environment variables:\n${problems}`);
}
