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

## api.scan(fovDeg)
Scans for the nearest bot inside a cone in front of you.

- `fovDeg`: field of view in degrees. Wider is easier to find targets.
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

## api.advance(power)
Moves forward this tick.

- `power` is in the range `[0, 1]`.
- Actual movement speed depends on `maxSpeedTier`.

Example:
```js
api.advance(0.4);
api.advance(1.0);
```

## api.fire()
Fires a hitscan shot in your current heading.

- Damage is based on your `shotPowerTier`.
- Range is based on your `shotSpeedTier`.
- Hits the first bot in the line of fire.
- Cooldown: one shot every 1 tick.

Hitscan range formula (current engine):
- `range = 140 + shotSpeedTier * 60`

Example:
```js
api.fire();
```

## api.aligned(angleDeg, toleranceDeg=6)
Returns `true` if a target angle is within the given tolerance.

- `angleDeg`: the angle you got from `scanResult.angle`.
- `toleranceDeg`: optional, defaults to 6 degrees.

Example:
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
