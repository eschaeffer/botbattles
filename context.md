# BotBattles Project Context (Deep Summary)

## Overview
BotBattles is a browser-based, p5.js arena where student-coded bots battle each other. It is designed for high‑school CS instruction and supports both local hosting and GitHub Pages deployment. Bots are configured via JSON files, loaded dynamically, and executed in a safe sandbox.

## Current Status (Working)
- Main UI works: arena, controls, match log, scoreboard, bot load report.
- Bots load from local bot folders (`.json` + `behavior.js`).
- GitHub Pages hosting is live and functioning.
- Bot behavior is stable; UI is polished; scan and fire visuals are in place.
- Friendly student-facing errors/warnings are now implemented.

## Core Architecture
### Files
- `index.html`: main UI + styles.
- `sketch.js`: engine, rendering, bot API, scoring, load workflow.
- `sampleBots/`: sample/reference bots and folders:
  - `sampleBots/twoFileBots/` (current two-file examples)
  - `sampleBots/failedBotExamples/` (intentional error demos)
- `bot-schema.json`: JSON schema for config validation.
- `api-cheatsheet.md`: student‑facing API reference.
- `spec.md`: formal spec.

### Bot Loading
- Use **Select Bot Folders** to load bots.
- Each bot folder must contain:
  - one bot config `.json` file, and
  - one `behavior.js` file (merged into `behavior.tick` at load time).
- Recommended workflow: place multiple bot folders under one parent folder, then select the parent.
- The folder loader now groups by nested folder name (works with parent folders like `twoFileBots/`).
- Bots are validated against `bot-schema.json`.
- If invalid, friendly errors appear in Bot Load Report.
- Tips and warnings appear in the Match Log.
- Last-known-good fallback per source: if a new load fails, the previous working version is used (with WARN).
- `Start Battle` begins match (sim does NOT auto-start).

### Deployment
Two supported paths:
1) Local server:
   - Use `python -m http.server`
   - Edit sample bots directly in `sampleBots/`
2) GitHub Pages:
   - Repo is public
   - Bots are loaded via local folder selection in the browser.

## Bot API (current)
Inside `tick(api)`:
- `scan(fovDeg=MAX)` → `{found, distance, angle, id}` or `{found:false}`
- `turn(deg)`
- `advance(power=1)` (0..1, default 1)
- `fire()` (hitscan, max power/speed per tiers)
- `aligned(angleDeg, toleranceDeg=6)` → boolean
- `memoryGet(slot)` / `memorySet(slot, value)` → numeric memory slots
- `getState()` → `{x, y, heading, health, time, alive}`

Notes:
- `scan()` uses max range by tier. Optional fov param clamps.
- `fire()` always uses tiered max power/speed.
- `advance()` default is full power.

## Key Mechanics
- No energy system; health only.
- Shots reduce health; dead at 0.
- Fire cooldown: 1 tick.
- Stop wall behavior stuns bot for 2 ticks; 3‑tick immunity afterward.
- Spawn system: 8 possible spawn points (corners + side midpoints), randomized per match, all facing center.
- Scan cone visual: translucent pulse.
- Shot visual: tracer line + spark.
- TPS slider scales entire sim speed + clock.
- Scoring: weighted sum of health, damage (accuracy‑weighted), engagement time, distance (capped).
- Normalize Scores toggle: off / strict / gentle.
- Bot status highlighting: WARN/ERR now reflected in Bot Load Report and Scoreboard.

## Scoring Details
```
score =
  health * 2.0
  + damage * 1.2 * accuracyFactor
  + engagementTime * 2.0
  + min(distance, 2000) * 0.1

accuracyFactor = 0.5 + 0.5 * (hits / shots)
```

Normalize options:
- off
- strict: divide by points
- gentle: divide by (0.5 + points/100)

## Build Points (100)
Tiers and costs live in `spec.md`. Current key tiers:
- Max speed (1–5), turn rate (1–5)
- Sight range (1–4), sight FOV (1–4)
- Shot power (1–5), shot speed (1–5)
- Max health (1–5)
- Memory tier (0–4 slots)
- Wall behavior: stop/bounce/slide

Memory tier cost: [0,3,7,12,18]; slots: [0,1,2,3,4]

## UI Controls (current)
- Pause/Resume (fixed width)
- Step
- Reset Match
- Start Battle (disabled until bots reloaded)
- Load Bots panel (`Select Bot Folders` + `Clear Loaded`)
- Normalize Scores (off/strict/gentle)
- Match End On (timer/last bot standing)
- TPS slider

## Bot Examples
Located in `sampleBots/`:
- `twoFileBots/` contains good two-file bots:
  - `SeekerLite`, `Spinner`, `WallHugger`, `Patroller`, `SniperSimple`
- `failedBotExamples/` contains intentional error demos:
  - `BrokenJson`, `MissingField`, `RangeError`, `OverBudget`, `TickRuntime`

All examples use beginner‑friendly syntax (no `const`, no `!`, no early `return`).

## Key Decisions / History
- Initially built an inverted pendulum demo, later fully replaced with BotBattles.
- Energy system removed; replaced with health-only.
- Fire parameters removed; fire now max tier.
- Scan range removed; scan uses max range; optional FOV param remains.
- Added memory tiers + API.
- Enabled GitHub Pages hosting.
- Adjusted TPS so sim speed and clock scale together.
- Added match-end banner to scoreboard.
- Added scan/advance defaults and aligned helper.
- Moved to folder-based loading and removed JSON drag/drop and Tools panel.
- Implemented friendly errors/warnings, bot status highlighting, and last-known-good fallback.
- Updated schema to allow top-level `color`.
- Added randomized 8-point spawn system facing center.

## Known Gotchas / Notes
- Local bots are remembered in localStorage per browser.

## Open Ideas / Future
- Add error line numbers for tick syntax issues.
- Add “student quickstart” doc and rubric.
- Add optional cooldowns or scan tradeoffs if desired.
- Add “build points checker” in UI.
