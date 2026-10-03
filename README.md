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
   - **Terminal / CLI**: Direct console-playable versions for SSH sessions and headless servers.
3. **Automated itch.io / Web Packaging**:
   - Run `/home/llmuser/projects/.scripts/shell/package_games.sh all` to instantly build standalone release zips in `dist/`.
4. **CI/CD Deployment**:
   - Automatic GitHub Pages publishing via `.github/workflows/deploy.yml`.

---

## 🎮 Games Suite Registry

| Game | Directory | Type | Rules | Status | Platforms |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Master Arcade** | [`/`](./) | Central Cabinet Launcher | - | 🟢 Production | Web, PWA |
| **Lights Out** | [`lightsout/`](./lightsout) | Binary Logic / 90s Handheld | [`RULES.md`](./lightsout/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |
| **Retro Snake** | [`snake/`](./snake) | Nokia 3310 Arcade | [`RULES.md`](./snake/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |
| **Simon** | [`simon/`](./simon) | 1978 Handheld Memory | [`RULES.md`](./simon/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |
| **Minesweeper** | [`minesweeper/`](./minesweeper) | Windows 95 Deduction | [`RULES.md`](./minesweeper/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |
| **2048** | [`2048/`](./2048) | Sliding Number Puzzle | [`RULES.md`](./2048/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |
| **Dots & Boxes** | [`dotsandboxes/`](./dotsandboxes) | Combinatorial Strategy | [`RULES.md`](./dotsandboxes/RULES.md) | 🟢 Production | Web, PWA, Terminal CLI |

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

### Run All Unit Test Suites
```bash
python3 /mnt/sharedroot/projects/games/lightsout/test/test_engine.py
python3 /mnt/sharedroot/projects/games/snake/test/test_snake.py
python3 /mnt/sharedroot/projects/games/simon/test/test_simon.py
python3 /mnt/sharedroot/projects/games/minesweeper/test/test_minesweeper.py
python3 /mnt/sharedroot/projects/games/2048/test/test_2048.py
python3 /mnt/sharedroot/projects/games/dotsandboxes/test/test_dotsandboxes.py
```

