# BotBattles Project Context (Deep Summary)

## Overview
BotBattles is a browser-based, p5.js arena where student-coded bots battle each other. It is designed for high‑school CS instruction and supports both local hosting and GitHub Pages deployment. Bots are configured via JSON files, loaded dynamically, and executed in a safe sandbox.

## Current Status (Working)
- Main UI works: arena, controls, match log, scoreboard, bot load report.
- Bots load from `bot-list.json` (list of bot file paths).
- Admin page exists (`/admin/`) for GitHub‑based upload/delete (teacher‑only via PAT).
- GitHub Pages hosting is live and functioning.
- Bot behavior is stable; UI is polished; scan and fire visuals are in place.

## Core Architecture
### Files
- `index.html`: main UI + styles.
- `sketch.js`: engine, rendering, bot API, scoring, load workflow.
- `bot-list.json`: list of bot JSON files to load.
- `bots/*.json`: individual bot configs.
- `bot-schema.json`: JSON schema for config validation.
- `api-cheatsheet.md`: student‑facing API reference.
- `spec.md`: formal spec.
- `admin/index.html`, `admin/admin.js`: admin UI for GitHub uploads.

### Bot Loading
- `bot-list.json` is fetched with cache‑busting.
- UI has a multi‑select (Bots) to choose which files from the list to load.
- Bots are validated against `bot-schema.json`.
- If invalid, errors appear in Bot Load Report.
- `Reload Bots` loads bots; `Start Battle` begins match (sim does NOT auto-start).

### Deployment
Two supported paths:
1) Local server:
   - Use `python -m http.server`
   - Edit bots directly in `bots/`
2) GitHub Pages:
   - Repo is public
   - `/admin/` page uses GitHub API to upload/delete bots and rebuild `bot-list.json`
   - Requires GitHub PAT (`repo` scope)

Admin token stored in `localStorage`; clear button exists in admin UI.

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
- Scan cone visual: translucent pulse.
- Shot visual: tracer line + spark.
- TPS slider scales entire sim speed + clock.
- Scoring: weighted sum of health, damage (accuracy‑weighted), engagement time, distance (capped).
- Normalize Scores toggle: off / strict / gentle.

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
- Reload Bots (pulsing glow until first click)
- Bots multi‑select list (from bot-list)
- Normalize Scores (off/strict/gentle)
- Match End On (timer/last bot standing)
- TPS slider
- Admin button (hidden on localhost/private IP)

## Bot Examples
Located in `bots/`:
- `bot-sample.json` (CornerHunter)
- `bot-random.json` (WanderSpark)
- `bot-hunter.json` (Sharpshade)
- `bot-stalker.json` (StalkerX)
- `bot-scorehawk.json` (ScoreHawk)

All examples use beginner‑friendly syntax (no `const`, no `!`, no early `return`).

## Key Decisions / History
- Initially built an inverted pendulum demo, later fully replaced with BotBattles.
- Energy system removed; replaced with health-only.
- Fire parameters removed; fire now max tier.
- Scan range removed; scan uses max range; optional FOV param remains.
- Added memory tiers + API.
- Added admin page (GitHub API uploads).
- Enabled GitHub Pages hosting.
- Adjusted TPS so sim speed and clock scale together.
- Added match-end banner to scoreboard.

## Known Gotchas / Notes
- GitHub Pages admin uses PAT; keep token private.
- Admin page is public but actions require token.
- GitHub Pages caching: cache-busting used for bot-list and bot files.
- Localhost hides Admin button automatically.

## Open Ideas / Future
- Add error line numbers for tick syntax issues.
- Add “student quickstart” doc and rubric.
- Add optional cooldowns or scan tradeoffs if desired.
- Add “build points checker” in UI.
