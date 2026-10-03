# 🔢 2048: Official Rules & Mechanics

> *"Slide matching tiles together to double their value. Can you reach the elusive 2048 tile?"*

---

## 📖 1. Origin & Heritage
Created by Gabriele Cirulli in March 2014 as an open-source mathematical sliding block puzzle, 2048 became an instant global phenomenon.

---

## 🎯 2. Core Game Rules

### 2.1 The Grid
- Played on a $4 \times 4$ grid with numbered tiles.
- Starts with two tiles on the board, each having a value of **2** (90% chance) or **4** (10% chance).

### 2.2 Moving & Merging
- The player slides all tiles in one of four directions: **UP**, **DOWN**, **LEFT**, or **RIGHT**.
- All tiles slide in that direction until they hit an obstacle or the edge of the board.
- When two tiles with the **same number collide**, they merge into a single tile with their sum ($2+2 \rightarrow 4$, $4+4 \rightarrow 8$, etc.).
- A tile cannot merge twice in a single move.
- After every valid move, a new tile (2 or 4) spawns in a random empty cell.

### 2.3 Winning & Losing
- **Win Condition**: Create a tile with the value **2048**. (You can choose to keep playing to reach 4096, 8192, and beyond!).
- **Loss Condition**: The grid is full and no valid moves can be made (no empty cells and no adjacent matching tiles).
