# 5-4-3-2-1 Grounding

A simple, mobile-friendly walk through the 5-4-3-2-1 sensory grounding method, intended to help
with anxiety, intrusive thoughts and OCD-related spirals: name 5 things you see, 4 you can touch,
3 you can hear, 2 you can smell and 1 you can taste.

## Run

```sh
npm run dev -w @lab/grounding-five
```

## Assumptions

- No persistence: the exercise is meant to be used in the moment and resets on reload. There is
  no history, reminders, or account.
- Fixed sense order (see, touch, hear, smell, taste) and fixed counts (5, 4, 3, 2, 1), matching
  the standard method. No customization in this first version.
- "Found one" is a manual tap per item rather than free-text input, since the exercise is about
  noticing, not data entry, and this is faster on mobile.
