export interface Sense {
    id: 'see' | 'touch' | 'hear' | 'smell' | 'taste';
    count: number;
    /** Full Tailwind classes, kept literal so the compiler can see them. */
    background: string;
    accent: string;
    dotFilled: string;
}

export const SENSES: readonly Sense[] = [
    {
        id: 'see',
        count: 5,
        background: 'from-sky-100 via-indigo-100 to-violet-200',
        accent: 'text-indigo-700',
        dotFilled: 'bg-indigo-500 border-indigo-500',
    },
    {
        id: 'touch',
        count: 4,
        background: 'from-amber-100 via-orange-100 to-rose-200',
        accent: 'text-orange-700',
        dotFilled: 'bg-orange-500 border-orange-500',
    },
    {
        id: 'hear',
        count: 3,
        background: 'from-emerald-100 via-teal-100 to-cyan-200',
        accent: 'text-teal-700',
        dotFilled: 'bg-teal-500 border-teal-500',
    },
    {
        id: 'smell',
        count: 2,
        background: 'from-fuchsia-100 via-pink-100 to-rose-200',
        accent: 'text-pink-700',
        dotFilled: 'bg-pink-500 border-pink-500',
    },
    {
        id: 'taste',
        count: 1,
        background: 'from-lime-100 via-yellow-100 to-amber-200',
        accent: 'text-lime-800',
        dotFilled: 'bg-lime-600 border-lime-600',
    },
];

export function getSense(index: number): Sense {
    const sense = SENSES[index];
    if (!sense) throw new Error(`Unknown sense index: ${index}`);
    return sense;
}
