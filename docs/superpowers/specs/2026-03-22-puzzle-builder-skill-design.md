# Puzzle Builder Skill — Design Spec
**Date:** 2026-03-22
**Project:** Do You Know Ball? (Mostly Immaculate Grid)

---

## Overview

A Claude Code skill (`build-puzzle`) that lets the creator build a new daily puzzle entry through a conversational workflow. The skill handles both the creative concept phase (teams, categories, theme) and the research phase (finding valid player answers for all 16 grid cells). Output is a complete, formatted entry written directly into `puzzles.js` and committed to git.

---

## Trigger

The skill activates in two ways:
1. Explicit invocation: user types `/build-puzzle` in Claude Code
2. Natural language: user says something like "I'm ready to build tomorrow's puzzle" — the using-superpowers skill detection catches this and invokes `build-puzzle`

---

## Phase 1: Concept (Conversational)

The orchestrator (main Claude session) walks the user through concept decisions one question at a time:

1. **Date** — "What date is this puzzle for?" (user can say "tomorrow" or a specific date; orchestrator resolves to `YYYY-MM-DD`)
2. **Week badge** — "Same week or new week?" If same week, `weekBadge` carries over from the most recent puzzle automatically. If new week, user provides the badge text (plain text, ~30 chars max).
3. **Grid label** — "What's the grid name?" User provides (e.g., "GRID #2: BIG TEN BALLERS") or asks the agent to suggest one based on the chosen theme.
4. **Teams (columns)** — "Which 4 teams?" User provides ideas, partial ideas, or says "surprise me." If agent suggests, it proposes 4 teams with a coherent theme. For each team, the agent automatically looks up the standard school colors (primary color and border color hex values) via web search — no manual hex entry required.
5. **Categories (rows)** — "Which 4 row categories?" User provides ideas or asks agent to suggest. Each category needs a name (~15 chars) and a description sentence (~60 chars) that defines the qualifying criteria clearly.

**Concept summary gate:** After all 5 questions are answered, the orchestrator presents a summary table — teams across the top, categories down the side — and asks "Ready to research this?" The user must confirm before Phase 2 begins. This is a hard gate: no research starts until the user says yes.

---

## Phase 2: Research (Parallel Agents)

After concept approval, the orchestrator dispatches **4 parallel research subagents simultaneously** — one per team column.

### Each research agent receives:
- The team name
- All 4 category definitions (name + description)
- Instructions to web search authoritative sources (basketball-reference.com, Wikipedia, sports archives, ESPN)

### Each research agent produces:
For each of its 4 cells (team × category intersections), a list of players tagged with confidence:
- **HIGH** — agent is confident the player qualifies. Include in answer pool.
- **UNCERTAIN** — agent found evidence the player may qualify but has doubt. Flagged for user review.

### Example agent output format:
```
Duke × Ball Hog:
  HIGH:      J.J. Redick, Christian Laettner, Zion Williamson, Shane Battier
  UNCERTAIN: Jason Williams (scoring leader but brief Tournament run — verify)

Duke × Ball Knower:
  HIGH:      Grant Hill, Jay Bilas, Jay Williams, Dick Vitale (honorary)
  UNCERTAIN: (none)
```

### Merging results:
The orchestrator waits for all 4 agents to complete, then merges their outputs into a complete 4×4 grid of results.

---

## Phase 3: Flagged Items Review

The orchestrator presents **only the UNCERTAIN items** to the user — not the full grid. Format:

```
A few items need your call:

  Kentucky × Ball & Chain — Jason Williams:
  Reasoning: Was a 4th-year player but team didn't win a championship.
  Include? (yes / no)

  Kansas × Clutch Balls — Mario Chalmers:
  Reasoning: His shot forced overtime — game-tying, not game-winning.
  Include? (yes / no)
```

User answers yes or no for each. The orchestrator folds answers in. Players the user excludes are dropped entirely; players the user includes are promoted to HIGH.

If there are no UNCERTAIN items, this phase is skipped and the orchestrator proceeds directly to Phase 4.

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
    "0-0": [ ... ],
    // all 16 cells
  },
},
```

The user reviews the entry. They can:
- Say "looks good" → proceed to write
- Request specific edits (e.g., "remove Jason Williams from 1-2", "add Bob Donaldson to 2-3") → orchestrator makes edits and shows the updated entry again
- Request a full redo of any cell → orchestrator re-researches that cell and presents new options

---

## Phase 5: Write, Commit, and Push

After the user approves the final entry:

1. **Write** — orchestrator inserts the new entry into `puzzles.js` as the last entry in the `PUZZLES` object (before the closing `}`), preserving all formatting
2. **Commit** — `git add puzzles.js && git commit -m "Add puzzle for YYYY-MM-DD: [gridLabel]"`
3. **Push prompt** — orchestrator asks "Push to GitHub now?" If yes, pushes. If no, stops and reminds the user the commit is local.

---

## Skill File Location

The skill is saved as a Claude Code skill at:
```
~/.claude/skills/build-puzzle/SKILL.md
```

It is invocable via `/build-puzzle` or natural language trigger detection.

---

## Data Conventions (carried over from existing system)

- `PUZZLES` object in `puzzles.js` is keyed by `"YYYY-MM-DD"` strings
- `answerPool` keys follow `"row-col"` format, 0-indexed (e.g., `"0-0"` = row 0, col 0 = category 0 × team 0)
- 16 cells total: rows 0–3, cols 0–3
- Team colors: primary `color` (background) and `border` (lighter accent) as hex strings
- `weekBadge`: plain text, ~30 chars max
- `gridLabel`: plain text, ~35 chars max

---

## Out of Scope

- Editing or removing existing puzzle entries (future feature)
- Validating answers against the `PLAYER_DB` autocomplete list (future feature)
- Scheduling puzzles in advance via a calendar UI (future feature)
- Automatic theme/team rotation logic (future feature)
