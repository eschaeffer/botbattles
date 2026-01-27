# BotBattles (p5.js) v1 Spec

## Core rules
- 2-8 bots per match, AI vs AI only.
- Arena: rectangular, solid walls.
- Match time limit: 120s (default). Match can also end when one bot remains.
- Winner on time-out: most health (default), configurable.
- Damage reduces health; health 0 = dead.
- Safe errors: student bot errors are caught and logged; bot is disabled for the match.

## Timing model
- Simulation ticks per second (TPS): 5 default.
- Rendering: runs at display frame rate (target 60 FPS).
- One action per tick (turn, advance, scan, fire). Actions apply instantly to the tick.
- Visuals interpolate between ticks for smooth motion.
- UI controls: pause, step, and TPS selector.
- Costs scale by tick duration so behavior is consistent when TPS changes.

## Bot API (student-facing)
```js
function tick(api) {
  // Called every simulation tick (default 5 TPS)
}
```

API methods:
- `api.scan(fovDeg=MAX)`
  - Returns `{ found, distance, angle, id }` or `{ found:false }`.
- `api.turn(deg)`
  - Sets desired turn for this tick; clamped to bot's max turn rate.
- `api.advance(power=1)`
  - `power` in [0,1]. Sets forward speed; default 1.0.
- `api.fire()`
- `api.getState()`
  - Read-only: `{ x, y, heading, health, time, alive }`.
- `api.aligned(angleDeg, toleranceDeg=6)`
  - Returns `true` if an angle is within tolerance.

## Hitscan weapon
- Fire uses the bot's current heading.
- First bot hit within range takes damage equal to bot's shot power tier.
- Cooldown: one shot every 1 tick.

## Wall behavior
- Stop (default): velocity set to 0 at wall.
- Bounce: reflect heading and apply speed penalty.
- Slide: movement becomes tangential to wall (higher cost, more advanced).

## Build points (100 total)
Choose one tier per category. Total points must be <= 100.

### Core movement
| Stat | Tier values | Tier costs |
| --- | --- | --- |
| Max speed | 1, 2, 3, 4, 5 | 0, 5, 12, 20, 30 |
| Turn rate (deg/tick) | 4, 7, 10, 13, 16 | 0, 4, 10, 18, 28 |

### Sensors
| Stat | Tier values | Tier costs |
| --- | --- | --- |
| Sight range (px) | 120, 200, 280, 360 | 0, 6, 14, 24 |
| Sight FOV (deg) | 30, 60, 120, 180 | 0, 6, 14, 24 |

### Weapons (hitscan)
| Stat | Tier values | Tier costs |
| --- | --- | --- |
| Shot power (damage) | 1, 2, 3, 4, 5 | 0, 6, 14, 24, 36 |
| Shot speed | 1, 2, 3, 4, 5 | 0, 4, 10, 18, 28 |

### Health
| Stat | Tier values | Tier costs |
| --- | --- | --- |
| Max health | 100, 140, 180, 220, 260 | 0, 8, 18, 30, 45 |

### Memory
| Stat | Tier values | Tier costs |
| --- | --- | --- |
| Memory slots | 0, 1, 2, 3, 4 | 0, 3, 7, 12, 18 |

### Wall behavior
- Stop: 0 pts
- Bounce: 10 pts
- Slide: 20 pts

## Defaults (if omitted)
- Max speed 2
- Turn rate 7 deg/tick
- Sight range 200 px
- Sight FOV 90 deg
- Shot power 2
- Shot speed 2
- Max health 100
- Memory slots 0

## Bot loading (current workflow)
- Bots are loaded from local files selected in the browser.
- Use the **Load Bots** panel:
  - `Select Bot Folders` where each bot folder contains one `.json` and `behavior.js`.
- Then click **Start Battle**.
- Sample bots live in `sampleBots/` for reference.
- Wall behavior Stop
