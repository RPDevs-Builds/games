# 🟡 Connect Four (Four in a Row) - Rules & Combinatorial Theory Guide

> **Release**: 1974  
> **Inventors**: Howard Wexler & Ned Strongin  
> **Original Publisher**: Milton Bradley  
> **Genre**: Discrete Combinatorial Connection Game  
> **Mathematical Solution**: Solved (James D. Allen & Victor Allis, 1988)

---

## 1. Game Overview
*Connect Four* is a two-player vertical connection game played on a standard **7-column by 6-row** grid. Players take turns dropping colored discs (Player 1: Red/Blue, Player 2: Yellow/Coral) into any non-full column.

### Core Mechanics
1. **Gravity Drop**: Discs fall straight down, occupying the lowest available cell within the chosen column.
2. **Turn-Based**: Players alternate one drop per turn.
3. **Winning Condition**: The first player to form a horizontal, vertical, or diagonal line of **four consecutive discs** of their color immediately wins.
4. **Draw Condition**: If all 42 cells are filled and neither player has achieved four-in-a-row, the game is declared a draw.

---

## 2. Combinatorial Game Theory & Mathematical Solution

Connect Four is a zero-sum, finite, perfect-information game with approximately $4.5 \times 10^{12}$ valid board states:

### 1. First-Player Win Proof (Allen & Allis, 1988)
In 1988, James D. Allen and Victor Allis independently solved Connect Four, mathematically proving that:
- With perfect play, the **first player (Player 1)** can always force a win when starting in the **center column (column 4)**.
- If Player 1 starts in columns 3 or 5, the game results in a draw against perfect play.
- If Player 1 starts in columns 1, 2, 6, or 7, Player 2 can force a win.

### 2. Center Column Dominance
The central column (column 3, 0-indexed) participates in **more winning 4-in-a-row combinations** (horizontal, vertical, and both diagonals) than any other column on the board:
- Column 3 participates in **up to 16 distinct winning lines**.
- Edge columns (0 and 6) participate in only 3 distinct winning lines.
- Controlling the center column is the foundational heuristic for strategic dominance.

### 3. Odd / Even Parity Strategy
Because gravity requires discs to be played from the bottom up:
- Player 1 controls the **odd rows** (rows 1, 3, 5).
- Player 2 controls the **even rows** (rows 2, 4, 6).
- Creating vertical threats in odd rows naturally favors Player 1, while even row threats favor Player 2.

### 4. Double Threats (Forks)
An unstoppable win occurs when a player creates two simultaneous, independent 3-in-a-row threats that cannot both be blocked in a single turn.

---

## 3. Digital AI Architecture (Minimax with Alpha-Beta Pruning)
The digital engine implements an adversarial **Minimax search algorithm with Alpha-Beta pruning**:
- **Evaluation Heuristic**:
  - Direct Win / Loss: $\pm 100,000$ points.
  - Open 3-in-a-Row Threats: $+50$ points per unblocked threat.
  - Open 2-in-a-Row Formations: $+10$ points.
  - Center Column Presence: $+6$ points per disc in column 3, $+3$ points in columns 2 and 4.
- **Difficulty Tiers**:
  - **Easy**: 1-ply greedy search with random perturbation.
  - **Medium**: 3-ply Minimax evaluating tactical forks and blocks.
  - **Hard**: 6-ply Alpha-Beta Minimax with move ordering (searching center columns first for maximal cutoff efficiency).
