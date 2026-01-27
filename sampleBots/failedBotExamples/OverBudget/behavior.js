function tick(api) {
  let scanResult = api.scan();
  if (scanResult.found) {
    api.turn(scanResult.angle);
    api.fire();
  }
  api.advance();
}