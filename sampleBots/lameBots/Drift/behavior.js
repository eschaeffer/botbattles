function tick(api) {
  let target = api.scan();
  if (target.found) {
    api.turn(target.angle);
  }
  api.advance(0.2);
}