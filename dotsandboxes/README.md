# 📦 Dots and Boxes (Édouard Lucas 1889 / La Pipopipette)

An authentic recreation of the 1889 French mathematical pencil-and-paper strategy classic **Dots and Boxes** (*La Pipopipette*).
Features an interactive blueprint vector grid, tactile pencil sound synthesis, 3-tier AI opponent (with chain capture and double-cross strategies), local 2-player pass-and-play, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/dotsandboxes/`
  - Click or tap between any two unjoined adjacent dots to draw a line.
  - Complete the 4th side of any box to claim it and earn a **bonus turn**!
  - Play against the Computer (Easy, Medium, Hard) or Pass-and-Play with a friend.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/dotsandboxes/cli/dotsandboxes_cli.py
  ```

---

## 🧠 Rules & Game Theory
See [`RULES.md`](./RULES.md) for full history, combinatorial game theory (Nimstring equivalence), and the legendary **"Double-Cross"** sacrifice technique.

---

## 🧪 Testing

```bash
python3 /mnt/sharedroot/projects/games/dotsandboxes/test/test_dotsandboxes.py
```
