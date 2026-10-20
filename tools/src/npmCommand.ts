// A plain `name`, `name@range` or `@scope/name[@range]` resolved from the npm registry.
export function isRegistrySpec(spec: string): boolean {
    return /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(@[^\s:/]+)?$/i.test(spec);
}
