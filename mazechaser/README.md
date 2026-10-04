# 🟡 Maze Chaser (1980)

An authentic recreation of Toru Iwatani and Namco's 1980 arcade maze masterpiece.

Features authentic four-ghost distinct targeting personalities (Blinky, Pinky, Inky, Clyde), alternating scatter and chase movement cycles, energizer fright mode with blue ghost consumption, bonus fruit spawners, chiptune sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/mazechaser/`
  - Navigate the maze collecting all dots while evading pursuing ghosts.
  - Eat larger flashing Power Pellets to turn the tables on ghosts!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/mazechaser/mazechaser_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full AI targeting algorithms, corner traps, and scatter/chase timing tables.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/mazechaser/test
```
