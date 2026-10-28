import type { Ingredient } from '@/mixing/cards';

export interface ExampleGroup {
    id: string;
    title: string;
    description: string;
    recipes: Ingredient[][];
}

export const EXAMPLE_GROUPS: ExampleGroup[] = [
    {
        id: 'pairs',
        title: 'Two lights make a new color',
        description:
            'Overlap two full-brightness lights and you get the colors in between. All three together make white.',
        recipes: [
            [
                { kind: 'red', level: 100 },
                { kind: 'green', level: 100 },
            ],
            [
                { kind: 'green', level: 100 },
                { kind: 'blue', level: 100 },
            ],
            [
                { kind: 'red', level: 100 },
                { kind: 'blue', level: 100 },
            ],
            [
                { kind: 'red', level: 100 },
                { kind: 'green', level: 100 },
                { kind: 'blue', level: 100 },
            ],
        ],
    },
    {
        id: 'dimming',
        title: 'Dim a light to get more colors',
        description:
            'Turning a light down changes how much it adds. Unequal amounts give oranges, browns, pinks and more. Equal amounts of all three give grays.',
        recipes: [
            [
                { kind: 'red', level: 100 },
                { kind: 'green', level: 50 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 25 },
            ],
            [
                { kind: 'red', level: 100 },
                { kind: 'green', level: 75 },
                { kind: 'blue', level: 75 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'blue', level: 100 },
            ],
            [
                { kind: 'green', level: 50 },
                { kind: 'blue', level: 50 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 50 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 100 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 75 },
                { kind: 'blue', level: 100 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 50 },
                { kind: 'blue', level: 50 },
            ],
        ],
    },
    {
        id: 'white',
        title: 'Many ways to make white',
        description:
            'Cyan, magenta and yellow are lights that are already mixed (cyan is green + blue). Add the one primary each is missing and you get white again. Even all three mixed lights at half brightness add up to white.',
        recipes: [
            [
                { kind: 'red', level: 100 },
                { kind: 'green', level: 100 },
                { kind: 'blue', level: 100 },
            ],
            [
                { kind: 'red', level: 100 },
                { kind: 'cyan', level: 100 },
            ],
            [
                { kind: 'green', level: 100 },
                { kind: 'magenta', level: 100 },
            ],
            [
                { kind: 'blue', level: 100 },
                { kind: 'yellow', level: 100 },
            ],
            [
                { kind: 'cyan', level: 50 },
                { kind: 'magenta', level: 50 },
                { kind: 'yellow', level: 50 },
            ],
        ],
    },
    {
        id: 'gray',
        title: 'Many ways to make gray',
        description: 'Gray is a dim white, so every way to make white works at half brightness.',
        recipes: [
            [
                { kind: 'red', level: 50 },
                { kind: 'green', level: 50 },
                { kind: 'blue', level: 50 },
            ],
            [
                { kind: 'red', level: 50 },
                { kind: 'cyan', level: 50 },
            ],
            [
                { kind: 'green', level: 50 },
                { kind: 'magenta', level: 50 },
            ],
            [
                { kind: 'blue', level: 50 },
                { kind: 'yellow', level: 50 },
            ],
            [
                { kind: 'cyan', level: 25 },
                { kind: 'magenta', level: 25 },
                { kind: 'yellow', level: 25 },
            ],
        ],
    },
];
