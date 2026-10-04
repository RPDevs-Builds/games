# 👾 Space Invaders (1978)

An authentic recreation of Tomohiro Nishikado and Taito's revolutionary 1978 fixed-screen arcade shooter classic **Space Invaders**.

Features the authentic 5×11 marching alien fleet with 2-frame retro bitmap animation, dynamic hardware-accurate stepping tempo speed progression curve, strict single-laser limit, 4 destructible pixel-erosion bunkers, mystery flying saucer UFO spawners, descending 4-tone bass pulse sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/spaceinvaders/`
  - Move cannon with `ArrowLeft`/`ArrowRight` or touch drag.
  - Fire cannon with `Space` or touch button.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/spaceinvaders/spaceinvaders_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full scoring point values, alien speed progression formulas, and bunker conservation tactics.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/spaceinvaders/test
```
