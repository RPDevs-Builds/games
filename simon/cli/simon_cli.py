#!/usr/bin/env python3
"""
Simon - Terminal CLI Edition
"""

import random
import time
import sys

COLORS = ['G', 'R', 'Y', 'B']
NAMES = {'G': 'Green', 'R': 'Red', 'Y': 'Yellow', 'B': 'Blue'}

class SimonCLI:
    def __init__(self, strict: bool = False):
        self.strict = strict
        self.sequence = []

    def add_step(self):
        self.sequence.append(random.choice(COLORS))

    def play_round(self) -> bool:
        print("\033[2J\033[H", end="")
        print(f"🔴🟢 SIMON - Round {len(self.sequence)}")
        print("Watch the sequence:\n")
        time.sleep(0.5)

        for c in self.sequence:
            print(f"  [ {NAMES[c].upper()} ]")
            time.sleep(0.5)

        time.sleep(0.3)
        print("\033[2J\033[H", end="")
        print(f"🔴🟢 SIMON - Round {len(self.sequence)}")
        print("Your turn! Enter the sequence (e.g. 'G R Y B' or 'gryb'):")

        user_input = input("> ").strip().upper().replace(' ', '')
        if user_input != "".join(self.sequence):
            print(f"\n💥 BUZZZZ! Wrong sequence! Correct was: {' '.join(self.sequence)}")
            return False

        print("\n✨ Correct!")
        time.sleep(0.7)
        return True

def main():
    game = SimonCLI()
    print("Welcome to Simon CLI! Press Enter to start.")
    input()
    while True:
        game.add_step()
        if not game.play_round():
            print(f"Game Over! Final Score: {len(game.sequence) - 1}")
            break

if __name__ == '__main__':
    main()
