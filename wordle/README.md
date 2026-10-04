# 🔤 Wordle (1955 / 2021)

An authentic, zero-dependency offline recreation of the modern linguistic deduction puzzle popularized by Josh Wardle, rooted in the 1955 paper-and-pencil game *Jotto*.

Features 100% client-side dual-dictionary verification (2,315 curated secret solution words, 10,657 allowed guesses), 3D flip tile animations, Daily Challenge seed mode, endless Practice mode, Hard Mode constraints, shareable emoji scorecards, and full offline PWA support.

---

## 🎮 How to Play

- **Web Browser**:
  - Visit `http://localhost:8080/wordle/`
  - Guess the 5-letter hidden word in 6 tries.
  - 🟩 Green indicates correct letter in the correct position.
  - 🟨 Yellow indicates letter exists in the word but wrong position.
  - ⬛ Dark grey indicates letter is not present in the solution.
- **Terminal CLI**:
  ```bash
  python3 /mnt/sharedroot/projects/games/wordle/wordle_cli.py
  ```

---

## 🧠 Rules & Strategy Guide
See [`RULES.md`](./RULES.md) for full letter frequency analysis, optimal opener words, and Hard Mode rules.

---

## 🧪 Testing

```bash
python3 -m unittest discover -s /mnt/sharedroot/projects/games/wordle/test
```
