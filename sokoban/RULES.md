# 📦 Sokoban (倉庫番) - Rules & Combinatorial Theory Guide

> **Release**: 1982  
> **Designer**: Hiroyuki Imabayashi (今林 宏行)  
> **Original Publisher**: Thinking Rabbit (Japan)  
> **Genre**: Discrete Grid Optimization & Transport Puzzle  
> **Computational Complexity**: PSPACE-complete (Culberson, 1997)

---

## 1. Game Overview
*Sokoban* (Japanese for "warehouse keeper") is a classic transport puzzle where the player controls a warehouse worker tasked with pushing storage crates to designated storage target locations within a confined warehouse maze.

### Core Mechanics
1. **Push Only**: The worker can only **push** crates forward; crates cannot be pulled or climbed over.
2. **Single Crate Capacity**: Only **one crate** may be pushed at a time. The worker cannot push two adjacent crates in line.
3. **Impassable Obstacles**: Warehouse walls and fixed boundaries cannot be traversed.
4. **Victory Condition**: The level is solved when **every crate** rests on a designated storage target (`.` or `*`).

---

## 2. Standard XSB Level Representation
Sokoban levels worldwide follow the universal **XSB text notation**:

| Character | Meaning | Description |
|:---:|:---|:---|
| `#` | **Wall** | Impassable warehouse perimeter or partition |
| ` ` | **Floor** | Empty walkable warehouse floor space |
| `.` | **Goal** | Target storage location for a crate |
| `@` | **Player** | Worker on empty floor |
| `+` | **Player on Goal** | Worker standing on a target storage location |
| `$` | **Crate** | Pushable storage crate on empty floor |
| `*` | **Crate on Goal** | Storage crate resting correctly on a target location |

---

## 3. Deadlock Theory & Pitfall Detection

Because crates cannot be pulled, pushing a crate into an irreversible configuration causes a **deadlock** (an unsolveable state):

### 1. Corner Deadlock (Static)
A crate pushed into any corner formed by two perpendicular walls (`#` above and `#` to the right/left) can **never** be moved again. If that corner tile is not a designated goal, the level becomes permanently unwinnable.

### 2. 2×2 Block Deadlock
When four crates and/or walls form a 2×2 square, none of the inner crates can be pushed from any side. If any of the crates in the 2×2 block are not on goal locations, a deadlock occurs.

### 3. Wall Line Deadlock (Boundary Freeze)
A crate pushed flush against an unbroken boundary wall can only slide along that wall. If there are no goals along that wall, or if another crate blocks the slide, the crate is trapped forever.

---

## 4. Controls & Input Architecture
- **Desktop Keyboard**:
  - `Arrow Keys` or `W / A / S / D`: Move worker / push crate
  - `U` or `Ctrl+Z`: Undo previous move
  - `R`: Reset current level
- **Touch & Mobile**:
  - Virtual On-Screen D-Pad (Up, Down, Left, Right)
  - Screen Swipe Gestures
  - Tap-to-Move (Breadth-First Search pathfinding moves worker to any reachable empty square)
- **Gamepad**:
  - D-Pad / Left Stick: Navigate
  - `X / Square`: Undo
  - `Y / Triangle`: Reset
