#!/usr/bin/env python3
"""
Wordle Terminal CLI Edition
100% offline word deduction game with ANSI color output, daily seed, hard mode,
and dictionary validation.
"""

import sys
import os
import argparse
import datetime
import random
from collections import Counter

# Ensure import of words from src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
try:
    from words import TARGET_WORDS, VALID_WORDS_SET
except ImportError:
    # Fallback to local files if imported differently
    import json
    json_path = os.path.join(os.path.dirname(__file__), 'words.json')
    with open(json_path) as f:
        data = json.load(f)
        TARGET_WORDS = data['targets']
        VALID_WORDS_SET = set(data['targets']) | set(data['allowed'])

# ANSI color codes
COLOR_RESET = "\033[0m"
COLOR_GREEN = "\033[1;37;42m"   # White text on green background
COLOR_YELLOW = "\033[1;37;43m"  # White text on yellow background
COLOR_GRAY = "\033[1;37;100m"   # White text on dark gray background
COLOR_BOLD = "\033[1m"
COLOR_DIM = "\033[2m"


def evaluate_guess(guess: str, target: str):
    """
    Evaluates a 5-letter guess against target using two-pass duplicate logic.
    Returns a list of tuples: (letter, status)
    where status is 'correct', 'present', or 'absent'.
    """
    guess = guess.lower()
    target = target.lower()
    length = len(target)
    result = [None] * length
    target_counts = Counter(target)

    # Pass 1: exact matches (green)
    for i in range(length):
        if guess[i] == target[i]:
            result[i] = (guess[i], 'correct')
            target_counts[guess[i]] -= 1

    # Pass 2: wrong-position matches (yellow) or absent (gray)
    for i in range(length):
        if result[i] is not None:
            continue
        g = guess[i]
        if target_counts[g] > 0:
            result[i] = (g, 'present')
            target_counts[g] -= 1
        else:
            result[i] = (g, 'absent')

    return result


def get_daily_word(date: datetime.date = None):
    """Returns the deterministic daily target word for given date."""
    if date is None:
        date = datetime.date.today()
    epoch = datetime.date(2021, 6, 19)
    day_diff = max(0, (date - epoch).days)
    index = day_diff % len(TARGET_WORDS)
    return TARGET_WORDS[index], day_diff


class WordleGame:
    def __init__(self, target_word: str, hard_mode: bool = False, is_daily: bool = False, day_num: int = 0):
        self.target_word = target_word.lower()
        self.hard_mode = hard_mode
        self.is_daily = is_daily
        self.day_num = day_num
        self.max_guesses = 6
        self.guesses = []
        self.evaluations = []
        self.status = 'IN_PROGRESS' # 'IN_PROGRESS', 'WON', 'LOST'
        self.revealed_green = [None] * 5
        self.revealed_yellow = set()

    def validate_hard_mode(self, guess: str):
        if not self.hard_mode:
            return True, ""
        guess = guess.lower()
        # Must reuse green letters in position
        for i in range(5):
            if self.revealed_green[i] and guess[i] != self.revealed_green[i]:
                pos = i + 1
                ord_str = "1st" if pos == 1 else "2nd" if pos == 2 else "3rd" if pos == 3 else f"{pos}th"
                return False, f"{ord_str} letter must be '{self.revealed_green[i].upper()}'"
        # Must include yellow letters
        for y_char in self.revealed_yellow:
            if y_char not in guess:
                return False, f"Guess must contain '{y_char.upper()}'"
        return True, ""

    def submit_guess(self, guess: str):
        if self.status != 'IN_PROGRESS':
            return False, "Game is already over"

        guess = guess.strip().lower()
        if len(guess) != 5 or not guess.isalpha():
            return False, "Word must be exactly 5 alphabetic letters"

        if guess not in VALID_WORDS_SET:
            return False, "Not in word list"

        valid_hard, hard_msg = self.validate_hard_mode(guess)
        if not valid_hard:
            return False, hard_msg

        eval_res = evaluate_guess(guess, self.target_word)
        self.guesses.append(guess)
        self.evaluations.append(eval_res)

        # Update hints for hard mode
        for i, (letter, st) in enumerate(eval_res):
            if st == 'correct':
                self.revealed_green[i] = letter
                self.revealed_yellow.discard(letter)
            elif st == 'present':
                if letter not in self.revealed_green:
                    self.revealed_yellow.add(letter)

        if guess == self.target_word:
            self.status = 'WON'
        elif len(self.guesses) >= self.max_guesses:
            self.status = 'LOST'

        return True, "OK"

    def format_row(self, eval_res):
        out = []
        for letter, st in eval_res:
            char = f" {letter.upper()} "
            if st == 'correct':
                out.append(f"{COLOR_GREEN}{char}{COLOR_RESET}")
            elif st == 'present':
                out.append(f"{COLOR_YELLOW}{char}{COLOR_RESET}")
            else:
                out.append(f"{COLOR_GRAY}{char}{COLOR_RESET}")
        return " ".join(out)

    def generate_scorecard(self):
        title = f"Wordle {self.day_num if self.is_daily else 'Practice'} "
        title += f"{len(self.guesses) if self.status == 'WON' else 'X'}/{self.max_guesses}"
        if self.hard_mode:
            title += "*"

        rows = []
        for eval_res in self.evaluations:
            row_str = ""
            for _, st in eval_res:
                if st == 'correct':
                    row_str += "🟩"
                elif st == 'present':
                    row_str += "🟨"
                else:
                    row_str += "⬛"
            rows.append(row_str)

        return f"{title}\n\n" + "\n".join(rows) + "\n\nRPDevs Arcade Vault"


def play_cli(game: WordleGame):
    print("=" * 45)
    print(f" {COLOR_BOLD}🔤 WORDLE - DEDUCTION WORD GUESS{COLOR_RESET}")
    mode_str = f"Daily Challenge #{game.day_num}" if game.is_daily else "Practice Mode"
    if game.hard_mode:
        mode_str += " (Hard Mode ⚡)"
    print(f" Mode: {mode_str}")
    print(" Type a 5-letter word and press Enter.")
    print(" Type 'quit' to exit.")
    print("=" * 45 + "\n")

    while game.status == 'IN_PROGRESS':
        attempt = len(game.guesses) + 1
        try:
            user_input = input(f"Guess {attempt}/6 > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            sys.exit(0)

        if user_input.lower() in ('quit', 'exit'):
            print("Game aborted.")
            sys.exit(0)

        success, msg = game.submit_guess(user_input)
        if not success:
            print(f"⚠️  {msg}")
            continue

        # Print all guesses so far
        print("\n" + "-" * 25)
        for eval_row in game.evaluations:
            print("  " + game.format_row(eval_row))
        print("-" * 25 + "\n")

    if game.status == 'WON':
        print(f"\n🎉 {COLOR_BOLD}VICTORY! Solved in {len(game.guesses)}/6 tries!{COLOR_RESET}\n")
    else:
        print(f"\n💀 {COLOR_BOLD}GAME OVER! The secret word was: {game.target_word.upper()}{COLOR_RESET}\n")

    print("Emoji Scorecard:")
    print("-" * 30)
    print(game.generate_scorecard())
    print("-" * 30)


def main():
    parser = argparse.ArgumentParser(description="Wordle CLI - RPDevs Arcade Edition")
    parser.add_argument("--daily", action="store_true", help="Play today's daily synchronized puzzle")
    parser.add_argument("--practice", action="store_true", help="Play a randomized practice puzzle")
    parser.add_argument("--hard", action="store_true", help="Enable Hard Mode constraints")
    parser.add_argument("--word", type=str, help="Specify custom 5-letter secret word")
    args = parser.parse_args()

    if args.word:
        target = args.word.lower()
        if len(target) != 5:
            print("Error: custom word must be 5 letters")
            sys.exit(1)
        game = WordleGame(target, hard_mode=args.hard, is_daily=False)
    elif args.daily:
        target, day_num = get_daily_word()
        game = WordleGame(target, hard_mode=args.hard, is_daily=True, day_num=day_num)
    else:
        # Default to practice
        target = random.choice(TARGET_WORDS)
        game = WordleGame(target, hard_mode=args.hard, is_daily=False)

    play_cli(game)


if __name__ == "__main__":
    main()
