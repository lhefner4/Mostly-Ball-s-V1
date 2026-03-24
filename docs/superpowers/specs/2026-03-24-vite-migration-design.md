# Vite Migration Design Spec
**Date:** 2026-03-24
**Status:** Approved

## Context

The game's entire codebase lives in a single `index.html` (914 lines) using React + Babel via CDN with no build step. The `App()` component alone is ~710 lines. With leaderboard and player identity features actively being built, the monolith is becoming hard to navigate and extend. This migration moves the project to Vite to enable proper file splitting, real npm packages, and automated GitHub Actions deployment — while keeping the game functionally identical.

## Goals

- Enable file-level code splitting (components, hooks, utilities)
- Replace CDN-loaded React, Babel, and Supabase with proper npm packages
- Maintain automated deployment to GitHub Pages on every push to `main`
- Keep plain JavaScript (no TypeScript)
- Big bang migration — game downtime is acceptable, no incremental compatibility required

## File Structure

```
MOSTLY BALL/
├── index.html                      ← minimal Vite HTML shell (<div id="root">)
├── vite.config.js                  ← base path config for GitHub Pages
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml              ← auto-build + deploy on push to main
│
├── src/
│   ├── main.jsx                    ← ReactDOM.createRoot entry point
│   ├── App.jsx                     ← orchestrator: all game state, renders sub-components
│   │
│   ├── components/
│   │   ├── Header.jsx              ← retro banner, week badge, grid label, corner phrase
│   │   ├── Grid.jsx                ← 4×4 tile grid + column/row headers + autocomplete input
│   │   ├── ResultsScreen.jsx       ← end-game score, verdict, share button, leaderboard
│   │   ├── NicknameModal.jsx       ← first-time player identity setup modal
│   │   └── LeaderboardPanel.jsx    ← leaderboard table, rank, total count
│   │
│   ├── hooks/
│   │   ├── usePlayerIdentity.js    ← token generation, nickname state, modal control
│   │   └── useLeaderboard.js       ← Supabase leaderboard fetch, rank resolution
│   │
│   ├── utils/
│   │   ├── validate.js             ← validate(), nc(), buildRevealMap(), getVerdict()
│   │   ├── storage.js              ← lsGet(), lsSet()
│   │   └── puzzle.js               ← loadPuzzle(): resolves today's puzzle from PUZZLES
│   │
│   ├── data/
│   │   ├── players.js              ← moved from root; export default PLAYER_DB
│   │   └── puzzles.js              ← moved from root; export default PUZZLES
│   │
│   └── styles/
│       └── main.css                ← extracted from index.html <style> block
```

## Component Responsibilities

**`App.jsx`** — Orchestrator only. Holds all game state (`cells`, `used`, `active`, `inputVal`, `feedback`, game phase). Calls `loadPuzzle()` at top level. Passes data and handlers to sub-components as props. Imports and calls `usePlayerIdentity` and `useLeaderboard`.

**`Header.jsx`** — Receives `weekBadge`, `gridLabel`, `cornerPhrase` as props. Renders retro composite banner with radial overlay, badge, label.

**`Grid.jsx`** — Receives `cells`, `columns`, `rows`, `active`, `inputVal`, `onTileClick`, `onSubmit`, `onInputChange`. Renders 4×4 grid with column/row headers and the autocomplete input field.

**`ResultsScreen.jsx`** — Receives `correct`, `cells`, `nickname`, and leaderboard props. Renders end-game score, verdict message, share button, and leaderboard.

**`NicknameModal.jsx`** — Receives `onSave`, `error`. Renders the first-time nickname input overlay.

**`LeaderboardPanel.jsx`** — Receives `entries`, `playerRank`, `totalCount`, `loading`. Renders the leaderboard table with rank highlights.

## Hooks (unchanged logic, new files)

**`usePlayerIdentity.js`** — Generates UUID token, manages nickname in localStorage, controls modal visibility. Returns `{ token, nickname, showModal, saveNickname }`.

**`useLeaderboard.js`** — Fetches leaderboard from Supabase, resolves player rank. Returns `{ entries, totalCount, playerRank, loading, error }`.

## Data Files

`players.js` and `puzzles.js` move from root to `src/data/` and become ES modules:

```js
// players.js
export default [ /* ... */ ]

// puzzles.js
export default { /* ... */ }
```

**Important:** The `build-puzzle` skill currently writes `const PUZZLES = {...}` global syntax to `puzzles.js`. After migration, the write template must be updated to use `export default { ... }` instead.

## Utilities

**`validate.js`** — Exports `validate()`, `nc()`, `buildRevealMap()`, `getVerdict()`. Pure functions, no changes to logic.

**`storage.js`** — Exports `lsGet()`, `lsSet()`. Pure functions.

**`puzzle.js`** — Exports `loadPuzzle(puzzles)`. Resolves today's date (with `?date=` param and `ACTIVE_OVERRIDE` support), finds the matching puzzle entry, returns structured puzzle object. Replaces the inline `_puzzle` / `_today` loader block currently at the top of the script.

## Vite Config

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Mostly-Ball-s-V1/'
})
```

The `base` path must match the GitHub Pages repo name exactly, or all asset URLs will 404.

## GitHub Actions Deployment

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Pushes built `dist/` to a `gh-pages` branch. No secrets to configure — `GITHUB_TOKEN` is built-in.

**Post-migration GitHub setting:** In repo Settings → Pages, change source branch from `main` to `gh-pages`.

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

## Migration Sequence

1. `npm create vite@latest` scaffold into a temp folder; copy config files into project root
2. Install dependencies (`npm install`)
3. Extract `<style>` block → `src/styles/main.css`
4. Move `players.js`, `puzzles.js` → `src/data/`; convert to `export default`
5. Extract utilities → `src/utils/validate.js`, `storage.js`, `puzzle.js`
6. Extract hooks → `src/hooks/usePlayerIdentity.js`, `useLeaderboard.js`
7. Extract components → `src/components/` (Header, Grid, ResultsScreen, NicknameModal, LeaderboardPanel)
8. Build `App.jsx` as orchestrator importing all of the above
9. Write `src/main.jsx` entry point
10. Write minimal `index.html` shell
11. Write `vite.config.js`
12. Add `.github/workflows/deploy.yml`
13. Run `npm run dev` locally to verify game works
14. Commit, push to `main`, verify Actions deploy
15. Flip GitHub Pages source to `gh-pages` branch
16. Update `build-puzzle` skill write template for new `puzzles.js` export format

## Verification

- `npm run dev` — game loads locally, all 16 tiles interactive, autocomplete works
- Submit a correct answer — score updates, tile marks correct
- Play through all 16 tiles — results screen appears, score submits to Supabase
- Check leaderboard renders with player rank
- Push to `main` — GitHub Actions workflow passes, live URL updates within ~60 seconds
- Verify `?date=YYYY-MM-DD` param still works for puzzle date override
