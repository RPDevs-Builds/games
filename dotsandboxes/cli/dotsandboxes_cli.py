#!/usr/bin/env python3
"""
Dots and Boxes (La Pipopipette) - Terminal CLI Edition
"""

import sys
import random
from typing import List, Tuple, Optional, Dict

class DotsAndBoxesCLI:
    def __init__(self, rows: int = 3, cols: int = 3):
        self.rows = rows
        self.cols = cols
        self.reset()

    def reset(self):
        # Horizontal lines: (rows + 1) x cols
        self.h_lines = [[False] * self.cols for _ in range(self.rows + 1)]
        # Vertical lines: rows x (cols + 1)
        self.v_lines = [[False] * (self.cols + 1) for _ in range(self.rows)]
        # Boxes: rows x cols (None, 1, or 2)
        self.boxes = [[None] * self.cols for _ in range(self.rows)]
        self.scores = {1: 0, 2: 0}
        self.current_player = 1
        self.game_over = False

    def is_box_complete(self, r: int, c: int) -> bool:
        return (self.h_lines[r][c] and
                self.h_lines[r + 1][c] and
                self.v_lines[r][c] and
                self.v_lines[r][c + 1])

    def get_available_moves(self) -> List[Tuple[str, int, int]]:
        moves = []
        for r in range(self.rows + 1):
            for c in range(self.cols):
                if not self.h_lines[r][c]:
                    moves.append(('h', r, c))
        for r in range(self.rows):
            for c in range(self.cols + 1):
                if not self.v_lines[r][c]:
                    moves.append(('v', r, c))
        return moves

    def make_move(self, line_type: str, r: int, c: int) -> bool:
        if self.game_over: return False

        if line_type == 'h':
            if not (0 <= r <= self.rows and 0 <= c < self.cols) or self.h_lines[r][c]:
                return False
            self.h_lines[r][c] = True
        elif line_type == 'v':
            if not (0 <= r < self.rows and 0 <= c <= self.cols) or self.v_lines[r][c]:
                return False
            self.v_lines[r][c] = True
        else:
            return False

        # Check completed boxes
        boxes_closed = 0
        check = []
        if line_type == 'h':
            if r > 0: check.append((r - 1, c))
            if r < self.rows: check.append((r, c))
        else:
            if c > 0: check.append((r, c - 1))
            if c < self.cols: check.append((r, c))

        for br, bc in check:
            if self.boxes[br][bc] is None and self.is_box_complete(br, bc):
                self.boxes[br][bc] = self.current_player
                self.scores[self.current_player] += 1
                boxes_closed += 1

        total_boxes = self.rows * self.cols
        if self.scores[1] + self.scores[2] == total_boxes:
            self.game_over = True
        elif boxes_closed == 0:
            self.current_player = 2 if self.current_player == 1 else 1

        return True

    def get_ai_move(self) -> Optional[Tuple[str, int, int]]:
        available = self.get_available_moves()
        if not available: return None

        # Check for immediate box completion
        for m_type, r, c in available:
            # Simulate
            if m_type == 'h': self.h_lines[r][c] = True
            else: self.v_lines[r][c] = True

            closes = False
            check = []
            if m_type == 'h':
                if r > 0: check.append((r - 1, c))
                if r < self.rows: check.append((r, c))
            else:
                if c > 0: check.append((r, c - 1))
                if c < self.cols: check.append((r, c))

            for br, bc in check:
                if self.boxes[br][bc] is None and self.is_box_complete(br, bc):
                    closes = True
                    break

            if m_type == 'h': self.h_lines[r][c] = False
            else: self.v_lines[r][c] = False

            if closes:
                return (m_type, r, c)

        return random.choice(available)

    def render(self):
        print("\033[2J\033[H", end="")
        print(f"📦 DOTS AND BOXES (1889) | P1 (A): {self.scores[1]}  vs  CPU (B): {self.scores[2]}")
        p_name = "Player 1 (A)" if self.current_player == 1 else "CPU / Player 2 (B)"
        print(f"Turn: {p_name}\n")

        # Column indices
        col_hdr = "    " + "   ".join(f"c{c}" for c in range(self.cols))
        print(col_hdr)

        for r in range(self.rows):
            # Horizontal lines row
            h_row = f"r{r} "
            for c in range(self.cols):
                h_row += "●" + ("━━━" if self.h_lines[r][c] else " ··")
            h_row += "●"
            print(h_row)

            # Vertical lines & boxes row
            v_row = "   "
            for c in range(self.cols):
                v_row += "┃" if self.v_lines[r][c] else "·"
                owner = self.boxes[r][c]
                v_row += f" { 'A' if owner == 1 else 'B' if owner == 2 else ' ' } "
            v_row += "┃" if self.v_lines[r][self.cols] else "·"
            print(v_row)

        # Bottom horizontal row
        last_h = f"r{self.rows} "
        for c in range(self.cols):
            last_h += "●" + ("━━━" if self.h_lines[self.rows][c] else " ··")
        last_h += "●"
        print(last_h)

        print("\nCommands: [h r c] Horizontal line | [v r c] Vertical line (e.g. 'h 0 0') | [q] Quit")

def play_cli():
    game = DotsAndBoxesCLI(3, 3)
    vs_ai = True

    while not game.game_over:
        game.render()

        if vs_ai and game.current_player == 2:
            import time
            print("\nCPU is making a move...")
            time.sleep(0.4)
            ai_m = game.get_ai_move()
            if ai_m:
                game.make_move(ai_m[0], ai_m[1], ai_m[2])
            continue

        try:
            line = input("> ").strip().lower().split()
        except (KeyboardInterrupt, EOFError):
            break

        if not line: continue
        if line[0] in ('q', 'quit'): break

        if len(line) == 3 and line[0] in ('h', 'v') and line[1].isdigit() and line[2].isdigit():
            m_type = line[0]
            r, c = int(line[1]), int(line[2])
            game.make_move(m_type, r, c)

    game.render()
    p1 = game.scores[1]
    p2 = game.scores[2]
    if p1 > p2:
        print(f"\n🎉 PLAYER 1 WINS! ({p1} to {p2})")
    elif p2 > p1:
        print(f"\n🏆 CPU WINS! ({p2} to {p1})")
    else:
        print(f"\n🤝 IT'S A TIE! ({p1} to {p2})")

if __name__ == '__main__':
    play_cli()
