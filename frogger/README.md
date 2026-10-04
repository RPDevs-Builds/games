# 🐸 Frogger (1981)

An authentic recreation of Konami and Sega's 1981 highway-crossing and river-navigation arcade classic **Frogger**.

Features authentic 14 rows by 11 columns grid navigation, 5 lanes of directional speeding traffic (tractors, sports cars, big rigs), 5 treacherous river lanes with floating logs and diving turtles, 5 home dock landing bays, bonus timed fly insect spawners, 60-second countdown timer, Web Audio retro sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/frogger/`
  - Hop your frog up, down, left, and right across the bustling highway.
  - Leap between logs and turtles to safely fill all 5 open home docks!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/frogger/frogger_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full scoring tables, obstacle speeds, diving turtle cycles, and bonus fly mechanics.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/frogger/test
```
