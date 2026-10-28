import { type Light, toCssColor } from '@/mixing/light';

interface SwatchProps {
    light: Light;
    className?: string;
}

export function Swatch({ light, className = '' }: SwatchProps): React.JSX.Element {
    return (
        <span
            aria-hidden="true"
            className={`inline-block shrink-0 rounded border border-white/25 ${className}`}
            style={{ backgroundColor: toCssColor(light) }}
        />
    );
}
