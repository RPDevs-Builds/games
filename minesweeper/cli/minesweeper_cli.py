#!/usr/bin/env python3
"""
Minesweeper - Terminal CLI Edition
"""

import random
import sys
from typing import List, Tuple, Set

class MinesweeperCLI:
    def __init__(self, rows: int = 9, cols: int = 9, mines: int = 10):
        self.rows = rows
        self.cols = cols
        self.total_mines = mines
        self.reset()

    def reset(self):
        self.mines = set()
        self.revealed = set()
        self.flags = set()
        self.first_click = True
        self.game_over = False
        self.game_won = False

    def populate(self, exclude_r: int, exclude_c: int):
        excluded = {(exclude_r, exclude_c)}
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                excluded.add((exclude_r + dr, exclude_c + dc))

        all_cells = [(r, c) for r in range(self.rows) for c in range(self.cols) if (r, c) not in excluded]
        self.mines = set(random.sample(all_cells, min(self.total_mines, len(all_cells))))

    def count_neighbors(self, r: int, c: int) -> int:
        count = 0
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0: continue
                if (r + dr, c + dc) in self.mines:
                    count += 1
        return count

    def reveal(self, r: int, c: int) -> str:
        if self.game_over or self.game_won:
            return 'inactive'
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            return 'invalid'
        if (r, c) in self.flags or (r, c) in self.revealed:
            return 'already'

        if self.first_click:
            self.populate(r, c)
            self.first_click = False

        if (r, c) in self.mines:
            self.game_over = True
            self.revealed.add((r, c))
            return 'exploded'

        queue = [(r, c)]
        self.revealed.add((r, c))

        while queue:
            curr_r, curr_c = queue.pop(0)
            if self.count_neighbors(curr_r, curr_c) == 0:
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        nr, nc = curr_r + dr, curr_c + dc
                        if 0 <= nr < self.rows and 0 <= nc < self.cols:
                            if (nr, nc) not in self.revealed and (nr, nc) not in self.flags:
                                self.revealed.add((nr, nc))
                                if self.count_neighbors(nr, nc) == 0:
                                    queue.append((nr, nc))

        if len(self.revealed) == self.rows * self.cols - len(self.mines):
            self.game_won = True
            return 'won'

        return 'ok'

    def toggle_flag(self, r: int, c: int):
        if (r, c) in self.revealed:
            return
        if (r, c) in self.flags:
            self.flags.remove((r, c))
        else:
            self.flags.add((r, c))

    def render(self):
        print("\033[2J\033[H", end="")
        rem = self.total_mines - len(self.flags)
        print(f"💣 MINESWEEPER | Mines Left: {rem:02d} | {'😎' if self.game_won else '😵' if self.game_over else '🙂'}")
        print("    " + " ".join(f"{c + 1:2}" for c in range(self.cols)))
        print("   ┌" + "──" * self.cols + "─┐")

        for r in range(self.rows):
            row_str = f"{r + 1:2} │"
            for c in range(self.cols):
                if (r, c) in self.flags:
                    row_str += " 🚩"
                elif (r, c) in self.revealed:
                    if (r, c) in self.mines:
                        row_str += " 💣"
                    else:
                        cnt = self.count_neighbors(r, c)
                        row_str += f"  {cnt}" if cnt > 0 else "  ·"
                else:
                    row_str += "  ■"
            row_str += " │"
            print(row_str)
        print("   └" + "──" * self.cols + "─┘")
        print("Commands: [r c] Reveal (e.g. 1 1) | [f r c] Flag | [q] Quit")

def play_cli():
    game = MinesweeperCLI(9, 9, 10)
    while True:
        game.render()
        if game.game_over:
            print("\n💥 KABOOM! You hit a mine. Game Over!")
            break
        if game.game_won:
            print("\n🎉 CONGRATULATIONS! You cleared the minefield!")
            break

        try:
            cmd = input("> ").strip().lower().split()
        except (KeyboardInterrupt, EOFError):
            break

        if not cmd: continue
        if cmd[0] in ('q', 'quit'): break

        if cmd[0] == 'f' and len(cmd) == 3:
            r, c = int(cmd[1]) - 1, int(cmd[2]) - 1
            game.toggle_flag(r, c)
        elif len(cmd) == 2:
            r, c = int(cmd[0]) - 1, int(cmd[1]) - 1
            game.reveal(r, c)

if __name__ == '__main__':
    play_cli()
