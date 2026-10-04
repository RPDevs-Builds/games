# Wordle / Deduction Word Guess (1955 Jotto / 2021 Wordle)

## 1. Historical Context
The lineage of word deduction games traces back to **Jotto**, invented in 1955 by Morton M. Rosenfeld, where two players secretly choose 5-letter words and deduce each other's secrets based on the count of shared letters. This evolved into the numeric/color deduction game **Bulls and Cows**, the commercial board game hit **Mastermind** (1971) by Mordecai Meirowitz, and game shows like **Lingo** (1987).

In 2021, software engineer Josh Wardle created **Wordle** for his partner Palak Shah. It rapidly became a global cultural sensation, uniting millions in a daily ritual of deduction and shareable color grid scorecards.

---

## 2. Core Game Rules
- The objective is to guess a hidden **5-letter secret word** within **6 attempts**.
- Every guess must be a valid English word found in the dictionary.
- After submitting a guess, each tile flips to reveal one of three states:
  - 🟩 **Green (Correct)**: The letter is in the secret word and in the exact position.
  - 🟨 **Yellow (Present)**: The letter is in the secret word, but in a different position.
  - ⬛ **Gray (Absent)**: The letter does not appear in the secret word (or has already been accounted for).

---

## 3. Two-Pass Duplicate Letter Scoring
Wordle rigorously handles duplicate letters with a deterministic two-pass algorithm:
1. **Pass 1 (Exact Matches)**: Any letter matching the target at index $i$ is marked **Green** (`correct`). The available count of that letter in the target is decremented by 1.
2. **Pass 2 (Position Mismatches)**: For remaining letters from left to right:
   - If the letter exists in the target and its remaining available count is $> 0$, it is marked **Yellow** (`present`) and its available count is decremented.
   - Otherwise, it is marked **Gray** (`absent`).

*Example:* If the secret word is **ABBEY** and the guess is **BABES**:
- Guess letter 2 (`A`), letter 3 (`B`), letter 4 (`E`) match positions 1, 2, 4? Let's trace:
  - ABBEY vs BABES:
    - Pass 1: No index matches exactly.
    - Pass 2:
      - `B` at index 0: 'B' in ABBEY (count 2). Marked 🟨, remaining count = 1.
      - `A` at index 1: 'A' in ABBEY (count 1). Marked 🟨, remaining count = 0.
      - `B` at index 2: 'B' in ABBEY (remaining count 1). Marked 🟨, remaining count = 0.
      - `E` at index 3: 'E' in ABBEY (count 1). Marked 🟨, remaining count = 0.
      - `S` at index 4: Not in ABBEY. Marked ⬛.

*Example 2:* Secret word is **SPEED** and guess is **ERASE**:
- Index 0: E vs S (no match)
- Index 1: R vs P (no match)
- Index 2: A vs E (no match)
- Index 3: S vs E (no match)
- Index 4: E vs D (no match)
- In SPEED: S:1, P:1, E:2, D:1.
- Guess:
  - `E` at 0: yellow (E remaining = 1).
  - `R` at 1: gray.
  - `A` at 2: gray.
  - `S` at 3: yellow (S remaining = 0).
  - `E` at 4: yellow (E remaining = 0).

---

## 4. Modes & Constraints
- **Daily Seed Challenge**: Uses the local calendar date (`YYYY-MM-DD`) with day epoch zero at `2021-06-19` to guarantee universal synchronization across players.
- **Practice Mode**: Endless free play with random words selected from the 2,315 curated target solution list.
- **Hard Mode**:
  - Any letter revealed as **Green** must be reused in the same position in subsequent guesses.
  - Any letter revealed as **Yellow** must appear anywhere in subsequent guesses.

---

## 5. Strategy & Openers
- **Information Theory / Entropy**: Words rich in common vowels and high-frequency consonants (E, A, R, O, T, I, S, N) yield maximum entropy reduction on turn 1.
- **Top Openers**:
  - `CRANE`, `SLATE`, `STARE`, `ROAST`, `ADIEU`, `AUDIO`, `TRACE`.
- **Elimination Pairs**: Using disjoint consonant sets across guesses 1 and 2 (e.g. `SLATE` followed by `CRONY` or `AUDIO` followed by `STERN`) narrows the remaining search space down to under 10 candidates in >80% of games.
