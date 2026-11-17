# Camino Challenge

A kilometre challenge: walk the 770 km of the Camino Francés, from Roncesvalles to Santiago de
Compostela, as fast as you can, wherever you actually walk. Log the kilometres you walked and a
pilgrim moves along a map of the real route, past its main cities and landmarks.

- **Current round:** day of the challenge, kilometres walked and left, daily average, a projected
  finish date, a progress bar and the next stop on the route.
- **Map:** northern Spain with its coast, mountain ranges and regions, and the Camino Francés as a
  smooth trail with its cities (circles), landmarks (diamonds) and the goal (star). The walked part
  glows and a pilgrim marks the current position. Reaching a stop shows a short note about it.
- **Rounds:** after reaching Santiago, start a new round. Completed rounds are kept with their
  dates and number of days; the fastest one is marked as the record.
- Data is stored in `localStorage` in the browser only.

## Run

```sh
npm run dev -w @lab/camino-challenge
```

## Test

```sh
npm run test:run -w @lab/camino-challenge
```

Unit tests cover dates, round statistics and completion, entry validation, saved data, the
position on the route and the map projection. Components are not tested.

## Assumptions

- The UI is in Czech; the route is 770 km from Roncesvalles. Distances of the 25 stops are
  approximate (rounded guidebook stages, scaled so Santiago is at 770 km).
- Day 1 is the start day. A round is completed on the date of the entry that reaches 770 km, and
  its time is the number of days from the start to that date, both included.
- Only one round runs at a time; a new one can start after reaching Santiago. A running round can
  be abandoned (it is deleted, not kept in the history).
- Entries can be dated from the round start up to today, at most 150 km each. Entries of the
  current round can be deleted to fix mistakes; completed rounds are frozen once a new one starts.
- The map is a simplified projection of real coordinates with north-south distances stretched by
  1.7. The coastline and border are hand-simplified, mountains are decorative markers near the real
  ranges, and the trail is a smooth curve through the stops, not the real path.
