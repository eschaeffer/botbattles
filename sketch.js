/* global createCanvas, createButton, createSlider, createSpan, createSelect, createCheckbox, select, background, width, height, windowWidth, windowHeight */
/* global radians, degrees, cos, sin, min, max, lerp, millis, noFill, noStroke, fill, stroke, strokeWeight, ellipse, line, rect, text, textAlign, textSize, loadJSON, beginShape, vertex, endShape */

const BASE_TPS = 5;
const MAX_LOG_LINES = 16;
const FIRE_COOLDOWN_TICKS = 1;
const WARNING_CHECK_SECONDS = 6;

const scoring = {
  healthWeight: 2.0,
  damageWeight: 1.2,
  engagementWeight: 2.0,
  distanceWeight: 0.1,
  distanceCap: 2000,
  accuracyMin: 0.5,
};

const tiers = {
  maxSpeed: [1, 2, 3, 4, 5],
  turnRate: [4, 7, 10, 13, 16],
  sightRange: [120, 200, 280, 360],
  sightFov: [30, 60, 120, 180],
  shotPower: [2, 4, 6, 8, 10],
  shotRange: [1, 2, 3, 4, 5],
  maxHealth: [100, 140, 180, 220, 260],
  memorySlots: [0, 1, 2, 3, 4],
};

const costs = {
  maxSpeed: [0, 5, 12, 20, 30],
  turnRate: [0, 4, 10, 18, 28],
  sightRange: [0, 6, 14, 24],
  sightFov: [0, 6, 14, 24],
  shotPower: [0, 6, 14, 24, 36],
  shotRange: [0, 4, 10, 18, 28],
  maxHealth: [0, 8, 18, 30, 45],
  memorySlots: [0, 3, 7, 12, 18],
  wallBehavior: {
    stop: 0,
    bounce: 10,
    slide: 20,
  },
};

const match = {
  tps: BASE_TPS,
  isPaused: false,
  isSim: false,
  time: 0,
  timeLimit: 120,
  endCondition: "timer",
  normalizeScore: "off",
  budget: 100,
  lastTickAt: 0,
  accumulator: 0,
  tickCount: 0,
  lastWarningCheck: 0,
  supportShown: false,
  lastWinner: null,
  hasStarted: false,
  isOver: false,
};

const arena = {
  padding: 18,
  radius: 16,
};

const logs = [];
const shotEffects = [];
const scanEffects = [];

const bots = [];
let canvas;
let tpsSlider;
let pauseButton;
let stepButton;
let resetButton;
let startButton;
let normalizeSelect;
let endConditionSelect;
let logOutput;
let loadOutput;
let scoreOutput;
let sketchHolderEl;
let botConfigs = [];
let botSchema;
let localLoadBtn;
let localFileInput;
let localFolderBtn;
let localFolderInput;
let dropZone;
let localClearBtn;
let loadErrors = [];
let loadReport = [];
let lastGoodBySource = {};
let botStatusByName = {};

function preload() {
  const schemaUrl = "bot-schema.json?v=" + Date.now();
  botSchema = loadJSON(schemaUrl, () => {}, () => {
    loadErrors.push("Failed to load bot-schema.json. Schema validation disabled.");
    botSchema = null;
  });
}

function setup() {
  sketchHolderEl = select("#sketch-holder");
  canvas = createCanvas(getCanvasWidth(), getCanvasHeight());
  canvas.parent("sketch-holder");

  setupControls();
  logOutput = select("#log-output");
  loadOutput = select("#load-output");
  scoreOutput = select("#score-output");
  loadLastGoodStore();
  setupLocalLoaders();
  restoreLocalBotsFromStorage();

  match.isPaused = true;
  resetMatch({ silent: true, keepPaused: true });
}

function draw() {
  background(10, 14, 18);
  drawArena();

  const now = millis();
  const frameTime = min(0.05, (now - match.lastTickAt) / 1000);
  match.lastTickAt = now;

  if (!match.isPaused) {
    match.accumulator += frameTime;
    const tickDt = 1 / match.tps;
    while (match.accumulator >= tickDt) {
      runTick(tickDt);
      match.accumulator -= tickDt;
    }
  }

  const tickDt = 1 / match.tps;
  const alpha = match.isPaused ? 1 : match.accumulator / tickDt;
  renderBots(alpha);
  renderScans();
  renderShots();
  updateScoreboard();
  renderHud();
}

function setupControls() {
  const controls = select("#controls");

  pauseButton = createButton("Pause");
  pauseButton.parent(controls);
  pauseButton.addClass("pause-button");
  pauseButton.attribute("disabled", true);
  pauseButton.mousePressed(togglePause);

  stepButton = createButton("Step");
  stepButton.parent(controls);
  stepButton.class("secondary");
  stepButton.mousePressed(stepOnce);

  resetButton = createButton("Reset<br>Match");
  resetButton.parent(controls);
  resetButton.addClass("btn-break");
  resetButton.mousePressed(resetMatch);

  startButton = createButton("Start<br>Battle");
  startButton.parent(controls);
  startButton.attribute("disabled", true);
  startButton.addClass("btn-break");
  startButton.mousePressed(startBattle);

  const normalizeWrap = createControl(controls, "Normalize Scores");
  normalizeSelect = createSelect();
  normalizeSelect.parent(normalizeWrap);
  normalizeSelect.option("off");
  normalizeSelect.option("strict");
  normalizeSelect.option("gentle");
  normalizeSelect.selected(match.normalizeScore);
  normalizeSelect.changed(() => {
    match.normalizeScore = normalizeSelect.value();
  });

  const budgetWrap = createControl(controls, "Build Budget");
  const budgetSelect = createSelect();
  budgetSelect.parent(budgetWrap);
  [100, 120, 140, 160, 180, 200].forEach((value) => {
    budgetSelect.option(String(value));
  });
  budgetSelect.selected(String(match.budget));
  budgetSelect.changed(() => {
    match.budget = Number(budgetSelect.value());
    logEvent("Budget set to " + match.budget + " points.");
  });

  const endWrap = createControl(controls, "Match End On");
  endConditionSelect = createSelect();
  endConditionSelect.parent(endWrap);
  endConditionSelect.option("timer");
  endConditionSelect.option("last bot standing");
  endConditionSelect.selected(match.endCondition);
  endConditionSelect.changed(() => {
    match.endCondition = endConditionSelect.value();
    logEvent("Match end set to " + match.endCondition + ".");
  });

  const tpsWrap = createControl(controls, "Sim Speed");
  tpsSlider = createSlider(1, 20, BASE_TPS, 1);
  tpsSlider.parent(tpsWrap);
  tpsSlider.input(() => {
    match.tps = tpsSlider.value();
  });
}

function createControl(parentEl, labelText) {
  const wrap = createSpan();
  wrap.parent(parentEl);
  wrap.class("control");
  const label = createSpan(labelText);
  label.parent(wrap);
  return wrap;
}

function initBots() {
  bots.length = 0;
  botStatusByName = {};
  loadErrors.forEach((message) => logEvent(message));
  loadErrors = [];

  if (!botConfigs.length) {
    loadReport.push({ name: "Local", ok: false, level: "err", detail: "No bots loaded yet." });
    updateLoadPanel();
    return;
  }

  botConfigs.forEach((item) => {
    const config = item.config;
    const source = item.source;
    const evaluated = evaluateBotConfig(config);
    if (evaluated.ok) {
      bots.push(makeBot({
        name: evaluated.name,
        color: evaluated.color,
        build: evaluated.build,
        points: evaluated.points,
        tick: evaluated.tick,
      }));
      setBotStatus(evaluated.name, "ok", "Loaded normally.");
      saveLastGoodForSource(source, config);
      loadReport.push({
        name: evaluated.name,
        ok: true,
        level: "ok",
        detail: "Loaded (" + evaluated.points + " pts) [" + source + "]",
      });
      return;
    }

    const fallback = getLastGoodForSource(source);
    if (fallback) {
      const fallbackEval = evaluateBotConfig(fallback);
      if (fallbackEval.ok) {
        bots.push(makeBot({
          name: fallbackEval.name,
          color: fallbackEval.color,
          build: fallbackEval.build,
          points: fallbackEval.points,
          tick: fallbackEval.tick,
        }));
        const warnMsg = "Used last working version. Latest error: " + evaluated.detail;
        setBotStatus(fallbackEval.name, "warn", warnMsg);
        logEvent("Fallback: " + fallbackEval.name + " (" + evaluated.detail + ")");
        loadReport.push({
          name: fallbackEval.name,
          ok: true,
          level: "warn",
          detail: warnMsg + " [" + source + "]",
        });
        return;
      }
    }

    const name = evaluated.name;
    const detail = evaluated.detail;
    logEvent("Config issue: " + name + " (" + detail + ")");
    loadReport.push({ name, ok: false, level: "err", detail: detail + " [" + source + "]" });
  });

  if (bots.length === 0) {
    logEvent("No valid bots loaded.");
  }
  updateLoadPanel();
}

function resetMatch(options) {
  const silent = options && options.silent;
  const keepPaused = options && options.keepPaused;
  match.time = 0;
  match.accumulator = 0;
  match.tickCount = 0;
  match.lastWarningCheck = 0;
  match.supportShown = false;
  match.lastTickAt = millis();
  match.isOver = false;
  if (!keepPaused) {
    match.isPaused = false;
  }
  match.lastWinner = null;
  if (!keepPaused) {
    pauseButton.html("Pause");
  }

  const bounds = getArenaBounds();
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;
  const edgeInset = 70;

  const spawnPoints = [
    { x: bounds.x + edgeInset, y: bounds.y + edgeInset },
    { x: bounds.x + bounds.w - edgeInset, y: bounds.y + edgeInset },
    { x: bounds.x + bounds.w - edgeInset, y: bounds.y + bounds.h - edgeInset },
    { x: bounds.x + edgeInset, y: bounds.y + bounds.h - edgeInset },
    { x: bounds.x + bounds.w / 2, y: bounds.y + edgeInset },
    { x: bounds.x + bounds.w - edgeInset, y: bounds.y + bounds.h / 2 },
    { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h - edgeInset },
    { x: bounds.x + edgeInset, y: bounds.y + bounds.h / 2 },
  ].map((pt) => {
    const heading = (degrees(Math.atan2(centerY - pt.y, centerX - pt.x)) + 360) % 360;
    return { x: pt.x, y: pt.y, heading };
  });

  const positions = shuffleInPlace(spawnPoints.slice());

  bots.forEach((bot, index) => {
    const pos = positions[index % positions.length];
    bot.x = pos.x;
    bot.y = pos.y;
    bot.heading = pos.heading;
    bot.health = bot.stats.maxHealth;
    bot.statsData = {
      damage: 0,
      shotsFired: 0,
      shotsHit: 0,
      distance: 0,
      engagement: 0,
      actions: { scan: 0, turn: 0, advance: 0, fire: 0 },
      lastActionTime: 0,
      lastX: bot.x,
      lastY: bot.y,
    };
    bot.memory = Array.from({ length: bot.stats.memorySlots }, () => 0);
    bot.alive = true;
    bot.disabled = false;
    bot.warned = new Set();
    bot.prev = { x: bot.x, y: bot.y, heading: bot.heading };
    bot.wallSlow = 1;
    bot.fireCooldown = 0;
    bot.scanCooldown = 0;
    bot.stunTicks = 0;
    bot.stunImmunity = 0;
  });

  logs.length = 0;
  if (!silent) {
    logEvent("Match reset. TPS " + match.tps + ".");
  }
}

function runTick(dt) {
  match.time += dt * (match.tps / BASE_TPS);
  match.tickCount += 1;
  let timeExpired = false;
  if (match.endCondition === "timer" && match.time >= match.timeLimit) {
    match.isPaused = true;
    timeExpired = true;
    resolveTimeOutcome();
  }

  bots.forEach((bot) => {
    bot.prev = { x: bot.x, y: bot.y, heading: bot.heading };
  });

  bots.forEach((bot) => {
    if (!bot.alive || bot.disabled) {
      return;
    }

    bot.turnCmd = 0;
    bot.advanceCmd = 0;
    bot.fireCmd = null;
    if (bot.fireCooldown > 0) {
      bot.fireCooldown -= 1;
    }
    if (bot.scanCooldown > 0) {
      bot.scanCooldown -= 1;
    }
    if (bot.stunImmunity > 0) {
      bot.stunImmunity -= 1;
    }
    if (bot.stunTicks > 0) {
      bot.stunTicks -= 1;
      if (bot.stunTicks === 0) {
        bot.stunImmunity = 3;
      }
      return;
    }

    const api = makeApi(bot, dt);
    try {
      bot.tick(api);
    } catch (err) {
      bot.disabled = true;
      handleBotRuntimeError(bot, err);
    }
  });

  bots.forEach((bot) => {
    if (!bot.alive || bot.disabled) {
      return;
    }

    applyTurn(bot, dt);
    applyMove(bot, dt);
    updateMovementStats(bot);
  });

  resolveBotCollisions();
  resolveWallCollisions();
  resolveShots();
  updateEngagementStats(dt);
  if (match.time - match.lastWarningCheck >= WARNING_CHECK_SECONDS) {
    checkBotsForWarnings();
    match.lastWarningCheck = match.time;
  }

  bots.forEach((bot) => {
    if (!bot.alive) {
      return;
    }
    if (bot.health <= 0) {
      bot.alive = false;
      logEvent(bot.name + " is destroyed.");
    }
  });

  if (!timeExpired || match.endCondition === "last bot standing") {
    resolveSurvivalOutcome();
  }
}

function makeBot({ name, color, build, points, tick }) {
  const stats = resolveStats(build);
  return {
    name,
    color,
    build,
    points: points || 0,
    stats,
    tick,
    x: 0,
    y: 0,
    heading: 0,
    health: stats.maxHealth,
    statsData: {
      damage: 0,
      shotsFired: 0,
      shotsHit: 0,
      distance: 0,
      engagement: 0,
      lastX: 0,
      lastY: 0,
    },
    memory: Array.from({ length: stats.memorySlots }, () => 0),
    alive: true,
    disabled: false,
    turnCmd: 0,
    advanceCmd: 0,
    fireCmd: null,
    fireCooldown: 0,
    stunTicks: 0,
    stunImmunity: 0,
    prev: { x: 0, y: 0, heading: 0 },
    wallSlow: 1,
  };
}

function resolveStats(build) {
  return {
    maxSpeed: tiers.maxSpeed[build.maxSpeedTier - 1],
    turnRate: tiers.turnRate[build.turnRateTier - 1],
    sightRange: tiers.sightRange[build.sightRangeTier - 1],
    sightFov: tiers.sightFov[build.sightFovTier - 1],
    shotPower: tiers.shotPower[build.shotPowerTier - 1],
    shotRange: tiers.shotRange[build.shotRangeTier - 1],
    maxHealth: tiers.maxHealth[build.maxHealthTier - 1],
    memorySlots: tiers.memorySlots[build.memoryTier],
    wallBehavior: build.wallBehavior,
  };
}

function statusRank(level) {
  if (level === "err") {
    return 2;
  }
  if (level === "warn") {
    return 1;
  }
  return 0;
}

function setBotStatus(name, level, message) {
  if (!name) {
    return;
  }
  const next = { level: level || "ok", message: message || "" };
  const current = botStatusByName[name];
  if (current && statusRank(current.level) > statusRank(next.level)) {
    return;
  }
  botStatusByName[name] = next;
}

function warnBot(bot, key, message) {
  if (!bot) {
    return;
  }
  if (!bot.warned) {
    bot.warned = new Set();
  }
  if (bot.warned.has(key)) {
    return;
  }
  bot.warned.add(key);
  logEvent("Tip (" + bot.name + "): " + message);
}

function trackAction(bot, action) {
  if (!bot || !bot.statsData) {
    return;
  }
  if (!bot.statsData.actions) {
    bot.statsData.actions = { scan: 0, turn: 0, advance: 0, fire: 0 };
  }
  bot.statsData.actions[action] = (bot.statsData.actions[action] || 0) + 1;
  bot.statsData.lastActionTime = match.time;
}

function handleBotRuntimeError(bot, err) {
  const message = err && err.message ? err.message : "Unknown error";
  warnBot(bot, "runtime-error", "tick() stopped due to an error: " + message);
  setBotStatus(bot.name, "warn", "Runtime error: " + message);
  loadReport.push({
    name: bot.name,
    ok: true,
    level: "warn",
    detail: "Disabled at runtime: " + message,
  });
  updateLoadPanel();
}

function makeApi(bot, dt) {
  const tpsScale = dt * BASE_TPS;
  return {
    scan: (fovDeg) => doScan(bot, fovDeg),
    turn: (deg) => doTurn(bot, deg, tpsScale),
    advance: (power) => doAdvance(bot, power, tpsScale),
    fire: () => doFire(bot),
    aligned: (targetOrAngle, toleranceDeg) => doAligned(bot, targetOrAngle, toleranceDeg),
    memoryGet: (slot) => getMemory(bot, slot),
    memorySet: (slot, value) => setMemory(bot, slot, value),
    getState: () => ({
      x: bot.x,
      y: bot.y,
      heading: bot.heading,
      health: bot.health,
      time: match.time,
      alive: bot.alive,
    }),
  };
}

function doScan(bot, fovDeg) {
  if (bot.scanCooldown > 0) {
    warnBot(bot, "scan-cooldown", "scan() can only be used once per tick.");
    return { found: false };
  }
  bot.scanCooldown = 1;
  trackAction(bot, "scan");
  let usedFov = fovDeg;
  if (usedFov === undefined) {
    usedFov = bot.stats.sightFov;
  } else if (!Number.isFinite(usedFov)) {
    warnBot(bot, "scan-nan", "scan(fov) needs a number. Using max FOV.");
    usedFov = bot.stats.sightFov;
  }
  const fov = clamp(usedFov, 10, bot.stats.sightFov);
  if (Number.isFinite(fovDeg) && (fovDeg < 10 || fovDeg > bot.stats.sightFov)) {
    warnBot(bot, "scan-range", "scan(fov) is clamped to 10.." + bot.stats.sightFov + ".");
  }
  const range = bot.stats.sightRange;
  recordScanEffect(bot, fov, range);

  const headingRad = radians(bot.heading);
  const best = getNearestTargetInCone(bot, headingRad, fov, range);
  if (!best) {
    return { found: false };
  }

  return {
    found: true,
    distance: best.distance,
    angle: degrees(best.angleOffset),
    id: best.target.name,
  };
}

function doTurn(bot, deg, tpsScale) {
  if (!Number.isFinite(deg)) {
    warnBot(bot, "turn-nan", "turn(deg) needs a number. Turn ignored.");
    return;
  }
  trackAction(bot, "turn");
  bot.turnCmd += deg;
}

function doAdvance(bot, power, tpsScale) {
  let usedPower = power;
  if (usedPower === undefined) {
    usedPower = 1;
  } else if (!Number.isFinite(usedPower)) {
    warnBot(bot, "advance-nan", "advance(power) needs a number from 0..1. Using 1.");
    usedPower = 1;
  }
  if (Number.isFinite(usedPower) && (usedPower < 0 || usedPower > 1)) {
    warnBot(bot, "advance-range", "advance(power) is clamped to 0..1.");
  }
  trackAction(bot, "advance");
  const capped = clamp(usedPower, 0, 1);
  bot.advanceCmd = max(bot.advanceCmd, capped);
}

function doFire(bot) {
  if (bot.fireCooldown > 0) {
    warnBot(bot, "fire-cooldown", "fire() has a short cooldown. Firing too often does nothing.");
    return;
  }
  trackAction(bot, "fire");
  bot.fireCmd = { power: bot.stats.shotPower, rangeTier: bot.stats.shotRange };
  bot.statsData.shotsFired += 1;
  bot.fireCooldown = FIRE_COOLDOWN_TICKS;
}

function doAligned(bot, targetOrAngle, toleranceDeg) {
  let angleDeg = targetOrAngle;
  if (targetOrAngle && typeof targetOrAngle === "object") {
    if (targetOrAngle.found === false) {
      return false;
    }
    angleDeg = targetOrAngle.angle;
  }
  if (!Number.isFinite(angleDeg)) {
    warnBot(bot, "aligned-nan", "aligned(target, tolerance) needs a scan result or an angle.");
    return false;
  }
  let tolerance = toleranceDeg;
  if (tolerance === undefined) {
    tolerance = 6;
  } else if (!Number.isFinite(tolerance) || tolerance <= 0) {
    warnBot(bot, "aligned-tol", "aligned(angle, tolerance) needs a positive number. Using 6.");
    tolerance = 6;
  }
  return Math.abs(angleDeg) <= tolerance;
}

function getMemory(bot, slot) {
  if (!bot.memory.length) {
    warnBot(bot, "memory-none", "This bot has no memory slots. Increase memoryTier to use memory.");
    return 0;
  }
  const index = Math.floor(slot);
  if (index < 0 || index >= bot.memory.length) {
    warnBot(bot, "memory-slot", "memory slot out of range. Valid slots: 0.." + (bot.memory.length - 1) + ".");
    return 0;
  }
  return bot.memory[index];
}

function setMemory(bot, slot, value) {
  if (!bot.memory.length) {
    warnBot(bot, "memory-none-set", "This bot has no memory slots. memorySet() ignored.");
    return;
  }
  const index = Math.floor(slot);
  if (index < 0 || index >= bot.memory.length) {
    warnBot(bot, "memory-slot-set", "memory slot out of range. memorySet() ignored.");
    return;
  }
  if (!Number.isFinite(value)) {
    warnBot(bot, "memory-value", "memorySet(slot, value) needs a number.");
    return;
  }
  bot.memory[index] = value;
}

function applyTurn(bot, dt) {
  const maxTurn = bot.stats.turnRate;
  const applied = clamp(bot.turnCmd, -maxTurn, maxTurn);
  bot.heading = (bot.heading + applied + 360) % 360;
}

function applyMove(bot, dt) {
  const headingRad = radians(bot.heading);
  const baseSpeed = bot.stats.maxSpeed * 12;
  const speed = baseSpeed * bot.advanceCmd * bot.wallSlow;
  bot.wallSlow = 1;
  bot.x += cos(headingRad) * speed;
  bot.y += sin(headingRad) * speed;
}

function resolveBotCollisions() {
  for (let i = 0; i < bots.length; i++) {
    for (let j = i + 1; j < bots.length; j++) {
      const a = bots[i];
      const b = bots[j];
      if (!a.alive || !b.alive) {
        continue;
      }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = arena.radius * 2;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function resolveWallCollisions() {
  const bounds = getArenaBounds();
  bots.forEach((bot) => {
    if (!bot.alive) {
      return;
    }
    const left = bounds.x + arena.radius;
    const right = bounds.x + bounds.w - arena.radius;
    const top = bounds.y + arena.radius;
    const bottom = bounds.y + bounds.h - arena.radius;

    let hitVertical = false;
    let hitHorizontal = false;

    if (bot.x < left) {
      bot.x = left;
      hitVertical = true;
    } else if (bot.x > right) {
      bot.x = right;
      hitVertical = true;
    }

    if (bot.y < top) {
      bot.y = top;
      hitHorizontal = true;
    } else if (bot.y > bottom) {
      bot.y = bottom;
      hitHorizontal = true;
    }

    if (hitVertical || hitHorizontal) {
      if (bot.stats.wallBehavior === "bounce") {
        if (hitVertical) {
          bot.heading = (180 - bot.heading + 360) % 360;
        }
        if (hitHorizontal) {
          bot.heading = (-bot.heading + 360) % 360;
        }
        bot.wallSlow = 0.6;
      } else if (bot.stats.wallBehavior === "slide") {
        if (hitVertical) {
          bot.heading = sin(radians(bot.heading)) >= 0 ? 90 : 270;
        }
        if (hitHorizontal) {
          bot.heading = cos(radians(bot.heading)) >= 0 ? 0 : 180;
        }
      } else if (bot.stats.wallBehavior === "stop") {
        if (bot.stunImmunity === 0) {
          bot.stunTicks = 2;
        }
      }
    }
  });
}

function resolveShots() {
  bots.forEach((bot) => {
    if (!bot.alive || bot.disabled || !bot.fireCmd) {
      return;
    }
    const range = 140 + bot.fireCmd.rangeTier * 60;
    const hit = raycastBot(bot, range);
    recordShotEffect(bot, hit, range);
    if (hit) {
      hit.health = clamp(hit.health - bot.fireCmd.power, 0, hit.stats.maxHealth);
      bot.statsData.damage += bot.fireCmd.power;
      bot.statsData.shotsHit += 1;
      logEvent(bot.name + " hit " + hit.name + " (" + bot.fireCmd.power + ")");
    }
  });
}

function resolveSurvivalOutcome() {
  const survivors = bots.filter((bot) => bot.alive);
  if (survivors.length <= 1) {
    match.isPaused = true;
    match.isOver = true;
    match.lastWinner = survivors.length === 1 ? survivors[0].name : null;
    if (match.isSim) {
      return;
    }
    if (survivors.length === 1) {
      const score = computeScore(survivors[0]);
      logEvent("Winner: " + survivors[0].name + " (" + score.toFixed(1) + " pts).");
    } else {
      logEvent("No bots remaining.");
    }
    maybeShowSupportOverlay();
  }
}

function resolveTimeOutcome() {
  if (!match.isSim) {
    logEvent("Time limit reached.");
  }
  match.isOver = true;
  let best = null;
  bots.forEach((bot) => {
    if (!best || bot.health > best.health) {
      best = bot;
    }
  });
  if (best) {
    match.lastWinner = best.name;
    if (!match.isSim) {
      const score = computeScore(best);
      logEvent("Winner: " + best.name + " (" + score.toFixed(1) + " pts).");
    }
  } else {
    match.lastWinner = null;
    if (!match.isSim) {
      logEvent("No bots remaining.");
    }
  }
  if (!match.isSim) {
    maybeShowSupportOverlay();
  }
}

function maybeShowSupportOverlay() {
  if (match.supportShown) {
    return;
  }
  match.supportShown = true;
  if (typeof window !== "undefined" && typeof window.showSupportOverlay === "function") {
    window.showSupportOverlay();
  }
}

function raycastBot(bot, range) {
  const origin = { x: bot.x, y: bot.y };
  const headingRad = radians(bot.heading);
  const dir = { x: cos(headingRad), y: sin(headingRad) };
  let closest = null;
  let closestDist = Infinity;

  bots.forEach((target) => {
    if (!target.alive || target === bot) {
      return;
    }
    const hit = rayCircleIntersection(origin, dir, target, arena.radius, range);
    if (hit && hit < closestDist) {
      closestDist = hit;
      closest = target;
    }
  });

  return closest;
}

function recordShotEffect(bot, hit, range) {
  const origin = { x: bot.x, y: bot.y };
  const headingRad = radians(bot.heading);
  const dir = { x: cos(headingRad), y: sin(headingRad) };
  let end = { x: origin.x + dir.x * range, y: origin.y + dir.y * range };
  if (hit) {
    const dist = distance(origin.x, origin.y, hit.x, hit.y) - arena.radius;
    end = { x: origin.x + dir.x * dist, y: origin.y + dir.y * dist };
  }
  shotEffects.push({
    start: origin,
    end,
    hit: Boolean(hit),
    life: 0.12,
  });
}

function recordScanEffect(bot, fovDeg, range) {
  scanEffects.push({
    x: bot.x,
    y: bot.y,
    heading: radians(bot.heading),
    fov: radians(fovDeg),
    range,
    life: 0.25,
    age: 0,
  });
}

function renderScans() {
  if (!scanEffects.length) {
    return;
  }
  scanEffects.forEach((scan) => {
    const pulse = 0.6 + 0.4 * sin(scan.age * 18);
    const alpha = 90 * (1 - scan.age / scan.life) * pulse;
    fill(90, 180, 255, alpha);
    noStroke();
    drawScanCone(scan.x, scan.y, scan.heading, scan.fov, scan.range);
    scan.age += 1 / 60;
  });
  for (let i = scanEffects.length - 1; i >= 0; i--) {
    if (scanEffects[i].age >= scanEffects[i].life) {
      scanEffects.splice(i, 1);
    }
  }
}

function drawScanCone(cx, cy, heading, fov, range) {
  const segments = 18;
  const half = fov / 2;
  beginShape();
  vertex(cx, cy);
  for (let i = 0; i <= segments; i++) {
    const t = -half + (fov * i) / segments;
    const angle = heading + t;
    vertex(cx + cos(angle) * range, cy + sin(angle) * range);
  }
  endShape();
}

function rayCircleIntersection(origin, dir, target, radius, maxRange) {
  const ocx = origin.x - target.x;
  const ocy = origin.y - target.y;
  const b = 2 * (dir.x * ocx + dir.y * ocy);
  const c = ocx * ocx + ocy * ocy - radius * radius;
  const discriminant = b * b - 4 * c;
  if (discriminant < 0) {
    return null;
  }
  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / 2;
  const t2 = (-b + sqrtDisc) / 2;
  const t = t1 >= 0 ? t1 : t2;
  if (t >= 0 && t <= maxRange) {
    return t;
  }
  return null;
}

function getNearestTargetInCone(bot, headingRad, fovDeg, rangePx) {
  const halfFov = radians(fovDeg / 2);
  let best = null;
  bots.forEach((target) => {
    if (!target.alive || target === bot) {
      return;
    }
    const dx = target.x - bot.x;
    const dy = target.y - bot.y;
    const dist = Math.hypot(dx, dy);
    if (dist > rangePx) {
      return;
    }
    const angleTo = Math.atan2(dy, dx);
    const offset = normalizeAngle(angleTo - headingRad);
    if (Math.abs(offset) > halfFov) {
      return;
    }
    if (!best || dist < best.distance) {
      best = { target, distance: dist, angleOffset: offset };
    }
  });
  return best;
}

function renderBots(alpha) {
  bots.forEach((bot) => {
    if (!bot.alive) {
      return;
    }
    const x = lerp(bot.prev.x, bot.x, alpha);
    const y = lerp(bot.prev.y, bot.y, alpha);
    const heading = lerpAngle(bot.prev.heading, bot.heading, alpha);

    fill(bot.color[0], bot.color[1], bot.color[2]);
    noStroke();
    ellipse(x, y, arena.radius * 2, arena.radius * 2);

    const dir = radians(heading);
    stroke(30, 30, 30);
    strokeWeight(3);
    line(x, y, x + cos(dir) * arena.radius, y + sin(dir) * arena.radius);

    noStroke();
    fill(230, 235, 240);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(bot.name, x, y - arena.radius - 12);

    drawHealthBar(bot, x, y);
    if (bot.stunTicks > 0) {
      drawStunEffect(x, y);
    }
  });
}

function renderShots() {
  if (!shotEffects.length) {
    return;
  }
  stroke(242, 184, 75);
  strokeWeight(2);
  shotEffects.forEach((shot) => {
    line(shot.start.x, shot.start.y, shot.end.x, shot.end.y);
    if (shot.hit) {
      noStroke();
      fill(255, 120, 80);
      ellipse(shot.end.x, shot.end.y, 8, 8);
    }
    shot.life -= 1 / 60;
  });
  for (let i = shotEffects.length - 1; i >= 0; i--) {
    if (shotEffects[i].life <= 0) {
      shotEffects.splice(i, 1);
    }
  }
}

function drawStunEffect(x, y) {
  stroke(255, 190, 120);
  strokeWeight(2);
  noFill();
  const size = arena.radius * 2.4;
  ellipse(x, y, size, size);
  line(x - 6, y - 6, x + 6, y + 6);
  line(x + 6, y - 6, x - 6, y + 6);
}

function drawHealthBar(bot, x, y) {
  const barWidth = 44;
  const barHeight = 6;
  const ratio = bot.health / bot.stats.maxHealth;
  const left = x - barWidth / 2;
  const top = y + arena.radius + 8;

  noStroke();
  fill(40, 48, 56);
  rect(left, top, barWidth, barHeight, 3);
  fill(127, 209, 255);
  rect(left, top, barWidth * ratio, barHeight, 3);
}

function drawArena() {
  const bounds = getArenaBounds();

  noFill();
  stroke(60, 70, 80);
  strokeWeight(2);
  rect(bounds.x, bounds.y, bounds.w, bounds.h, 18);

  stroke(30, 36, 42);
  strokeWeight(1);
  for (let i = 0; i < 10; i++) {
    const gx = bounds.x + (bounds.w / 10) * i;
    line(gx, bounds.y, gx, bounds.y + bounds.h);
  }
  for (let i = 0; i < 7; i++) {
    const gy = bounds.y + (bounds.h / 7) * i;
    line(bounds.x, gy, bounds.x + bounds.w, gy);
  }
}

function renderHud() {
  noStroke();
  fill(180, 190, 200);
  textAlign(LEFT, TOP);
  textSize(12);
  text(
    `Time: ${match.time.toFixed(1)} / ${match.timeLimit}s\nTPS: ${match.tps}\nEnd: ${match.endCondition}`,
    16,
    16
  );
}

function updateMovementStats(bot) {
  const dx = bot.x - bot.statsData.lastX;
  const dy = bot.y - bot.statsData.lastY;
  const step = Math.hypot(dx, dy);
  bot.statsData.distance += step;
  bot.statsData.lastX = bot.x;
  bot.statsData.lastY = bot.y;
}

function updateEngagementStats(dt) {
  bots.forEach((bot) => {
    if (!bot.alive || bot.disabled) {
      return;
    }
    const headingRad = radians(bot.heading);
    const target = getNearestTargetInCone(bot, headingRad, bot.stats.sightFov, bot.stats.sightRange);
    if (target) {
      bot.statsData.engagement += dt;
    }
  });
}

function checkBotsForWarnings() {
  bots.forEach((bot) => {
    if (!bot.alive || bot.disabled) {
      return;
    }
    const stats = bot.statsData;
    if (!stats) {
      return;
    }
    const idleTime = match.time - (stats.lastActionTime || 0);
    if (match.time >= 12 && idleTime >= 12) {
      warnBot(bot, "inactive-idle", "I have not taken an action in a while. Check your tick() logic.");
    }
    if (match.time >= 15 && stats.distance < 25 && stats.shotsFired === 0) {
      warnBot(bot, "inactive-start", "I am not moving or firing yet. Try advance(), scan(), and fire().");
    }
    if (match.time >= 20 && stats.shotsFired >= 8 && stats.shotsHit === 0) {
      warnBot(bot, "accuracy-low", "Lots of shots but no hits. Try turn(scanResult.angle) before fire().");
    }
  });
}

function escapeHtml(text) {
  const value = String(text || "");
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function computeScore(bot) {
  const accuracy = bot.statsData.shotsFired > 0
    ? bot.statsData.shotsHit / bot.statsData.shotsFired
    : 0;
  const damageFactor = scoring.accuracyMin + (1 - scoring.accuracyMin) * accuracy;
  const effectiveDamage = bot.statsData.damage * damageFactor;
  const distanceScore = min(bot.statsData.distance, scoring.distanceCap);

  const total =
    bot.health * scoring.healthWeight +
    effectiveDamage * scoring.damageWeight +
    bot.statsData.engagement * scoring.engagementWeight +
    distanceScore * scoring.distanceWeight;
  if (match.normalizeScore === "off") {
    return total;
  }
  if (match.normalizeScore === "gentle") {
    return total / (0.5 + bot.points / 100);
  }
  return total / max(1, bot.points);
}

function updateScoreboard() {
  if (!scoreOutput) {
    return;
  }
  const rows = bots.map((bot) => {
    const score = computeScore(bot);
    const status = botStatusByName[bot.name] || { level: "ok", message: "" };
    return {
      name: bot.name,
      score,
      health: bot.health,
      alive: bot.alive,
      status,
    };
  }).sort((a, b) => b.score - a.score);

  const lines = rows.map((row) => {
    const status = row.alive ? "alive" : "out";
    const level = row.status.level || "ok";
    const cls = level === "warn" ? "score-warn" : (level === "err" ? "score-err" : "score-ok");
    let flag = "";
    if (level === "warn") {
      const title = escapeHtml(row.status.message || "See load report.");
      flag = ` <a class="score-flag warn" href="#load-panel" title="${title}">⚠</a>`;
    }
    return `<li class="${cls}">${row.name}: ${row.score.toFixed(1)} (${status}, ${row.health.toFixed(0)} hp)${flag}</li>`;
  });

  if (match.isOver && rows.length) {
    const winner = rows[0];
    lines.unshift(
      `<li><strong>Match Over:</strong> ${winner.name} wins with ${winner.score.toFixed(1)} pts</li>`
    );
  }

  scoreOutput.html(lines.join(""));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function logEvent(message) {
  if (match.isSim) {
    return;
  }
  const timestamp = match.time.toFixed(1).padStart(5, " ");
  logs.push(`[${timestamp}] ${message}`);
  if (logs.length > MAX_LOG_LINES) {
    logs.shift();
  }
  if (logOutput) {
    logOutput.html(logs.join("\n"));
    logOutput.elt.scrollTop = logOutput.elt.scrollHeight;
  }
}

function updateLoadPanel() {
  if (!loadOutput) {
    return;
  }
  const lines = loadReport.map((item) => {
    const level = item.level || (item.ok ? "ok" : "err");
    const prefix = level === "warn" ? "WARN" : (level === "err" ? "ERR" : "OK");
    const cls = "load-" + level;
    return `<li class="${cls}">${prefix}: ${item.name} - ${item.detail}</li>`;
  });
  loadOutput.html(lines.join(""));
}

function togglePause() {
  match.isPaused = !match.isPaused;
  pauseButton.html(match.isPaused ? "Resume" : "Pause");
  logEvent(match.isPaused ? "Paused." : "Resumed.");
}

function stepOnce() {
  if (!match.isPaused) {
    match.isPaused = true;
    pauseButton.html("Resume");
  }
  runTick(1 / match.tps);
}

function getArenaBounds() {
  const pad = arena.padding;
  return { x: pad, y: pad, w: width - pad * 2, h: height - pad * 2 };
}

function getCanvasWidth() {
  if (sketchHolderEl && sketchHolderEl.elt) {
    const inner = sketchHolderEl.elt.clientWidth - 24;
    return max(300, inner);
  }
  return min(820, windowWidth - 80);
}

function getCanvasHeight() {
  return min(540, windowHeight * 0.72);
}

function windowResized() {
  resizeCanvas(getCanvasWidth(), getCanvasHeight());
}

function clamp(value, minVal, maxVal) {
  return min(max(value, minVal), maxVal);
}

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function calculateBuildPoints(build) {
  if (!build) {
    return { total: 0 };
  }
  const total =
    getCost(costs.maxSpeed, build.maxSpeedTier) +
    getCost(costs.turnRate, build.turnRateTier) +
    getCost(costs.sightRange, build.sightRangeTier) +
    getCost(costs.sightFov, build.sightFovTier) +
    getCost(costs.shotPower, build.shotPowerTier) +
    getCost(costs.shotRange, build.shotRangeTier) +
    getCost(costs.maxHealth, build.maxHealthTier) +
    getCost(costs.memorySlots, build.memoryTier) +
    (costs.wallBehavior[build.wallBehavior] ?? 0);
  return { total };
}

function getCost(costArray, tier) {
  if (!Number.isInteger(tier) || tier < 1 || tier > costArray.length) {
    return 0;
  }
  return costArray[tier - 1];
}

function normalizeBotConfigs(data) {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.bots)) {
    return data.bots;
  }
  return [data];
}

function friendlyParseError(err) {
  if (!err || !err.message) {
    return "Could not parse JSON.";
  }
  const msg = String(err.message);
  return msg.length > 120 ? msg.slice(0, 117) + "..." : msg;
}

function summarizeMessages(messages, maxItems) {
  const limit = maxItems || 3;
  if (!messages.length) {
    return "";
  }
  const shown = messages.slice(0, limit);
  const extra = messages.length - shown.length;
  const tail = extra > 0 ? " (and " + extra + " more)" : "";
  return shown.join("; ") + tail;
}

function friendlySchemaMessage(message) {
  const text = String(message || "");
  if (text.includes(" is required")) {
    const path = text.replace(" is required", "");
    return "Missing: " + path + ".";
  }
  if (text.includes(" is not allowed")) {
    const path = text.replace(" is not allowed", "");
    return "Remove extra field: " + path + ".";
  }
  if (text.includes(" should be integer")) {
    const path = text.replace(" should be integer", "");
    return path + " must be a whole number.";
  }
  if (text.includes(" should be one of [")) {
    const parts = text.split(" should be one of ");
    return parts[0] + " must be one of " + parts[1] + ".";
  }
  if (text.includes(" should be ")) {
    const parts = text.split(" should be ");
    return parts[0] + " has the wrong type (" + parts[1] + ").";
  }
  if (text.includes(" below minimum") || text.includes(" above maximum")) {
    const path = text.replace(" below minimum", "").replace(" above maximum", "");
    return path + " is out of range.";
  }
  return text;
}

function formatSchemaErrors(errors) {
  const friendly = errors.map(friendlySchemaMessage);
  return summarizeMessages(friendly, 3);
}

function validateBuildRanges(build) {
  const errors = [];
  if (!build || typeof build !== "object") {
    errors.push("Missing: build.");
    return errors;
  }

  const checks = [
    { key: "maxSpeedTier", min: 1, max: tiers.maxSpeed.length },
    { key: "turnRateTier", min: 1, max: tiers.turnRate.length },
    { key: "sightRangeTier", min: 1, max: tiers.sightRange.length },
    { key: "sightFovTier", min: 1, max: tiers.sightFov.length },
    { key: "shotPowerTier", min: 1, max: tiers.shotPower.length },
    { key: "shotRangeTier", min: 1, max: tiers.shotRange.length },
    { key: "maxHealthTier", min: 1, max: tiers.maxHealth.length },
    { key: "memoryTier", min: 0, max: tiers.memorySlots.length - 1 },
  ];

  checks.forEach((check) => {
    const value = build[check.key];
    const label = "build." + check.key;
    if (value === undefined || value === null) {
      errors.push("Missing: " + label + ".");
      return;
    }
    if (!Number.isInteger(value)) {
      errors.push(label + " must be a whole number.");
      return;
    }
    if (value < check.min || value > check.max) {
      errors.push(label + " must be " + check.min + ".." + check.max + ".");
    }
  });

  const wallBehavior = build.wallBehavior;
  if (!wallBehavior) {
    errors.push("Missing: build.wallBehavior.");
  } else if (!(wallBehavior in costs.wallBehavior)) {
    errors.push("build.wallBehavior must be stop, bounce, or slide.");
  }

  return errors;
}

function validateTickSource(config) {
  const errors = [];
  const behavior = config && config.behavior;
  if (!behavior || typeof behavior !== "object") {
    errors.push("Missing: behavior.tick.");
    return errors;
  }
  const tick = behavior.tick;
  if (typeof tick !== "string") {
    errors.push("behavior.tick must be a string.");
    return errors;
  }
  if (!tick.trim()) {
    errors.push("behavior.tick is empty.");
  }
  return errors;
}

function formatCompileError(errorText) {
  const message = String(errorText || "Unknown error");
  if (message.includes("Unexpected token")) {
    return "Syntax error: " + message + ".";
  }
  if (message.includes("Unexpected identifier")) {
    return "Syntax error: " + message + ".";
  }
  return "tick() code error: " + message + ".";
}

function evaluateBotConfig(config) {
  const name = config && config.name ? config.name : "Unnamed bot";
  const sourceColor = config && config.color ? config.color : randomBotColor();

  const schemaResult = validateBotConfig(config);
  if (!schemaResult.ok) {
    return { ok: false, name, detail: formatSchemaErrors(schemaResult.errors) };
  }

  const buildErrors = validateBuildRanges(config.build);
  if (buildErrors.length) {
    return { ok: false, name, detail: summarizeMessages(buildErrors, 3) };
  }

  const points = calculateBuildPoints(config.build);
  if (points.total > match.budget) {
    return { ok: false, name, detail: "Point budget exceeded: " + points.total + "/" + match.budget + "." };
  }

  const tickErrors = validateTickSource(config);
  if (tickErrors.length) {
    return { ok: false, name, detail: summarizeMessages(tickErrors, 2) };
  }

  const compiled = compileTick(config.behavior.tick);
  if (!compiled.ok) {
    return { ok: false, name, detail: formatCompileError(compiled.error) };
  }

  return {
    ok: true,
    name,
    color: sourceColor,
    build: config.build,
    points: points.total,
    tick: compiled.fn,
  };
}

function validateBotConfig(config) {
  if (!botSchema) {
    return { ok: true, errors: [] };
  }
  const errors = [];
  validateAgainstSchema(botSchema, config, "", errors);
  return { ok: errors.length === 0, errors };
}

function validateAgainstSchema(schema, value, path, errors) {
  if (!schema || typeof schema !== "object") {
    return;
  }
  const location = path || "root";
  if (schema.type) {
    if (!typeMatches(schema.type, value)) {
      errors.push(location + " should be " + schema.type);
      return;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(location + " should be one of [" + schema.enum.join(", ") + "]");
    return;
  }

  if (schema.type === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(location + " too short");
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(location + " too long");
    }
  }

  if (schema.type === "integer") {
    if (!Number.isInteger(value)) {
      errors.push(location + " should be integer");
      return;
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(location + " below minimum");
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(location + " above maximum");
    }
  }

  if (schema.type === "object") {
    const obj = value || {};
    if (Array.isArray(schema.required)) {
      schema.required.forEach((key) => {
        if (!(key in obj)) {
          errors.push((path ? path + "." : "") + key + " is required");
        }
      });
    }
    const props = schema.properties || {};
    Object.keys(props).forEach((key) => {
      if (obj[key] !== undefined) {
        validateAgainstSchema(props[key], obj[key], joinPath(path, key), errors);
      }
    });
    if (schema.additionalProperties === false) {
      Object.keys(obj).forEach((key) => {
        if (!props[key]) {
          errors.push(joinPath(path, key) + " is not allowed");
        }
      });
    }
  }
}

function typeMatches(type, value) {
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "string") {
    return typeof value === "string";
  }
  if (type === "integer") {
    return Number.isInteger(value);
  }
  return true;
}

function joinPath(base, key) {
  return base ? base + "." + key : key;
}

function compileTick(code) {
  try {
    const fn = new Function(`"use strict"; return (${code});`)();
    if (typeof fn !== "function") {
      return { ok: false, error: "tick is not a function" };
    }
    return { ok: true, fn };
  } catch (err) {
    try {
      const fn = new Function("api", `"use strict";\n${code}`);
      return { ok: true, fn };
    } catch (inner) {
      return { ok: false, error: inner.message };
    }
  }
}

function setupLocalLoaders() {
  localLoadBtn = select("#local-load-btn");
  localFileInput = select("#local-file-input");
  localFolderBtn = select("#local-folder-btn");
  localFolderInput = select("#local-folder-input");
  dropZone = select("#drop-zone");
  localClearBtn = select("#local-clear-btn");

  if (localLoadBtn && localFileInput) {
    localLoadBtn.mousePressed(() => localFileInput.elt.click());
    localFileInput.elt.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      loadLocalBotFiles(files);
      event.target.value = "";
    });
  }

  if (localFolderBtn && localFolderInput) {
    localFolderBtn.mousePressed(() => localFolderInput.elt.click());
    localFolderInput.elt.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      loadBotFolders(files);
      event.target.value = "";
    });
  }

  if (localClearBtn) {
    localClearBtn.mousePressed(clearLoadedBots);
  }

  if (dropZone) {
    dropZone.elt.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.addClass("active");
    });
    dropZone.elt.addEventListener("dragleave", () => {
      dropZone.removeClass("active");
    });
    dropZone.elt.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.removeClass("active");
      const files = Array.from(event.dataTransfer.files || []);
      loadLocalBotFiles(files);
    });
  }
}

function loadLocalBotFiles(files) {
  loadReport = [];
  botConfigs = [];
  const jsonFiles = files.filter((file) => file.name.toLowerCase().endsWith(".json"));
  if (!jsonFiles.length) {
    loadReport.push({ name: "Local", ok: false, level: "err", detail: "No .json files selected." });
    updateLoadPanel();
    return;
  }
  let pending = jsonFiles.length;
  jsonFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const configs = normalizeBotConfigs(data);
        if (!configs.length) {
          loadReport.push({
            name: file.name,
            ok: false,
            level: "err",
            detail: "No bots found in that JSON file.",
          });
        } else {
          configs.forEach((config) => {
            botConfigs.push({ config, source: file.name });
          });
        }
      } catch (err) {
        loadReport.push({
          name: file.name,
          ok: false,
          level: "err",
          detail: "Invalid JSON: " + friendlyParseError(err),
        });
      }
      pending -= 1;
      if (pending === 0) {
        finalizeLocalLoad();
      }
    };
    reader.onerror = () => {
      loadReport.push({ name: file.name, ok: false, level: "err", detail: "File read failed." });
      pending -= 1;
      if (pending === 0) {
        finalizeLocalLoad();
      }
    };
    reader.readAsText(file);
  });
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsText(file);
  });
}

function groupFilesByFolder(files) {
  const groups = new Map();
  files.forEach((file) => {
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split("/");
    if (parts.length <= 1) {
      const rootKey = "_root";
      if (!groups.has(rootKey)) {
        groups.set(rootKey, []);
      }
      groups.get(rootKey).push(file);
      return;
    }
    let folderParts = parts.slice(0, -1);
    // Drop the selected root folder when nested bot folders are used.
    if (folderParts.length > 1) {
      folderParts = folderParts.slice(1);
    }
    const folder = folderParts.join("/") || folderParts[0] || "_root";
    if (!groups.has(folder)) {
      groups.set(folder, []);
    }
    groups.get(folder).push(file);
  });
  return groups;
}

async function processBotFolder(folder, files) {
  const jsonFile = files.find((file) => file.name.toLowerCase().endsWith(".json"));
  const behaviorFile = files.find((file) => file.name.toLowerCase() === "behavior.js");

  if (!jsonFile || !behaviorFile) {
    loadReport.push({
      name: folder,
      ok: false,
      level: "err",
      detail: "Need one .json bot file and behavior.js",
    });
    return;
  }

  try {
    const [jsonText, behaviorText] = await Promise.all([readFileText(jsonFile), readFileText(behaviorFile)]);
    const data = JSON.parse(jsonText);
    const configs = normalizeBotConfigs(data);
    if (!configs.length) {
      loadReport.push({ name: folder, ok: false, level: "err", detail: "No bots found in the folder JSON." });
      return;
    }
    configs.forEach((config) => {
      if (!config.behavior || typeof config.behavior !== "object") {
        config.behavior = {};
      }
      config.behavior.tick = behaviorText;
      botConfigs.push({ config, source: folder });
    });
    loadReport.push({
      name: folder,
      ok: true,
      level: "ok",
      detail: "Loaded bot folder (" + configs.length + ")",
    });
  } catch (err) {
    loadReport.push({
      name: folder,
      ok: false,
      level: "err",
      detail: "Invalid folder JSON: " + friendlyParseError(err),
    });
  }
}

async function loadBotFolders(files) {
  loadReport = [];
  botConfigs = [];
  if (!files || files.length === 0) {
    loadReport.push({ name: "Folders", ok: false, level: "err", detail: "No folders selected." });
    updateLoadPanel();
    return;
  }

  const groups = groupFilesByFolder(files);
  if (!groups.size) {
    loadReport.push({ name: "Folders", ok: false, level: "err", detail: "No bot folders found." });
    updateLoadPanel();
    return;
  }

  const tasks = [];
  groups.forEach((folderFiles, folder) => {
    tasks.push(processBotFolder(folder, folderFiles));
  });

  try {
    await Promise.all(tasks);
  } catch (err) {
    loadReport.push({ name: "Folders", ok: false, level: "err", detail: "Folder load failed." });
  }

  finalizeLocalLoad();
}

function finalizeLocalLoad() {
  initBots();
  resetMatch({ silent: true, keepPaused: true });
  match.isPaused = true;
  match.hasStarted = false;
  pauseButton.html("Resume");
  pauseButton.attribute("disabled", true);
  if (startButton) {
    startButton.removeAttribute("disabled");
  }
  saveLocalBotsToStorage();
  logEvent("Local bots loaded.");
}

function deepCopy(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return value;
  }
}

function saveLocalBotsToStorage() {
  try {
    const payload = botConfigs.map((item) => ({
      config: item.config,
      source: item.source,
    }));
    localStorage.setItem("botbattles_local_bots", JSON.stringify(payload));
  } catch (err) {
    // Ignore storage errors (quota, privacy mode).
  }
}

function loadLastGoodStore() {
  try {
    const raw = localStorage.getItem("botbattles_last_good") || "";
    if (!raw) {
      lastGoodBySource = {};
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      lastGoodBySource = {};
      return;
    }
    lastGoodBySource = parsed;
  } catch (err) {
    lastGoodBySource = {};
  }
}

function saveLastGoodStore() {
  try {
    localStorage.setItem("botbattles_last_good", JSON.stringify(lastGoodBySource));
  } catch (err) {
    // Ignore storage errors.
  }
}

function getLastGoodForSource(source) {
  if (!source || !lastGoodBySource[source]) {
    return null;
  }
  return deepCopy(lastGoodBySource[source]);
}

function saveLastGoodForSource(source, config) {
  if (!source || !config) {
    return;
  }
  lastGoodBySource[source] = deepCopy(config);
  saveLastGoodStore();
}

function restoreLocalBotsFromStorage() {
  let raw = "";
  try {
    raw = localStorage.getItem("botbattles_local_bots") || "";
  } catch (err) {
    raw = "";
  }
  if (!raw) {
    return;
  }
  try {
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload) || payload.length === 0) {
      return;
    }
    botConfigs = payload
      .filter((item) => item && item.config)
      .map((item) => ({ config: item.config, source: item.source || "localStorage" }));
    loadReport = [{ name: "Local", ok: true, level: "ok", detail: "Restored from previous session." }];
    initBots();
    resetMatch({ silent: true, keepPaused: true });
    match.isPaused = true;
    match.hasStarted = false;
    pauseButton.html("Resume");
    pauseButton.attribute("disabled", true);
    if (startButton) {
      startButton.removeAttribute("disabled");
    }
    updateLoadPanel();
  } catch (err) {
    // Ignore bad storage data.
  }
}

function clearLoadedBots() {
  bots.length = 0;
  botConfigs = [];
  loadReport = [{ name: "Local", ok: true, level: "ok", detail: "Cleared loaded bots." }];
  try {
    localStorage.removeItem("botbattles_local_bots");
  } catch (err) {
    // Ignore storage errors.
  }
  resetMatch({ silent: true, keepPaused: true });
  match.isPaused = true;
  match.hasStarted = false;
  pauseButton.html("Resume");
  pauseButton.attribute("disabled", true);
  updateLoadPanel();
  updateScoreboard();
}

function startBattle() {
  if (!bots.length) {
    logEvent("No bots loaded.");
    return;
  }
  match.hasStarted = true;
  match.isPaused = false;
  resetMatch({ silent: true });
  pauseButton.html("Pause");
  pauseButton.removeAttribute("disabled");
  logEvent("Battle started.");
}

function randomBotColor() {
  const palette = [
    [242, 184, 75],
    [127, 209, 255],
    [244, 114, 182],
    [132, 204, 22],
    [248, 113, 113],
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

function normalizeAngle(angle) {
  let wrapped = angle;
  while (wrapped > Math.PI) {
    wrapped -= Math.PI * 2;
  }
  while (wrapped < -Math.PI) {
    wrapped += Math.PI * 2;
  }
  return wrapped;
}

function lerpAngle(a, b, t) {
  let delta = ((b - a + 540) % 360) - 180;
  return a + delta * t;
}
