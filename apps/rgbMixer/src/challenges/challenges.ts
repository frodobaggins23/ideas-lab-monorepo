import { ALL_KINDS, type CardKind, PRIMARY_KINDS } from '@/mixing/cards';
import type { Light } from '@/mixing/light';

export interface Challenge {
    id: string;
    target: Light;
    kinds: CardKind[];
    /** How many different card combinations must produce the target. */
    waysRequired: number;
    hint: string;
}

export const CHALLENGES: Challenge[] = [
    {
        id: 'yellow',
        target: { r: 100, g: 100, b: 0 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Yellow light has no blue in it.',
    },
    {
        id: 'cyan',
        target: { r: 0, g: 100, b: 100 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Cyan has no red in it.',
    },
    {
        id: 'magenta',
        target: { r: 100, g: 0, b: 100 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Magenta is the color with no green. It is not in the rainbow.',
    },
    {
        id: 'white',
        target: { r: 100, g: 100, b: 100 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'White light contains everything.',
    },
    {
        id: 'orange',
        target: { r: 100, g: 50, b: 0 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Orange sits between red and yellow. Dim one of the lights you use for yellow.',
    },
    {
        id: 'brown',
        target: { r: 50, g: 25, b: 0 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Brown is a dark orange. Make orange first, then dim both lights.',
    },
    {
        id: 'pink',
        target: { r: 100, g: 75, b: 75 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Pink is a pale red: full red plus a good amount of the other two.',
    },
    {
        id: 'violet',
        target: { r: 50, g: 0, b: 100 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Violet is blue with a little red.',
    },
    {
        id: 'teal',
        target: { r: 0, g: 50, b: 50 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Teal is a dark cyan.',
    },
    {
        id: 'olive',
        target: { r: 50, g: 50, b: 0 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Olive is a dark yellow.',
    },
    {
        id: 'gray',
        target: { r: 50, g: 50, b: 50 },
        kinds: PRIMARY_KINDS,
        waysRequired: 1,
        hint: 'Gray is a dim white.',
    },
    {
        id: 'white-ways',
        target: { r: 100, g: 100, b: 100 },
        kinds: ALL_KINDS,
        waysRequired: 3,
        hint: 'Yellow is red + green. Which light is it missing to become white?',
    },
    {
        id: 'gray-ways',
        target: { r: 50, g: 50, b: 50 },
        kinds: ALL_KINDS,
        waysRequired: 4,
        hint: 'Every way to make white also makes gray, with all its lights at half.',
    },
];
