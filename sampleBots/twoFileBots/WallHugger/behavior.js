function tick(api) {
  let scanResult = api.scan(90);
  let wallTimer = api.memoryGet(0);

  if (scanResult.found) {
    api.turn(scanResult.angle);
    wallTimer = 0;

    if (api.aligned(scanResult.angle, 8)) {
      api.fire();
    } else {
      api.advance(0.7);
    }
  } else {
    wallTimer = wallTimer + 1;

    if (wallTimer > 6) {
      api.turn(20);
      wallTimer = 0;
    } else {
      api.turn(4);
    }

    api.advance(0.9);
  }

  api.memorySet(0, wallTimer);
}