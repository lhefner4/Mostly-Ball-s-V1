# Yesterday's Biggest Baller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Yesterday's Biggest Baller" banner to the top of the leaderboard panel showing the prior day's top scorer (name, score, puzzle label), with a "No Ballers Yet" fallback when no data exists.

**Architecture:** A new `useYesterdaysLegend(puzzles)` hook queries Supabase for yesterday's top scorer and passes a `legend` object to `LeaderboardPanel` as a new prop. The banner renders above the existing today's leaderboard. Supabase credentials are simultaneously migrated from hardcoded strings to Vite env vars.

**Tech Stack:** React 18, Vite 5, @supabase/supabase-js v2, Vitest + @testing-library/react (added in Task 2)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `.gitignore` | Modify | Add `.env` entry |
| `.env.example` | Create | Document required env vars |
| `.env` | Create (not committed) | Local Supabase credentials |
| `src/utils/supabase.js` | Modify | Use `import.meta.env` instead of hardcoded strings |
| `vite.config.js` | Modify | Add Vitest config |
| `package.json` | Modify | Add `test` script and Vitest deps |
| `src/hooks/useYesterdaysLegend.js` | Create | Hook — queries yesterday's top scorer from Supabase |
| `src/hooks/useYesterdaysLegend.test.js` | Create | Unit tests for the hook |
| `src/components/LeaderboardPanel.jsx` | Modify | Add `legend` prop + banner rendering + updated `aria-label` |
| `src/components/LeaderboardPanel.test.jsx` | Create | Unit tests for banner states |
| `src/App.jsx` | Modify | Call `useYesterdaysLegend(PUZZLES)`, pass `legend` to `LeaderboardPanel` |

---

## Task 1: Environment Setup

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `.env` (not committed)

- [ ] **Step 1: Add `.env` to `.gitignore`**

Open `.gitignore` and add `.env` on its own line:

```
.worktrees/
.superpowers/
node_modules/
dist/
.playwright-mcp/
.env
```

- [ ] **Step 2: Create `.env.example`**

Create `.env.example` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Create `.env` with real credentials**

Create `.env` in the project root with the actual values from `src/utils/supabase.js` (the hardcoded strings currently in that file):

```
VITE_SUPABASE_URL=https://lvskvhkzpjxhidqowbls.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_FxT1q_Elb2QcaOX6L0vlCQ_qe0GaTxh
```

- [ ] **Step 4: Verify `.env` is ignored**

Run:
```bash
git status
```
Expected: `.env` does NOT appear in the untracked files list. `.env.example` DOES appear.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example
git commit -m "add env var setup — .env.example and .gitignore entry"
```

---

## Task 2: Migrate Supabase Credentials to Env Vars

**Files:**
- Modify: `src/utils/supabase.js`

The current file has hardcoded credentials. Replace them with Vite env vars so the app reads from `.env` at build time.

- [ ] **Step 1: Read the current file**

Read `src/utils/supabase.js` to confirm current state before editing.

- [ ] **Step 2: Replace hardcoded credentials**

Change `src/utils/supabase.js` from:
```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lvskvhkzpjxhidqowbls.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FxT1q_Elb2QcaOX6L0vlCQ_qe0GaTxh'

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

To:
```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

Leave `submitScore` unchanged.

- [ ] **Step 3: Verify dev server still starts**

Run:
```bash
npm run dev
```
Expected: Dev server starts without errors. Open the URL in a browser and confirm the leaderboard loads (trophy button → today's scores appear).

- [ ] **Step 4: Commit**

```bash
git add src/utils/supabase.js
git commit -m "migrate Supabase credentials to VITE_ env vars"
```

---

## Task 3: Add Vitest Test Infrastructure

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

This project has no test framework. Vitest integrates directly with Vite and requires minimal setup.

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev vitest @testing-library/react@^14 @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Add test script to `package.json`**

Add `"test": "vitest"` and `"test:run": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 3: Update `vite.config.js` to include Vitest config**

Replace current contents of `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/HefLab/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test-setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Verify Vitest works**

Run:
```bash
npm run test:run
```
Expected: Output shows "No test files found" or similar — no errors, just no tests yet.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/test-setup.js
git commit -m "add Vitest + React Testing Library test infrastructure"
```

---

## Task 4: Implement `useYesterdaysLegend` Hook (TDD)

**Files:**
- Create: `src/hooks/useYesterdaysLegend.js`
- Create: `src/hooks/useYesterdaysLegend.test.js`

The hook queries Supabase for yesterday's top scorer. `puzzles` is a required parameter (not imported internally) — this keeps the hook independently testable.

**How the hook works:**
1. Computes yesterday's date as a `YYYY-MM-DD` string
2. Queries `scores` where `puzzle_date = yesterday`, order by `correct DESC, submitted_at ASC`, limit 1
3. Looks up `puzzles[yesterdayStr]?.gridLabel` for the puzzle label
4. Returns `{ legend, loading, error }`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useYesterdaysLegend.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useYesterdaysLegend } from './useYesterdaysLegend.js'

// Mock the supabase client
vi.mock('../utils/supabase.js', () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}))

import { supabaseClient } from '../utils/supabase.js'

function makeMockQuery(data, error = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  }
  supabaseClient.from.mockReturnValue(chain)
  return chain
}

const MOCK_PUZZLES = {
  '2026-03-24': { gridLabel: 'GRID #3: THREE POINT LAND' },
}

// Pin "today" so yesterday is always 2026-03-24 in tests
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-25T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useYesterdaysLegend', () => {
  it('returns legend with player_name, correct, and gridLabel when data exists', async () => {
    makeMockQuery([{ player_name: 'HoopDreams', correct: 16 }])

    const { result } = renderHook(() => useYesterdaysLegend(MOCK_PUZZLES))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.legend).toEqual({
      player_name: 'HoopDreams',
      correct: 16,
      gridLabel: 'GRID #3: THREE POINT LAND',
    })
    expect(result.current.error).toBe(false)
  })

  it('returns legend with gridLabel undefined when yesterday is not in puzzles', async () => {
    makeMockQuery([{ player_name: 'HoopDreams', correct: 16 }])

    const { result } = renderHook(() => useYesterdaysLegend({}))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.legend).toEqual({
      player_name: 'HoopDreams',
      correct: 16,
      gridLabel: undefined,
    })
  })

  it('returns legend as null when no scores exist for yesterday', async () => {
    makeMockQuery([])

    const { result } = renderHook(() => useYesterdaysLegend(MOCK_PUZZLES))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.legend).toBeNull()
    expect(result.current.error).toBe(false)
  })

  it('returns error true and legend null when fetch fails', async () => {
    makeMockQuery(null, { message: 'network error' })

    const { result } = renderHook(() => useYesterdaysLegend(MOCK_PUZZLES))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(true)
    expect(result.current.legend).toBeNull()
  })

  it('queries scores table filtered by yesterday with correct ordering', async () => {
    const chain = makeMockQuery([{ player_name: 'HoopDreams', correct: 16 }])

    const { result } = renderHook(() => useYesterdaysLegend(MOCK_PUZZLES))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabaseClient.from).toHaveBeenCalledWith('scores')
    expect(chain.eq).toHaveBeenCalledWith('puzzle_date', '2026-03-24')
    expect(chain.order).toHaveBeenCalledWith('correct', { ascending: false })
    expect(chain.order).toHaveBeenCalledWith('submitted_at', { ascending: true })
    expect(chain.limit).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/hooks/useYesterdaysLegend.test.js
```
Expected: FAIL — "Cannot find module './useYesterdaysLegend.js'"

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useYesterdaysLegend.js`:

```js
import { useState, useEffect } from 'react'
import { supabaseClient } from '../utils/supabase.js'

export function useYesterdaysLegend(puzzles) {
  const [legend, setLegend] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    supabaseClient
      .from('scores')
      .select('player_name, correct')
      .eq('puzzle_date', yesterdayStr)
      .order('correct', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(1)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) { setError(true); setLoading(false); return }
        if (!data || data.length === 0) { setLegend(null); setLoading(false); return }
        const winner = data[0]
        setLegend({
          player_name: winner.player_name,
          correct: winner.correct,
          gridLabel: puzzles[yesterdayStr]?.gridLabel,
        })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [])

  return { legend, loading, error }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/hooks/useYesterdaysLegend.test.js
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useYesterdaysLegend.js src/hooks/useYesterdaysLegend.test.js
git commit -m "add useYesterdaysLegend hook with tests"
```

---

## Task 5: Update `LeaderboardPanel` with Banner (TDD)

**Files:**
- Modify: `src/components/LeaderboardPanel.jsx`
- Create: `src/components/LeaderboardPanel.test.jsx`

The banner renders at the very top of the panel, before the "Today's Leaderboard" heading. It receives a `legend` prop (object, `null`, or `undefined` during loading).

**Banner render rules:**
- `legendLoading === true`: show loading indicator inside banner
- `legend === null` and not loading: show "No Ballers Yet"
- `legendError === true`: hide banner entirely
- `legend` is an object: show player name, score, and gridLabel (omit gridLabel if `undefined`)

- [ ] **Step 1: Write failing tests**

Create `src/components/LeaderboardPanel.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeaderboardPanel from './LeaderboardPanel.jsx'

const defaultProps = {
  entries: [],
  totalCount: 0,
  loading: false,
  error: false,
  token: 'test-token',
  onClose: vi.fn(),
  legend: null,
  legendLoading: false,
  legendError: false,
}

describe('LeaderboardPanel — Yesterday\'s Biggest Baller banner', () => {
  it('shows player name, score, and gridLabel when legend is present', () => {
    render(<LeaderboardPanel
      {...defaultProps}
      legend={{ player_name: 'HoopDreams', correct: 16, gridLabel: 'GRID #3: THREE POINT LAND' }}
    />)

    expect(screen.getByText("YESTERDAY'S BIGGEST BALLER")).toBeInTheDocument()
    expect(screen.getByText('HoopDreams')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('GRID #3: THREE POINT LAND')).toBeInTheDocument()
  })

  it('shows name and score without gridLabel when gridLabel is undefined', () => {
    render(<LeaderboardPanel
      {...defaultProps}
      legend={{ player_name: 'HoopDreams', correct: 16, gridLabel: undefined }}
    />)

    expect(screen.getByText('HoopDreams')).toBeInTheDocument()
    expect(screen.queryByText(/GRID/)).not.toBeInTheDocument()
  })

  it('shows "No Ballers Yet" when legend is null and not loading', () => {
    render(<LeaderboardPanel {...defaultProps} legend={null} legendLoading={false} />)

    expect(screen.getByText('No Ballers Yet')).toBeInTheDocument()
  })

  it('hides banner entirely when legendError is true', () => {
    render(<LeaderboardPanel {...defaultProps} legendError={true} />)

    expect(screen.queryByText("YESTERDAY'S BIGGEST BALLER")).not.toBeInTheDocument()
    expect(screen.queryByText('No Ballers Yet')).not.toBeInTheDocument()
  })

  it('shows loading indicator inside banner when legendLoading is true', () => {
    render(<LeaderboardPanel {...defaultProps} legendLoading={true} />)

    expect(screen.getByText("YESTERDAY'S BIGGEST BALLER")).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('has aria-label "Leaderboard" on the dialog', () => {
    render(<LeaderboardPanel {...defaultProps} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Leaderboard')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/components/LeaderboardPanel.test.jsx
```
Expected: FAIL — multiple failures since `legend`, `legendLoading`, `legendError` props don't exist yet.

- [ ] **Step 3: Implement banner in `LeaderboardPanel.jsx`**

Read `src/components/LeaderboardPanel.jsx` first, then update it. Add `legend`, `legendLoading`, `legendError` to the props destructuring and insert the banner block:

```jsx
export default function LeaderboardPanel({ entries, totalCount, loading, error, token, onClose, legend, legendLoading, legendError }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 300 }}>
      <div
        role="dialog" aria-modal="true" aria-label="Leaderboard"
        onClick={e => e.stopPropagation()}
        style={{ background: '#1B2A6B', border: '3px solid #FFD700', borderRadius: 14, padding: '24px 20px', maxWidth: 380, width: '100%', boxShadow: '6px 6px 0 rgba(0,0,0,0.5)' }}>

        {/* Yesterday's Biggest Baller Banner */}
        {!legendError && (
          <div style={{ marginBottom: 16, background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial Black', sans-serif", marginBottom: 6 }}>
              <span aria-hidden="true">⭐ </span><span>YESTERDAY'S BIGGEST BALLER</span>
            </div>
            {legendLoading && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Arial', sans-serif" }}>Loading…</div>
            )}
            {!legendLoading && legend === null && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Arial', sans-serif" }}>No Ballers Yet</div>
            )}
            {!legendLoading && legend !== null && (
              <>
                {legend.gridLabel && (
                  <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.6)', fontFamily: "'Arial', sans-serif", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {legend.gridLabel}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Arial', sans-serif" }}>{legend.player_name}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD700', fontFamily: "'Arial Black', sans-serif" }}>{legend.correct}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        {!legendError && (
          <div style={{ borderTop: '1px solid rgba(255,215,0,0.2)', marginBottom: 14 }} />
        )}

        {/* Today's Leaderboard — existing content unchanged */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial Black', sans-serif" }}>🏆 Today's Leaderboard</div>
          {!loading && !error && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Arial', sans-serif" }}>
              {totalCount} {totalCount === 1 ? 'player' : 'players'}
            </div>
          )}
        </div>
        {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '24px 0' }}>Loading…</div>}
        {error && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '24px 0' }}>Leaderboard unavailable</div>}
        {!loading && !error && entries.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Arial', sans-serif", padding: '16px 0' }}>No scores yet today</div>
        )}
        {!loading && !error && entries.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {entries.map((entry) => {
              const isMe = entry.player_token === token
              return (
                <div key={entry.player_token} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 5, marginBottom: 4, background: isMe ? 'rgba(255,215,0,0.10)' : 'transparent', border: isMe ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', fontFamily: "'Arial', sans-serif" }}>
                  <span style={{ fontSize: 12, color: entry.rank <= 3 ? (['#FFD700','#C0C0C0','#CD7F32'][entry.rank - 1]) : 'rgba(255,255,255,0.4)', width: 20, textAlign: 'right', flexShrink: 0 }}>{entry.rank}</span>
                  <span style={{ flex: 1, fontSize: 13, color: isMe ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.player_name}
                    {isMe && <span style={{ marginLeft: 6, fontSize: 9, background: '#FFD700', color: '#1B2A6B', padding: '1px 5px', borderRadius: 3, fontWeight: 900 }}>YOU</span>}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD700', flexShrink: 0 }}>{entry.correct}</span>
                </div>
              )
            })}
          </div>
        )}
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 7, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', fontWeight: 700, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial', sans-serif" }}>
          Close
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/LeaderboardPanel.test.jsx
```
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/LeaderboardPanel.jsx src/components/LeaderboardPanel.test.jsx
git commit -m "update LeaderboardPanel — add Yesterday's Biggest Baller banner"
```

---

## Task 6: Wire Up `App.jsx`

**Files:**
- Modify: `src/App.jsx`

Add the `useYesterdaysLegend` call and pass its output down to `LeaderboardPanel`.

- [ ] **Step 1: Read current `App.jsx`**

Read `src/App.jsx` to confirm current import list and the `useLeaderboard` call location before editing.

- [ ] **Step 2: Add import**

Add `useYesterdaysLegend` to the imports near the top of `App.jsx`:

```js
import { useYesterdaysLegend } from './hooks/useYesterdaysLegend.js'
```

- [ ] **Step 3: Add hook call**

Directly below the existing `useLeaderboard` call, add:

```js
const { legend, loading: legendLoading, error: legendError } = useYesterdaysLegend(PUZZLES)
```

- [ ] **Step 4: Pass new props to `LeaderboardPanel`**

Find the `<LeaderboardPanel` JSX in `App.jsx` and add the three new props:

```jsx
<LeaderboardPanel
  entries={entries}
  totalCount={totalCount}
  loading={lbLoading}
  error={lbError}
  token={token}
  onClose={() => setShowLeaderboard(false)}
  legend={legend}
  legendLoading={legendLoading}
  legendError={legendError}
/>
```

- [ ] **Step 5: Smoke test in browser**

Run:
```bash
npm run dev
```
Open the game, click the 🏆 Leaderboard button.

Verify:
- The "⭐ Yesterday's Biggest Baller" banner appears at the top
- Either the prior day's winner shows (name + score + puzzle label) OR "No Ballers Yet" shows if no data exists
- Today's leaderboard still renders below the banner as before
- The banner does not appear if Supabase is unreachable (test by temporarily breaking the URL in `.env`)

- [ ] **Step 6: Run full test suite**

```bash
npm run test:run
```
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "wire useYesterdaysLegend into App — pass legend to LeaderboardPanel"
```

---

## Acceptance Criteria Checklist

- [ ] "Yesterday's Biggest Baller" banner appears at top of leaderboard panel, above today's list
- [ ] Banner shows winner's `player_name`, `correct` score, and puzzle `gridLabel`
- [ ] If `gridLabel` is not found, name and score still render without it
- [ ] If no scores exist for yesterday, banner shows "No Ballers Yet"
- [ ] If fetch fails, banner is hidden entirely — no error shown
- [ ] Tie-breaking uses earliest `submitted_at` (handled by query order in hook)
- [ ] Supabase credentials read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `.env.example` committed; `.env` not committed and listed in `.gitignore`
- [ ] Dialog `aria-label` is `"Leaderboard"`
- [ ] All tests pass (`npm run test:run`)
- [ ] No existing leaderboard or game functionality is broken
