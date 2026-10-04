# 🚀 Asteroids (1979) - Game Rules & Strategy Guide

## Historical Background
Designed by **Lyle Rains** and programmed by **Ed Logg**, *Asteroids* was released by Atari in November 1979. It became Atari's bestselling arcade game of all time, selling over 70,000 arcade cabinets. Asteroids pioneered vector line graphics ("QuadraScan"), where an electron beam directly drew bright, crisp phosphor lines across the CRT face without a raster framebuffer.

The game is famed for its authentic Newtonian inertia in a frictionless space vacuum, modular rock splitting, the two-tone accelerating heartbeat soundtrack, and the dreaded alien flying saucers.

---

## Game Rules & Mechanics

### 1. Vector Space Ship
- **Steering**: Rotate ship 360 degrees left or right.
- **Thrust**: Fire rocket engine to accelerate in the direction the ship is pointing. Once in motion, your ship continues drifting through space with minimal vacuum drag.
- **Boundary Wraparound**: Flying off any edge of the screen causes your ship, lasers, and asteroids to immediately wrap around to the opposite side.
- **Invulnerability**: On initial spawn or after losing a life, your ship is invulnerable for 3 seconds (indicated by a flickering hull).

### 2. Laser Cannon
- Your ship can fire up to **5 active laser projectiles** at any time.
- Lasers travel with high velocity along the ship's heading, inherit a fraction of the ship's momentum, and wrap around screen boundaries before decaying.

### 3. Asteroid Splitting Hierarchy
- **Large Asteroid**: 20 points. When hit, splits into **2 Medium Asteroids**.
- **Medium Asteroid**: 50 points. When hit, splits into **2 Small Asteroids**.
- **Small Asteroid**: 100 points. When hit, completely disintegrates into vector debris.

Each large asteroid is therefore worth a cumulative total of **20 + 2×50 + 4×100 = 520 points**!

### 4. Alien Flying Saucers (UFOs)
- **Big Saucer (200 points)**: Appears periodically. Flies steadily across the screen, firing lasers in random directions.
- **Small Saucer (1,000 points)**: Appears in later waves or when high scores are achieved. Highly dangerous: fires predictive, targeted shots directly at the player ship!

### 5. Hyperspace Device
- When cornered by rocks and saucers, activate **Hyperspace** to instantly dematerialize and reappear at a random coordinate on the screen.
- **Warning**: There is an authentic **15% risk of hyperspace malfunction**, destroying the ship on re-entry.

### 6. Extra Ships
- Players start with **3 Ships**.
- An extra ship is awarded every **10,000 points**.

---

## Scoring Summary

| Target | Point Value |
| :--- | :---: |
| Large Asteroid | **20 pts** |
| Medium Asteroid | **50 pts** |
| Small Asteroid | **100 pts** |
| Big Flying Saucer | **200 pts** |
| Small Flying Saucer | **1,000 pts** |
| Complete Large Rock Family | **520 pts** |

---

## Controls

| Action | Keyboard | Touch Controls | Gamepad (Controller) |
| :--- | :---: | :---: | :---: |
| **Rotate Left** | `←` / `A` | ◀ TURN | Left Stick / D-Pad Left |
| **Rotate Right** | `→` / `D` | TURN ▶ | Left Stick / D-Pad Right |
| **Thrust** | `↑` / `W` | 🚀 THRUST | `B` / `LT` / Stick Up |
| **Fire Laser** | `Space` | ⚡ FIRE | `A` / `RT` |
| **Hyperspace** | `Shift` / `H` / `↓` | 🌀 HYPER | `X` / `Y` |
| **Restart Game** | `R` | Reset Button | `Start` |
| **Toggle Sound** | `M` | Sound Button | — |
| **Toggle CRT Shader** | `C` | CRT Button | — |
