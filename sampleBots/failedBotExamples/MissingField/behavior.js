function tick(api) {
  let scanResult = api.scan();
  if (scanResult.found) {
    api.turn(scanResult.angle);
    api.fire();
  } else {
    api.turn(4);
    api.advance();
  }
}