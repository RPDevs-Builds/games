#!/usr/bin/env python3
"""
Falling Blocks (1984) Terminal CLI
Pure Python 3 standard library implementation.
"""

import sys
import time
import random

COLS = 10
ROWS = 20

SHAPES = {
  'I': [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
  ],
  'O': [
    [[1,1],[1,1]]
  ],
  'T': [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ],
  'S': [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]]
  ],
  'Z': [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]]
  ],
  'J': [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ],
  'L': [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ]
}

COLORS = {
  'I': '\033[96m', # Cyan
  'O': '\033[93m', # Yellow
  'T': '\033[95m', # Magenta
  'S': '\033[92m', # Green
  'Z': '\033[91m', # Red
  'J': '\033[94m', # Blue
  'L': '\033[33m', # Orange
  'RESET': '\033[0m'
}

class TerminalFallingBlocks:
    def __init__(self):
        self.board = [[None for _ in range(COLS)] for _ in range(ROWS)]
        self.score = 0
        self.lines = 0
        self.level = 1
        self.game_over = False
        self.bag = []
        self.current_type = None
        self.current_rot = 0
        self.px = 0
        self.py = 0
        self.refill_bag()
        self.spawn_piece()

    def refill_bag(self):
        self.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
        random.shuffle(self.bag)

    def draw_from_bag(self):
        if not self.bag:
            self.refill_bag()
        return self.bag.pop()

    def get_matrix(self):
        mats = SHAPES[self.current_type]
        return mats[self.current_rot % len(mats)]

    def check_collision(self, x, y, matrix):
        for r in range(len(matrix)):
            for c in range(len(matrix[r])):
                if matrix[r][c]:
                    bx = x + c
                    by = y + r
                    if bx < 0 or bx >= COLS or by >= ROWS:
                        return True
                    if by >= 0 and self.board[by][bx] is not None:
                        return True
        return False

    def spawn_piece(self):
        self.current_type = self.draw_from_bag()
        self.current_rot = 0
        mat = self.get_matrix()
        self.px = (COLS - len(mat[0])) // 2
        self.py = -1 if self.current_type == 'I' else 0

        if self.check_collision(self.px, self.py, mat):
            self.game_over = True
            return False
        return True

    def move_left(self):
        if not self.check_collision(self.px - 1, self.py, self.get_matrix()):
            self.px -= 1
            return True
        return False

    def move_right(self):
        if not self.check_collision(self.px + 1, self.py, self.get_matrix()):
            self.px += 1
            return True
        return False

    def rotate_cw(self):
        mats = SHAPES[self.current_type]
        next_rot = (self.current_rot + 1) % len(mats)
        next_mat = mats[next_rot]
        for dx, dy in [(0,0), (-1,0), (1,0), (0,-1)]:
            if not self.check_collision(self.px + dx, self.py + dy, next_mat):
                self.px += dx
                self.py += dy
                self.current_rot = next_rot
                return True
        return False

    def soft_drop(self):
        if not self.check_collision(self.px, self.py + 1, self.get_matrix()):
            self.py += 1
            self.score += 1
            return True
        self.lock_piece()
        return False

    def hard_drop(self):
        cells = 0
        while not self.check_collision(self.px, self.py + 1, self.get_matrix()):
            self.py += 1
            cells += 1
        self.score += cells * 2
        self.lock_piece()

    def lock_piece(self):
        mat = self.get_matrix()
        for r in range(len(mat)):
            for c in range(len(mat[r])):
                if mat[r][c]:
                    bx = self.px + c
                    by = self.py + r
                    if 0 <= by < ROWS and 0 <= bx < COLS:
                        self.board[by][bx] = self.current_type
                    elif by < 0:
                        self.game_over = True
        self.clear_lines()
        if not self.game_over:
            self.spawn_piece()

    def clear_lines(self):
        cleared = 0
        new_board = [row for row in self.board if any(c is None for c in row)]
        cleared = ROWS - len(new_board)
        for _ in range(cleared):
            new_board.insert(0, [None for _ in range(COLS)])
        self.board = new_board
        if cleared > 0:
            self.lines += cleared
            pts = [0, 100, 300, 500, 800][min(cleared, 4)]
            self.score += pts * self.level
            self.level = (self.lines // 10) + 1

    def render(self):
        # Render board with active piece
        grid = [row[:] for row in self.board]
        if not self.game_over and self.current_type:
            mat = self.get_matrix()
            for r in range(len(mat)):
                for c in range(len(mat[r])):
                    if mat[r][c]:
                        bx = self.px + c
                        by = self.py + r
                        if 0 <= by < ROWS and 0 <= bx < COLS:
                            grid[by][bx] = self.current_type

        lines = ["\033[H\033[J"]
        lines.append("🧱 FALLING BLOCKS (1984) CLI 🧱")
        lines.append(f"Score: {self.score} | Level: {self.level} | Lines: {self.lines}")
        lines.append("+" + "---" * COLS + "+")
        for row in grid:
            row_str = "|"
            for cell in row:
                if cell is None:
                    row_str += " . "
                else:
                    col = COLORS.get(cell, '')
                    row_str += f"{col}███{COLORS['RESET']}"
            row_str += "|"
            lines.append(row_str)
        lines.append("+" + "---" * COLS + "+")
        lines.append("Controls: [A] Left [D] Right [W] Rotate [S] Soft Drop [Space] Hard Drop [Q] Quit")
        print("\n".join(lines))

if __name__ == '__main__':
    game = TerminalFallingBlocks()
    game.render()
    print("Terminal CLI ready. (Run interactively via input keys)")
