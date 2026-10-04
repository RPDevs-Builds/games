# 🧱 Falling Blocks (Tetromino 1984) - Rules & Strategy Guide

## Overview
Falling Blocks is the quintessential tile-matching arcade puzzle game originally designed in 1984. Seven distinct tetrominoes fall from the sky into a 10×20 matrix. Your objective is to rotate, slide, and drop these pieces to form complete horizontal lines without gaps.

---

## The 7 Tetrominoes
Every piece consists of exactly four squares:
- **I-Piece (Cyan)**: 4×1 line. The only piece capable of clearing a 4-line *Tetris*.
- **O-Piece (Yellow)**: 2×2 square. Stable, does not rotate.
- **T-Piece (Purple)**: 3×2 T-shape. Flexible with high mobility.
- **S-Piece (Green)**: 3×2 right snake.
- **Z-Piece (Red)**: 3×2 left snake.
- **J-Piece (Blue)**: 3×2 L-shape pointing left.
- **L-Piece (Orange)**: 3×2 L-shape pointing right.

---

## Core Game Mechanics

### 1. 7-Bag Randomizer
Pieces are dealt using the authentic 7-bag algorithm: each cycle of 7 pieces contains exactly one of each shape shuffled randomly. This prevents dry streaks and ensures fair, deterministic distribution.

### 2. Super Rotation System (SRS)
Pieces can rotate clockwise and counter-clockwise even when flush against walls or settled blocks. The engine checks a standard kick table to slip pieces into tight pockets.

### 3. Ghost Piece Projection
A semi-transparent outline on the floor shows exactly where the falling piece will land if dropped instantly.

### 4. Hold Queue
Press **C** or tap **HOLD** to swap your current piece with the hold slot. You may only hold once per piece drop until the piece locks.

### 5. Scoring & Level Scaling
- **Single (1 Line)**: 100 × Level
- **Double (2 Lines)**: 300 × Level
- **Triple (3 Lines)**: 500 × Level
- **Tetris (4 Lines)**: 800 × Level (1.5× bonus for Back-to-Back Tetris!)
- **Soft Drop**: +1 pt per cell
- **Hard Drop**: +2 pts per cell
- **Level Scaling**: Increases every 10 cleared lines, accelerating gravity speed.

---

## Controls Reference

| Action | Keyboard | Touch / Gamepad |
| :--- | :--- | :--- |
| **Move Left** | `←` or `A` | `◀` / D-Pad Left |
| **Move Right** | `→` or `D` | `▶` / D-Pad Right |
| **Soft Drop** | `↓` or `S` | `▼` / D-Pad Down |
| **Hard Drop** | `Space` | `⤓ HARD DROP` / Button A |
| **Rotate CW** | `↑` or `W` or `X` | `⟳ CW` / Button B |
| **Rotate CCW** | `Z` | `⟲ CCW` / Button X |
| **Hold Piece** | `C` or `Shift` | `HOLD` / Button Y / LB |
| **Pause** | `P` or `Esc` | `⏸ Pause` / Start |
| **Reset** | `R` | `🔄 Reset` / Select |
