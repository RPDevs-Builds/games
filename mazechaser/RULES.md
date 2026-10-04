# 🍒 Maze Chaser (1980) - Rules & Strategy Guide

## Overview
Maze Chaser is the quintessential 1980 arcade maze game. Guide your yellow hero through a neon labyrinth, eating all the glowing pellets while outsmarting four ghosts each possessing distinct AI targeting behaviors.

---

## Ghost Personalities & Targeting Behavior

Each of the four ghosts follows an exact algorithmic personality:

1. **Blinky (Red - "Shadow")**:
   - **Behavior**: The relentless pursuer.
   - **Target Tile**: Direct pursuit of player's current tile `(px, py)`.
   - **Scatter Corner**: Top-Right.

2. **Pinky (Pink - "Speedy")**:
   - **Behavior**: The ambush predator.
   - **Target Tile**: 4 tiles directly ahead of the player in their current direction of motion.
   - **Scatter Corner**: Top-Left.

3. **Inky (Cyan - "Bashful")**:
   - **Behavior**: The unpredictable pincer flanker.
   - **Target Tile**: Finds the intermediate spot 2 tiles ahead of the player, calculates the vector from Blinky to that spot, and doubles it.
   - **Scatter Corner**: Bottom-Right.

4. **Clyde (Orange - "Pokey")**:
   - **Behavior**: The cautious coward.
   - **Target Tile**: If greater than 8 tiles away from player, pursues player like Blinky; once within 8 tiles, loses courage and retreats to his home scatter corner!
   - **Scatter Corner**: Bottom-Left.

---

## Mode Waves

The game alternates between two global states:
- **Scatter Mode (7 Seconds)**: Ghosts abandon pursuit and loop their home corners.
- **Chase Mode (20 Seconds)**: Ghosts deploy their full targeting algorithms to corner the player.

---

## Energizers & Frightened Mode

Eating one of the 4 flashing gold Power Pellets triggers **Frightened Mode**:
- Ghosts turn deep blue and slow down to 60% speed.
- In the final 2 seconds, ghosts flash white before reverting.
- The player can eat frightened ghosts for cascading bonus points:
  - 1st Ghost: **200 pts**
  - 2nd Ghost: **400 pts**
  - 3rd Ghost: **800 pts**
  - 4th Ghost: **1,600 pts**
- Eaten ghosts turn into floating eyes and return to the central ghost house to respawn.

---

## Side Wraparound Tunnels
The tunnels on the far left and right edges (Row 9) allow instant wraparound between sides. Ghosts move slower through the tunnel, giving the player a critical escape route!

---

## Controls Reference

| Action | Keyboard | Touch / Gamepad |
| :--- | :--- | :--- |
| **Move Up** | `↑` or `W` | `▲` / Swipe Up / D-Pad Up |
| **Move Down** | `↓` or `S` | `▼` / Swipe Down / D-Pad Down |
| **Move Left** | `←` or `A` | `◀` / Swipe Left / D-Pad Left |
| **Move Right** | `→` or `D` | `▶` / Swipe Right / D-Pad Right |
| **Pause** | `P` or `Esc` | `⏸ Pause` / Start |
| **Reset** | `R` | `🔄 Reset` / Select |
