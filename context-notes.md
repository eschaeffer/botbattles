# BotBattles project context notes

## Goal
- Build a simple p5.js BotBattles-style AI-vs-AI arena for teaching high-school CS.
- Students edit bot code only; teacher can tweak engine.

## Current status
- p5.js arena scaffold implemented (TPS 5 default, 60 FPS render, interpolation).
- UI: Pause, Step, TPS slider, Reset Match, win-condition selector.
- Logs: Match log + Bot Load Report panel (accepted/rejected bots + reasons).

## Rules and API (v1)
- Health only (0 = dead); no energy costs.
- One action set per tick: `turn`, `advance`, `scan`, `fire`.
- Bots use `tick(api)`; API methods:
  - `scan(fovDeg=MAX)` -> `{found, distance, angle, id}` or `{found:false}`
  - `turn(deg)`
  - `advance(power=1)` [0..1]
  - `fire()` hitscan
  - `aligned(angleDeg, toleranceDeg=6)` -> boolean
  - `memoryGet(slot)` / `memorySet(slot, value)` -> numeric memory slots (tier 0 = none)
  - `getState()` -> `{x, y, heading, health, time, alive}`
- Match: 120s default; win condition selectable (default most health).

## Files
- `index.html`: UI layout (arena + log panels + controls).
- `sketch.js`: Engine + UI controls + bots + validation.
- `spec.md`: Full spec including build tiers, costs, timing model.
- `bot-schema.json`: JSON schema for bot config.
- `bot-template.js`: Sample bot tick function.
- `bot-sample.json`: Loaded bots. Can be a single object, `{ "bots": [...] }`, or an array.

## Bot config loading
- `loadJSON` reads `bot-sample.json` and `bot-schema.json`.
- Schema validation with a small in-code validator (no external libs).
- Behavior tick compiled from string:
  - Prefer `"function tick(api) { ... }"` string.
  - Fallback accepts body-only string.
- Fallback bots in `sketch.js` if JSON invalid or not loaded.

## Notes
- Use a local server to load JSON (e.g., `python -m http.server 8000`).
- Pending idea: add reload-bots button and build-points checker.
