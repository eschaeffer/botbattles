function tick(api) {
  let target = api.scan();
  if (target.found && api.aligned(target)) {
    api.fire();
  }
  api.advance(0.2);
}