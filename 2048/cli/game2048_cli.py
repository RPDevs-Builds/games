#!/usr/bin/env python3
"""
2048 - Terminal CLI Edition
"""

import random
import sys
from typing import List, Tuple

class Game2048CLI:
    def __init__(self, size: int = 4):
        self.size = size
        self.reset()

    def reset(self):
        self.grid = [[0] * self.size for _ in range(self.size)]
        self.score = 0
        self.spawn_tile()
        self.spawn_tile()

    def spawn_tile(self):
        empty = [(r, c) for r in range(self.size) for c in range(self.size) if self.grid[r][c] == 0]
        if not empty: return
        r, c = random.choice(empty)
        self.grid[r][c] = 2 if random.random() < 0.9 else 4

    def slide_line(self, line: List[int]) -> Tuple[List[int], int]:
        non_zero = [v for v in line if v != 0]
        res = []
        score = 0
        i = 0
        while i < len(non_zero):
            if i < len(non_zero) - 1 and non_zero[i] == non_zero[i + 1]:
                merged = non_zero[i] * 2
                res.append(merged)
                score += merged
                i += 2
            else:
                res.append(non_zero[i])
                i += 1
        while len(res) < self.size:
            res.append(0)
        return res, score

    def move(self, dir_name: str) -> bool:
        old_grid = [row[:] for row in self.grid]
        earned = 0

        if dir_name == 'left':
            for r in range(self.size):
                self.grid[r], pts = self.slide_line(self.grid[r])
                earned += pts
        elif dir_name == 'right':
            for r in range(self.size):
                rev, pts = self.slide_line(self.grid[r][::-1])
                self.grid[r] = rev[::-1]
                earned += pts
        elif dir_name == 'up':
            for c in range(self.size):
                col = [self.grid[r][c] for r in range(self.size)]
                res_col, pts = self.slide_line(col)
                for r in range(self.size):
                    self.grid[r][c] = res_col[r]
                earned += pts
        elif dir_name == 'down':
            for c in range(self.size):
                col = [self.grid[r][c] for r in range(self.size)][::-1]
                res_col, pts = self.slide_line(col)
                res_col = res_col[::-1]
                for r in range(self.size):
                    self.grid[r][c] = res_col[r]
                earned += pts

        moved = old_grid != self.grid
        if moved:
            self.score += earned
            self.spawn_tile()
        return moved

    def is_game_over(self) -> bool:
        for r in range(self.size):
            for c in range(self.size):
                if self.grid[r][c] == 0: return False
                if c < self.size - 1 and self.grid[r][c] == self.grid[r][c + 1]: return False
                if r < self.size - 1 and self.grid[r][c] == self.grid[r + 1][c]: return False
        return True

    def render(self):
        print("\033[2J\033[H", end="")
        print(f"🔢 2048 CLI | Score: {self.score}")
        print("┌" + "──────┬" * (self.size - 1) + "──────┐")
        for r in range(self.size):
            row_str = "│"
            for c in range(self.size):
                v = self.grid[r][c]
                s = f"{v:^6}" if v > 0 else "      "
                row_str += s + "│"
            print(row_str)
            if r < self.size - 1:
                print("├" + "──────┼" * (self.size - 1) + "──────┤")
            else:
                print("└" + "──────┴" * (self.size - 1) + "──────┘")
        print("Controls: [w] Up | [s] Down | [a] Left | [d] Right | [q] Quit")

def play_cli():
    game = Game2048CLI(4)
    while True:
        game.render()
        if game.is_game_over():
            print(f"\n💥 Game Over! Final Score: {game.score}")
            break

        try:
            cmd = input("> ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            break

        if cmd in ('q', 'quit'): break
        elif cmd == 'w': game.move('up')
        elif cmd == 's': game.move('down')
        elif cmd == 'a': game.move('left')
        elif cmd == 'd': game.move('right')

if __name__ == '__main__':
    play_cli()
