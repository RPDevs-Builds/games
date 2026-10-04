# 🔴 Connect Four (1974)

An authentic recreation of the 1974 Milton Bradley vertical drop strategy classic **Connect Four**, invented by Howard Wexler and Ned Strongin.

Features a 7×6 gravity grid, Minimax AI engine with Alpha-Beta pruning, 2-player local pass-and-play, tactile plastic token sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/connectfour/`
  - Click or tap any column header to drop a checker.
  - Align 4 checkers of your color horizontally, vertically, or diagonally to win.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/connectfour/connectfour_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full rules, column control heuristics, and parity traps.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/connectfour/test
```
