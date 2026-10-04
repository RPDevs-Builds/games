# 🏓 Pong (1972) - Rules & Strategy Guide

## Overview
**Pong** is one of the earliest arcade video games, designed by Allan Alcorn and released by Atari in November 1972. It is a 2D sports simulation that simulates table tennis. The original arcade cabinet was famously installed at Andy Capp's Tavern in Sunnyvale, California, where it stopped working after its coin mechanism overflowed with quarters.

---

## Game Objective
Control your paddle vertically to hit the ball back across the net to your opponent. When your opponent fails to return the ball, you score one point. The first player to reach **11 points** wins the match.

---

## Controls
- **Mobile / Touch**:
  - Touch & drag along the screen to smoothly reposition your paddle.
  - Or use the on-screen `▲ UP` and `DOWN ▼` virtual touch buttons.
- **Keyboard**:
  - **Player 1**: `W` / `S` or `Up` / `Down` (in 1-Player mode).
  - **Player 2** (Local 2P): `Up` / `Down` arrows.
  - `Space`: Serve / Launch ball.
  - `R`: Reset game.
- **Gamepad / Controller**:
  - Left Analog Stick or D-Pad controls Player 1 paddle.
  - Right Analog Stick controls Player 2 paddle (in 2P mode).

---

## Physics & Mechanics
1. **Angular Paddle Deflection**:
   - The ball's return angle depends directly on where it hits your paddle.
   - Hitting near the paddle edges generates sharp 50-degree cut angles.
   - Hitting in the dead center reflects the ball straight back across the arena.
2. **Dynamic Speed Ramping**:
   - Each successful paddle volley accelerates the ball by **5%**, testing player reflexes during intense rallies (up to a blistering 680 px/sec).
3. **Wall Bounces**:
   - The ball rebounds specularly off the top and bottom court boundaries without losing momentum.
4. **Predictive AI Modes**:
   - **Easy**: Slower reaction time with occasional tracking jitter.
   - **Medium**: Reliable tracking when the ball approaches the CPU half.
   - **Impossible**: Mathematical vector projection calculating bounce trajectories in advance.
