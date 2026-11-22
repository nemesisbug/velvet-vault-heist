// Velvet Vault Heist — renderer: the night gallery in one canvas frame.
// Every frame shows the room, the thief, guard cones, cameras, the loot and
// the alarm meter, so a single screenshot tells the whole story.
import { TILE, COLS, ROWS, WIDTH, HEIGHT } from "./level.js";
import { CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE } from "./guards.js";

const FLOOR_A = "#2b2f45";
const FLOOR_B = "#262a3e";
const CARPET = "#7a1f2b";
const CARPET_EDGE = "#c9a227";
const WALL_TOP = "#4a4f6d";
const WALL_FACE = "#33374f";
const CRATE = "#6b4f2a";
const CRATE_EDGE = "#a07a3e";

export function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = color.replace("0.20", "0.55").replace("0.16", "0.45");
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, g, time) {
  // Vision cone first, so the guard body draws on top of it.
  const coneColor = g.state === "chase" ? "rgba(255,60,60,0.28)" : "rgba(255,210,80,0.20)";
  drawCone(ctx, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE, coneColor);
  // Body: navy uniform, brass buttons, peaked cap.
  ctx.fillStyle = "#1c2a4a";
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c9a227";
  ctx.beginPath();
  ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = "#e8e8f0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 17, g.y + Math.sin(g.angle) * 17);
  ctx.stroke();
  if (g.state === "suspicious") {
    ctx.fillStyle = "#ffd250";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", g.x, g.y - 22);
  }
  if (g.state === "chase") {
    ctx.fillStyle = "#ff5040";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", g.x, g.y - 22 + Math.sin(time * 10) * 2);
  }
}

function drawCamera(ctx, cam) {
  drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, "rgba(255,80,80,0.16)");
  ctx.fillStyle = "#3a3f55";
  ctx.fillRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.strokeStyle = "#ff5040";
  ctx.lineWidth = 2;
  ctx.strokeRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.fillStyle = "#ff5040";
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 12, cam.y + Math.sin(cam.angle) * 12, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawThief(ctx, thief, time) {
  const bob = Math.sin(time * 8) * (thief.moving ? 1.5 : 0);
  ctx.save();
  ctx.translate(thief.x, thief.y + bob * 0.3);
  // Shadow.
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded burglar: dark cloak, pale mask, gold sash.
  ctx.fillStyle = "#15131f";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8f7bd8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#e8e4d8";
  ctx.beginPath();
  ctx.arc(0, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#15131f";
  ctx.fillRect(-5, -4, 3.5, 2.5);
  ctx.fillRect(1.5, -4, 3.5, 2.5);
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(-8, 4, 16, 3);
  ctx.restore();
}

function drawLoot(ctx, level, time) {
  // Vault pedestal + the Star Sapphire, glowing.
  const v = level.vault;
  ctx.fillStyle = "#3d3a55";
  ctx.fillRect(v.x - 16, v.y - 12, 32, 24);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.strokeRect(v.x - 16, v.y - 12, 32, 24);
  if (!level.sapphire.taken) {
    const pulse = 0.7 + Math.sin(time * 3) * 0.3;
    const glow = ctx.createRadialGradient(v.x, v.y - 8, 2, v.x, v.y - 8, 34);
    glow.addColorStop(0, "rgba(120,220,255," + (0.55 * pulse) + ")");
    glow.addColorStop(1, "rgba(120,220,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(v.x, v.y - 8, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7fe0ff";
    ctx.beginPath();
    ctx.moveTo(v.x, v.y - 22);
    ctx.lineTo(v.x + 9, v.y - 8);
    ctx.lineTo(v.x, v.y + 2);
    ctx.lineTo(v.x - 9, v.y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(v.x - 3, v.y - 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const gem of level.gems) {
    if (gem.taken) continue;
    ctx.fillStyle = "#ff7fb0";
    ctx.beginPath();
    ctx.moveTo(gem.x, gem.y - 8);
    ctx.lineTo(gem.x + 6, gem.y);
    ctx.lineTo(gem.x, gem.y + 7);
    ctx.lineTo(gem.x - 6, gem.y);
    ctx.closePath();
    ctx.fill();
  }
  for (const cs of level.cases) {
    if (cs.taken) continue;
    ctx.fillStyle = "rgba(160,220,255,0.25)";
    ctx.fillRect(cs.x - 13, cs.y - 13, 26, 26);
    ctx.strokeStyle = "#9fd8ff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cs.x - 13, cs.y - 13, 26, 26);
    ctx.fillStyle = "#ffd250";
    ctx.beginPath();
    ctx.arc(cs.x, cs.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawWorld(ctx, game, time) {
  const { level, thief, guards, cameras } = game;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Marble floor, checkerboard.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = c + "," + r;
      if (level.walls.has(key)) continue;
      ctx.fillStyle = (r + c) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (level.carpets.has(key)) {
        ctx.fillStyle = CARPET;
        ctx.fillRect(c * TILE + 3, r * TILE, TILE - 6, TILE);
        ctx.fillStyle = CARPET_EDGE;
        ctx.fillRect(c * TILE + 3, r * TILE, 2, TILE);
        ctx.fillRect(c * TILE + TILE - 5, r * TILE, 2, TILE);
      }
    }
  }
  // Walls with a lit top edge.
  for (const key of level.walls) {
    const [c, r] = key.split(",").map(Number);
    ctx.fillStyle = WALL_FACE;
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    ctx.fillStyle = WALL_TOP;
    ctx.fillRect(c * TILE, r * TILE, TILE, 5);
  }
  // Crates: cover you can hide behind.
  for (const crate of level.crates) {
    ctx.fillStyle = CRATE;
    ctx.fillRect(crate.x - TILE / 2, crate.y - TILE / 2, TILE, TILE);
    ctx.strokeStyle = CRATE_EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(crate.x - TILE / 2 + 1, crate.y - TILE / 2 + 1, TILE - 2, TILE - 2);
    ctx.beginPath();
    ctx.moveTo(crate.x - TILE / 2, crate.y - TILE / 2);
    ctx.lineTo(crate.x + TILE / 2, crate.y + TILE / 2);
    ctx.stroke();
  }
  // Exit door, glowing green once the sapphire is yours.
  const exit = level.exit;
  ctx.fillStyle = level.sapphire.taken ? "#2fae5f" : "#5a5f7a";
  ctx.fillRect(exit.x - 16, exit.y - 16, 32, 32);
  ctx.strokeStyle = level.sapphire.taken ? "#7dffb0" : "#9aa0b8";
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x - 16, exit.y - 16, 32, 32);
  ctx.fillStyle = "#0a0a14";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EXIT", exit.x, exit.y + 4);
  drawLoot(ctx, level, time);
  for (const cam of cameras) drawCamera(ctx, cam);
  for (const g of guards) drawGuard(ctx, g, time);
  drawThief(ctx, thief, time);
  // Smoke bomb cloud.
  if (game.smoke > 0) {
    ctx.fillStyle = "rgba(200,200,210," + Math.min(0.5, game.smoke * 0.2) + ")";
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 90, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHud(ctx, game) {
  const W = WIDTH;
  ctx.fillStyle = "rgba(8,8,18,0.92)";
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(0, 46, W, 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f0e6c8";
  ctx.font = "bold 19px Georgia, serif";
  ctx.fillText("VELVET VAULT HEIST", 14, 24);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#9aa0b8";
  ctx.fillText("WASD move · Shift sneak · Space smoke · E grab", 250, 24);
  // Alarm meter.
  const ax = 640, ay = 14, aw = 220, ah = 18;
  ctx.fillStyle = "#1c1c2c";
  ctx.fillRect(ax, ay, aw, ah);
  const alarm = game.alarm / 100;
  const alarmColor = alarm < 0.5 ? "#e8b93c" : alarm < 0.8 ? "#ff7a30" : "#ff4030";
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, ay, aw * alarm, ah);
  ctx.strokeStyle = "#f0e6c8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = "#f0e6c8";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("ALARM " + Math.round(game.alarm) + "%", ax + aw + 10, 24);
  // Loot + tools.
  ctx.fillStyle = "#7fe0ff";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("◆ " + game.loot + " / " + game.lootTotal, 1000, 24);
  ctx.fillStyle = "#c9c9d8";
  ctx.fillText("SMOKE ×" + game.smokeBombs, 1120, 24);
  // Objective line: a pill just under the HUD, so it never hides the
  // exit door or the floor at the bottom of the screen.
  ctx.fillStyle = "rgba(8,8,18,0.78)";
  const pillW = ctx.measureText(game.objective).width + 24;
  ctx.fillRect(14, 56, pillW, 26);
  ctx.strokeStyle = "rgba(201,162,39,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 56, pillW, 26);
  ctx.fillStyle = "#e8e4d8";
  ctx.font = "14px sans-serif";
  ctx.fillText(game.objective, 26, 70);
}

export function drawOverlay(ctx, game) {
  if (game.state === "title") {
    ctx.fillStyle = "rgba(8,8,18,0.78)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9a227";
    ctx.font = "bold 54px Georgia, serif";
    ctx.fillText("VELVET VAULT HEIST", WIDTH / 2, 250);
    ctx.fillStyle = "#f0e6c8";
    ctx.font = "22px Georgia, serif";
    ctx.fillText("One thief. One sapphire. A gallery full of eyes.", WIDTH / 2, 310);
    ctx.font = "17px sans-serif";
    ctx.fillStyle = "#c9c9d8";
    ctx.fillText("Sneak past the guards and their vision cones. Dodge the sweeping cameras.", WIDTH / 2, 360);
    ctx.fillText("Grab the Star Sapphire, then slip out the front door before the alarm hits 100%.", WIDTH / 2, 388);
    ctx.fillText("WASD / arrows move · Shift sneak · Space smoke bomb · E grab loot · Click to move", WIDTH / 2, 430);
    ctx.fillStyle = "#ffd250";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Click or press Enter to begin", WIDTH / 2, 500);
    return;
  }
  if (game.state === "caught" || game.state === "won") {
    ctx.fillStyle = "rgba(8,8,18,0.72)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    if (game.state === "caught") {
      ctx.fillStyle = "#ff5040";
      ctx.font = "bold 52px Georgia, serif";
      ctx.fillText("CAUGHT!", WIDTH / 2, 300);
      ctx.fillStyle = "#f0e6c8";
      ctx.font = "20px sans-serif";
      ctx.fillText("The alarm hit 100% and the guards closed in.", WIDTH / 2, 350);
    } else {
      ctx.fillStyle = "#7dffb0";
      ctx.font = "bold 52px Georgia, serif";
      ctx.fillText("CLEAN GETAWAY!", WIDTH / 2, 300);
      ctx.fillStyle = "#f0e6c8";
      ctx.font = "20px sans-serif";
      ctx.fillText("The Star Sapphire is yours. Score: " + game.score, WIDTH / 2, 350);
    }
    ctx.fillStyle = "#ffd250";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Press R to try again", WIDTH / 2, 420);
  }
}
