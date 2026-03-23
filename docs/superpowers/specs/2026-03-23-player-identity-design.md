# Player Identity System — Design Spec
**Date:** 2026-03-23
**Project:** Do You Know Ball? (Mostly Ball)
**Phase:** 1 — Local-only identity (no backend)

---

## Overview

Implement a persistent, anonymous player identity system using localStorage. Each player receives a unique browser token and chooses a display nickname. This is the foundation for Phase 2 leaderboard functionality.

---

## Architecture

### Approach
Custom React hook (`usePlayerIdentity`) added to the top of the existing `index.html` script block, above the main game component. All localStorage I/O is isolated in the hook. The main component consumes the hook's return values — no localStorage calls scattered in the component body.

This preserves the single-file architecture and creates a clean boundary that Phase 2 can extend (e.g., swapping localStorage reads for Supabase calls) without touching component logic.

### localStorage Unavailability
All localStorage reads and writes must be wrapped in try/catch. If localStorage is blocked (e.g., private browsing with strict settings), the hook falls back to in-memory state only: the token is ephemeral (not persisted), the nickname modal still appears, and the game functions normally. No errors are surfaced to the player.

---

## Data Layer

Two localStorage keys are introduced. No existing keys conflict (confirmed: zero current localStorage usage in the codebase).

| Key | Type | Description |
|---|---|---|
| `player_token` | UUID string | Anonymous browser identifier. Generated once on first visit, never changed. |
| `player_nickname` | String | Player-chosen display name. Written on first submission, updateable via settings. |

### Token Generation
Uses `crypto.randomUUID()` (native, modern browsers) with a manual UUID v4 fallback for older browser compatibility:
```js
'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});
```

### Nickname Validation Rules
- Minimum 2 characters
- Maximum 20 characters
- Allowed characters: `a-zA-Z0-9_-` (letters, digits, underscores, hyphens)
- Error message copy: `"2–20 characters. Letters, numbers, _ and - only."`
- Applied identically at both the initial modal and the settings change input

---

## `usePlayerIdentity` Hook

**Location:** Top of `<script type="text/babel">` block in `index.html`, before the main component definition.

**Responsibilities:**
- Read `player_token` from localStorage on mount via `useRef` (initialized once, never recalculated); generate and write if absent
- Read `player_nickname` from localStorage; set initial `showModal` state based on whether it exists
- Expose `saveNickname(val)` which validates, writes to localStorage, updates state, and closes the modal

**Token storage:** Use `useRef` (not `useMemo`) for the token — `useRef` is the correct React primitive for a value that is computed once on mount, never changes, and does not drive re-renders. `useMemo` is for derived values; `useRef` is for stable imperative values.

**Return shape:**
```js
{ token, nickname, showModal, saveNickname }
```

The `nickname` value in the return shape is the single source of truth for the display name throughout the component. No other code reads `player_nickname` from localStorage directly.

**State ownership:** `showModal` (initial nickname gate) lives inside the hook and is closed only via `saveNickname`. The settings popover uses a separate `showPopover` boolean — local component state (`useState(false)`), toggled by the gear button, not part of the hook's return shape. These two are independent: the hook owns the first-visit gate; the component owns the settings popover.

---

## Nickname Entry Modal

**Trigger:** `showModal === true` (first visit, or no `player_nickname` in localStorage)

**Blocking strategy:** Conditional rendering. When `showModal === true`, the game content is not rendered at all — only the modal is returned from the component. This is the simplest and most robust approach for a Babel standalone React app: no focus trap library needed, no `inert` attribute, no keyboard bypass risk.

**Behavior:**
- Full-viewport dark backdrop rendered as the sole content when `showModal === true`
- Centered card using existing palette: `#1B2A6B` background, `#FFD700` gold border, white text
- Single labeled text input, Submit button
- Validation on submit — inline error message on failure (no alert dialogs), using `#CC1122` red consistent with game styling
- Error message: `"2–20 characters. Letters, numbers, _ and - only."`
- No dismiss/close — player cannot bypass; must submit a valid nickname
- Modal has `role="dialog"` and `aria-modal="true"` for screen reader compatibility

---

## Nickname Display + Settings

**Nickname Display:** A small pill element in the game header, right-aligned. Shows the current nickname in the existing gold/navy palette. Unobtrusive — does not compete with the title.

**Settings Icon:** A `⚙` gear button rendered inside the nickname pill, to the right of the displayed name. The component manages a `showPopover` boolean state (`useState(false)`) that the gear button toggles. Button has `aria-label="Change nickname"` and `aria-expanded={showPopover}`. Clicking toggles the popover, which contains:
- A pre-filled text input with the current nickname
- A "Save" button
- Same validation rules and error message as the initial modal
- The popover has `role="dialog"` and `aria-label="Change nickname"`

**Popover click-away:** Implemented via an invisible full-viewport backdrop `div` rendered behind the popover (z-index lower than popover, higher than game content). Clicking the backdrop closes the popover without saving. This avoids document-level event listeners and ref complexity.

**Popover save behavior:**
- On valid save: localStorage updated (try/catch), `nickname` state updated, popover closes, display reflects new name immediately
- On invalid save: inline error shown, popover stays open
- `player_token` is never modified during a nickname change

---

## Share Function Integration

**File:** `index.html`, `handleCopyResults` function (line ~195)

**Change:** Minimal — reads `nickname` from hook state (already in component scope), adds one conditional prepend. Existing clipboard logic is untouched. Does not read localStorage directly.

```js
const handleCopyResults = () => {
  const pct = Math.round((correct / TOTAL_TILES) * 100);
  const base = `${GRID_LABEL}\nI shot ${correct} / ${TOTAL_TILES} (${pct}% Correct) — Balls in your court now!\n\n${GAME_URL}`;
  const msg = nickname ? `${nickname} — ${base}` : base;
  // existing clipboard logic unchanged...
};
```

**Fallback:** If `nickname` is null or empty string, share text falls back to the existing format with no changes. No error thrown.

---

## Integration Points Summary

| What | Where in `index.html` | Change type |
|---|---|---|
| `usePlayerIdentity` hook | Top of script block | New addition |
| Hook call + destructuring | Top of main component | New addition |
| Nickname modal (conditional render) | Main component return, replaces game when `showModal === true` | New addition |
| Nickname pill + settings popover | Header section | New addition |
| `handleCopyResults` | Existing function | Minimal modification (2 lines) |

**Nothing else in the game is modified.** No core game logic, no scoring system, no state management beyond the identity hook.

---

## Acceptance Criteria

- [ ] First-time visitor sees nickname modal; no game content is rendered until a valid nickname is submitted
- [ ] Returning visitor with saved nickname goes directly to game with no prompt
- [ ] `player_token` in localStorage persists across sessions and is never shown in UI
- [ ] `player_token` does not change when nickname is updated
- [ ] Nickname is visible in game header during play
- [ ] Settings gear button opens nickname change popover; valid save updates display immediately
- [ ] Clicking outside the settings popover closes it without saving changes
- [ ] Submitting an invalid nickname displays the inline error message and does not close the modal/popover
- [ ] Share output includes nickname prefix when nickname exists
- [ ] Share output falls back gracefully when nickname is null or empty
- [ ] If localStorage is unavailable, game still functions with in-memory identity state
- [ ] No existing game functionality is broken

---

## Out of Scope (Phase 2)

- Supabase / backend integration
- Score submission
- Leaderboard display
- Cross-device identity sync
