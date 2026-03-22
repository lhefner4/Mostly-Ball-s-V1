# Site Notice Popup — Design Spec
**Date:** 2026-03-22
**Project:** Do You Know Ball? (Mostly Immaculate Grid)

## Overview

A lightweight global popup that appears on game load when a message is active. Used for prototype notices, holiday greetings, or any brief announcement the creator wants players to see before playing.

---

## Control

A single constant at the top of `puzzles.js`, alongside `ACTIVE_OVERRIDE`:

```js
const SITE_NOTICE = null;
```

- **`null`** — no popup, game loads normally
- **Any string** — popup appears on load with that message

To activate: set `SITE_NOTICE` to a message string and push `puzzles.js`.
To deactivate: set back to `null` and push.

The message is whatever the creator writes at the time — no hardcoded text.

---

## Behavior

- Popup appears immediately on game load if `SITE_NOTICE` is non-null
- Covers the full screen with a dark semi-transparent overlay
- Centered card displays the message text and a single **OK** button
- Player taps OK → popup dismisses, game is fully accessible
- No auto-dismiss, no timer — requires manual acknowledgment
- Disappears for the rest of the session once dismissed

---

## UI

- Overlay: full-screen, dark semi-transparent background
- Card: centered, styled in the game's existing navy/gold theme
- Content: message text + single OK button
- Matches existing modal patterns in the codebase (rules modal, end-game modal)

---

## Implementation

### `puzzles.js`
Add one line at the top alongside `ACTIVE_OVERRIDE`:
```js
const SITE_NOTICE = null;
```

### `index.html`
Two additions inside the `App` component:

1. **State:** `const [showNotice, setShowNotice] = useState(typeof SITE_NOTICE === 'string' && SITE_NOTICE.length > 0);`
2. **Render:** When `showNotice` is true, render a modal overlay on top of all game content. OK button calls `setShowNotice(false)`.

No changes to existing game logic, state, or components.

---

## Scope

- No per-puzzle notices (global only)
- No persistence across sessions (reappears on each page load while active)
- No title field — message text only
- No rich formatting — plain text string

---

## Removal

To remove the feature entirely: delete the `SITE_NOTICE` constant from `puzzles.js` and remove the `showNotice` state and modal render block from `index.html`. Self-contained, no side effects.
