# Ground Now

A calm, mobile-first guide through the 5-4-3-2-1 grounding technique, built for moments of OCD
flare-ups, panic or racing thoughts. Open it, tap through five senses and return to the present.

## Run

```sh
npm run dev -w @lab/ground-now
```

Tests: `npm run test:run -w @lab/ground-now`.

## Assumptions

- Self-paced: one tap per sense confirms it. The circles then fill with colour for about 3 seconds
  before "Next" appears, so the pause itself does the grounding. Nothing is typed or sent anywhere.
- One tap and no verification, so the exercise cannot become a perfection or checking ritual.
- Czech and English via i18next, react-i18next and i18next-browser-languagedetector. Texts live in
  `src/i18n/locales/*.json`; Czech plural forms are handled by i18next. The language comes from the
  saved choice, else the browser language (`cs*` is Czech, anything else English). The EN/CS
  switch stores the choice in `localStorage`. Czech texts were written by the assistant, not a
  native reviewer.
- Respects `prefers-reduced-motion`: circles appear filled and "Next" shows at once.
- Not a medical tool and no crisis resources are bundled; the final screen only suggests reaching out
  to a therapist.
