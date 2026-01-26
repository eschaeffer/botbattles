# bot-sample.json (readable version)

This is the same logic as `bot-sample.json`, formatted for readability.

```js
function tick(api) {
  // Look for a target in front of us.
  let scanResult = api.scan(90);

  // If nothing is found, wander.
  if (scanResult.found === false) {
    api.turn(5);
    api.advance(0.4);
  } else {
    // Turn toward the target and move in.
    api.turn(scanResult.angle);
    api.advance(0.6);

    // Fire when aligned.
    let aligned = api.aligned(scanResult.angle, 8);
    if (aligned) {
      api.fire();
    }
  }
}
```
