# velvet-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nemesisbug/velvet-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nemesisbug/velvet-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Velvet Vault Heist** — a complete, original top-down stealth heist game for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

One thief. One sapphire. A gallery full of eyes. Sneak through the Velvet Gallery at night, read the patrols, slip past the guards' vision cones and the sweeping security cameras, grab the Star Sapphire from its vault pedestal, pocket the bonus gems and display-case trinkets on the way — then slip out the front door before the alarm meter hits 100%.

## How to play

Open `game/index.html` in desktop Chrome (serve `game/` with any static server, e.g. `python3 -m http.server` inside `game/`).

- **WASD / arrow keys** — move (or click somewhere to walk there)
- **Shift** — sneak: slower, but guards and cameras spot you at barely half the range
- **Space** — smoke bomb (2 per run): blinds guards and cameras for 4 seconds
- **E** — grab loot when close: the Star Sapphire, pink gems, display-case trinkets
- **R** — retry after being caught or escaping

Getting spotted raises the alarm — guards raise it fast, cameras slower. Break line of sight and it falls again. At 100% every guard chases you, and a guard's touch ends the run. Escape with the sapphire for the score: 500 for the sapphire, 100 per gem, 50 per trinket, plus a speed and low-alarm bonus.

## Layout

- `game/index.html` — the page; `game/src/main.js` — state machine, alarm, loot and the loop
- `game/src/level.js` — the gallery map, walls, cover, line of sight
- `game/src/guards.js` — guard patrols, vision cones, camera sweeps, the chase
- `game/src/render.js` — canvas drawing: floor, cones, characters, HUD, overlays
- `game/src/audio.js` — WebAudio synth sounds (no audio files)
- `game/src/input.js` — keyboard + mouse input
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` and writes `dossier.json`
- `screenshots/` — real renders of the game's own code

Original idea, art, sounds and names — no commercial game was copied.
