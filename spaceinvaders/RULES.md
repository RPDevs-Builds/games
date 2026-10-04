# 👾 Space Invaders (1978) - Game Rules & Strategy Guide

## Historical Background
Designed and programmed by **Tomohiro Nishikado** and released by **Taito** in June 1978 (licensed to Midway in North America), *Space Invaders* is the grandfather of the golden age of arcade games. Nishikado custom-engineered the hardware using an Intel 8080 CPU. The game's famous accelerating tempo was actually an emergent hardware limitation: rendering 55 alien sprites pushed the 8080 processor to its computational limit; as the player shot aliens down, the processor had fewer sprites to draw, causing the remaining invaders to naturally move faster and faster!

Nishikado turned this computational bottleneck into a core gameplay mechanic, coupling it with a 4-note descending bass heartbeat (`174Hz`, `164Hz`, `155Hz`, `146Hz`) that induced pure adrenaline in millions of arcade players worldwide.

---

## Game Rules & Mechanics

### 1. The Alien Fleet (55 Invaders)
- **Grid Layout**: 5 rows of 11 columns (55 aliens total).
  - **Top Row (Row 0)**: Squid (`30 pts`) — 11 aliens.
  - **Middle Rows (Rows 1 & 2)**: Crab (`20 pts`) — 22 aliens.
  - **Bottom Rows (Rows 3 & 4)**: Octopus (`10 pts`) — 22 aliens.
- **March Pattern**: The fleet steps left and right. When the leading edge strikes a screen boundary, the entire formation drops down one step and reverses horizontal direction.
- **Dynamic March Tempo**: The stepping interval scales directly with the remaining alive alien count:
  - 55 to 45 aliens: Leisurely march (~0.85s per step).
  - 20 to 10 aliens: Fast march (~0.35s per step).
  - Last surviving alien: Furious, blistering sprint across the arena!

### 2. Laser Cannon
- **Single Shot Discipline**: Emulating authentic 1978 shift-register hardware limitations, the player can have **only 1 active laser shot** on screen at any time.
- You must wait for your laser to hit an invader, strike a bunker, or leave the top screen before firing another.

### 3. Alien Bombs & Missiles
- Invaders drop bombs downwards from the lowest alien in active columns.
- Alien bombs can collide with your laser in mid-air, neutralizing both projectiles!

### 4. Destructible Defensive Bunkers
- **4 Green Archway Bunkers** protect your cannon.
- **Pixel-level Erosion**: Shots striking bunkers (from either your cannon below or alien bombs above) blast away realistic chunks of protective masonry.
- **Alien Invasion Crush**: If the alien fleet descends into the bunker line, they crush and dissolve any bunker material they make contact with.

### 5. Mystery Flying Saucer (UFO)
- Periodically flies across the topmost red zone accompanied by a high/low warbling siren.
- Successfully striking the saucer awards mystery bonus points: **50, 100, 150, 200, or 300 points**!

### 6. Invasion & Game Over
- Players start with **3 Lives**.
- Getting struck by an alien bomb destroys your cannon and costs 1 life.
- **Instant Game Over**: If even a single alien manages to touch down at the player cannon's baseline, the alien invasion succeeds and the game ends immediately!

---

## Scoring Summary

| Target | Point Value |
| :--- | :---: |
| Squid (Top Row) | **30 pts** |
| Crab (Middle Rows) | **20 pts** |
| Octopus (Bottom Rows) | **10 pts** |
| Mystery Flying Saucer (UFO) | **50 – 300 pts** |
| Perfect Fleet Clear (55 Aliens) | **990 pts** (Base Fleet) |

---

## Controls

| Action | Keyboard | Touch Controls | Gamepad (Controller) |
| :--- | :---: | :---: | :---: |
| **Move Left** | `←` / `A` | ◀ LEFT | Left Stick / D-Pad Left |
| **Move Right** | `→` / `D` | RIGHT ▶ | Left Stick / D-Pad Right |
| **Fire Laser** | `Space` | ⚡ FIRE | Button A / B / X / RT |
| **Restart Game** | `R` | Reset Button | Start / Select |
| **Toggle CRT** | Click Header | CRT Button | — |
| **Toggle Audio** | Click Header | Sound Button | — |
