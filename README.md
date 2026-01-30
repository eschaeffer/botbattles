# BotBattles

BotBattles is a browser-based, p5.js arena where student-coded bots battle each other. It is designed for high‑school CS instruction and supports local or GitHub Pages hosting. Bots are configured via JSON and a separate `behavior.js` file, loaded locally through the UI, and executed in a safe sandbox.

## Quick Start
1) Serve the folder (any static server works).
- Example: `python -m http.server`
2) Open the site in a modern browser.
3) Click **Load Bots → Select Bot Folders** and choose a parent folder that contains multiple bot folders.
4) Click **Start Battle**.

## Bot Folder Format
Each bot lives in its own folder:
```
MyBot/
  bot-mine.json
  behavior.js
```
- The JSON file can be any name.
- `behavior.js` must be named exactly `behavior.js`.

## Key Features
- Tick-based simulation (default 5 TPS)
- Friendly load/runtime errors and warnings
- Scoreboard with engagement, accuracy, and survival emphasis
- Build budget selector (100..200)
- Randomized 8-point spawn system (corners + side midpoints)

## Repository Layout
- `index.html`: main UI and styling
- `sketch.js`: simulation engine, bot API, scoring, UI logic
- `bot-schema.json`: JSON schema for bot configs
- `sampleBots/`: example bots and error demos
  - `sampleBots/twoFileBots/`: working two‑file bot examples
  - `sampleBots/failedBotExamples/`: intentional error examples
- `docs/Google Docs/`: original teacher/student docs (.docx)
- `docs/markdown/`: Markdown conversions of the docs
- `api-cheatsheet.md`: student‑facing API reference
- `spec.md`: formal spec with tiers, costs, and mechanics
- `feature-list.md`: v2 ideas backlog
- `context.md`: deep project summary and decision history
- `context-notes.md`: quick project notes

## Bot API (Summary)
Inside `behavior.js`:
```js
function tick(api) {
  // one call per simulation tick
}
```
Key methods:
- `api.scan(fovDeg=MAX)` (once per tick)
- `api.turn(deg)`
- `api.advance(power=1)`
- `api.fire()` (1‑tick cooldown)
- `api.aligned(targetOrAngle, toleranceDeg=6)`
- `api.memoryGet(slot)` / `api.memorySet(slot, value)`
- `api.getState()`

See `api-cheatsheet.md` for full details and examples.

## Notes
- Bots are loaded locally via the UI; they are not fetched from the server.
- The match is deterministic under fixed conditions (same spawns, no randomness).

---

If you want to host this publicly or tailor it for your class, see the docs in `docs/`.