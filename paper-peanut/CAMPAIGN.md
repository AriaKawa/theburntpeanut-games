# Paper Peanut campaign

The static site still runs directly from the repository root, with no build step.

- Chapter 1: the original three depot encounters, with encounter title cards.
- Chapter 2: four market encounters ending with the Market Regent.
- Chapter 3: four cathedral encounters ending with the Pipe Warden.
- The Trickster feints, the Courier attacks twice, and the Cantor fires a slow note. The Regent adds a second strike at half health; the Warden changes from a slow note to a slow/fast pair. Visible intent labels explain each pattern. New-chapter wind-ups cycle through 420, 740, and 1050 ms.
- All attacks still resolve against alpha-mask contact. The screen-reader motion cue announces the final 70 ms of travel; it does not control collision or damage.
- Each completed chapter earns eight scrap. The three special unlocks cost 18 total; two permanent damage tiers for each of four specials cost another 60, for 78 scrap total (ten complete chapter runs).
- The existing `paper-peanut-profile-v1` storage key now holds version 2 data. Version 1 saves retain scrap, clears, runs, purchases, equipped special, and best score. A previous completed run unlocks Chapter 2 and becomes Chapter 1's best. New data stores chapter unlocks, three best scores, and special tiers.

The upstream contact/entrance/liquid-goop changes from `5cfb999` and scrapbook styling from `08c2a61` were ported after fetching the source repository. Existing showcase navigation and detailed help text were retained. The two stitched menu textures were converted from PNG to WebP.

New artwork was generated with the built-in image generator. The complete prompt set is in `assets/campaign-art-prompts.json`; all seven delivered assets are WebP files in that directory. Backdrops are 301,396 and 308,308 bytes. Character assets retain transparency.

## Verification

`node tests/paper-peanut-model.mjs` checks migration, chapter unlocks and bests, reward idempotence, Arsenal costs and tiers, and contact-window boundaries.

`tests/paper-peanut-browser.cjs` serves the repository root on localhost:5268 and uses Playwright/Edge to play all chapters using keys 1–3 and Space when the accessible motion text contains “about to.” It records console/page errors and captures chapter/boss screenshots at 1280×860, 390×844, and 844×390.

While that server is running, the other browser checks cover:

- `paper-peanut-accessibility.cjs`: version 1 save, Cozy synchronization, Escape pause, touch timing, reduced motion, and defeat without contact inputs. A completely idle turn correctly waits for a move; the defeat test selects Jump but never blocks.
- `paper-peanut-ui.cjs`: all menu sizes, title card, arrow targeting, Enter timing, Pause, and asset failure/retry.
- `paper-peanut-scenes.cjs`: test-only module instrumentation selects real boss encounters and half-health phases, then checks every block at each viewport. It does not ship a debug API in the game.

Browser scripts use the installed Codex runtime's Playwright package and system Edge. Screenshots and reports are in `tests/artifacts/paper-peanut/`.

Validation completed: the full eleven-fight campaign cleared in 527.7 seconds with 20 HP remaining at the end of each chapter, scores of 980 / 1,990 / 2,270, 24 earned scrap, and no browser console or page errors. Both bosses' second-phase attacks were also blocked perfectly at all three viewport sizes. Final scene screenshots are in `tests/artifacts/paper-peanut/final-layout/`. Save migration, touch/reduced-motion controls, no-block defeat, and asset retry checks passed. Log review also corrected the Warden's phase-one intent label to accurately say “Slow drifting note.”
