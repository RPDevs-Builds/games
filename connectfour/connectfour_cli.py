#!/usr/bin/env python3
"""
Connect Four Terminal CLI Edition - 1974 Retro Classic
Zero-dependency discrete 7x6 gravity grid with Minimax AI and ANSI rendering.
"""

import sys
import os
import random

ROWS = 6
COLS = 7
EMPTY = 0
PLAYER_1 = 1  # Human (Red)
PLAYER_2 = 2  # Computer / Player 2 (Yellow)

# ANSI Colors
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

class ConnectFourCLI:
    def __init__(self, mode="ai", difficulty="medium"):
        self.mode = mode
        self.difficulty = difficulty
        self.reset()

    def reset(self):
        # board[r][c] with r=0 at top, r=5 at bottom
        self.board = [[EMPTY for _ in range(COLS)] for _ in range(ROWS)]
        self.turn = PLAYER_1
        self.moves_history = []
        self.winner = None
        self.winning_cells = []

    def is_valid_column(self, col):
        if col < 0 or col >= COLS:
            return False
        return self.board[0][col] == EMPTY

    def get_valid_columns(self):
        preferred = [3, 2, 4, 1, 5, 0, 6]
        return [c for c in preferred if self.is_valid_column(c)]

    def drop_piece(self, col, player=None):
        if player is None:
            player = self.turn
        if self.winner or not self.is_valid_column(col):
            return None

        target_row = -1
        for r in range(ROWS - 1, -1, -1):
            if self.board[r][col] == EMPTY:
                target_row = r
                break

        if target_row == -1:
            return None

        self.board[target_row][col] = player
        self.moves_history.append((target_row, col, player))

        win, cells = self.check_win_at(target_row, col, player)
        if win:
            self.winner = player
            self.winning_cells = cells
        elif self.is_board_full():
            self.winner = "draw"
        else:
            self.turn = PLAYER_2 if self.turn == PLAYER_1 else PLAYER_1

        return {
            "row": target_row,
            "col": col,
            "player": player,
            "winner": self.winner,
            "winning_cells": self.winning_cells
        }

    def undo(self):
        if not self.moves_history:
            return None
        r, c, player = self.moves_history.pop()
        self.board[r][c] = EMPTY
        self.winner = None
        self.winning_cells = []
        self.turn = player
        return (r, c, player)

    def is_board_full(self):
        return all(self.board[0][c] != EMPTY for c in range(COLS))

    def check_win_at(self, r, c, player):
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

        for dr, dc in directions:
            cells = [(r, c)]

            step = 1
            while True:
                nr, nc = r + dr * step, c + dc * step
                if 0 <= nr < ROWS and 0 <= nc < COLS and self.board[nr][nc] == player:
                    cells.append((nr, nc))
                    step += 1
                else:
                    break

            step = 1
            while True:
                nr, nc = r - dr * step, c - dc * step
                if 0 <= nr < ROWS and 0 <= nc < COLS and self.board[nr][nc] == player:
                    cells.append((nr, nc))
                    step += 1
                else:
                    break

            if len(cells) >= 4:
                return True, cells

        return False, []

    # ================= Minimax AI =================
    def get_ai_move(self, difficulty=None):
        if difficulty is None:
            difficulty = self.difficulty
        valid = self.get_valid_columns()
        if not valid:
            return None

        # Check immediate winning move
        for col in valid:
            if self.simulate_move(col, PLAYER_2):
                return col

        # Check immediate block
        for col in valid:
            if self.simulate_move(col, PLAYER_1):
                return col

        if difficulty == "easy":
            if 3 in valid and random.random() < 0.5:
                return 3
            return random.choice(valid)

        depth = 5 if difficulty == "hard" else 3
        best_score = -float("inf")
        best_col = valid[0]

        for col in valid:
            row = self.simulate_drop(col, PLAYER_2)
            score = self.minimax(depth - 1, -float("inf"), float("inf"), False)
            self.undo_simulated_drop(row, col)

            if score > best_score:
                best_score = score
                best_col = col

        return best_col

    def minimax(self, depth, alpha, beta, is_maximizing):
        winner = self.evaluate_terminal()
        if winner == PLAYER_2:
            return 100000 + depth
        if winner == PLAYER_1:
            return -100000 - depth
        if self.is_board_full() or depth == 0:
            return self.evaluate_heuristic()

        valid = self.get_valid_columns()

        if is_maximizing:
            max_score = -float("inf")
            for col in valid:
                row = self.simulate_drop(col, PLAYER_2)
                score = self.minimax(depth - 1, alpha, beta, False)
                self.undo_simulated_drop(row, col)
                max_score = max(max_score, score)
                alpha = max(alpha, score)
                if beta <= alpha:
                    break
            return max_score
        else:
            min_score = float("inf")
            for col in valid:
                row = self.simulate_drop(col, PLAYER_1)
                score = self.minimax(depth - 1, alpha, beta, True)
                self.undo_simulated_drop(row, col)
                min_score = min(min_score, score)
                beta = min(beta, score)
                if beta <= alpha:
                    break
            return min_score

    def simulate_drop(self, col, player):
        for r in range(ROWS - 1, -1, -1):
            if self.board[r][col] == EMPTY:
                self.board[r][col] = player
                return r
        return -1

    def undo_simulated_drop(self, row, col):
        if row != -1:
            self.board[row][col] = EMPTY

    def simulate_move(self, col, player):
        r = self.simulate_drop(col, player)
        win = False
        if r != -1:
            win, _ = self.check_win_at(r, col, player)
        self.undo_simulated_drop(r, col)
        return win

    def evaluate_terminal(self):
        for r in range(ROWS):
            for c in range(COLS):
                p = self.board[r][c]
                if p != EMPTY:
                    win, _ = self.check_win_at(r, c, p)
                    if win:
                        return p
        return None

    def evaluate_heuristic(self):
        score = 0
        # Center column bonus
        for r in range(ROWS):
            if self.board[r][3] == PLAYER_2:
                score += 6
            elif self.board[r][3] == PLAYER_1:
                score -= 6

            if self.board[r][2] == PLAYER_2:
                score += 3
            elif self.board[r][2] == PLAYER_1:
                score -= 3
            if self.board[r][4] == PLAYER_2:
                score += 3
            elif self.board[r][4] == PLAYER_1:
                score -= 3

        # Window evaluations
        score += self.evaluate_windows()
        return score

    def evaluate_windows(self):
        score = 0

        def eval_win(cells):
            p2 = cells.count(PLAYER_2)
            p1 = cells.count(PLAYER_1)
            empty = cells.count(EMPTY)

            if p2 == 4:
                return 10000
            if p2 == 3 and empty == 1:
                return 80
            if p2 == 2 and empty == 2:
                return 15
            if p1 == 3 and empty == 1:
                return -90
            if p1 == 2 and empty == 2:
                return -15
            return 0

        # Horizontal
        for r in range(ROWS):
            for c in range(COLS - 3):
                score += eval_win([self.board[r][c+i] for i in range(4)])

        # Vertical
        for c in range(COLS):
            for r in range(ROWS - 3):
                score += eval_win([self.board[r+i][c] for i in range(4)])

        # Diagonal \
        for r in range(ROWS - 3):
            for c in range(COLS - 3):
                score += eval_win([self.board[r+i][c+i] for i in range(4)])

        # Diagonal /
        for r in range(3, ROWS):
            for c in range(COLS - 3):
                score += eval_win([self.board[r-i][c+i] for i in range(4)])

        return score

    def render(self):
        print(f"\n{BOLD}{BLUE}================ CONNECT FOUR (1974) ================{RESET}")
        print(f" Mode: {self.mode.upper()}  |  AI: {self.difficulty.upper()}  |  Turn: {'🔴 RED (P1)' if self.turn == PLAYER_1 else '🟡 YELLOW (P2)'}")
        print()

        # Column indices
        col_headers = "   " + "   ".join(f"{c+1}" for c in range(COLS))
        print(f"{CYAN}{col_headers}{RESET}")
        print(f"{BLUE} ╔═══" + "╤═══" * (COLS - 1) + "╗" + RESET)

        win_set = set(self.winning_cells)
        for r in range(ROWS):
            row_str = f"{BLUE} ║ {RESET}"
            for c in range(COLS):
                val = self.board[r][c]
                is_win = (r, c) in win_set
                if val == PLAYER_1:
                    disc = f"{BOLD}{RED}●{RESET}" if not is_win else f"\033[41m\033[97m●{RESET}"
                elif val == PLAYER_2:
                    disc = f"{BOLD}{YELLOW}●{RESET}" if not is_win else f"\033[43m\033[30m●{RESET}"
                else:
                    disc = "·"

                row_str += disc + f"{BLUE} │ {RESET}" if c < COLS - 1 else disc + f"{BLUE} ║{RESET}"
            print(row_str)
            if r < ROWS - 1:
                print(f"{BLUE} ╟───" + "┼───" * (COLS - 1) + "╢" + RESET)

        print(f"{BLUE} ╚═══" + "╧═══" * (COLS - 1) + "╝" + RESET)
        print(f"{CYAN}{col_headers}{RESET}\n")

    def run(self):
        while True:
            self.render()
            if self.winner:
                if self.winner == PLAYER_1:
                    print(f"{BOLD}{RED}🏆 PLAYER 1 (RED) WINS!{RESET}\n")
                elif self.winner == PLAYER_2:
                    print(f"{BOLD}{YELLOW}🏆 PLAYER 2 (YELLOW) WINS!{RESET}\n")
                else:
                    print(f"{BOLD}🤝 STALEMATE DRAW!{RESET}\n")
                cmd = input("Play again? (y/n): ").strip().lower()
                if cmd == 'y':
                    self.reset()
                    continue
                else:
                    break

            if self.mode == "ai" and self.turn == PLAYER_2:
                print(f"{YELLOW}🤖 Computer is calculating optimal drop...{RESET}")
                col = self.get_ai_move()
                print(f"Computer chose column {col + 1}")
                self.drop_piece(col, PLAYER_2)
                continue

            try:
                cmd = input(f"Enter column (1-{COLS}), 'u' for Undo, 'r' for Reset, 'q' to Quit: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                break

            if cmd == 'q':
                break
            elif cmd == 'u':
                if self.mode == "ai":
                    self.undo()
                    self.undo()
                else:
                    self.undo()
                continue
            elif cmd == 'r':
                self.reset()
                continue

            if cmd.isdigit():
                col = int(cmd) - 1
                if self.is_valid_column(col):
                    self.drop_piece(col)
                else:
                    print("⚠️ Invalid column or column is full!")
            else:
                print("⚠️ Unrecognized command.")

if __name__ == "__main__":
    mode = "ai" if len(sys.argv) < 2 else sys.argv[1]
    diff = "medium" if len(sys.argv) < 3 else sys.argv[2]
    game = ConnectFourCLI(mode=mode, difficulty=diff)
    game.run()
