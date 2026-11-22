// Velvet Vault Heist — the game itself: state machine, alarm, loot, tools
// and the loop. One room, one sapphire, four guards, two cameras, one exit.
import { TILE, WIDTH, HEIGHT, buildLevel, walkable } from "./level.js";
import { makeGuards, makeCameras, updateGuards, updateCameras, triggerChase } from "./guards.js";
import { drawWorld, drawHud, drawOverlay } from "./render.js";
import { createInput } from "./input.js";
import {
  ensureAudio, playPickup, playSapphire, playSmoke,
  playAlarmTick, playCaught, playWin,
} from "./audio.js";

const WALK_SPEED = 150;
const SNEAK_SPEED = 78;
const GRAB_RANGE = 46;
const ALARM_GUARD_RATE = 55; // alarm points per second while a guard sees you
const ALARM_CAMERA_RATE = 26;
const ALARM_DECAY = 9;
const SMOKE_DURATION = 4;

const params = new URLSearchParams(location.search);
const SHOT = params.get("shot") || "";

function newGame() {
  const level = buildLevel();
  const game = {
    level,
    thief: {
      x: level.player.x, y: level.player.y,
      sneaking: false, moving: false,
    },
    guards: makeGuards(level),
    cameras: makeCameras(level),
    state: "title", // title | playing | caught | won
    alarm: 0,
    smoke: 0,
    smokeBombs: 2,
    loot: 0,
    lootTotal: level.gems.length + level.cases.length + 1,
    score: 0,
    time: 0,
    playTime: 0,
    objective: "Reach the Star Sapphire in the vault — stay out of the yellow cones.",
    clickMove: null,
    alarmTicked: false,
  };
  return game;
}

function stageShot(game, shot) {
  // Deterministic staged scenes for the entry's screenshots: real renders
  // of the game's own code, with the thief placed mid-heist.
  game.state = "playing";
  const L = game.level;
  if (shot === "cover" || shot === "play") {
    game.thief.x = 19.5 * TILE;
    game.thief.y = 13.5 * TILE;
    game.alarm = 35;
    game.objective = "The sapphire glows in the vault — slip past the patrols to reach it.";
  } else if (shot === "stealth") {
    game.thief.x = 8.5 * TILE;
    game.thief.y = 10.5 * TILE;
    game.thief.sneaking = true;
    game.alarm = 12;
    game.objective = "Hold still behind the crates — let the patrol pass.";
  } else if (shot === "alarm") {
    game.thief.x = 21.5 * TILE;
    game.thief.y = 20.5 * TILE;
    game.alarm = 82;
    game.loot = 2;
    L.gems[0].taken = true;
    L.gems[1].taken = true;
    triggerChase(game.guards);
    game.objective = "SPOTTED! Break line of sight and the alarm will fall.";
  } else if (shot === "escape") {
    game.thief.x = 8.5 * TILE;
    game.thief.y = 23.5 * TILE;
    game.alarm = 18;
    game.loot = 4;
    L.sapphire.taken = true;
    L.gems.forEach((g) => { g.taken = true; });
    game.objective = "Sapphire secured — reach the EXIT before the alarm climbs.";
  }
  game.time = 1.2;
}

function tryGrab(game) {
  const L = game.level;
  const t = game.thief;
  if (!L.sapphire.taken && Math.hypot(L.sapphire.x - t.x, L.sapphire.y - t.y) < GRAB_RANGE) {
    L.sapphire.taken = true;
    game.loot += 1;
    game.score += 500;
    game.objective = "Sapphire secured! Get out through the EXIT door, bottom left.";
    playSapphire();
    return;
  }
  for (const gem of L.gems) {
    if (!gem.taken && Math.hypot(gem.x - t.x, gem.y - t.y) < GRAB_RANGE) {
      gem.taken = true;
      game.loot += 1;
      game.score += 100;
      playPickup();
      return;
    }
  }
  for (const cs of L.cases) {
    if (!cs.taken && Math.hypot(cs.x - t.x, cs.y - t.y) < GRAB_RANGE) {
      cs.taken = true;
      game.loot += 1;
      game.score += 50;
      playPickup();
      return;
    }
  }
}

function moveThief(game, input, dt) {
  const t = game.thief;
  const L = game.level;
  t.sneaking = input.sneaking();
  const speed = t.sneaking ? SNEAK_SPEED : WALK_SPEED;
  let mx = 0;
  let my = 0;
  const axis = input.axis();
  mx = axis.x;
  my = axis.y;
  const click = input.takeClick();
  if (click) game.clickMove = click;
  if (mx === 0 && my === 0 && game.clickMove) {
    const dx = game.clickMove.x - t.x;
    const dy = game.clickMove.y - t.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      game.clickMove = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  t.moving = mx !== 0 || my !== 0;
  const nx = t.x + mx * speed * dt;
  const ny = t.y + my * speed * dt;
  if (walkable(L, nx, t.y)) t.x = nx;
  if (walkable(L, t.x, ny)) t.y = ny;
  t.x = Math.max(14, Math.min(WIDTH - 14, t.x));
  t.y = Math.max(14, Math.min(HEIGHT - 14, t.y));
}

function update(game, input, dt) {
  game.time += dt;
  if (game.state === "title") {
    if (input.wasPressed("Enter") || input.takeClick()) {
      ensureAudio();
      game.state = "playing";
    }
    input.clearPressed();
    return;
  }
  if (game.state === "caught" || game.state === "won") {
    if (input.wasPressed("KeyR")) {
      const fresh = newGame();
      Object.assign(game, fresh);
      if (SHOT) stageShot(game, SHOT);
    }
    input.clearPressed();
    return;
  }
  game.playTime += dt;
  if (game.smoke > 0) game.smoke -= dt;
  moveThief(game, input, dt);
  if (input.wasPressed("KeyE")) tryGrab(game);
  if (input.wasPressed("Space") && game.smokeBombs > 0 && game.smoke <= 0) {
    game.smokeBombs -= 1;
    game.smoke = SMOKE_DURATION;
    playSmoke();
  }
  const guardSees = updateGuards(game.level, game.guards, game.thief, dt, game.alarm, game.smoke);
  const cameraSees = updateCameras(game.cameras, game.level, game.thief, dt, game.smoke);
  if (guardSees) game.alarm += ALARM_GUARD_RATE * dt;
  if (cameraSees) game.alarm += ALARM_CAMERA_RATE * dt;
  if (!guardSees && !cameraSees) game.alarm -= ALARM_DECAY * dt;
  game.alarm = Math.max(0, Math.min(100, game.alarm));
  if (game.alarm >= 100) {
    game.state = "caught";
    playCaught();
  } else if (game.alarm > 80 && !game.alarmTicked) {
    game.alarmTicked = true;
    playAlarmTick();
  } else if (game.alarm < 70) {
    game.alarmTicked = false;
  }
  // Caught by touch: a guard that reaches you ends the run.
  for (const g of game.guards) {
    if (Math.hypot(g.x - game.thief.x, g.y - game.thief.y) < 24) {
      game.state = "caught";
      playCaught();
      break;
    }
  }
  // Escape: sapphire in hand and standing on the exit.
  const exit = game.level.exit;
  if (game.level.sapphire.taken && Math.hypot(exit.x - game.thief.x, exit.y - game.thief.y) < 34) {
    game.state = "won";
    game.score += Math.max(0, 1000 - Math.round(game.playTime) * 5);
    game.score += Math.round((100 - game.alarm)) * 2;
    playWin();
  }
  input.clearPressed();
}

function resize(canvas) {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.style.width = Math.floor(WIDTH * scale) + "px";
  canvas.style.height = Math.floor(HEIGHT * scale) + "px";
}

function main() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const status = document.getElementById("status");
  resize(canvas);
  window.addEventListener("resize", () => resize(canvas));
  const input = createInput(canvas);
  const game = newGame();
  if (SHOT) stageShot(game, SHOT);
  let last = performance.now();
  let statusText = "";
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(game, input, dt);
    drawWorld(ctx, game, game.time);
    drawHud(ctx, game);
    drawOverlay(ctx, game);
    const next = game.state === "playing"
      ? "Alarm " + Math.round(game.alarm) + " percent. Loot " + game.loot + " of " + game.lootTotal + ". " + game.objective
      : game.state;
    if (next !== statusText) {
      statusText = next;
      status.textContent = statusText;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
