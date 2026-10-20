import type { GroundingStep } from '@/types/groundingStep';

export const groundingSteps: readonly GroundingStep[] = [
    {
        id: 'see',
        sense: 'See',
        count: 5,
        instruction: 'Look around and name five things you can see',
        icon: '👀',
        gradient: 'from-sky-400 to-blue-500',
    },
    {
        id: 'touch',
        sense: 'Touch',
        count: 4,
        instruction: 'Notice four things you can feel or touch',
        icon: '✋',
        gradient: 'from-emerald-400 to-teal-500',
    },
    {
        id: 'hear',
        sense: 'Hear',
        count: 3,
        instruction: 'Listen for three things you can hear',
        icon: '👂',
        gradient: 'from-violet-400 to-purple-500',
    },
    {
        id: 'smell',
        sense: 'Smell',
        count: 2,
        instruction: 'Notice two things you can smell',
        icon: '👃',
        gradient: 'from-amber-400 to-orange-500',
    },
    {
        id: 'taste',
        sense: 'Taste',
        count: 1,
        instruction: 'Notice one thing you can taste',
        icon: '👅',
        gradient: 'from-rose-400 to-pink-500',
    },
];
