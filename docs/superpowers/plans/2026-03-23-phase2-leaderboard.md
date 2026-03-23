# Phase 2: Score Submission + Daily Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed score submission and a daily leaderboard to the existing single-file game.

**Architecture:** All changes live in `index.html`. Supabase JS is loaded via CDN. Score is submitted automatically at game end via the existing `useEffect` that watches `totalPlayed`. The leaderboard is fetched by a new `useLeaderboard` hook and displayed in two places: the end-game modal (extended) and a standalone modal opened via a header trophy button.

**Tech Stack:** Supabase JS v2 (CDN), React 18 (CDN/Babel), existing single-file `index.html` with no build step.

> **Note on testing:** This project has no test framework. Verification steps use the browser console and Supabase dashboard instead of unit tests. Each task ends with a specific manual check that must pass before committing.

---

## Files

| File | Change |
|---|---|
| `index.html` | All code changes — CDN tag, constants, new hook, new function, state additions, UI additions |
| Supabase dashboard | Manual: create table, RLS policies, index (Task 1) |

---

### Task 1: Supabase project setup

**This is a manual setup task in the Supabase dashboard — no code changes.**

- [ ] **Step 1: Create a Supabase project**

  Go to https://supabase.com → New project. Choose a name (e.g. `mostly-ball`), set a strong DB password, pick the region closest to your users. Wait for provisioning (~2 min).

- [ ] **Step 2: Note your credentials**

  In the project dashboard → Settings → API. Copy and save:
  - `Project URL` (looks like `https://xxxxxxxxxxxx.supabase.co`)
  - `anon` / `public` key (long JWT string under "Project API keys")

  You will paste these into `index.html` in Task 2.

- [ ] **Step 3: Create the `scores` table**

  In Supabase → SQL Editor → New query. Paste and run:

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

  Expected: "Success. No rows returned."

- [ ] **Step 4: Enable RLS and add policies**

  In SQL Editor, run:

  ```sql
  ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "allow_insert" ON scores
    FOR INSERT TO anon
    WITH CHECK (true);

  CREATE POLICY "allow_select" ON scores
    FOR SELECT TO anon
    USING (true);

  CREATE POLICY "deny_update" ON scores
    FOR UPDATE TO anon
    USING (false);

  CREATE POLICY "deny_delete" ON scores
    FOR DELETE TO anon
    USING (false);
  ```

  Expected: "Success. No rows returned." (×4)

- [ ] **Step 5: Create the index**

  ```sql
  CREATE INDEX idx_scores_date ON scores (puzzle_date, correct DESC);
  ```

  Expected: "Success. No rows returned."

- [ ] **Step 6: Verify in Table Editor**

  Supabase → Table Editor → `scores`. Confirm the table exists with all columns.

---

### Task 2: Add Supabase CDN and client to `index.html`

**File:** `index.html`

- [ ] **Step 1: Add Supabase CDN script tag**

  In `index.html`, locate the existing CDN `<script>` tags in `<head>` (lines 9–11 — React, ReactDOM, Babel). Add Supabase **after** them:

  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  ```

  The head should now look like:
  ```html
  <script src="players.js"></script>
  <script src="puzzles.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  ```

- [ ] **Step 2: Add config constants and client instance**

  In `index.html`, locate the constants block near the top of the `<script type="text/babel">` block — specifically after the `GAME_URL` constant (line ~49) and before the `nc` helper. Add:

  ```js
  const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  ```

  Replace `YOUR-PROJECT-ID` and `YOUR-ANON-KEY` with the values saved in Task 1 Step 2.

- [ ] **Step 3: Verify client initializes**

  Open `index.html` in a browser. Open DevTools → Console. Run:

  ```js
  supabaseClient.from('scores').select('id').limit(1).then(r => console.log(r))
  ```

  Expected: `{ data: [], error: null, ... }` — an empty array (no scores yet) with no error.

  If you see an error like `relation "scores" does not exist`, RLS or the table wasn't created — go back to Task 1.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add Supabase CDN and client initialization"
  ```

---

### Task 3: Implement `submitScore()` function

**File:** `index.html` — script block, after the `usePlayerIdentity` hook definition (~line 149)

- [ ] **Step 1: Write the function**

  Add this after the closing `}` of `usePlayerIdentity`:

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

- [ ] **Step 2: Verify manually in browser console**

  Open `index.html` in a browser. In DevTools Console, run (replace the UUID with any UUID):

  ```js
  submitScore('11111111-1111-4111-a111-111111111111', 'TestPlayer', 10, '2026-03-23').then(() => console.log('done'))
  ```

  Expected: logs `done` with no visible error.

  Then check Supabase → Table Editor → `scores`. You should see a row with `player_name = 'TestPlayer'`, `correct = 10`.

- [ ] **Step 3: Verify duplicate is ignored**

  Run the same `submitScore` call again with the same token and date but `correct = 15`.

  Check Supabase — the row should still show `correct = 10` (first score wins).

- [ ] **Step 4: Verify the CHECK constraint rejects impossible scores**

  Run:
  ```js
  submitScore('11111111-1111-4111-a111-111111111111', 'TestPlayer', 99, '2026-03-23').then(() => console.log('done'))
  ```

  Expected: logs `done` with no visible error (error is swallowed silently). The Supabase dashboard should show no new row with `correct = 99`.

- [ ] **Step 5: Delete the test row**

  In Supabase → Table Editor → `scores`, delete the test row before continuing.

- [ ] **Step 6: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add submitScore() function"
  ```

---

### Task 4: Implement `useLeaderboard()` hook

**File:** `index.html` — script block, after `submitScore` function

- [ ] **Step 1: Write the hook**

  Add after `submitScore`:

  ```js
  function useLeaderboard(puzzleDate, playerToken, refreshKey) {
    const [entries, setEntries] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [playerRank, setPlayerRank] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(false);

      supabaseClient
        .from('scores')
        .select('player_token, player_name, correct', { count: 'exact' })
        .eq('puzzle_date', puzzleDate)
        .order('correct', { ascending: false })
        .limit(100)
        .then(({ data, count, error: err }) => {
          if (cancelled) return;
          if (err) { setError(true); setLoading(false); return; }
          const rows = (data || []).map((row, i) => ({ ...row, rank: i + 1 }));
          setEntries(rows);
          setTotalCount(count || 0);
          const myRow = rows.find(r => r.player_token === playerToken);
          setPlayerRank(myRow ? myRow.rank : null);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) { setError(true); setLoading(false); }
        });

      return () => { cancelled = true; };
    }, [puzzleDate, refreshKey]);

    return { entries, totalCount, playerRank, loading, error };
  }
  ```

- [ ] **Step 2: Verify the hook works**

  After adding the hook, open the browser, open DevTools → Console, and test a quick fetch against the live table:

  ```js
  supabaseClient.from('scores').select('player_token, player_name, correct', { count: 'exact' }).eq('puzzle_date', '2026-03-23').order('correct', { ascending: false }).limit(100).then(r => console.log(r))
  ```

  Expected: `{ data: [], count: 0, error: null }` (empty since we deleted the test row).

  The hook will be fully exercised in Task 5 when wired into the component.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add useLeaderboard() hook"
  ```

---

### Task 5: Wire score submission into game-end flow

**File:** `index.html` — `App` component (~lines 151–182)

- [ ] **Step 1: Add `token` to `usePlayerIdentity` destructuring**

  Find line 152:
  ```js
  const { nickname, showModal, saveNickname } = usePlayerIdentity();
  ```

  Change to:
  ```js
  const { token, nickname, showModal, saveNickname } = usePlayerIdentity();
  ```

  (`token` is already returned by the hook — it just wasn't destructured.)

- [ ] **Step 2: Add `refreshKey` state**

  Find the block of `useState` calls near the top of `App` (~lines 153–168). Add after the last one:

  ```js
  const [refreshKey, setRefreshKey] = useState(0);
  ```

- [ ] **Step 3: Add `useLeaderboard` call**

  Directly below the `refreshKey` line, add:

  ```js
  const { entries, totalCount, playerRank, loading: lbLoading, error: lbError } = useLeaderboard(_today, token, refreshKey);
  ```

- [ ] **Step 4: Wire `submitScore` and `setRefreshKey` into the game-end `useEffect`**

  Find lines 180–182:
  ```js
  useEffect(() => {
    if (totalPlayed === TOTAL_TILES) setTimeout(() => setShowEndGame(true), 600);
  }, [totalPlayed]);
  ```

  Replace with:
  ```js
  useEffect(() => {
    if (totalPlayed === TOTAL_TILES) {
      submitScore(token, nickname, correct, _today);
      setTimeout(() => setShowEndGame(true), 600);
      setRefreshKey(k => k + 1);
    }
  }, [totalPlayed]);
  ```

- [ ] **Step 5: Verify end-to-end submission**

  Open `index.html` in the browser. Play through all 16 tiles (or use browser console to force game end: this is a manual check — just play a few tiles and use the "End Game" button). Observe:

  1. End-game modal appears as before (no regression)
  2. Check Supabase → Table Editor → `scores` — your row should appear with your nickname, correct count, and today's date

- [ ] **Step 6: Commit**

  ```bash
  git add index.html
  git commit -m "feat: wire score submission into game-end flow"
  ```

---

### Task 6: Extend end-game modal with leaderboard section

**File:** `index.html` — end-game modal JSX (~lines 646–655, the action row at the bottom of the modal)

The leaderboard section goes **between the action buttons divider** (`{/* Action row */}`) and the closing `</div>` of the modal card. Specifically, insert it after the Copy Results / Play Again button row.

- [ ] **Step 1: Add the leaderboard section to the end-game modal**

  Find the action row (lines ~647–655):
  ```jsx
  {/* Action row: Keep Playing (conditional) | Copy Results | Play Again */}
  <div style={{ display: "flex", gap: 8 }}>
    ...buttons...
  </div>
  ```

  Directly **after** the closing `</div>` of the action row (and before the modal card's closing `</div>`), add:

  ```jsx
  {/* LEADERBOARD SECTION */}
  {!lbError && (
    <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,215,0,0.2)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#FFD700', fontFamily: "'Arial', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          🏆 Today's Leaderboard
        </div>
        {!lbLoading && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Arial', sans-serif" }}>
            {totalCount} {totalCount === 1 ? 'player' : 'players'}
          </div>
        )}
      </div>
      {lbLoading && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: "'Arial', sans-serif", padding: '12px 0' }}>
          Loading…
        </div>
      )}
      {!lbLoading && entries.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: "'Arial', sans-serif", padding: '8px 0' }}>
          No scores yet today
        </div>
      )}
      {!lbLoading && entries.length > 0 && (
        <div style={{ maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
          {entries.map((entry) => {
            const isMe = entry.player_token === token;
            return (
              <div key={entry.player_token} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: isMe ? 'rgba(255,215,0,0.10)' : 'transparent', border: isMe ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', fontFamily: "'Arial', sans-serif" }}>
                <span style={{ fontSize: 11, color: entry.rank <= 3 ? (['#FFD700','#C0C0C0','#CD7F32'][entry.rank - 1]) : 'rgba(255,255,255,0.4)', width: 18, textAlign: 'right', flexShrink: 0 }}>
                  {entry.rank}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: isMe ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.player_name}
                  {isMe && <span style={{ marginLeft: 5, fontSize: 9, background: '#FFD700', color: '#1B2A6B', padding: '1px 4px', borderRadius: 3, fontWeight: 900 }}>YOU</span>}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FFD700', flexShrink: 0 }}>
                  {entry.correct}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}
  ```

- [ ] **Step 2: Verify in browser**

  Open `index.html` and end a game. Confirm:
  1. Leaderboard section appears below the Copy Results button
  2. Your entry is highlighted with a gold tint and "YOU" badge
  3. Player count is shown (e.g., "1 player")
  4. If Supabase is unreachable, the section is hidden entirely (not broken)

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add leaderboard section to end-game modal"
  ```

---

### Task 7: Add header trophy button and standalone leaderboard modal

**File:** `index.html`

- [ ] **Step 1: Add `showLeaderboard` state**

  In the `App` component state block (near the other `useState` calls), add:

  ```js
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  ```

- [ ] **Step 2: Add Escape key handler for the leaderboard modal**

  Find the existing `useEffect` that handles Escape for the site notice popup (~line 195):
  ```js
  useEffect(() => {
    if (!showNotice) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowNotice(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showNotice]);
  ```

  Add a similar effect **directly after** it:
  ```js
  useEffect(() => {
    if (!showLeaderboard) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowLeaderboard(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showLeaderboard]);
  ```

- [ ] **Step 3: Add the trophy button to the header**

  Find the nickname pill block (~line 332) — it opens with:
  ```jsx
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, ...
  ```

  This entire pill `<div>` is a single inline-flex container. We need to wrap it and the new trophy button in a flex row. Wrap the existing pill and add the trophy button as a sibling. Change the structure from:

  ```jsx
  {/* existing pill */}
  <div style={{ position: 'relative', display: 'inline-flex', ... marginBottom: 14 ... }}>
    ...pill contents...
  </div>
  ```

  To:

  ```jsx
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <button
      onClick={() => setShowLeaderboard(true)}
      aria-label="View leaderboard"
      style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 8, color: '#FFD700', fontSize: 15, padding: '4px 9px', cursor: 'pointer', lineHeight: 1 }}>
      🏆
    </button>
    {/* existing pill — remove its marginBottom since the wrapper handles it */}
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,212,0,0.12)', border: '1px solid rgba(255,212,0,0.35)', borderRadius: 20, padding: '4px 10px 4px 12px', cursor: 'default' }}>
      ...exact existing pill contents unchanged...
    </div>
  </div>
  ```

  > **Important:** Only the wrapper `<div>` and the trophy `<button>` are new. The pill's inner contents are unchanged — copy them exactly from the current code.

- [ ] **Step 4: Add the standalone leaderboard modal**

  Find the SITE NOTICE POPUP block (~line 661). Add the leaderboard modal **directly before** it (still inside the main `return`):

  ```jsx
  {/* LEADERBOARD MODAL */}
  {showLeaderboard && (
    <div
      onClick={() => setShowLeaderboard(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 300 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Today's leaderboard"
        onClick={e => e.stopPropagation()}
        style={{ background: '#1B2A6B', border: '3px solid #FFD700', borderRadius: 14, padding: '24px 20px', maxWidth: 380, width: '100%', boxShadow: '6px 6px 0 rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial Black', sans-serif" }}>
            🏆 Today's Leaderboard
          </div>
          {!lbLoading && !lbError && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Arial', sans-serif" }}>
              {totalCount} {totalCount === 1 ? 'player' : 'players'}
            </div>
          )}
        </div>
        {lbLoading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '24px 0' }}>
            Loading…
          </div>
        )}
        {lbError && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '24px 0' }}>
            Leaderboard unavailable
          </div>
        )}
        {!lbLoading && !lbError && entries.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '16px 0' }}>
            No scores yet today
          </div>
        )}
        {!lbLoading && !lbError && entries.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {entries.map((entry) => {
              const isMe = entry.player_token === token;
              return (
                <div key={entry.player_token} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 5, marginBottom: 4, background: isMe ? 'rgba(255,215,0,0.10)' : 'transparent', border: isMe ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', fontFamily: "'Arial', sans-serif" }}>
                  <span style={{ fontSize: 12, color: entry.rank <= 3 ? (['#FFD700','#C0C0C0','#CD7F32'][entry.rank - 1]) : 'rgba(255,255,255,0.4)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                    {entry.rank}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: isMe ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.player_name}
                    {isMe && <span style={{ marginLeft: 6, fontSize: 9, background: '#FFD700', color: '#1B2A6B', padding: '1px 5px', borderRadius: 3, fontWeight: 900 }}>YOU</span>}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD700', flexShrink: 0 }}>
                    {entry.correct}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setShowLeaderboard(false)}
          style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 7, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', fontWeight: 700, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial', sans-serif" }}>
          Close
        </button>
      </div>
    </div>
  )}
  ```

- [ ] **Step 5: Verify in browser**

  Open `index.html`. Confirm:
  1. Trophy 🏆 button appears to the left of the nickname pill in the header
  2. Clicking it opens the leaderboard modal
  3. Clicking the backdrop or pressing Escape closes it
  4. The Close button closes it
  5. The modal shows your submitted score (from Task 5 testing) or "No scores yet today"
  6. The modal sits above the end-game modal when both are open (z-index 300 > 200) — test by opening the leaderboard while the end-game modal is visible

- [ ] **Step 6: Verify the full acceptance criteria checklist**

  Run through the spec's acceptance criteria one by one:
  - [ ] Score auto-submits at game end
  - [ ] `puzzle_date` comes from `_today` (not server)
  - [ ] Submitting twice same day → first score stands
  - [ ] Submission failure is silent
  - [ ] Leaderboard re-fetches after submission (`refreshKey` increments)
  - [ ] End-game modal: scrollable leaderboard with player count
  - [ ] Player row highlighted with "YOU" badge
  - [ ] Trophy button opens standalone modal anytime
  - [ ] Standalone modal: backdrop click + Escape + Close button all work
  - [ ] Standalone modal z-index 300 (above end-game modal at 200)
  - [ ] Leaderboard is today's scores only
  - [ ] Loading spinner shown while fetching
  - [ ] Fetch failure: section hidden (end-game) / "unavailable" text (standalone)
  - [ ] Zero scores: "No scores yet today" shown
  - [ ] No existing functionality broken (reset, nickname, copy results, rules, autocomplete all work)
  - [ ] All code in `index.html` — no new files

- [ ] **Step 7: Final commit**

  ```bash
  git add index.html
  git commit -m "feat: add trophy button and standalone leaderboard modal"
  ```

- [ ] **Step 8: Push to GitHub**

  ```bash
  git push https://lhefner4:YOUR-TOKEN@github.com/lhefner4/Mostly-Ball-s-V1.git main
  ```

  Wait ~60 seconds, then verify the live site at https://lhefner4.github.io/Mostly-Ball-s-V1/ — trophy button visible, leaderboard loads, score submits on game end.
