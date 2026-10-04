# 🧱 Falling Blocks (1984)

An authentic recreation of Alexey Pajitnov's timeless 1984 tetromino alignment and line-clearing puzzle masterpiece.

Features modern Guideline-compliant mechanics including the 7-bag randomizer, Super Rotation System (SRS) wall kicks, ghost piece projection, hold piece queue, next queue preview, chiptune sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/fallingblocks/`
  - Rotate and drop falling tetrominoes to fill complete horizontal rows.
  - Complete 4 lines simultaneously for maximum bonus points!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/fallingblocks/fallingblocks_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full tetromino geometries, SRS rotation offset tables, and scoring multipliers.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/fallingblocks/test
```
