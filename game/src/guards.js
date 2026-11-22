// Velvet Vault Heist — guards and cameras: patrol routes, sweeping vision
// cones, alarm contribution and the chase that starts when the alarm maxes.
import { TILE, hasLineOfSight, walkable } from "./level.js";

export const GUARD_SPEED = 62;
export const GUARD_CHASE_SPEED = 118;
export const CONE_RANGE = 230;
export const CONE_HALF_ANGLE = 0.52; // ~60 degrees of vision
export const CAMERA_RANGE = 250;
export const CAMERA_HALF_ANGLE = 0.42;

// Patrol loops, one per guard post, in tile coordinates. Each loop stays
// inside one open band between the partition walls, so a guard never has
// to push through a wall or a crate to reach its next waypoint.
const PATROLS = [
  [[6, 9], [16, 9], [16, 10], [6, 10]],
  [[20, 9], [28, 9], [28, 10], [20, 10]],
  [[6, 15], [16, 15], [16, 16], [6, 16]],
  [[20, 15], [28, 15], [28, 16], [20, 16]],
];

export function makeGuards(level) {
  return level.guards.map((post, i) => {
    const loop = PATROLS[i % PATROLS.length];
    return {
      x: post.x, y: post.y,
      angle: Math.PI / 2,
      waypoint: 0,
      loop: loop.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE })),
      state: "patrol", // patrol | suspicious | chase
      suspect: null,
      chaseTime: 0,
      pause: 0,
    };
  });
}

export function makeCameras(level) {
  return level.cameras.map((mount, i) => ({
    x: mount.x, y: mount.y,
    baseAngle: i === 0 ? Math.PI / 2 : -Math.PI / 2,
    angle: i === 0 ? Math.PI / 2 : -Math.PI / 2,
    sweep: 0,
    sweepDir: i === 0 ? 1 : -1,
  }));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the watcher can see the thief: inside range and cone, with a
// clear line of sight. Sneaking halves the range at which you are spotted.
export function canSee(level, wx, wy, angle, range, halfAngle, tx, ty, sneaking) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  const effRange = sneaking ? range * 0.55 : range;
  if (dist > effRange) return false;
  if (Math.abs(angleDiff(angleTo(wx, wy, tx, ty), angle)) > halfAngle) return false;
  return hasLineOfSight(level, wx, wy, tx, ty);
}

export function updateGuards(level, guards, thief, dt, alarm, smoke) {
  let seen = false;
  for (const g of guards) {
    if (g.state === "chase") {
      g.chaseTime += dt;
      const a = angleTo(g.x, g.y, thief.x, thief.y);
      g.angle = a;
      const step = GUARD_CHASE_SPEED * dt;
      const nx = g.x + Math.cos(a) * step;
      const ny = g.y + Math.sin(a) * step;
      if (walkable(level, nx, g.y)) g.x = nx;
      if (walkable(level, g.x, ny)) g.y = ny;
      if (g.chaseTime > 6 || Math.hypot(thief.x - g.x, thief.y - g.y) > 420) {
        g.state = "patrol";
        g.chaseTime = 0;
      }
      continue;
    }
    // Patrol: walk to the next waypoint, pausing and looking around there.
    const target = g.loop[g.waypoint];
    if (g.pause > 0) {
      g.pause -= dt;
      g.angle += dt * 0.9; // scan the room while paused
      if (g.pause <= 0) g.waypoint = (g.waypoint + 1) % g.loop.length;
    } else {
      const a = angleTo(g.x, g.y, target.x, target.y);
      const want = angleDiff(a, g.angle);
      g.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, want));
      const step = GUARD_SPEED * dt;
      const nx = g.x + Math.cos(a) * step;
      const ny = g.y + Math.sin(a) * step;
      if (walkable(level, nx, g.y)) g.x = nx;
      if (walkable(level, g.x, ny)) g.y = ny;
      if (Math.hypot(target.x - g.x, target.y - g.y) < 10) g.pause = 1.6;
    }
    if (smoke > 0) continue;
    if (canSee(level, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE, thief.x, thief.y, thief.sneaking)) {
      seen = true;
      g.state = "suspicious";
      g.suspect = { x: thief.x, y: thief.y };
    } else if (g.state === "suspicious") {
      g.state = "patrol";
      g.suspect = null;
    }
  }
  return seen;
}

export function updateCameras(cameras, level, thief, dt, smoke) {
  let seen = false;
  for (const cam of cameras) {
    cam.sweep += cam.sweepDir * dt * 0.55;
    if (cam.sweep > 0.9) { cam.sweep = 0.9; cam.sweepDir = -1; }
    if (cam.sweep < -0.9) { cam.sweep = -0.9; cam.sweepDir = 1; }
    cam.angle = cam.baseAngle + cam.sweep;
    if (smoke > 0) continue;
    if (canSee(level, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, thief.x, thief.y, thief.sneaking)) {
      seen = true;
    }
  }
  return seen;
}

// When the alarm tops out, every guard knows where you are and runs at you.
export function triggerChase(guards) {
  for (const g of guards) {
    g.state = "chase";
    g.chaseTime = 0;
  }
}
