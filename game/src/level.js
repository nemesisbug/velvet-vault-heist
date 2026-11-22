// Velvet Vault Heist — level layout: one night gallery with three routes,
// cover crates, guard posts, sweeping cameras and the Star Sapphire vault.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 25;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

// Legend: '#' wall, '.' floor, 'C' crate cover, 'R' red carpet, 'V' vault pedestal,
// 'E' exit door, 'G' guard post, 'K' camera mount, 'S' sapphire, 'g' bonus gem,
// 'P' player start, 'D' display case (lootable, low value).
const MAP = [
  "########################################",
  "#P.....R..........#..........R.........#",
  "#......R....g.....#.....g....R.....K...#",
  "#......R..........#..........R.........#",
  "#..C...R....C.....D.....C....R....C....#",
  "#......R..........#..........R.........#",
  "####.####..####.####..####.####..####.##",
  "#......R..........#..........R.........#",
  "#..g...R....C..........C....R.....g....#",
  "#......R..........#..........R.........#",
  "#......R....G..........G....R....C.....#",
  "#..C...R..........C.........R..........#",
  "####.####..####.####..####.####..####.##",
  "#......R..........#..........R.........#",
  "#......R....C.....D.....C....R....g....#",
  "#..C...R..........#..........R.........#",
  "#......R....G..........G....R....C.....#",
  "#......R..........#..........R.........#",
  "####.####..####.####..####.####..####.##",
  "#......R..........#..........R.........#",
  "#..g...R....C.....V.....C....R.....K...#",
  "#......R..........#..........R.........#",
  "#......R....C..........C....R....C.....#",
  "#......R..........#..........R.........#",
  "########E###############################",
];

export function buildLevel() {
  const walls = new Set();
  const crates = [];
  const carpets = new Set();
  const cases = [];
  const gems = [];
  const guards = [];
  const cameras = [];
  let player = { x: 1.5 * TILE, y: 1.5 * TILE };
  let sapphire = { x: 0, y: 0 };
  let vault = { x: 0, y: 0 };
  let exit = { x: 0, y: 0 };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = MAP[r][c];
      const key = c + "," + r;
      const cx = (c + 0.5) * TILE;
      const cy = (r + 0.5) * TILE;
      if (ch === "#") walls.add(key);
      else if (ch === "C") crates.push({ x: cx, y: cy, w: TILE, h: TILE });
      else if (ch === "R") carpets.add(key);
      else if (ch === "D") cases.push({ x: cx, y: cy, taken: false });
      else if (ch === "g") gems.push({ x: cx, y: cy, taken: false });
      else if (ch === "G") guards.push({ x: cx, y: cy });
      else if (ch === "K") cameras.push({ x: cx, y: cy });
      else if (ch === "V") vault = { x: cx, y: cy };
      else if (ch === "S") sapphire = { x: cx, y: cy };
      else if (ch === "P") player = { x: cx, y: cy };
      else if (ch === "E") exit = { x: cx, y: cy };
    }
  }
  // The sapphire sits on the vault pedestal (marked V in the map).
  sapphire = { x: vault.x, y: vault.y, taken: false };
  return {
    walls, crates, carpets, cases, gems, guards, cameras,
    player, sapphire, vault, exit,
  };
}

export function isWall(level, px, py) {
  const c = Math.floor(px / TILE);
  const r = Math.floor(py / TILE);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  return level.walls.has(c + "," + r);
}

export function isCrate(level, px, py) {
  for (const crate of level.crates) {
    if (Math.abs(px - crate.x) < TILE / 2 + 6 && Math.abs(py - crate.y) < TILE / 2 + 6) return true;
  }
  return false;
}

// A tile blocks sight: walls and crates both hide the thief.
export function blocksSight(level, px, py) {
  return isWall(level, px, py) || isCrate(level, px, py);
}

// Walkable for the thief: not a wall, not a crate, not a display case.
export function walkable(level, px, py) {
  if (isWall(level, px, py) || isCrate(level, px, py)) return false;
  for (const cs of level.cases) {
    if (Math.abs(px - cs.x) < TILE / 2 + 4 && Math.abs(py - cs.y) < TILE / 2 + 4) return false;
  }
  return true;
}

// Line of sight between two points, sampled in small steps.
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(level, ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}
