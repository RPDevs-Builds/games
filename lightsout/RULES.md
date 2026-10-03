# 💡 Lights Out: Official Rules, Mathematical Theory & Strategy Guide

> *"Lights Out is a puzzle of pure logic. Order does not matter, repetition is redundant, and every light that burns can be extinguished through the power of binary linear algebra."*

---

## 📖 1. Origin & History

**Lights Out** was created by Avi Arad, Burt Meyer, and the toy design team at **Tiger Electronics** in **1995**. The original physical electronic game featured a 5×5 grid of 25 backlit square push-buttons housed in a portable charcoal-grey handheld console. It quickly became an iconic 90s puzzle classic and a famous subject of study in recreational mathematics and linear algebra.

---

## 🎯 2. Core Game Rules & Objective

### 2.1 The Board
- The game is played on a two-dimensional grid of light cells.
- The standard board size is **5×5** (25 lights), but variations exist from **3×3** up to **6×6**.
- Each cell has two possible states:
  - **ON** (illuminated, glowing neon)
  - **OFF** (dark, dormant)

### 2.2 The Action (The Toggle Rule)
- When a player presses any cell $(r, c)$:
  1. The selected cell $(r, c)$ **flips state** (ON becomes OFF, or OFF becomes ON).
  2. All horizontally and vertically adjacent neighbor cells **flip state** as well:
     - Above: $(r - 1, c)$
     - Below: $(r + 1, c)$
     - Left: $(r, c - 1)$
     - Right: $(r, c + 1)$
  3. Diagonal cells are **unaffected**.
  4. Cells on the board edges or corners toggle fewer neighbors because boundary limits apply (a corner cell toggles itself and 2 neighbors; an edge cell toggles itself and 3 neighbors; an interior cell toggles itself and 4 neighbors).

### 2.3 The Win Condition
- The game is won when **ALL lights are turned OFF** ("Lights Out!").
- The challenge is to extinguish the entire board in the **minimum number of moves** and the **shortest time**.

---

## 🔬 3. Fundamental Mathematical Theorems

Lights Out obeys two fundamental algebraic principles that simplify gameplay:

### 3.1 Principle 1: Commutativity (Order Does Not Matter)
Because toggling a cell simply inverts binary states, toggling cell $A$ and then cell $B$ produces the exact same result as toggling cell $B$ and then cell $A$:
$$A \oplus B = B \oplus A$$
You do not need to worry about the sequence of your clicks—only *which* cells you click!

### 3.2 Principle 2: Idempotency (Never Click a Cell Twice)
Pressing any cell twice toggles it and its neighbors back to their initial state:
$$1 \oplus 1 = 0$$
In an optimal solution, **every cell should be clicked either 0 times or 1 time**. You never need to click any cell more than once.

---

## 🧮 4. The Linear Algebra of Lights Out ($GF(2)$)

Lights Out can be modeled as a system of linear equations over the Galois Field of two elements, **$\mathbb{F}_2$** (or $GF(2)$), where arithmetic is modulo 2:
- Addition corresponds to **XOR** ($\oplus$): $0+0=0,\; 0+1=1,\; 1+0=1,\; 1+1=0$
- Multiplication corresponds to **AND** ($\cdot$): $1 \cdot 1 = 1,\; 1 \cdot 0 = 0$

### 4.1 System Formulation
For an $m \times n$ grid with $N = m \cdot n$ cells:
- Let $\vec{b} \in \mathbb{F}_2^N$ be the **current board state vector**, where $b_i = 1$ if light $i$ is ON, and $0$ if OFF.
- Let $\vec{x} \in \mathbb{F}_2^N$ be the **move vector**, where $x_j = 1$ if cell $j$ must be clicked, and $0$ if not.
- Let $A \in \mathbb{F}_2^{N \times N}$ be the **toggle adjacency matrix**, where:
  $$A_{i, j} = \begin{cases} 1 & \text{if pressing cell } j \text{ toggles light } i \\ 0 & \text{otherwise} \end{cases}$$

To turn all lights off, the total state after the moves must be zero vector:
$$\vec{b} \oplus A \vec{x} = \vec{0} \iff A \vec{x} = \vec{b} \pmod 2$$

Since $A$ is symmetric ($A^T = A$), we can solve for $\vec{x}$ using **Gaussian Elimination over $GF(2)$**.

### 4.2 Solvability on a 5×5 Board
On a standard $5 \times 5$ board:
- Matrix dimension is $25 \times 25$.
- The rank of $A$ over $\mathbb{F}_2$ is **23** (not full rank 25!).
- The nullity (dimension of the kernel $\ker(A)$) is:
  $$\operatorname{nullity}(A) = 25 - 23 = 2$$
- This null space is spanned by two non-zero vectors $\vec{n}_1$ and $\vec{n}_2$. When these vectors are mapped onto the 5×5 grid, clicking these combinations produces a net toggle of zero (the board returns to its exact original state).
- **Consequence**: Out of all $2^{25} = 33,554,432$ possible random light patterns, **only $2^{23} = 8,388,608$ configurations (exactly 25%) are solvable!**
- A randomly lit 5×5 board has a **75% chance of being impossible to solve**.
- In this implementation, the game engine guarantees **100% solvable puzzles** by either generating scrambles through simulated valid clicks, or verifying solvability via rank consistency in $GF(2)$.

---

## 🏆 5. Strategy: The "Light Chasing" Algorithm

You don't need a computer to solve Lights Out! The most famous human solving technique is called **Light Chasing** (or "chasing the lights"):

### Step 1: Clear Rows 1 Through 4
1. Look at **Row 1**. For every light that is **ON** at column $c$, press the button directly beneath it in **Row 2** at $(2, c)$. This toggles the light in Row 1 to **OFF**.
2. When you finish, Row 1 is completely dark!
3. Now look at **Row 2**. For every light that is **ON** in Row 2, press the button directly beneath it in **Row 3** at $(3, c)$. Row 2 is now completely dark!
4. Repeat this for **Row 3** by pressing buttons in **Row 4**.
5. Repeat for **Row 4** by pressing buttons in **Row 5**.

### Step 2: Inspect Row 5
Now, Rows 1 through 4 are completely dark. Only lights in **Row 5** may still be lit.
- If Row 5 is also completely dark, **YOU WON!**
- If Row 5 still has lights on, there are only **7 possible solvable patterns** that can appear in Row 5.

### Step 3: The Row 5 $\rightarrow$ Row 1 Lookup Table
Press the corresponding buttons in **Row 1**, and then repeat the **Light Chasing** procedure (Steps 1–5) down the board. The board will be 100% solved!

| If Row 5 has lights ON at columns: | Press these buttons in Row 1: |
| :--- | :--- |
| **Col 1, Col 2, Col 3** | Press **Col 2** |
| **Col 1, Col 2, Col 4, Col 5** | Press **Col 3** |
| **Col 1, Col 3, Col 4** | Press **Col 5** |
| **Col 1, Col 4** | Press **Col 1 & Col 2** |
| **Col 2, Col 3, Col 5** | Press **Col 1** |
| **Col 2, Col 5** | Press **Col 4 & Col 5** |
| **Col 3, Col 4, Col 5** | Press **Col 4** |

---

## 🎮 6. Game Modes in this Project

1. **Campaign / Challenge Levels**:
   - Progressive handcrafted puzzles ranging from beginner 3-move teasers to master-tier 15+ move scrambles.
2. **Random Generator**:
   - Instant solvable random scrambles across **Easy** (3-6 moves), **Medium** (7-12 moves), and **Hard** (13-20 moves).
3. **Custom / Puzzle Editor**:
   - Manually toggle any light setup to test puzzles or recreate patterns from original 1995 game booklets.
4. **Grid Sizes**:
   - Supports **3×3** (quick micro puzzle), **4×4** (fully invertible, rank 16), **5×5** (classic Tiger Electronics), and **6×6** (extreme challenge).
5. **Real-time Optimal Solver & Hint Engine**:
   - Powered by $GF(2)$ Gaussian Elimination. Stuck on a puzzle? Click **Hint** to illuminate the next optimal button to press!
6. **Daily Seed Challenge**:
   - Every day at midnight UTC, a new official puzzle is generated using a deterministic Mulberry32 PRNG seeded from the calendar date (`YYYY-MM-DD`).
   - Generates a shareable Wordle-style emoji grid so players can share their move scores without spoiling the solution.
7. **Lit-Out (Inverted Target Mode)**:
   - Invert the victory objective: instead of turning all lights OFF, the goal is to turn **ALL lights ON**!
   - Solved in $GF(2)$ by setting the target vector $\vec{t} = [1, 1, \dots, 1]^T$, yielding the augmented equation $A\vec{x} \equiv \vec{b} \oplus \vec{t} \pmod 2$.
8. **Torus / Wrap-Around Topology**:
   - When enabled, grid boundaries wrap around like a donut: pressing a cell on the left edge toggles the corresponding cell on the right edge, and pressing the top row wraps to the bottom row!

