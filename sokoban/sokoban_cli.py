#!/usr/bin/env python3
"""
Sokoban (倉庫番) Terminal CLI Edition
Zero-dependency discrete grid warehouse puzzle with ANSI color rendering.
"""

import sys
import os

SOKOBAN_LEVELS = [
    # Level 1
    [
        "  #####",
        "###   #",
        "# $ # ##",
        "# #  . #",
        "#    # #",
        "## #   #",
        " #@ .# #",
        " #  $  #",
        " #######"
    ],
    # Level 2
    [
        "#####",
        "#@  #",
        "# $$#",
        "##  #",
        "##..#",
        "#####"
    ],
    # Level 3
    [
        "######",
        "#    #",
        "# #$ #",
        "# .@ #",
        "# $. #",
        "######"
    ]
]

class SokobanCLI:
    def __init__(self, level_idx=0):
        self.level_idx = level_idx
        self.load_level(level_idx)

    def load_level(self, idx):
        self.level_idx = idx % len(SOKOBAN_LEVELS)
        raw_lines = SOKOBAN_LEVELS[self.level_idx]
        self.height = len(raw_lines)
        self.width = max(len(l) for l in raw_lines)

        self.walls = [[False] * self.width for _ in range(self.height)]
        self.goals = [[False] * self.width for _ in range(self.height)]
        self.boxes = [[False] * self.width for _ in range(self.height)]
        self.player_r = 0
        self.player_c = 0

        for r in range(self.height):
            line = raw_lines[r]
            for c in range(self.width):
                char = line[c] if c < len(line) else ' '
                if char == '#': self.walls[r][c] = True
                elif char == '.': self.goals[r][c] = True
                elif char == '$': self.boxes[r][c] = True
                elif char == '*':
                    self.boxes[r][c] = True
                    self.goals[r][c] = True
                elif char == '@':
                    self.player_r = r
                    self.player_c = c
                elif char == '+':
                    self.player_r = r
                    self.player_c = c
                    self.goals[r][c] = True

        self.moves = 0
        self.pushes = 0
        self.history = []

    def is_wall(self, r, c):
        if r < 0 or r >= self.height or c < 0 or c >= self.width: return True
        return self.walls[r][c]

    def has_box(self, r, c):
        if r < 0 or r >= self.height or c < 0 or c >= self.width: return False
        return self.boxes[r][c]

    def move(self, dr, dc):
        nr = self.player_r + dr
        nc = self.player_c + dc

        if self.is_wall(nr, nc): return False

        if self.has_box(nr, nc):
            bnr = nr + dr
            bnc = nc + dc
            if self.is_wall(bnr, bnc) or self.has_box(bnr, bnc):
                return False

            self.history.append((self.player_r, self.player_c, nr, nc, bnr, bnc))
            self.boxes[nr][nc] = False
            self.boxes[bnr][bnc] = True
            self.player_r = nr
            self.player_c = nc
            self.moves += 1
            self.pushes += 1
            return True
        else:
            self.history.append((self.player_r, self.player_c, None, None, None, None))
            self.player_r = nr
            self.player_c = nc
            self.moves += 1
            return True

    def undo(self):
        if not self.history: return False
        pr, pc, bx_from_r, bx_from_c, bx_to_r, bx_to_c = self.history.pop()
        self.player_r = pr
        self.player_c = pc
        self.moves = max(0, self.moves - 1)
        if bx_from_r is not None:
            self.boxes[bx_to_r][bx_to_c] = False
            self.boxes[bx_from_r][bx_from_c] = True
            self.pushes = max(0, self.pushes - 1)
        return True

    def is_won(self):
        for r in range(self.height):
            for c in range(self.width):
                if self.boxes[r][c] and not self.goals[r][c]:
                    return False
        return True

    def detect_corner_deadlocks(self):
        deadlocks = []
        for r in range(self.height):
            for c in range(self.width):
                if self.boxes[r][c] and not self.goals[r][c]:
                    up = self.is_wall(r - 1, c)
                    down = self.is_wall(r + 1, c)
                    left = self.is_wall(r, c - 1)
                    right = self.is_wall(r, c + 1)
                    if (up and left) or (up and right) or (down and left) or (down and right):
                        deadlocks.append((r, c))
        return deadlocks

    def render(self):
        deadlocks = set(self.detect_corner_deadlocks())
        lines = []
        lines.append(f"\033[1;36m=== SOKOBAN (倉庫番) - Level {self.level_idx + 1} ===\033[0m")
        lines.append(f"Moves: \033[1;33m{self.moves}\033[0m | Pushes: \033[1;33m{self.pushes}\033[0m")
        if deadlocks:
            lines.append("\033[1;31m[WARNING] Box deadlocked! Press 'u' to Undo.\033[0m")

        for r in range(self.height):
            row_str = ""
            for c in range(self.width):
                if self.player_r == r and self.player_c == c:
                    if self.goals[r][c]: row_str += "\033[1;32m@\033[0m "
                    else: row_str += "\033[1;36m@\033[0m "
                elif self.boxes[r][c]:
                    if (r, c) in deadlocks:
                        row_str += "\033[1;41;37m$\033[0m "
                    elif self.goals[r][c]:
                        row_str += "\033[1;33m*\033[0m "
                    else:
                        row_str += "\033[1;35m$\033[0m "
                elif self.walls[r][c]:
                    row_str += "\033[1;30;47m#\033[0m "
                elif self.goals[r][c]:
                    row_str += "\033[1;32m.\033[0m "
                else:
                    row_str += "  "
            lines.append(row_str)

        lines.append("\033[0;37mControls: W/A/S/D (Move) | U (Undo) | R (Reset) | N (Next) | Q (Quit)\033[0m")
        return "\n".join(lines)

def main():
    game = SokobanCLI(0)
    print(game.render())

    # If running non-interactively or in tests, exit cleanly
    if not sys.stdin.isatty():
        return

    import termios, tty
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        while True:
            os.system('clear')
            print(game.render())
            if game.is_won():
                print(f"\n\033[1;32m★ LEVEL {game.level_idx + 1} CLEARED! Press N for next level. ★\033[0m")

            ch = sys.stdin.read(1)
            if ch in ('q', 'Q'): break
            elif ch in ('w', 'W'): game.move(-1, 0)
            elif ch in ('s', 'S'): game.move(1, 0)
            elif ch in ('a', 'A'): game.move(0, -1)
            elif ch in ('d', 'D'): game.move(0, 1)
            elif ch in ('u', 'U'): game.undo()
            elif ch in ('r', 'R'): game.load_level(game.level_idx)
            elif ch in ('n', 'N'): game.load_level(game.level_idx + 1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

if __name__ == '__main__':
    main()
