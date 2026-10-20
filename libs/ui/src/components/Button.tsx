import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
};

export function Button({
    variant = 'primary',
    className = '',
    type = 'button',
    ...props
}: ButtonProps): React.JSX.Element {
    return (
        <button
            type={type}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
}
