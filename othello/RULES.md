# ⚪ Othello / Reversi (1883 / 1971) - Rules & Strategy Guide

## Overview
**Othello** (originally invented in England as *Reversi* in 1883 by Lewis Waterman and John W. Mollett, and trademarked as *Othello* in Japan by Goro Hasegawa in 1971) is a 2-player deterministic board game played on an 8×8 grid. 

The game’s motto—*"A minute to learn... a lifetime to master"*—captures its strategic depth: simple rules governing explosive tactical reversals.

---

## 🎮 How to Play

### Board Setup & Pieces
- Played on an 8×8 green felt board.
- 64 reversible discs: Black on one side, White on the other.
- The game begins with 4 discs placed in the center squares:
  - White at **D4** and **E5**
  - Black at **D5** and **E4**
- **Black moves first**.

### Flanking Rule
1. A player must place a disc on an empty square such that there is at least one straight line (horizontal, vertical, or diagonal) of opposing discs between the newly placed disc and another disc of the current player's color.
2. All trapped opposing discs along those lines are **flipped** to the current player's color.
3. If a player has no legal moves that can flip at least one opposing disc, their turn is **passed** to the opponent.
4. If neither player has a legal move (usually when the board is full), the game ends.
5. The player with the most discs of their color wins.

---

## 🧠 Master Strategy & Heuristics

1. **Corner Dominance**:
   - Corners (**A1, A8, H1, H8**) can never be flipped once claimed. They provide permanent anchors for safe edge expansions.
2. **Beware the C-Squares and X-Squares**:
   - The squares immediately adjacent to corners (**B1, B2, A2**, etc.) are dangerous early in the game because playing on them often allows your opponent to seize the adjacent corner on the very next turn.
3. **Mobility & Parity**:
   - It is rarely advantageous to capture many discs early in the game. Keeping your disc count low restricts your opponent's available moves while keeping your options open.
   - Force your opponent into positions where their only legal moves surrender corner access.

---

## 🕹️ Controls
- **Web**: Click or tap any hinted valid cell to place your disc.
- **Terminal CLI**: Enter letter-number coordinate (e.g., `D3`, `C5`).
