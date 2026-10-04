# ⚪ Othello / Reversi (1883 / 1971)

An authentic recreation of the 1883 British strategic board game classic **Reversi** / **Othello**, popularized worldwide by Goro Hasegawa in 1971.

Features an 8×8 green felt board, 3-tier Minimax AI with Alpha-Beta pruning, corner-weight matrix heuristics, 2-player local Pass & Play, tactile disc placement and flip audio synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/othello/`
  - Tap any cell highlighted with a hint dot to place your disc.
  - Flank and flip your opponent's discs horizontally, vertically, and diagonally!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/othello/cli/othello_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full historical background, corner dominance heuristics, and X-square danger zones.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/othello/test
```
