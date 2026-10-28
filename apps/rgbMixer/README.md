# RGB Mixer

Learn how red, green and blue light mix into other colors. Drag light cards on a board, overlap
them and see the mixed color, then practise with challenges such as "make brown" or "make white
in 3 different ways".

- **Learn:** a playground board plus worked examples (pairs, dimmed lights, many ways to white and
  gray). "Try it" loads an example onto the board.
- **Challenges:** 13 targets, from yellow to "make gray in 4 ways". Progress is kept in
  `localStorage`.

## Run

```sh
npm run dev -w @lab/rgb-mixer
```

## Test

```sh
npm run test:run -w @lab/rgb-mixer
```

Unit tests cover the mixing math, overlap detection, challenge solvability and saved progress.
Components are not tested.

## Assumptions

- Mixing is additive (light on a black board), not paint.
- Each card has a brightness of 25, 50, 75 or 100 %. Colors such as brown or pink need it.
- A match must be exact and use at least two cards.
- "Multiple ways" uses optional cyan, magenta and yellow cards, which are lights already mixed
  from two primaries (white = R + G + B = R + C = G + M = B + Y = C + M + Y at 50 %). A way is a
  distinct set of cards.
- Cards are squares so overlaps can be computed exactly; the same logic draws the board and
  checks challenges.
