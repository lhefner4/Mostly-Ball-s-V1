# Player Identity System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent anonymous player identity system (browser token + nickname) to the single-file HTML game, gating game access behind a first-visit nickname modal and surfacing the nickname in the header and share text.

**Architecture:** A `usePlayerIdentity` custom React hook is added at the top of the Babel script block. It owns all localStorage I/O and returns `{ token, nickname, showModal, saveNickname }`. The main `App` component consumes the hook and conditionally renders either the nickname modal (first visit) or the full game (returning visits). A separate `showPopover` boolean in the component manages the settings popover independently from the hook.

**Tech Stack:** React 18 (CDN, Babel standalone), vanilla localStorage, `crypto.randomUUID()` with manual UUID fallback. No build system — all changes are in `index.html`.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `index.html` | Modify | Add hook, modal, nickname pill, popover, update share function |

Only one file changes. All additions are inside the `<script type="text/babel">` block.

---

## Task 1: Add `usePlayerIdentity` Hook

**Files:**
- Modify: `index.html` — insert hook function before `function App()` (currently line ~115)

This hook owns all localStorage reads and writes. It must be the only place in the file that touches `player_token` or `player_nickname`.

- [ ] **Step 1: Locate insertion point**

Open `index.html`. Find the line that reads:
```js
function App() {
```
The hook goes immediately above it, after the existing helper functions (`navBtn`, etc.).

- [ ] **Step 2: Insert the hook**

Add this block directly above `function App()`:

```js
function usePlayerIdentity() {
  const lsGet = (key) => { try { return localStorage.getItem(key); } catch(e) { return null; } };
  const lsSet = (key, val) => { try { localStorage.setItem(key, val); } catch(e) {} };

  const tokenRef = useRef(null);
  if (!tokenRef.current) {
    let t = lsGet('player_token');
    if (!t) {
      t = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });
      lsSet('player_token', t);
    }
    tokenRef.current = t;
  }

  const stored = lsGet('player_nickname');
  const [nickname, setNickname] = useState(stored || '');
  const [showModal, setShowModal] = useState(!stored);

  const saveNickname = (val) => {
    lsSet('player_nickname', val);
    setNickname(val);
    setShowModal(false);
  };

  return { token: tokenRef.current, nickname, showModal, saveNickname };
}
```

- [ ] **Step 3: Verify the file opens without errors**

Open `index.html` in a browser (or use a local server). Open DevTools console. Confirm: no JS errors on load. The game should render exactly as before (hook exists but is not yet wired in).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add usePlayerIdentity hook"
```

---

## Task 2: Wire Hook + New State into App

**Files:**
- Modify: `index.html` — top of `function App()` body (currently line ~116)

- [ ] **Step 1: Add hook call and new state to App**

Inside `function App()`, immediately after the opening brace, add these lines before the existing `useState` declarations:

```js
const { token, nickname, showModal, saveNickname } = usePlayerIdentity();
const [showPopover, setShowPopover] = useState(false);
const [modalInput, setModalInput] = useState('');
const [modalError, setModalError] = useState('');
const [popoverInput, setPopoverInput] = useState('');
const [popoverError, setPopoverError] = useState('');
```

The existing state declarations (`cells`, `used`, `active`, etc.) remain unchanged below these new lines.

- [ ] **Step 2: Verify in browser**

Reload the page. No console errors. Game still renders normally. Open DevTools → Application → Local Storage. Confirm `player_token` now exists with a UUID value. Confirm `player_nickname` is absent (since the modal isn't rendered yet, the game renders normally regardless).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire usePlayerIdentity into App component"
```

---

## Task 3: Add Nickname Entry Modal (Conditional Render)

**Files:**
- Modify: `index.html` — add a validation helper and the modal conditional return inside `function App()`

When `showModal` is true, the entire game return is replaced by the modal. The game DOM is not rendered at all.

- [ ] **Step 1: Add nickname validation helper**

Add this function directly above `function usePlayerIdentity()` (i.e., before the hook):

```js
const validateNickname = (val) => {
  if (!val || val.length < 2 || val.length > 20) return false;
  return /^[a-zA-Z0-9_-]+$/.test(val);
};
```

- [ ] **Step 2: Add `handleModalSubmit` handler to App**

Inside `function App()`, add this handler alongside the other handlers (near `handleReveal`, `reset`, etc.). It must be defined **before** the modal JSX uses it:

```js
const handleModalSubmit = () => {
  const val = modalInput.trim();
  if (!validateNickname(val)) {
    setModalError('2–20 characters. Letters, numbers, _ and - only.');
    return;
  }
  setModalError('');
  saveNickname(val);
};
```

- [ ] **Step 3: Add conditional modal return**

In `function App()`, locate the existing early return guard:

```js
if (!_puzzle) return <div ...>Game unavailable — check back soon.</div>;
```

Immediately **after** that line (before `return (<div style={bgStyle}>`), add:

```js
if (showModal) {
  return (
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Arial Black', 'Impact', 'Segoe UI Black', system-ui, sans-serif" }}
         role="dialog" aria-modal="true" aria-label="Enter your nickname">
      <div style={{ background: '#1B2A6B', border: '3px solid #FFD700', borderRadius: 12, padding: '36px 32px', maxWidth: 340, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Welcome
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: "'Arial', sans-serif", marginBottom: 24, lineHeight: 1.5 }}>
          Choose a nickname to track your scores.
        </div>
        <input
          type="text"
          maxLength={20}
          placeholder="Your nickname"
          value={modalInput}
          onChange={(e) => setModalInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleModalSubmit(); }}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '2px solid #FFD700', background: '#0d1a4a', color: '#fff', fontSize: 16, fontFamily: "'Arial', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          autoFocus
        />
        {modalError && (
          <div style={{ color: '#CC1122', fontSize: 11, fontFamily: "'Arial', sans-serif", marginBottom: 10, textAlign: 'left' }}>
            {modalError}
          </div>
        )}
        <button
          onClick={handleModalSubmit}
          style={{ width: '100%', padding: '11px 0', borderRadius: 7, background: '#FFD700', border: 'none', color: '#1B2A6B', fontWeight: 900, cursor: 'pointer', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial Black', sans-serif", marginTop: 4 }}>
          Let's Play
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify first-visit modal**

Clear localStorage (DevTools → Application → Local Storage → right-click → Clear). Reload. Confirm:
- The modal appears; the game grid is not visible
- Typing fewer than 2 characters and clicking "Let's Play" shows the error message inline; input retains typed value (does not reset)
- Typing a valid nickname (e.g. `TestUser`) and clicking "Let's Play" dismisses the modal and shows the game
- `player_nickname` is now set in localStorage
- Reloading the page skips the modal entirely

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add nickname entry modal with conditional render gate"
```

---

## Task 4: Add Nickname Pill + Settings Popover to Header

**Files:**
- Modify: `index.html` — the header section (currently lines ~220–252)

The nickname pill sits inside the existing header `<div>`. The `handlePopoverSave` handler must be defined **before** the JSX that references it.

- [ ] **Step 1: Add `handlePopoverSave` handler to App**

Inside `function App()`, add this alongside the other handlers (near `handleModalSubmit`, `handleReveal`, `reset`). Define it **before** the header JSX in the render return:

```js
const handlePopoverSave = () => {
  const val = popoverInput.trim();
  if (!validateNickname(val)) {
    setPopoverError('2–20 characters. Letters, numbers, _ and - only.');
    return;
  }
  saveNickname(val);
  setShowPopover(false);
  setPopoverError('');
};
```

- [ ] **Step 2: Replace the placeholder header line with the nickname pill**

Locate this line in the header (currently line ~232):
```js
<div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 14, fontFamily: "'Arial', sans-serif" }}>
  Sign-In &nbsp;•&nbsp; Sign-Up &nbsp;•&nbsp; View Leaderboards
</div>
```

Replace it with:
```js
<div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,212,0,0.12)', border: '1px solid rgba(255,212,0,0.35)', borderRadius: 20, padding: '4px 10px 4px 12px', marginBottom: 14, cursor: 'default' }}>
  <span style={{ fontSize: 12, color: '#FFD700', fontFamily: "'Arial', sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>
    {nickname}
  </span>
  <button
    onClick={() => { setShowPopover(p => !p); setPopoverInput(nickname); setPopoverError(''); }}
    aria-label="Change nickname"
    aria-expanded={showPopover}
    style={{ background: 'none', border: 'none', color: 'rgba(255,212,0,0.6)', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>
    ⚙
  </button>

  {showPopover && (
    <>
      {/* Invisible backdrop to catch click-away */}
      <div
        onClick={() => setShowPopover(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
      />
      {/* Popover card */}
      <div
        role="dialog"
        aria-label="Change nickname"
        style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#1B2A6B', border: '2px solid #FFD700', borderRadius: 10, padding: '16px', zIndex: 100, minWidth: 220, boxShadow: '0 6px 24px rgba(0,0,0,0.5)', textAlign: 'left' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Arial', sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Change Nickname
        </div>
        <input
          type="text"
          maxLength={20}
          value={popoverInput}
          onChange={(e) => setPopoverInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePopoverSave(); }}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 5, border: '2px solid #FFD700', background: '#0d1a4a', color: '#fff', fontSize: 14, fontFamily: "'Arial', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
          autoFocus
        />
        {popoverError && (
          <div style={{ color: '#CC1122', fontSize: 11, fontFamily: "'Arial', sans-serif", marginBottom: 8 }}>
            {popoverError}
          </div>
        )}
        <button
          onClick={handlePopoverSave}
          style={{ width: '100%', padding: '8px 0', borderRadius: 6, background: '#FFD700', border: 'none', color: '#1B2A6B', fontWeight: 900, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Arial Black', sans-serif" }}>
          Save
        </button>
      </div>
    </>
  )}
</div>
```

- [ ] **Step 3: Verify in browser**

Reload. Confirm:
- Nickname pill shows current nickname in the header
- Clicking `⚙` opens the popover pre-filled with the current nickname
- Clicking outside the popover card closes it with no changes
- Entering an invalid nickname in the popover shows the inline error; input retains typed value
- Entering a valid new nickname and clicking Save updates the pill display immediately
- `player_token` in localStorage is unchanged after a nickname save
- `player_nickname` in localStorage reflects the new name

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add nickname pill and settings popover to header"
```

---

## Task 5: Update Share Function

**Files:**
- Modify: `index.html` — `handleCopyResults` function (currently lines ~195–203)

- [ ] **Step 1: Locate `handleCopyResults`**

Find the function (search for `handleCopyResults`). It currently reads:
```js
const handleCopyResults = () => {
  const pct = Math.round((correct / TOTAL_TILES) * 100);
  const msg = `${GRID_LABEL}\nI shot ${correct} / ${TOTAL_TILES} (${pct}% Correct) — Balls in your court now!\n\n${GAME_URL}`;
  if (navigator.clipboard) {
    ...
```

- [ ] **Step 2: Update the message construction**

Replace the `msg` construction line only — leave the clipboard logic entirely untouched:

Before:
```js
const msg = `${GRID_LABEL}\nI shot ${correct} / ${TOTAL_TILES} (${pct}% Correct) — Balls in your court now!\n\n${GAME_URL}`;
```

After:
```js
const base = `${GRID_LABEL}\nI shot ${correct} / ${TOTAL_TILES} (${pct}% Correct) — Balls in your court now!\n\n${GAME_URL}`;
const msg = nickname ? `${nickname} — ${base}` : base;
```

- [ ] **Step 3: Verify share output — with nickname**

Play a few tiles, then trigger "Copy Results" from the end-game screen (or click End Game to force it). Paste into a text editor. Confirm the first line starts with the player's nickname followed by ` — `.

- [ ] **Step 4: Verify share fallback — without nickname**

In DevTools → Application → Local Storage, delete `player_nickname` only (leave `player_token`). Reload — the modal will appear. Open DevTools Console and run: `localStorage.setItem('player_nickname', '')` then reload again. This forces `nickname` to be an empty string. Click "Copy Results". Paste and confirm the output matches the original format with no nickname prefix and no error.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: prepend player nickname to share text"
```

---

## Task 6: Final Acceptance Test Pass

No code changes in this task — verify all acceptance criteria from the spec.

- [ ] **Clear all identity localStorage keys**

DevTools → Application → Local Storage → delete `player_token` and `player_nickname`.

- [ ] **AC: First-time visitor sees modal, game is not rendered**

Reload. Confirm the nickname modal is the only thing on screen. No game grid visible.

- [ ] **AC: Invalid nickname shows inline error, modal stays open**

Submit an empty string. Submit `x` (1 char). Submit `ab!` (invalid character). Each should show the inline error and keep the modal open with the typed value preserved.

- [ ] **AC: Valid nickname dismisses modal and shows game**

Enter `BallKnower`. Click "Let's Play". Game appears. `player_nickname` = `BallKnower` in localStorage.

- [ ] **AC: Returning visitor skips modal**

Reload. Game appears immediately with no modal.

- [ ] **AC: Token persists and is never shown**

Confirm `player_token` exists in localStorage and is never visible anywhere in the UI.

- [ ] **AC: Nickname visible in header**

Confirm `BallKnower` appears in the header pill during gameplay.

- [ ] **AC: Settings popover updates nickname; token unchanged**

Click `⚙`. Enter `HoopsDreams`. Save. Pill updates to `HoopsDreams`. `player_token` value in localStorage is unchanged. Reload — `HoopsDreams` loads immediately.

- [ ] **AC: Click-away closes popover without saving**

Open popover. Type `SomethingElse`. Click outside the card. Pill still shows `HoopsDreams`. `player_nickname` in localStorage unchanged.

- [ ] **AC: Share output includes nickname**

Play through or reveal tiles. Open end-game screen. Click "Copy Results". Paste. Confirm output starts with `HoopsDreams — `.

- [ ] **AC: Share fallback when nickname is empty**

In DevTools Console run `localStorage.setItem('player_nickname', '')` then reload. Trigger Copy Results. Confirm output matches original format (no prefix, no error).

- [ ] **AC: No existing functionality broken**

Play a full game: open tiles, submit answers, get correct/wrong responses, trigger end-game, see reveal map, use Reset. Confirm everything works as before.

- [ ] **Commit final tag**

```bash
git add index.html
git commit -m "test: confirm all player identity acceptance criteria pass"
```
