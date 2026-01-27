function tick(api) {
  let mode = api.memoryGet(0);
  let timer = api.memoryGet(1);
  let scanResult = api.scan(120);

  timer = timer + 1;

  if (scanResult.found) {
    mode = 1;
    timer = 0;
  } else if (timer > 10) {
    mode = 0;
    timer = 0;
  }

  if (mode === 1) {
    api.turn(scanResult.angle);

    if (api.aligned(scanResult.angle, 7)) {
      api.fire();
    } else {
      api.advance(0.8);
    }
  } else {
    api.turn(5);
    api.advance(1);
  }

  api.memorySet(0, mode);
  api.memorySet(1, timer);
}