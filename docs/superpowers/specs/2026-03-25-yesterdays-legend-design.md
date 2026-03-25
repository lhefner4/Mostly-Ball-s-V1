# Yesterday's Biggest Baller — Design Spec
**Date:** 2026-03-25
**Project:** Do You Know Ball? (Mostly Ball)
**Feature:** Yesterday's Biggest Baller — persistent, date-driven leaderboard banner showing the prior day's top scorer

---

## Overview

Display a "Yesterday's Biggest Baller" banner at the top of the leaderboard panel, above today's leaderboard. The banner shows the prior day's top scorer (name, score, and puzzle label), sourced from the existing `scores` table filtered by `puzzle_date = yesterday`. If no data exists, the banner shows "No Ballers Yet." No schema changes are required.

---

## Architecture

A new `useYesterdaysLegend` hook queries the `scores` table for the prior day's winner. The result is passed as a `legend` prop to `LeaderboardPanel`, which renders the banner above the existing today's leaderboard. Credentials in `supabase.js` are migrated from hardcoded strings to Vite env vars.

### Why a separate hook
Follows the existing pattern (`useLeaderboard` handles today; `useYesterdaysLegend` handles yesterday). Single responsibility, independently testable, no coupling to today's fetch.

---

## Data Layer

### Environment Variables

`src/utils/supabase.js` is updated to use Vite env vars instead of hardcoded strings:

```js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
```

A `.env` file (not committed) and `.env.example` (committed) are added to the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### New Hook: `useYesterdaysLegend(puzzles)`

File: `src/hooks/useYesterdaysLegend.js`

Queries the `scores` table for `puzzle_date = yesterday`, ordered `correct DESC, submitted_at ASC`, limit 1. The puzzle's `gridLabel` is derived client-side by looking up yesterday's date string in the `puzzles` object passed as a parameter.

Returns:
```js
{
  legend: { player_name, correct, gridLabel } | null,
  loading,
  error
}
```

- `legend`: winner object, or `null` if no scores exist for yesterday
- `gridLabel`: the puzzle's label string (e.g., "GRID #3: THREE POINT LAND"), or `undefined` if yesterday's date is not in the `puzzles` object
- `loading`: boolean
- `error`: boolean — if `true`, banner is hidden entirely

### SQL Migration

No migration required. The existing schema fully supports this feature:

```sql
-- Composite index already present:
-- CREATE INDEX idx_scores_date ON scores (puzzle_date, correct DESC);

-- submitted_at column already present for tie-breaking:
-- submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- No new tables, columns, indexes, or RLS policies needed.
```

---

## Component Changes

### `LeaderboardPanel.jsx`

Receives one new prop: `legend` (object or `null`, from `useYesterdaysLegend`).

A banner is rendered at the very top of the panel, before the "Today's Leaderboard" heading:

**Layout:**
```
┌─────────────────────────────────┐
│  ⭐ YESTERDAY'S BIGGEST BALLER   │
│  GRID #4: FOUR BALLERS EVERYWHERE│  ← gridLabel (omitted if not found)
│  HoopDreams             16       │  ← player_name + correct
└─────────────────────────────────┘
│  🏆 Today's Leaderboard          │
│  ...                             │
```

**States:**
- `loading`: subtle loading indicator inside the banner
- `legend === null` (no data): shows "No Ballers Yet" inside the banner
- `error`: banner hidden entirely
- Normal: shows player name, score, and puzzle label

**Styling:** Navy background, gold border accent, same font family as the rest of the panel. Banner separated from the today's leaderboard section by a divider.

### `App.jsx`

- Calls `useYesterdaysLegend(PUZZLES)` alongside the existing `useLeaderboard` call
- Passes `legend` prop to `LeaderboardPanel`

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No scores for yesterday | Banner shows "No Ballers Yet" |
| Yesterday's date not in `PUZZLES` | `gridLabel` omitted; name + score still shown |
| Supabase fetch fails | Banner hidden entirely — silent |
| Tie on `correct` | Earliest `submitted_at` wins (handled by query order) |
| Env vars missing (local dev) | Supabase client fails to init — existing silent error handling covers it |

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/supabase.js` | Replace hardcoded credentials with `import.meta.env` vars |
| `src/hooks/useYesterdaysLegend.js` | New hook — queries yesterday's top scorer |
| `src/components/LeaderboardPanel.jsx` | Add `legend` prop and banner rendering |
| `src/App.jsx` | Call `useYesterdaysLegend`, pass `legend` to `LeaderboardPanel` |
| `.env.example` | New committed file — documents required env vars |
| `.env` | New uncommitted file — local credentials (added to `.gitignore`) |

**Nothing else in the game is modified.** No core game logic, no scoring system, no existing state beyond additions above.

---

## Acceptance Criteria

- [ ] "Yesterday's Biggest Baller" banner appears at the top of the leaderboard panel above today's leaderboard
- [ ] Banner shows winner's `player_name`, `correct` score, and puzzle `gridLabel`
- [ ] If `gridLabel` is not found for yesterday's date, name and score still render without it
- [ ] If no scores exist for yesterday, banner shows "No Ballers Yet"
- [ ] If the fetch fails, the banner is hidden entirely — no error shown
- [ ] Tie-breaking uses earliest `submitted_at`
- [ ] Supabase credentials read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars
- [ ] `.env.example` committed; `.env` not committed
- [ ] No existing leaderboard or game functionality is broken

---

## Out of Scope

- All-time or cumulative Hall of Fame
- Showing yesterday's full leaderboard (not just the winner)
- Score breakdown by row/column
- Real-time updates
- Edge Function / server-side validation
