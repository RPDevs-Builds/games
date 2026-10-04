#!/usr/bin/env python3
"""
RPDevs Terminal CLI Othello (Reversi)
Play directly inside any standard terminal or SSH session.
"""

import sys

EMPTY = 0
BLACK = 1
WHITE = 2

DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    ( 0, -1),          ( 0, 1),
    ( 1, -1), ( 1, 0), ( 1, 1)
]

WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [ 10,  -2,  1,  1,  1,  1,  -2,  10],
    [  5,  -2,  1,  0,  0,  1,  -2,   5],
    [  5,  -2,  1,  0,  0,  1,  -2,   5],
    [ 10,  -2,  1,  1,  1,  1,  -2,  10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100]
]


class OthelloGame:
    def __init__(self):
        self.board = [[EMPTY for _ in range(8)] for _ in range(8)]
        self.board[3][3] = WHITE
        self.board[3][4] = BLACK
        self.board[4][3] = BLACK
        self.board[4][4] = WHITE
        self.turn = BLACK

    def get_flips(self, r, c, player):
        if self.board[r][c] != EMPTY:
            return []
        opp = WHITE if player == BLACK else BLACK
        flips = []
        for dr, dc in DIRECTIONS:
            cr, cc = r + dr, c + dc
            ray = []
            while 0 <= cr < 8 and 0 <= cc < 8 and self.board[cr][cc] == opp:
                ray.append((cr, cc))
                cr += dr
                cc += dc
            if ray and 0 <= cr < 8 and 0 <= cc < 8 and self.board[cr][cc] == player:
                flips.extend(ray)
        return flips

    def get_valid_moves(self, player):
        moves = []
        for r in range(8):
            for c in range(8):
                flips = self.get_flips(r, c, player)
                if flips:
                    moves.append((r, c, flips))
        return moves

    def play(self, r, c, player):
        flips = self.get_flips(r, c, player)
        if not flips:
            return False
        self.board[r][c] = player
        for fr, fc in flips:
            self.board[fr][fc] = player
        return True

    def get_scores(self):
        b = sum(row.count(BLACK) for row in self.board)
        w = sum(row.count(WHITE) for row in self.board)
        return b, w

    def get_ai_move(self):
        moves = self.get_valid_moves(WHITE)
        if not moves:
            return None
        # Greedy heuristic with positional weights
        best_score = -9999
        best_move = moves[0]
        for r, c, flips in moves:
            score = WEIGHTS[r][c] + len(flips) * 2
            if score > best_score:
                best_score = score
                best_move = (r, c, flips)
        return best_move

    def print_board(self, valid_moves):
        valid_set = {(r, c) for r, c, _ in valid_moves}
        b, w = self.get_scores()
        print("\n   A B C D E F G H")
        print("  ┌────────────────┐")
        for r in range(8):
            row_str = f"{r+1} │"
            for c in range(8):
                val = self.board[r][c]
                if val == BLACK:
                    row_str += "● "
                elif val == WHITE:
                    row_str += "○ "
                elif (r, c) in valid_set:
                    row_str += "· "
                else:
                    row_str += "  "
            row_str += f"│ {r+1}"
            print(row_str)
        print("  └────────────────┘")
        print("   A B C D E F G H")
        print(f"Score -> Black (●): {b} | White (○): {w}\n")


def main():
    game = OthelloGame()
    print("====================================")
    print("⚪ OTHELLO (REVERSI) TERMINAL CLI ⚫")
    print("====================================")

    while True:
        valid_black = game.get_valid_moves(BLACK)
        valid_white = game.get_valid_moves(WHITE)

        if not valid_black and not valid_white:
            print("Game Over!")
            b, w = game.get_scores()
            game.print_board([])
            if b > w:
                print(f"🎉 Black wins {b} to {w}!")
            elif w > b:
                print(f"🤖 White wins {w} to {b}!")
            else:
                print(f"🤝 Draw! {b} to {w}")
            break

        if game.turn == BLACK:
            if not valid_black:
                print("Black has no valid moves! Passing to White.")
                game.turn = WHITE
                continue
            game.print_board(valid_black)
            try:
                move_str = input("Your move (e.g. D3, or 'q' to quit): ").strip().upper()
                if move_str == 'Q':
                    break
                if len(move_str) != 2:
                    print("Invalid format! Use Column Letter + Row Number (e.g. D3).")
                    continue
                col = ord(move_str[0]) - ord('A')
                row = int(move_str[1]) - 1
                if not (0 <= row < 8 and 0 <= col < 8):
                    print("Coordinates out of range!")
                    continue
                if not game.play(row, col, BLACK):
                    print("Invalid move! You must flank at least one opposing disc.")
                    continue
                game.turn = WHITE
            except (ValueError, IndexError):
                print("Invalid input!")
        else:
            if not valid_white:
                print("White has no valid moves! Passing to Black.")
                game.turn = BLACK
                continue
            ai_m = game.get_ai_move()
            r, c, _ = ai_m
            game.play(r, c, WHITE)
            col_letter = chr(ord('A') + c)
            print(f"AI plays: {col_letter}{r+1}")
            game.turn = BLACK


if __name__ == '__main__':
    main()
