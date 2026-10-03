# 💡 Lights Out (1995 Handheld Classic & GF(2) Engine)

An authentic, zero-dependency recreation of the legendary 1995 **Tiger Electronics Lights Out** handheld logic puzzle. Built with standard modern web technologies (HTML5, CSS3, ES6 modules, Web Audio API), full PWA offline support, and a complete terminal CLI port.

---

## 🎮 How to Play

The puzzle is played on a grid of light cells (classic 5×5, plus 3×3, 4×4, and 6×6 variants).

- **The Rule**: Pressing any cell toggles its state (ON $\leftrightarrow$ OFF) and simultaneously inverts all four directly adjacent orthogonal neighbors (Up, Down, Left, Right).
- **The Goal**: Turn **ALL lights OFF** ("Lights Out!") in the fewest moves and quickest time.
- **Rules & Theory**: See [`RULES.md`](./RULES.md) for the complete mathematical formulation in Galois Field $\mathbb{F}_2$, solvability theorems, and the human "Light Chasing" strategy guide.

---

## 🚀 Running the Game

### 1. Web Version (Browser & PWA)
Run any local static server from the games root:

```bash
# Using Python 3 built-in server:
python3 -m http.server 8080 --directory /mnt/sharedroot/projects/games
```

Then visit:
```text
http://localhost:8080/lightsout/
```

- **PWA Installation**: Open in Chrome, Edge, or Safari, and click "Install App" or "Add to Home Screen" for full-screen offline gameplay.
- **Share Puzzles**: Click the **Share** button to copy a URL with the exact encoded board state to challenge friends!

### 2. Terminal CLI Version (Shell / SSH)
Play directly in your console with ANSI color graphics and interactive keyboard controls:

```bash
python3 /mnt/sharedroot/projects/games/lightsout/cli/lightsout_cli.py
```

CLI Commands:
- `1 1` or `r c`: Toggle coordinate row $r$, column $c$.
- `h` or `hint`: Ask the GF(2) AI solver for the optimal next move.
- `s` or `solve`: Automatically solve the board in minimal moves.
- `u` or `undo`: Undo the previous move.
- `r` or `reset`: Reset board to initial puzzle state.
- `n` or `new`: Scramble a fresh solvable puzzle.
- `q` or `quit`: Exit game.

---

## 🎯 Game Features

- **Mathematical GF(2) Gaussian Elimination Solver**:
  - Implements binary linear algebra over $\mathbb{F}_2$.
  - Automatically searches the null space ($2^{\text{nullity}}$ combinations) to find the absolute minimum-weight move solution.
  - Guarantees 100% solvable random puzzles.
- **Web Audio API Synthesizer**:
  - Pure harmonic tone generation with spatial pentatonic pitches based on button coordinates.
  - Zero external `.mp3` or `.wav` assets required.
- **Campaign Mode**:
  - 12 handcrafted progressive difficulty levels with target par moves and star ratings.
- **Custom Puzzle Editor**:
  - Toggle individual lights freely to design your own patterns or test classic 1995 Tiger booklet challenges.
- **Theme Switcher**:
  - **Retro Handheld (1995)**: Charcoal casing, beveled buttons, and glowing warm amber LEDs.
  - **Cyber Matrix**: Deep dark synthwave with glowing cyan neon lights.
- **Controls & Accessibility**:
  - Full keyboard support: Arrow keys / WASD to navigate, Space / Enter to toggle, `H` for hint, `U` for undo, `R` for reset, `N` for new game.
  - Instant touch response (pointer events) with zero mobile tap delay.

---

## 📦 Multi-Platform Publishing Guide

### 1. itch.io & Web Portals
1. Zip the files inside `lightsout/`:
   ```bash
   cd /mnt/sharedroot/projects/games/lightsout
   zip -r lightsout-web.zip index.html style.css manifest.json sw.js src/
   ```
2. Upload `lightsout-web.zip` to itch.io as an HTML5 game.

### 2. Mobile App (Capacitor / Android & iOS)
```bash
npm install -g @capacitor/cli @capacitor/core
npx cap init "Lights Out" com.rpdevs.lightsout --web-dir .
npx cap add android
npx cap open android
```

### 3. GitHub Pages
Push the repository to GitHub and enable GitHub Pages on the `/games/lightsout` directory or main root.

---

## 🧪 Unit Testing

Run the test suite verifying toggle mechanics, idempotency, commutativity, solvability, and Gaussian elimination:

```bash
python3 /mnt/sharedroot/projects/games/lightsout/test/test_engine.py
```

---

## 📁 File Structure

```
lightsout/
├── RULES.md              # Authoritative rules, math theory, & Light Chasing guide
├── README.md             # Game documentation and deployment guide
├── index.html            # PWA web interface
├── style.css             # Handheld console & responsive styling
├── manifest.json         # Web App Manifest
├── sw.js                 # Service worker for offline play
├── src/
│   ├── engine.js         # Core game mechanics & GF(2) solver
│   ├── audio.js          # Web Audio API sound synthesizer
│   ├── storage.js        # High score & settings persistence
│   └── ui.js             # UI controller & keyboard navigation
├── cli/
│   └── lightsout_cli.py  # Playable terminal edition
└── test/
    └── test_engine.py    # Unit tests
```
