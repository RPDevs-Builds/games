# 🐍 Retro Snake: Official Rules & Mechanics

> *"The classic test of reflexes and spatial greed. Consume food to grow, but remember: the longer you get, the less room you have to escape yourself."*

---

## 📖 1. Origin & Heritage
Snake originated in the 1976 arcade game *Blockade* and gained universal cultural renown when preloaded on the **Nokia 6110 in 1997** and **Nokia 3310 in 2000**. This edition recreates the unmistakable green monochrome LCD handheld aesthetic with modern responsive controls.

---

## 🎯 2. Core Rules & Objective

### 2.1 The Arena
- Played on a discrete $20 \times 20$ grid of LCD pixels.
- The snake starts in the center with a length of 3 segments, moving eastward.

### 2.2 Movement & Controls
- The snake advances continuously at a fixed clock interval (tick).
- The player can alter the snake's heading: **UP**, **DOWN**, **LEFT**, or **RIGHT**.
- The snake **cannot reverse into its own neck** (e.g. if moving RIGHT, pressing LEFT is rejected).

### 2.3 Food & Growth
- When the snake's head occupies the food cell:
  1. The food is consumed, and the player gains **10 points**.
  2. The snake grows by **1 segment** (the tail is not truncated on that tick).
  3. A new food pellet spawns instantly in a random unoccupied cell.
  4. Game tick interval decreases progressively (speed increases).

### 2.4 Loss Conditions
The game ends immediately if the snake's head:
1. Crosses the outer arena boundary (Wall Collision).
2. Collides with any segment of its own body (Self Collision).

---

## 🎮 3. Controls

- **Desktop Keyboard**:
  - Arrow Keys or `W`, `A`, `S`, `D` to steer.
  - `Space` to Pause / Resume.
  - `R` to Restart immediately.
- **Mobile Touch**:
  - On-screen tactile retro D-pad buttons (Up, Down, Left, Right).
  - Swipe gestures across the canvas.
