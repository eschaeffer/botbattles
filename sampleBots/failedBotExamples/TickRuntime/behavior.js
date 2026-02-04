function tick(api) {
  // This triggers a friendly API warning (wrong type).
  api.advance("fast");

  // This causes a runtime error and disables the bot.
  notDefinedYet = notDefinedYet + 1;

  api.turn(5);
}