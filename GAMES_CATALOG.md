# 📚 Games Catalog & Platform Matrix

This catalog tracks all games in the RPDevs Games base, their release status, platform targets, and mechanics.

---

## 🟢 Released Games (Full Suite)

### 1. Lights Out (`lightsout/`)
- **Genre**: Binary Logic / Grid Puzzle / 90s Handheld Classic
- **Inspiration**: Tiger Electronics (1995)
- **Base Directory**: [`/mnt/sharedroot/projects/games/lightsout/`](./lightsout)
- **Rules & Theory**: [`RULES.md`](./lightsout/RULES.md)
- **Features**: GF(2) Gaussian elimination solver, Daily Seed Challenge with emoji sharing, Lit-Out invert mode, Torus wrap-around topology, retro audio synthesizer, 12 campaign levels.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

### 2. Retro Snake (`snake/`)
- **Genre**: Arcade Reflexes / Mobile Classic
- **Inspiration**: Nokia 3310 (1997-2000)
- **Base Directory**: [`/mnt/sharedroot/projects/games/snake/`](./snake)
- **Rules**: [`RULES.md`](./snake/RULES.md)
- **Features**: Authentic monochrome green LCD pixel matrix, piezoelectric square wave bleeps, speed ramping, touchscreen D-pad, high-score memory.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

### 3. Simon (`simon/`)
- **Genre**: Audio-Visual Sequence Memory / 1978 Handheld
- **Inspiration**: Milton Bradley / Ralph Baer (1978)
- **Base Directory**: [`/mnt/sharedroot/projects/games/simon/`](./simon)
- **Rules**: [`RULES.md`](./simon/RULES.md)
- **Features**: Exact historical harmonic frequencies (209Hz to 415Hz), circular quadrant disc console, progressive sequence growth, strict mode.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

### 4. Minesweeper (`minesweeper/`)
- **Genre**: Deductive Logic / Windows 95 Desktop Classic
- **Inspiration**: Microsoft Windows 3.1/95 (1992)
- **Base Directory**: [`/mnt/sharedroot/projects/games/minesweeper/`](./minesweeper)
- **Rules**: [`RULES.md`](./minesweeper/RULES.md)
- **Features**: Guaranteed first-click safety, Windows 95 grey bevels, digital LED timer, animated smiley face reset, flag toggling.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

### 5. 2048 (`2048/`)
- **Genre**: Sliding Block / Mathematical Puzzle
- **Inspiration**: Gabriele Cirulli (2014)
- **Base Directory**: [`/mnt/sharedroot/projects/games/2048/`](./2048)
- **Rules**: [`RULES.md`](./2048/RULES.md)
- **Features**: Touch swipe gesture physics, merge harmonic synthesis, undo support, score & best persistence, endless mode beyond 2048.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

### 6. Dots and Boxes (`dotsandboxes/`)
- **Genre**: Combinatorial Strategy / Paper-and-Pencil Classic
- **Inspiration**: Édouard Lucas (1889 / *La Pipopipette*)
- **Base Directory**: [`/mnt/sharedroot/projects/games/dotsandboxes/`](./dotsandboxes)
- **Rules & Theory**: [`RULES.md`](./dotsandboxes/RULES.md)
- **Features**: Graph-based topology, bonus turn chain reactions, 3-tier AI opponent (with chain capture & double-cross sacrifice heuristics), vintage blueprint UI, pencil scratch audio.
- **Platforms**: Web, PWA, Terminal CLI, itch.io, Mobile.

---

## 📦 Automated Release Packages

Pre-built web distribution zip archives ready for instant upload to [itch.io](https://itch.io) or static hosting are located in [`/mnt/sharedroot/projects/games/dist/`](./dist):
- `dist/lightsout_web_release.zip`
- `dist/snake_web_release.zip`
- `dist/simon_web_release.zip`
- `dist/minesweeper_web_release.zip`
- `dist/2048_web_release.zip`
- `dist/dotsandboxes_web_release.zip`
- `dist/arcade_portal_release.zip` (The full arcade suite)


Run `/home/llmuser/projects/.scripts/shell/package_games.sh all` at any time to re-bundle all packages.
