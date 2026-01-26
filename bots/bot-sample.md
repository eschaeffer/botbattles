# bot-sample.json annotated

## Reference with annotations
| JSON line | Purpose |
| --- | --- |
| `{` | Start of the bot object. |
| `  "name": "CornerHunter",` | Bot display name used in the arena and logs. |
| `  "build": {` | Build configuration (tiers that spend points). |
| `    "maxSpeedTier": 2,` | Speed tier (1-5). Higher = faster. |
| `    "turnRateTier": 3,` | Turn rate tier (1-5). Higher = faster turns. |
| `    "sightRangeTier": 2,` | Scan range tier (1-4). Higher = farther sight. |
| `    "sightFovTier": 3,` | Scan FOV tier (1-4). Higher = wider cone. |
| `    "shotPowerTier": 2,` | Shot damage tier (1-5). Higher = more damage. |
| `    "shotSpeedTier": 2,` | Shot speed tier (1-5). Higher = longer hitscan range. |
| `    "maxHealthTier": 3,` | Max health tier (1-5). Higher = more health. |
| `    "memoryTier": 0,` | Memory slots tier (0-4). Higher = more storage. |
| `    "wallBehavior": "stop"` | Wall behavior: stop, bounce, or slide. |
| `  },` | End build block. |
| `  "behavior": {` | Behavior block (bot logic). |
| `    "tick": "function tick(api) { let scanResult = api.scan(90); if (scanResult.found === false) { api.turn(5); api.advance(0.4); } else { api.turn(scanResult.angle); api.advance(0.6); let aligned = api.aligned(scanResult.angle, 8); if (aligned) { api.fire(); } } }"` | Bot logic as a JS string. Scan; wander if none found; chase and fire when aligned. |
| `  }` | End behavior block. |
| `}` | End of bot object. |

## Full JSON
```json
{
  "name": "CornerHunter",
  "build": {
    "maxSpeedTier": 2,
    "turnRateTier": 3,
    "sightRangeTier": 2,
    "sightFovTier": 3,
    "shotPowerTier": 2,
    "shotSpeedTier": 2,
    "maxHealthTier": 3,
    "memoryTier": 0,
    "wallBehavior": "stop"
  },
  "behavior": {
    "tick": "function tick(api) { let scanResult = api.scan(90); if (scanResult.found === false) { api.turn(5); api.advance(0.4); } else { api.turn(scanResult.angle); api.advance(0.6); let aligned = api.aligned(scanResult.angle, 8); if (aligned) { api.fire(); } } }"
  }
}
```
