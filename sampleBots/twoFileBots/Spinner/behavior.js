function tick(api) {
  let scanResult = api.scan();

  api.turn(12);
  api.advance(0.7);

  if (scanResult.found) {
    api.turn(scanResult.angle);

    if (api.aligned(scanResult.angle, 10)) {
      api.fire();
    }
  }
}