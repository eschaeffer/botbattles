function tick(api) {
  let scanResult = api.scan();

  if (scanResult.found) {
    api.turn(scanResult.angle);

    if (api.aligned(scanResult.angle)) {
      api.fire();
    } else {
      api.advance(0.6);
    }
  } else {
    api.turn(6);
    api.advance(0.8);
  }
}