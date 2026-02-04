function tick(api) {
  let scanResult = api.scan(60);
  let sweepDir = api.memoryGet(0);

  if (sweepDir === 0) {
    sweepDir = 1;
  }

  if (scanResult.found) {
    api.turn(scanResult.angle * 0.8);

    if (api.aligned(scanResult.angle, 5)) {
      api.fire();
    } else {
      api.advance(0.4);
    }
  } else {
    api.turn(8 * sweepDir);
    api.advance(0.5);

    if (Math.random() < 0.1) {
      sweepDir = sweepDir * -1;
    }
  }

  api.memorySet(0, sweepDir);
}