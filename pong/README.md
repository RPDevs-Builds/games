# 🏓 Pong (1972)

An authentic recreation of Allan Alcorn and Atari's historic 1972 table tennis arcade game **Pong**, widely recognized as the foundation of the commercial video game industry.

Features authentic CRT scanline styling, segment-based paddle deflection angles, spin transfer, adaptive CPU opponent, 2-player local pass-and-play, tactile square-wave sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/pong/`
  - Control your paddle using `W`/`S` (Player 1) or `Up`/`Down` (Player 2).
  - On touch devices, drag the on-screen paddle vertically.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/pong/pong_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full scoring rules, deflection mechanics, and spin control tactics.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/pong/test
```
