# BotBattles API Cheatsheet

This is the student-facing API available inside `tick(api)`.

## tick(api)
Called once per simulation tick. Use it to decide actions for this tick.

Example:
```js
function tick(api) {
  let scanResult = api.scan(90);
  if (scanResult.found === false) {
    api.turn(6);
    api.advance(0.5);
  } else {
    api.turn(scanResult.angle);
    api.advance(0.7);
    let aligned = api.aligned(scanResult.angle);
    if (aligned) {
      api.fire();
    }
  }
}
```

## api.scan(fovDeg=MAX)
Scans for the nearest bot inside a cone in front of you.

- `fovDeg`: field of view in degrees. Default is your max FOV tier.
- Range is capped by your `sightRangeTier`.
- FOV is capped by your `sightFovTier`.

Returns:
- `{ found:false }` if nothing is seen.
- `{ found:true, distance, angle, id }` if a bot is seen.

Notes:
- `angle` is the offset from your current heading (degrees).
- Positive angles mean clockwise rotation (right turn).

Example:
```js
let scanResult = api.scan();
let scanResult = api.scan(60);
let aligned = api.aligned(scanResult.angle, 10);
if (scanResult.found === true && aligned) {
  api.fire();
}
```

## api.turn(deg)
Rotates your heading by `deg` degrees this tick.

- Positive = clockwise, negative = counterclockwise.
- Your maximum per tick is capped by `turnRateTier`.

Example:
```js
api.turn(8);
api.turn(-5);
```

## api.advance(power=1)
Moves forward this tick.

- `power` is in the range `[0, 1]`, default is `1`.
- Actual movement speed depends on `maxSpeedTier`.

Example:
```js
api.advance(0.4);
api.advance(1.0);
api.advance();
```

## api.fire()
Fires a hitscan shot in your current heading.

- Damage is based on your `shotPowerTier`.
- Range is based on your `shotRangeTier`.
- Hits the first bot in the line of fire.
- Cooldown: one shot every 1 tick.

Hitscan range formula (current engine):
- `range = 140 + shotRangeTier * 60`

Example:
```js
api.fire();
```

## api.aligned(targetOrAngle, toleranceDeg=6)
Returns `true` if a target is within the given tolerance.

- Pass a **scan result** (recommended), or an **angle** in degrees.
- `toleranceDeg`: optional, defaults to 6 degrees.

Examples:
```js
let scanResult = api.scan();
let aligned = api.aligned(scanResult, 8);
```

```js
let aligned = api.aligned(scanResult.angle, 8);
```

## api.memoryGet(slot)
Returns a number stored in a memory slot.

- `slot` is an integer index starting at 0.
- Number of slots is set by `memoryTier` (tier 0 = 0 slots, tier 4 = 4 slots).

Example:
```js
let turns = api.memoryGet(0);
```

## api.memorySet(slot, value)
Stores a number in a memory slot.

- `value` must be a number.
- Out-of-range slots are ignored.

Example:
```js
api.memorySet(0, turns + 1);
```

## Loading bots locally (student/teacher)
Use the **Load Bots** panel on the main page:
- `Select Bot Folders`: load bot folders where each folder contains:
  - one bot config `.json` file, and
  - one `behavior.js` file with the `tick` function code.

Loaded bots are remembered for the next visit on the same browser.
Errors show in the **Bot Load Report**. Tips and warnings appear in the **Match Log**.
If a bot fails to load but a previous version worked, BotBattles will use the last working version and warn you.

### Example bot folder layout
```text
MyBot/
  bot-mybot.json
  behavior.js
```

`behavior.js` should contain your `tick` function, for example:
```js
function tick(api) {
  let scanResult = api.scan();
  if (scanResult.found) {
    api.turn(scanResult.angle);
    if (api.aligned(scanResult.angle)) {
      api.fire();
    }
  } else {
    api.turn(6);
    api.advance();
  }
}
```

## api.getState()
Returns your current state:
```js
{
  x, y, heading, health, time, alive
}
```

Notes:
- `heading` is in degrees.
- Coordinate system: `(0,0)` is top-left of the arena.
- Heading 0 = right, 90 = down, 180 = left, 270 = up.
