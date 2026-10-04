# 🚀 Missile Command (1980)

An authentic, zero-dependency recreation of Dave Theurer and Atari's historic 1980 arcade defense classic **Missile Command**.

Features 6 cities, 3 strategic anti-ballistic missile silos (Alpha, Delta, Omega), incoming ICBM trajectory physics, MIRV warhead cluster splitting, expanding flak blast explosion dynamics, retro vector sound synthesis, touch/mouse/gamepad controls, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/missilecommand/`
  - Aim with mouse or touch, tap or press `A`/`S`/`D` to fire interceptors from Alpha, Delta, or Omega silos.
  - Form protective flak fireballs to dissolve incoming warheads before they strike cities!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/missilecommand/cli/missilecommand_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full ballistic trajectory theory, lead targeting tactics, and scoring multipliers.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/missilecommand/test
```
