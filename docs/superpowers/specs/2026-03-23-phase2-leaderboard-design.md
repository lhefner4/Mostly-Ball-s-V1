# Phase 2: Score Submission + Daily Leaderboard — Design Spec
**Date:** 2026-03-23
**Project:** Do You Know Ball? (Mostly Ball)
**Phase:** 2 — Backend integration (Supabase), score submission, daily leaderboard

---

## Overview

Extend the existing local player identity system (Phase 1) with a Supabase backend. Each player's score is automatically submitted when the game ends. A daily leaderboard shows how all players ranked on today's puzzle — accessible from the end-game modal and from a trophy button in the header at any time.

---

## Architecture

### Approach

Load `@supabase/supabase-js` via CDN. Submit scores and fetch the leaderboard directly from the browser using Supabase's anon key. All new code lives in `index.html` — no new files, no build step. The existing `usePlayerIdentity` hook is unchanged; the new Supabase client and hooks sit alongside it.

### Why Direct Client (No Edge Function)

Score validation at the database level (CHECK constraint) is sufficient for a casual game. Server-side validation via an Edge Function would add deployment complexity without meaningful security benefit — the risk of a player cheating their score on a friends' leaderboard is low-stakes.

---

## Supabase Setup

### Table: `scores`

```sql
CREATE TABLE scores (
  id            BIGSERIAL PRIMARY KEY,
  player_token  UUID        NOT NULL,
  player_name   TEXT        NOT NULL,
  correct       SMALLINT    NOT NULL CHECK (correct >= 0 AND correct <= 16),
  puzzle_date   DATE        NOT NULL,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_player_per_day UNIQUE (player_token, puzzle_date)
);
```

Note: `puzzle_date` has no server-side default — it is always passed explicitly from the client using the resolved `_today` value (see Score Submission Flow). This ensures the correct puzzle date is used even when the server's timezone differs from the player's local date.

### Row Level Security

RLS must be enabled on the `scores` table. The following four policies apply to the `anon` role:

```sql
-- Allow any user to submit a score
CREATE POLICY "allow_insert" ON scores
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anyone to read the leaderboard
CREATE POLICY "allow_select" ON scores
  FOR SELECT TO anon
  USING (true);

-- Deny updates
CREATE POLICY "deny_update" ON scores
  FOR UPDATE TO anon
  USING (false);

-- Deny deletes
CREATE POLICY "deny_delete" ON scores
  FOR DELETE TO anon
  USING (false);
```

### Index

```sql
CREATE INDEX idx_scores_date ON scores (puzzle_date, correct DESC);
```

Supports efficient leaderboard queries filtered by date, sorted by score.

---

## Data Layer

### Config Constants

Added near the top of the script block alongside existing constants (`GAME_URL`, etc.):

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### `submitScore(token, name, correct, puzzleDate)`

Standalone async function. Called once when the game ends. `puzzleDate` is the resolved `_today` value already computed at the top of the script (accounts for URL param overrides). Uses `upsert` with `onConflict: 'player_token,puzzle_date'` and `ignoreDuplicates: true` — if the same player submits twice on the same day, the first score stands and the second call is silently ignored. All errors are swallowed silently — submission failure does not affect game flow.

```js
async function submitScore(token, name, correct, puzzleDate) {
  try {
    await supabaseClient
      .from('scores')
      .upsert(
        { player_token: token, player_name: name, correct, puzzle_date: puzzleDate },
        { onConflict: 'player_token,puzzle_date', ignoreDuplicates: true }
      );
  } catch (e) { /* silent */ }
}
```

### `useLeaderboard(puzzleDate, playerToken, refreshKey)`

React hook. `refreshKey` is a numeric counter; incrementing it triggers a re-fetch. Fetches today's scores sorted by `correct DESC`, limited to top 100. Returns:

```js
{ entries: [{ player_name, correct, rank }], totalCount, playerRank, loading, error }
```

- `entries`: array of top scores; `rank` is assigned sequentially (1, 2, 3…) in sort order — ties are not collapsed
- `playerRank`: the current player's rank (1-based), or `null` if their token isn't in the results
- `totalCount`: total number of players who submitted today (shown as "N players")
- `loading`: boolean, true while fetching
- `error`: boolean, true if the fetch failed — the component hides the leaderboard section when `error` is true

The hook runs a `useEffect` on `[puzzleDate, refreshKey]`. When `refreshKey` changes, the effect re-runs and re-fetches. It does not re-fetch on modal open/close.

**Rendering rules for the leaderboard section:**
- `loading && !error`: show spinner
- `!loading && error`: hide section entirely (no error message shown)
- `!loading && !error && entries.length === 0`: show "No scores yet today"
- `!loading && !error && entries.length > 0`: show leaderboard table

---

## Score Submission Flow

Game end is detected by an existing `useEffect` that watches `totalPlayed === TOTAL_TILES`. The submission is wired into that same effect. No separate "game-end handler" exists — submission is added to the existing effect:

```js
useEffect(() => {
  if (totalPlayed === TOTAL_TILES) {
    submitScore(token, nickname, correct, _today); // new line
    setTimeout(() => setShowEndGame(true), 600);   // existing line
    setRefreshKey(k => k + 1);                     // new line — triggers leaderboard re-fetch
  }
}, [totalPlayed]);
```

`token` must be added to the destructured return of `usePlayerIdentity()` in the `App` component (currently only `nickname`, `showModal`, and `saveNickname` are destructured). `_today` is the resolved puzzle date constant already available at the top of the script block.

`setRefreshKey` increments the `refreshKey` state variable (initialized to `0`), which is passed to `useLeaderboard` and triggers a re-fetch after submission. This is the only mechanism that triggers a re-fetch — the hook does not re-fetch on modal open/close.

---

## UI

### Header Trophy Button

A `🏆` icon button added to the right of the existing nickname pill. Toggles a `showLeaderboard` boolean state (`useState(false)`). Same style as the gear button — gold, unobtrusive.

```
[DO YOU KNOW BALL?]          [🏆] [LucasH ⚙]
```

Clicking `🏆` opens the standalone leaderboard modal (see below).

### Standalone Leaderboard Modal

Opens when the trophy button is clicked during play (before game ends). Full-viewport backdrop, centered navy card — same pattern as the nickname modal. **z-index: 300** (above the end-game modal at 200, below the site notice popup at 1000). Shows today's leaderboard in the same scrollable format as the end-game modal. Includes a player count ("247 players"). Player's own entry is highlighted. Closeable via backdrop click or Escape key.

### End-Game Modal (Extended)

The existing end-game results modal is extended with a leaderboard section below the Copy Results button:

```
┌─────────────────────────────┐
│       Today's Results        │
│         12 / 16              │
│   [📋 Copy Results]          │
│ ─────────────────────────── │
│ 🏆 Today's Leaderboard       │
│                 (247 players)│
│  1  HoopDreams          16  │
│  2  BallKnower99        15  │
│  3  CoachK_Fan          14  │
│  4  SportsGuy88         13  │
│ ▶5  You                 12  │  ← player row highlighted
│  6  NetBaller           11  │
│  7  Duke4Ever           10  │
│      [scrollable]            │
└─────────────────────────────┘
```

- Max height with `overflow-y: auto` so the modal doesn't grow unbounded
- Player's own row is highlighted (gold-tinted background, "YOU" badge)
- Shows player count in subtitle
- Loading state: spinner shown while fetching
- If leaderboard fetch fails (`error === true`): section is hidden entirely, no error shown to player
- If no scores yet (`entries.length === 0`): shows "No scores yet today"

---

## Integration Points in `index.html`

| What | Location | Change type |
|---|---|---|
| Supabase CDN `<script>` | `<head>` | New addition |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `supabaseClient` | Top of script block, constants section | New addition |
| `submitScore()` function | Script block, after hook definitions | New addition |
| `useLeaderboard()` hook | Script block, after `usePlayerIdentity` | New addition |
| `token` added to `usePlayerIdentity()` destructuring | Top of `App` component | Minimal modification |
| `refreshKey` state + `setRefreshKey` | Top of `App` component state | New addition |
| `useLeaderboard(puzzleDate, token, refreshKey)` call | Top of `App` component | New addition |
| `submitScore()` + `setRefreshKey` call | Existing `useEffect` watching `totalPlayed` | Minimal modification |
| Trophy button `🏆` | Header, right of nickname pill | New addition |
| `showLeaderboard` state | `App` component state | New addition |
| Standalone leaderboard modal (z-index 300) | `App` component return | New addition |
| End-game modal leaderboard section | Existing end-game modal | Extension |

**Nothing else in the game is modified.** No core game logic, no scoring system, no existing state beyond additions above.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Score submission fails (network) | Silent — game unaffected, player won't appear on leaderboard |
| Score submitted twice same day | Silent — first score stands (upsert ignoreDuplicates) |
| Leaderboard fetch fails | `error = true` — section hidden in modal; no error shown |
| Leaderboard loading | `loading = true` — spinner shown |
| No scores yet today | `entries.length === 0` — "No scores yet today" shown |
| Supabase completely down | Game functions normally; leaderboard section absent |

---

## Acceptance Criteria

- [ ] Score is automatically submitted at game end with no player action required
- [ ] `puzzle_date` is passed explicitly from the client (not derived from server `CURRENT_DATE`)
- [ ] Submitting the same player_token twice on the same day results in one entry (first score wins)
- [ ] Score submission failure is silent — game flow unaffected
- [ ] Leaderboard re-fetches after submission via `refreshKey` increment
- [ ] End-game modal shows a scrollable leaderboard with player count below Copy Results button
- [ ] Player's own row is visually highlighted with rank position and "YOU" badge
- [ ] Trophy button `🏆` in header opens a standalone leaderboard modal at any time
- [ ] Standalone leaderboard modal is closeable via backdrop click or Escape key
- [ ] Standalone leaderboard modal has z-index 300 (above end-game modal, below site notice)
- [ ] Leaderboard shows today's scores only (resets daily)
- [ ] Player count ("N players") is shown
- [ ] Loading state (spinner) shown while leaderboard fetches
- [ ] If leaderboard fetch fails, section is hidden — no error shown
- [ ] If no scores yet today, "No scores yet today" is shown
- [ ] No existing game functionality is broken
- [ ] All new code lives in `index.html` — no new files

---

## Out of Scope

- All-time / cumulative leaderboards
- Per-puzzle historical leaderboards
- Cross-device identity sync
- Optional or required account creation
- Score breakdown by category (row/column performance)
- Real-time leaderboard updates (polling or subscriptions)
