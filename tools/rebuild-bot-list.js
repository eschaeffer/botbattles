const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const botsDir = path.join(rootDir, "bots");
const botListPath = path.join(rootDir, "bot-list.json");

if (!fs.existsSync(botsDir)) {
  console.error("bots/ folder not found.");
  process.exit(1);
}

const bots = fs.readdirSync(botsDir)
  .filter((name) => name.toLowerCase().endsWith(".json"))
  .sort()
  .map((name) => `bots/${name}`);

const data = { bots };
fs.writeFileSync(botListPath, JSON.stringify(data, null, 2));

console.log("Updated bot-list.json with", bots.length, "bots.");
