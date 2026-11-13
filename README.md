# Casino Demon

Frontend-only retro arcade roulette. Credits are fictional and have no monetary value. There is no backend, account service, or payment flow.

The developer screen is a **simulated** gate for local test controls. It is not production security. The password ships in the client bundle. Do not reuse it anywhere real.

## Run

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run test:e2e
```

`npm run dev` serves the Vite app. End-to-end tests read the URL from `DEV_SERVER.txt` when `BASE_URL` is not set. `npm run test:e2e` expects Playwright browsers to be installed (`npx playwright install`).

## Proposed defaults

These are the rules this build uses. They are game settings, not a claim that the simulator is fair in any regulated sense, and not a promise that the build is bug-free.

- European wheel, pockets 0–36. Green is 0. Red is 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36. Every other pocket from 1–36 is black. Color is derived from the pocket.
- Starting balance: **10,000 fictional credits**.
- Wagers are whole credits, from **1** to **100,000**, and cannot exceed the balance.
- A red or black win returns **2× the stake** (the stake plus an equal profit). Pocket 0 loses color bets.
- A straight number win returns **5× the stake**. That 5× figure is the total return, not extra profit on top of the stake.
- Load credits adds a whole number from **1** to **1,000,000** per action. The balance cap for loads is **9,999,999**. A load that would pass the cap adds only the room left. A load at the cap is rejected.
- VIP changes the win presentation only. It does not change odds or payouts.
- Normal play draws a uniform integer from 0 through 36. Test overrides are ignored unless test mode is on.
- Test mode is off by default. Turning it on and applying it forces outcomes and is meant to be labeled in the UI. The house-edge control is a test-only bias (default 2, clamped 0–15) and does nothing while test mode is off.

## Developer gate

Username `developer`, password `casino`. Only the boolean `devAuthenticated` is stored. The password is not persisted.

## Save file

`localStorage` key `casino-demon:v1` stores balance, VIP, the last 40 real rounds, test settings, the rig counter, the developer flag, and a spin that has not paid out yet. Demo ticker text, draft edits, and passwords are not stored. Corrupt JSON or a different version resets to the defaults above instead of crashing.

A reload during a spin applies that spin's payout once and lands on the result. It does not start another spin.
