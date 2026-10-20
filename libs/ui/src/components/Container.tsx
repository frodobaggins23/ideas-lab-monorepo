import type { HTMLAttributes } from 'react';

export function Container({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>): React.JSX.Element {
    return <div className={`mx-auto w-full max-w-3xl px-4 py-8 ${className}`} {...props} />;
}
