# Reveal All Answers — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Problem

When a player clicks "Reveal Correct Answers", each cell currently shows only one valid answer. The player has no way to see the full breadth of correct answers for any cell — whether they got it right or not.

## Goal

After reveal, every cell displays its complete answer pool stacked inside the tile, so players can see all valid answers and learn from them.

---

## Behavior

### Trigger
Same as today — player clicks "Reveal Correct Answers" button on the ResultsScreen.

### All cells show all valid answers

| Cell state | Border | Player's answer | Other valid answers |
|---|---|---|---|
| Correct | Green | Top, green + bold | Listed below in gold |
| Wrong | Gold | — | All valid answers in gold |
| Unanswered | Gold | — | All valid answers in gold |
| Empty pool (N/A) | Dark | — | Shows "N/A" as before |

### Layout inside each cell
- Names stack vertically inside the tile
- Player's correct answer (if any) sits at the top, visually distinct (green, bold)
- Remaining answers below in gold at a slightly smaller font
- Cells grow in height naturally to fit all names — no fixed cap, page scroll handles overflow
- No "+N more" truncation — all names are shown

---

## Implementation

### 1. `src/utils/validate.js` — `buildRevealMap`

**Current:** Returns `{ [key]: string }` — one answer per non-correct cell, avoiding repeats across cells.

**New:** Returns `{ [key]: string[] }` — full answer pool for every cell. For correct cells, the player's answer is moved to index 0.

```js
export const buildRevealMap = (cells, answerPool, rows, columns) => {
  const map = {}
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < columns.length; ci++) {
      const k = `${ri}-${ci}`
      const pool = answerPool[k] || []
      if (pool.length === 0) continue
      const cell = cells[k]
      const playerAnswer = cell?.status === 'correct' ? cell.name : null
      if (playerAnswer) {
        // Put player's answer first, then the rest
        const rest = pool.filter(a => nc(a) !== nc(playerAnswer))
        map[k] = [playerAnswer, ...rest]
      } else {
        map[k] = [...pool]
      }
    }
  }
  return map
}
```

### 2. `src/components/ResultsScreen.jsx` — cell rendering

**Current:** Renders a single `revealAns` string in gold for non-correct cells only.

**New:** Renders a stacked list for all revealed cells:
- `revealMap[k]` is now an array
- First item in correct cells: green + bold
- All other items: gold, slightly smaller font
- Correct cells lose their special "player answered" single-name rendering — they now show the full list with the player's answer highlighted at top

### 3. `src/components/Grid.jsx`

Check if `revealMap` is used during active play. If so, apply the same array-based rendering. If it's only used in ResultsScreen, no change needed here.

---

## Files to Modify

| File | Change |
|---|---|
| `src/utils/validate.js` | Rewrite `buildRevealMap` to return `{ [key]: string[] }` |
| `src/components/ResultsScreen.jsx` | Update cell rendering to handle array reveal data |

---

## Verification

1. Play a game — answer some correctly, miss some, skip some
2. On ResultsScreen, click "Reveal Correct Answers"
3. Verify: every cell (correct, wrong, unanswered) shows a stacked list
4. Verify: correctly answered cells show player's answer at top in green
5. Verify: all other answers appear in gold below
6. Verify: N/A cells still show "N/A"
7. Verify: no regressions in the rest of the ResultsScreen UI
