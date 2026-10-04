# 🕹️ RPDevs Multi-Platform Games Base & Arcade Suite

Welcome to the **RPDevs Games Base** located at `/mnt/sharedroot/projects/games/`.
This repository is engineered to host a collection of classic retro, puzzle, and arcade games designed with a **"build once, publish anywhere"** philosophy.

---

## 🎯 Architecture & Publishing Principles

All games in this repository follow strict cross-platform design tenets:

1. **Zero External Dependencies**:
   - Built with standard HTML5, CSS3, ES6 JavaScript modules, and standard library Python.
   - No build step or node runtime is required. Runs from `file://`, local servers, or static web hosts.
2. **Publish Anywhere Compatibility**:
   - **Modern Web**: Drop onto any static host (GitHub Pages, Netlify, Cloudflare Pages, S3).
   - **Progressive Web App (PWA)**: Full offline service worker caching and Web App Manifests (`manifest.json`) across the entire suite.
   - **Game Distribution Portals**: Self-contained zip packages for [itch.io](https://itch.io) in `dist/`.
   - **Native Android APKs**: Direct SDK builds (zero Gradle/npm bloat) signed and aligned in `dist/apk/`.
   - **Native Linux Desktop**: Standalone WebKitGTK desktop packages (`.tar.gz` and `.deb`) in `dist/desktop/`.
   - **Terminal / CLI**: Direct console-playable versions for SSH sessions and headless servers.
3. **Packaging & Distribution Scripts**:
   - Web / itch.io: `./scripts/package_games.sh all`
   - Android APKs: `./scripts/build_android_apk.sh all`
   - Linux Desktop: `./scripts/build_desktop_app.sh all`
   - App Icon Generation: `python3 scripts/generate_game_icons.py`
4. **CI/CD Deployment**:
   - Automatic GitHub Pages publishing via `.github/workflows/deploy.yml`.

---

## 🎮 Games Suite Registry

| Game | Directory | Type | Rules | Status | Platforms |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Master Arcade** | [`/`](./) | Central Cabinet Launcher (18 Games) | - | 🟢 Production | Web, PWA, Android, Desktop |
| **Lights Out** | [`lightsout/`](./lightsout) | Binary Logic / 90s Handheld (1995) | [`RULES.md`](./lightsout/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Retro Snake** | [`snake/`](./snake) | Nokia 3310 Arcade (1997) | [`RULES.md`](./snake/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Simon** | [`simon/`](./simon) | Handheld Memory (1978) | [`RULES.md`](./simon/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Minesweeper** | [`minesweeper/`](./minesweeper) | Windows 95 Deduction (1992) | [`RULES.md`](./minesweeper/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **2048** | [`2048/`](./2048) | Sliding Number Puzzle (2014) | [`RULES.md`](./2048/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Dots & Boxes** | [`dotsandboxes/`](./dotsandboxes) | Combinatorial Strategy (1889) | [`RULES.md`](./dotsandboxes/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Sokoban** | [`sokoban/`](./sokoban) | Box-Pushing Puzzle (1982) | [`RULES.md`](./sokoban/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Connect Four** | [`connectfour/`](./connectfour) | Vertical Gravity Grid (1974) | [`RULES.md`](./connectfour/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Breakout** | [`breakout/`](./breakout) | Paddle & Brick Demolition (1976) | [`RULES.md`](./breakout/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Pong** | [`pong/`](./pong) | 2D Paddle Tennis Arcade (1972) | [`RULES.md`](./pong/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Falling Blocks** | [`fallingblocks/`](./fallingblocks) | Tetromino Stacker (1984) | [`RULES.md`](./fallingblocks/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Maze Chaser** | [`mazechaser/`](./mazechaser) | 4-Ghost Labyrinth Classic (1980) | [`RULES.md`](./mazechaser/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Asteroids** | [`asteroids/`](./asteroids) | Vector Inertial Space Shooter (1979) | [`RULES.md`](./asteroids/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Wordle** | [`wordle/`](./wordle) | Deduction Word Guess (1955/2021) | [`RULES.md`](./wordle/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Space Invaders** | [`spaceinvaders/`](./spaceinvaders) | Marching Fleet Arcade Classic (1978) | [`RULES.md`](./spaceinvaders/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Frogger** | [`frogger/`](./frogger) | Highway & River Navigation Classic (1981) | [`RULES.md`](./frogger/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Othello** | [`othello/`](./othello) | Strategic 8×8 Reversi (1883/1971) | [`RULES.md`](./othello/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |
| **Missile Command** | [`missilecommand/`](./missilecommand) | Ballistic Trajectory Defense (1980) | [`RULES.md`](./missilecommand/RULES.md) | 🟢 Production | Web, PWA, CLI, Android, Desktop |

---

## 🚀 Quick Start & Local Play

### Run the Master Arcade in Your Browser
```bash
python3 -m http.server 8080 --directory /mnt/sharedroot/projects/games
```
Open `http://localhost:8080/` in your browser.

### Run Any Game in the Terminal
- Lights Out: `python3 /mnt/sharedroot/projects/games/lightsout/cli/lightsout_cli.py`
- Retro Snake: `python3 /mnt/sharedroot/projects/games/snake/cli/snake_cli.py`
- Simon: `python3 /mnt/sharedroot/projects/games/simon/cli/simon_cli.py`
- Minesweeper: `python3 /mnt/sharedroot/projects/games/minesweeper/cli/minesweeper_cli.py`
- 2048: `python3 /mnt/sharedroot/projects/games/2048/cli/game2048_cli.py`
- Dots & Boxes: `python3 /mnt/sharedroot/projects/games/dotsandboxes/cli/dotsandboxes_cli.py`
- Sokoban: `python3 /mnt/sharedroot/projects/games/sokoban/sokoban_cli.py`
- Connect Four: `python3 /mnt/sharedroot/projects/games/connectfour/connectfour_cli.py`
- Breakout: `python3 /mnt/sharedroot/projects/games/breakout/breakout_cli.py`
- Pong: `python3 /mnt/sharedroot/projects/games/pong/pong_cli.py`
- Falling Blocks: `python3 /mnt/sharedroot/projects/games/fallingblocks/fallingblocks_cli.py`
- Maze Chaser: `python3 /mnt/sharedroot/projects/games/mazechaser/mazechaser_cli.py`
- Asteroids: `python3 /mnt/sharedroot/projects/games/asteroids/asteroids_cli.py`
- Wordle: `python3 /mnt/sharedroot/projects/games/wordle/wordle_cli.py`
- Space Invaders: `python3 /mnt/sharedroot/projects/games/spaceinvaders/spaceinvaders_cli.py`
- Frogger: `python3 /mnt/sharedroot/projects/games/frogger/frogger_cli.py`
- Othello: `python3 /mnt/sharedroot/projects/games/othello/cli/othello_cli.py`
- Missile Command: `python3 /mnt/sharedroot/projects/games/missilecommand/cli/missilecommand_cli.py`

### Run All Unit Test Suites (122 Tests Across 18 Games)
```bash
for d in */test; do python3 -m unittest discover -s "$d"; done
```

### 📱 Build Native Android APKs
Direct SDK compilation with zero Gradle or npm overhead:
```bash
# Build a single game APK
./scripts/build_android_apk.sh dotsandboxes

# Build the complete suite + master arcade hub APKs
./scripts/build_android_apk.sh all
```
Output files are written to `dist/apk/` (e.g. `dist/apk/portal.apk`).

### 🖥️ Build Standalone Linux Desktop Apps
Direct WebKitGTK desktop bundles (portable tarballs and standard `.deb` packages):
```bash
# Build a single game desktop bundle
./scripts/build_desktop_app.sh lightsout

# Build all games + master arcade hub desktop packages
./scripts/build_desktop_app.sh all
```
Output files are written to `dist/desktop/` (e.g. `rpdevs-lightsout_1.0.0_amd64.deb`).


