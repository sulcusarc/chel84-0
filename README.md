# Chel 84-0

Spin a decade and a franchise, draft a starting six, simulate 84 games. Can you go 84-0?

Live at https://chel84-0.com. Vite + React + TypeScript, deployed on Vercel (every push to `main` goes live).

- `src/core/core.js` — the game engine and the real-data player pool (plain JavaScript, shared with the tuning scripts).
- `src/lib/` — game helpers, the in-progress session, preferences (theme, sound), routing.
- `src/screens/` — Home, Draft, Sim, Results / Cap Cup verdict, Leaderboard, How it works / About.
- `src/components/` — header + menu, modals, jerseys, rinks.
- `public/assets/` — logo, boards banner, mode cards.

Run locally: `npm install`, then `npm run dev`.
