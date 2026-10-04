# 🚀 Asteroids (1979)

An authentic recreation of Lyle Rains and Ed Logg's landmark 1979 Atari vector-graphics arcade space shooter **Asteroids**.

Features full 360-degree rotational inertia and thruster physics, toroidal wraparound screen boundaries, procedural polygon asteroid splitting, alien flying saucers, emergency hyperspace jump, particle explosion debris, authentic vector sound synthesis, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/asteroids/`
  - Rotate ship with `ArrowLeft`/`ArrowRight`, apply thrust with `ArrowUp`, fire photon torpedoes with `Space`.
  - Press `Down` or `H` for an emergency hyperspace leap into the unknown!
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/asteroids/asteroids_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full scoring tables, saucer hunting tactics, and vector physics details.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/asteroids/test
```
