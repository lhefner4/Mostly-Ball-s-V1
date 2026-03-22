# Daily Puzzle System — Design Spec
**Date:** 2026-03-22
**Project:** Do You Know Ball? (Mostly Immaculate Grid)

---

## Overview

Add a daily puzzle rotation to the existing immaculate grid game. Each day a new puzzle loads automatically based on the current date. Puzzles share a weekly theme but vary in teams (columns), row categories, and answer pools each day. If no puzzle exists for today, the most recent available puzzle is shown.

---

## Data Structure — `puzzles.js`

A new file `puzzles.js` lives alongside `players.js` in the project root. It exports a single global object `PUZZLES` keyed by date strings in `"YYYY-MM-DD"` format. Each entry contains everything that varies per day.

```js
const PUZZLES = {
  "2026-03-22": {
    weekTheme: "WEEK 1: THIS IS MARCH!",
    columns: [
      { name: "Duke",      nickname: "Blue Devils", color: "#00539B", border: "#1a7fd4" },
      { name: "UConn",     nickname: "Huskies",     color: "#000E2F", border: "#1a3a88" },
      { name: "Villanova", nickname: "Wildcats",    color: "#003366", border: "#1a5599" },
      { name: "UNC",       nickname: "Tar Heels",   color: "#4B9CD3", border: "#7bbde8" },
    ],
    rows: [
      { name: "Ball Hog",     desc: "Led team in scoring during a Tournament run" },
      { name: "Clutch Balls", desc: "Hit a game-winning shot in March Madness" },
      { name: "Ball Knower",  desc: "Became a broadcaster, analyst, or major media figure" },
      { name: "Ball & Chain", desc: "Won a national championship in their 4th year or more" },
    ],
    answerPool: {
      "0-0": ["Christian Laettner", "J.J. Redick", /* ... */],
      "0-1": ["Kemba Walker", /* ... */],
      // all 16 cells ("row-col" format, 0-indexed)
    }
  },
  "2026-03-23": {
    weekTheme: "WEEK 1: THIS IS MARCH!",
    columns: [ /* different teams */ ],
    rows: [ /* different categories */ ],
    answerPool: { /* 16 cells */ }
  }
};
```

**Adding a new day:** Add a new date-keyed entry to `puzzles.js` and push to GitHub. No changes to `index.html` needed.

**Weekly theme:** All puzzles in a given week share the same `weekTheme` string. This controls the week badge text in the header. A new week = update `weekTheme` in new entries.

---

## Puzzle Loading Logic

Added to `index.html` near the top of the React app, before any component renders:

1. Get today's date as `"YYYY-MM-DD"` using the user's local clock
2. Look up `PUZZLES[today]`
3. If not found, scan all keys in `PUZZLES`, filter to those ≤ today, sort descending, take the first (most recent)
4. Extract `columns`, `rows`, `answerPool`, `weekTheme` from the selected puzzle
5. Use these in place of the current hardcoded constants

---

## Changes to `index.html`

**Add (1 line):** `<script src="puzzles.js"></script>` after the existing `<script src="players.js"></script>`

**Add (~10 lines):** Puzzle-loading function that runs before the React app initializes, sets the active puzzle based on today's date

**Remove:** Hardcoded `COLUMNS`, `ROWS`, `ANSWER_POOL` constants — these move into `puzzles.js` as the `"2026-03-22"` entry

**Update:** The week badge text currently hardcoded as `"WEEK 1: THIS IS MARCH!"` — wire it to `weekTheme` from the loaded puzzle

---

## What Stays the Same

- All game logic: `validate()`, `buildRevealMap()`, `nc()` normalizer
- All UI components and layout
- All styling and theme colors
- Autocomplete (still uses `PLAYER_DB` from `players.js`)
- Results screen, scoring, and share functionality
- Fallback: `ALL_PLAYERS` already handles missing `PLAYER_DB` gracefully

---

## Out of Scope (future work)

- **Replay prevention:** Tracking per-date completion in localStorage ("you already played today") — natural next feature, deliberately excluded to keep this build simple
- **Player database with metadata:** Auto-computing answer pools from tagged player records — excluded in favor of manual curation for correctness

---

## Migration Plan

The current Duke/UConn/Villanova/UNC puzzle becomes the first entry in `puzzles.js` dated `"2026-03-22"`. Its data is cut from `index.html` and pasted into the new file. The game behavior on day one is identical to today.
