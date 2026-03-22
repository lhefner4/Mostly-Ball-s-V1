# Puzzle Builder Skill — Design Spec
**Date:** 2026-03-22
**Project:** Do You Know Ball? (Mostly Immaculate Grid)

---

## Overview

A Claude Code skill (`build-puzzle`) that lets the creator build a new daily puzzle entry through a conversational workflow. The skill handles both the creative concept phase (teams, categories, theme) and the research phase (finding valid player answers for all 16 grid cells). Output is a complete, formatted entry written directly into `puzzles.js` and committed to git.

---

## Skill File

The skill is a Claude Code skill prompt file located at:
```
~/.claude/skills/build-puzzle/SKILL.md
```
This file contains the full instructions Claude follows when the skill is invoked. It is read by Claude Code at invocation time and executed in the current session — not a script, not a binary.

---

## Trigger

The skill activates in two ways:
1. Explicit invocation: user types `/build-puzzle` in Claude Code
2. Natural language: user says something like "I'm ready to build tomorrow's puzzle" — the using-superpowers skill detection catches this and invokes `build-puzzle`

---

## Phase 1: Concept (Conversational)

The orchestrator (main Claude session) walks the user through concept decisions one question at a time:

1. **Date** — "What date is this puzzle for?" User can say "tomorrow" or a specific date; orchestrator resolves to `YYYY-MM-DD` format.

2. **Week badge** — "Same week or new week?" The orchestrator reads `puzzles.js`, finds the most recent entry by date key, and extracts its `weekBadge`. "Same week" means the puzzle date falls in the same calendar week (Sunday–Saturday) as the most recent existing entry. If same week, `weekBadge` carries over automatically with no question needed. If new week, user provides the badge text (plain text, ~30 chars max). If `puzzles.js` has no existing entries, user is always asked to provide the badge text.

3. **Grid label** — "What's the grid name?" User provides (e.g., "GRID #2: BIG TEN BALLERS") or asks the agent to suggest one based on the theme chosen in step 4. If user asks for a suggestion, this question is deferred until after step 4.

4. **Teams (columns)** — "Which 4 teams?" User provides ideas, partial ideas, or says "surprise me." If agent suggests, it proposes 4 teams with a coherent theme. For each confirmed team, the agent automatically looks up the standard school colors (primary `color` and `border` hex values) via web search — no manual hex entry required.

5. **Categories (rows)** — "Which 4 row categories?" User provides ideas or asks agent to suggest. Each category needs:
   - `name`: plain text, ~15 chars max (e.g., "Ball Hog")
   - `desc`: plain text, ~60 chars max — the qualifying criteria stated clearly (e.g., "Led team in scoring during a Tournament run")

**Concept summary gate:** After all 5 questions are answered, the orchestrator displays a summary table — teams across the top, categories down the side — and asks "Ready to research this?" The user must confirm before Phase 2 begins. This is a hard gate: no research starts until the user says yes.

---

## Phase 2: Research (Parallel Agents)

After concept approval, the orchestrator dispatches **4 parallel research subagents simultaneously** — one per team column.

### Each research agent receives:
- The team name and nickname
- Its column index (0–3) — used to label output keys correctly (e.g., col index 2 produces `"0-2"`, `"1-2"`, `"2-2"`, `"3-2"`)
- All 4 category definitions (name + full desc), each with its row index (0–3)
- Research scope: players from any era who played for this college program during their college career (not current roster, not professional career). Focus on NCAA Tournament history.
- Authoritative sources to search: basketball-reference.com, Sports Reference CBB, Wikipedia, ESPN, and NCAA.com
- Output format instructions (see below)

### Confidence model:
- **HIGH** — agent is confident the player qualifies based on clear evidence found in sources. Include in answer pool.
- **UNCERTAIN** — agent found evidence the player may qualify but has meaningful doubt (ambiguous criteria interpretation, conflicting sources, or edge case). Flag for user review with a one-sentence explanation.

### Per-cell targets:
- Aim for **3–15 HIGH players per cell**. There is no maximum cap.
- If fewer than 3 HIGH players are found for a cell, include the best UNCERTAIN candidates and flag them — do not leave the pool empty without surfacing it.
- If **zero** players (HIGH or UNCERTAIN) are found for a cell, the agent must report this explicitly as an **EMPTY** cell.

### Example agent output format:
```
Duke × Ball Hog (row 0, col 0):
  HIGH:      J.J. Redick, Christian Laettner, Zion Williamson, Shane Battier
  UNCERTAIN: Jason Williams — scoring leader but team's run was one round; verify Tournament qualifier
  EMPTY:     (no)

Duke × Ball Knower (row 2, col 0):
  HIGH:      Grant Hill, Jay Bilas, Jay Williams
  UNCERTAIN: (none)
  EMPTY:     (no)
```

### Merging results:
The orchestrator waits for all 4 agents to complete, then merges their outputs into the full 4×4 grid keyed by `"row-col"` (e.g., agent for col 0 produces `"0-0"`, `"1-0"`, `"2-0"`, `"3-0"`).

---

## Phase 3: Flagged Items Review

### UNCERTAIN items:
The orchestrator presents only the UNCERTAIN items to the user, one at a time or as a grouped list, with the agent's reasoning:

```
A few items need your call:

  Duke × Ball Hog — Jason Williams:
  Reasoning: Scoring leader but team's Tournament run was brief. Does he qualify?
  Include? (yes / no)

  Kansas × Clutch Balls — Mario Chalmers:
  Reasoning: His shot forced overtime — game-tying, not game-winning. Include?
  Include? (yes / no)
```

User answers yes or no for each. Yes promotes the player to HIGH (included in answer pool). No drops the player entirely.

### EMPTY cells:
If any cell has zero players (HIGH or UNCERTAIN), the orchestrator alerts the user:

```
  ⚠️  Kentucky × Clutch Balls — no valid players found.
  Options:
    A) Provide player names yourself
    B) Change this category
    C) Keep empty — written as `[]` in answerPool. This is a pre-confirmed contract: `validate()` in `index.html` line 71 checks `pool.length === 0` and returns `{ reason: "empty" }`, which the game renders as "⏳ Answer pool coming soon!" — no further verification needed by the agent.
```

### If no UNCERTAIN items and no EMPTY cells:
This phase is skipped entirely. The orchestrator proceeds directly to Phase 4.

---

## Phase 4: Final Approval

The orchestrator presents the **complete formatted puzzle entry** — the exact JavaScript object block ready to be inserted into `puzzles.js`:

```js
"2026-03-23": {
  weekBadge: "WEEK 1: THIS IS MARCH",
  gridLabel: "GRID #2: BIG TEN BALLERS",
  columns: [
    { name: "Michigan",  nickname: "Wolverines", color: "#00274C", border: "#1a4a70" },
    { name: "Kentucky",  nickname: "Wildcats",   color: "#0033A0", border: "#3366cc" },
    { name: "Kansas",    nickname: "Jayhawks",   color: "#0051A5", border: "#3374c8" },
    { name: "Indiana",   nickname: "Hoosiers",   color: "#990000", border: "#cc3333" },
  ],
  rows: [
    { name: "Ball Hog",     desc: "Led team in scoring during a Tournament run" },
    { name: "Clutch Balls", desc: "Hit a game-winning shot in March Madness" },
    { name: "Ball Knower",  desc: "Became a broadcaster, analyst, or major media figure" },
    { name: "Ball & Chain", desc: "Won a national championship in their 4th year or more" },
  ],
  answerPool: {
    "0-0": ["Player A", "Player B", "Player C"],
    "0-1": ["Player D", "Player E"],
    // ... all 16 cells, each an array of player name strings
  },
},
```

**answerPool value format:** Each cell value is a plain JavaScript array of player name strings (e.g., `["Christian Laettner", "J.J. Redick"]`). This matches the existing format in `puzzles.js` and `index.html`'s `validate()` function.

The user can:
- Say "looks good" → proceed to Phase 5
- Request specific edits (e.g., "remove Jason Williams from 1-2", "add Bob Knight to 2-3") → orchestrator makes the edits inline and shows the updated entry again
- Request a full cell redo (e.g., "redo Kentucky × Ball Knower") → orchestrator spawns a **new single-cell subagent** for that specific team × category pair, gets fresh research results, folds them in, and presents the updated entry

---

## Phase 5: Write and Commit

After the user approves the final entry:

1. **Write** — orchestrator inserts the new entry into `puzzles.js` using text string manipulation (no JSON parsing):
   - Locate the line containing exactly `};` with no leading whitespace — this is the unique closing line of the top-level `PUZZLES` const in this file's structure. (Entry closers use `  },` with 2 spaces of indentation; the `PUZZLES` closer uses `};` at column 0.)
   - Find the last non-blank line before `};`. Verify it ends with `},` (the previous entry's close). If it ends with just `}`, add a trailing comma.
   - Insert the new entry (properly indented with 2 spaces, ending with `  },`) immediately before the `};` line.

2. **Commit** — `git add puzzles.js && git commit -m "Add puzzle for YYYY-MM-DD: [gridLabel]"`

3. **Push prompt** — orchestrator asks "Push to GitHub now?" If yes, pushes using the repo's configured remote. If no, stops and reminds the user the commit is local.

---

## Data Conventions (from existing system)

- `PUZZLES` object in `puzzles.js` is keyed by `"YYYY-MM-DD"` strings
- `answerPool` keys follow `"row-col"` format, 0-indexed (e.g., `"0-0"` = category row 0, team col 0)
- 16 cells total: rows 0–3 (categories), cols 0–3 (teams)
- Team `color`: hex string for background (e.g., `"#00539B"`)
- Team `border`: hex string for lighter accent border (e.g., `"#1a7fd4"`)
- `weekBadge`: plain text, ~30 chars max
- `gridLabel`: plain text, ~35 chars max

---

## Out of Scope

- Editing or removing existing puzzle entries (future feature)
- Validating answers against the `PLAYER_DB` autocomplete list (future feature)
- Scheduling puzzles in advance via a calendar UI (future feature)
- Automatic theme/team rotation logic (future feature)
