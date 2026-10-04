# 🧱 Breakout (1976)

An authentic, zero-dependency recreation of the legendary 1976 Atari arcade demolition classic **Breakout**, originally conceptualized by Nolan Bushnell and Steve Bristow and engineered by Steve Wozniak.

Features 8 tiers of color-coded bricks, progressive ball speed multipliers, angular deflection physics, tactile retro sound synthesis, keyboard/touch/gamepad controls, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/breakout/`
  - Drag or use Arrow keys to maneuver the paddle.
  - Deflect the ball upward to demolish the wall of bricks.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/breakout/breakout_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full scoring rules, angular physics breakdown, and the "Breakthrough" strategy.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/breakout/test
```
