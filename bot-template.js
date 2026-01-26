// Bot template for BotBattles v1.
// The engine will call tick(api) every simulation tick.

function tick(api) {
  const state = api.getState();

  // Example: scan forward, rotate slowly if nothing found.
  let scanResult = api.scan(90);
  if (scanResult.found === false) {
    api.turn(5);
    api.advance(0.4);
  } else {
    // Turn toward target and move in.
    api.turn(scanResult.angle);
    api.advance(0.6);

    // Fire if reasonably aligned.
    let aligned = api.aligned(scanResult.angle, 8);
    if (aligned) {
      api.fire();
    }
  }
}

module.exports = { tick };
