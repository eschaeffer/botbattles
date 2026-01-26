# bot-random.json annotated

## Reference with annotations
| JSON line | Purpose |
| --- | --- |
| `{` | Start of the bot object. |
| `  "name": "WanderSpark",` | Bot display name used in the arena and logs. |
| `  "build": {` | Build configuration (tiers that spend points). |
| `    "maxSpeedTier": 1,` | Speed tier (1-5). Lower = slower. |
| `    "turnRateTier": 2,` | Turn rate tier (1-5). Modest turning. |
| `    "sightRangeTier": 1,` | Minimal scan range (1-4). |
| `    "sightFovTier": 2,` | Narrowish scan cone (1-4). |
| `    "shotPowerTier": 1,` | Minimal damage per hit (1-5). |
| `    "shotSpeedTier": 1,` | Shortest hitscan range (1-5). |
| `    "maxHealthTier": 2,` | Modest health pool (1-5). |
| `    "memoryTier": 0,` | Memory slots tier (0-4). |
| `    "wallBehavior": "stop"` | Wall behavior: stop, bounce, or slide. |
| `  },` | End build block. |
| `  "behavior": {` | Behavior block (bot logic). |
| `    "tick": "function tick(api) { let roll = Math.random(); if (roll < 0.3) { api.turn(12); } else if (roll < 0.6) { api.turn(-10); } api.advance(0.4); if (roll > 0.85) { api.fire(); } }"` | Unsophisticated bot logic: random turns, constant move, occasional fire. |
| `  }` | End behavior block. |
| `}` | End of bot object. |

## Full JSON
```json
{
  "name": "WanderSpark",
  "build": {
    "maxSpeedTier": 1,
    "turnRateTier": 2,
    "sightRangeTier": 1,
    "sightFovTier": 2,
    "shotPowerTier": 1,
    "shotSpeedTier": 1,
    "maxHealthTier": 2,
    "memoryTier": 0,
    "wallBehavior": "stop"
  },
  "behavior": {
    "tick": "function tick(api) { let roll = Math.random(); if (roll < 0.3) { api.turn(12); } else if (roll < 0.6) { api.turn(-10); } api.advance(0.4); if (roll > 0.85) { api.fire(); } }"
  }
}
```
