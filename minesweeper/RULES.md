# 💣 Minesweeper: Official Rules & Deductive Logic

> *"Every number on the grid is an exact clue. Clear the minefield without detonation."*

---

## 📖 1. Origin & Heritage
Created by Curt Johnson and Robert Donner and popularized globally with **Microsoft Windows 3.1 in 1992**, Minesweeper remains one of the definitive logic puzzles of the personal computer era.

---

## 🎯 2. Core Game Rules

### 2.1 The Objective
Uncover all squares that **do not contain mines** without detonating any mine.

### 2.2 Board Mechanics
1. **Numbers**: When a safe square is clicked, it reveals a number indicating how many of its 8 surrounding neighbors contain a mine (from 1 to 8).
2. **Blank Squares (0)**: A square with zero adjacent mines is blank and automatically cascades to uncover all adjacent connected safe squares (Flood Fill).
3. **Flags (🚩)**: Mark suspected mines with a flag to prevent accidental clicks.
4. **First Click Safety**: The first square clicked is guaranteed to be safe and will open up an initial clearing.
5. **Loss Condition**: Clicking any square containing a mine immediately ends the game (detonation).
6. **Win Condition**: All safe squares are uncovered.

---

## 🎚️ 3. Standard Presets

| Difficulty | Grid Dimensions | Total Mines |
| :--- | :--- | :--- |
| **Beginner** | 9 × 9 | 10 Mines |
| **Intermediate** | 16 × 16 | 40 Mines |
| **Expert** | 30 × 16 | 99 Mines |
