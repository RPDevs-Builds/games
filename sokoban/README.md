# 📦 Sokoban (1982)

An authentic recreation of Hiroyuki Imabayashi and Thinking Rabbit's 1982 Japanese discrete warehouse puzzle classic **Sokoban** (倉庫番).

Features 60 progressively challenging warehouse levels, automated deadlock detection assistant, tap-to-move pathfinding, undo history, industrial synthesized sound effects, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/sokoban/`
  - Push all crates onto designated storage goal targets (`.`).
  - Move using Arrow keys, `WASD`, or tap/click on-screen tiles.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/sokoban/sokoban_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full movement mechanics, deadlock prevention patterns, and warehouse logistics.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/sokoban/test
```
