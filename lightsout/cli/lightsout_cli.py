#!/usr/bin/env python3
"""
Lights Out - Interactive Terminal Edition
Play the 1995 handheld logic puzzle directly in your shell.
Includes full GF(2) Gaussian elimination solver for optimal moves and hints.
"""

import sys
import time
import random
from typing import List, Tuple, Optional, Dict

# ANSI Terminal Colors
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
YELLOW = "\033[38;5;220m"
ORANGE = "\033[38;5;214m"
CYAN = "\033[38;5;51m"
GREEN = "\033[38;5;82m"
GRAY = "\033[38;5;240m"
DARK_GRAY = "\033[38;5;236m"
WHITE = "\033[38;5;255m"
RED = "\033[38;5;196m"


class LightsOutGame:
    def __init__(self, rows: int = 5, cols: int = 5, target_mode: str = 'off', wrap_topology: bool = False):
        self.rows = max(2, min(8, rows))
        self.cols = max(2, min(8, cols))
        self.target_mode = target_mode # 'off' (Lights Out) or 'on' (Lit-Out)
        self.wrap_topology = wrap_topology
        self.board = [[0 for _ in range(self.cols)] for _ in range(self.rows)]
        self.initial_board = [[0 for _ in range(self.cols)] for _ in range(self.rows)]
        self.history: List[Tuple[int, int]] = []
        self.move_count = 0
        self.start_time = time.time()

    def is_valid_coord(self, r: int, c: int) -> bool:
        if self.wrap_topology:
            return True
        return 0 <= r < self.rows and 0 <= c < self.cols

    def normalize_row(self, r: int) -> int:
        if not self.wrap_topology:
            return r
        return r % self.rows

    def normalize_col(self, c: int) -> int:
        if not self.wrap_topology:
            return c
        return c % self.cols

    def toggle(self, r: int, c: int, record: bool = True) -> bool:
        if not self.is_valid_coord(r, c):
            return False

        actual_r = self.normalize_row(r)
        actual_c = self.normalize_col(c)

        deltas = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]
        for dr, dc in deltas:
            nr, nc = r + dr, c + dc
            if self.is_valid_coord(nr, nc):
                norm_r = self.normalize_row(nr)
                norm_c = self.normalize_col(nc)
                self.board[norm_r][norm_c] ^= 1

        if record:
            self.history.append((actual_r, actual_c))
            self.move_count += 1
        return True

    def undo(self) -> Optional[Tuple[int, int]]:
        if not self.history:
            return None
        last_r, last_c = self.history.pop()
        self.toggle(last_r, last_c, record=False)
        self.move_count = max(0, self.move_count - 1)
        return (last_r, last_c)

    def reset_to_initial(self):
        self.board = [row[:] for row in self.initial_board]
        self.history.clear()
        self.move_count = 0
        self.start_time = time.time()

    def is_solved(self) -> bool:
        target = 1 if self.target_mode == 'on' else 0
        return all(self.board[r][c] == target for r in range(self.rows) for c in range(self.cols))

    def active_count(self) -> int:
        return sum(self.board[r][c] for r in range(self.rows) for c in range(self.cols))

    def scramble(self, steps: int = 8):
        self.board = [[0 for _ in range(self.cols)] for _ in range(self.rows)]
        total = self.rows * self.cols
        pressed = set()
        target = min(steps, total)

        while len(pressed) < target:
            idx = random.randint(0, total - 1)
            if idx not in pressed:
                pressed.add(idx)
                r, c = idx // self.cols, idx % self.cols
                self.toggle(r, c, record=False)

        if self.is_solved():
            self.toggle(0, 0, record=False)

        self.initial_board = [row[:] for row in self.board]
        self.history.clear()
        self.move_count = 0
        self.start_time = time.time()

    def solve(self) -> Dict:
        """Solves using GF(2) Gaussian Elimination, finding minimum weight solution."""
        N = self.rows * self.cols
        A = [[0] * N for _ in range(N)]
        deltas = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]
        target_bit = 1 if self.target_mode == 'on' else 0

        for r in range(self.rows):
            for c in range(self.cols):
                j = r * self.cols + c
                for dr, dc in deltas:
                    nr, nc = r + dr, c + dc
                    if self.is_valid_coord(nr, nc):
                        norm_r = self.normalize_row(nr)
                        norm_c = self.normalize_col(nc)
                        i = norm_r * self.cols + norm_c
                        A[i][j] = 1

        # Augmented matrix [A | (b ^ target)]
        M = []
        for i in range(N):
            r, c = i // self.cols, i % self.cols
            diff_bit = self.board[r][c] ^ target_bit
            M.append(A[i] + [diff_bit])


        pivot_row_for_col = [-1] * N
        curr_row = 0

        for col in range(N):
            if curr_row >= N:
                break
            pivot = -1
            for r in range(curr_row, N):
                if M[r][col] == 1:
                    pivot = r
                    break
            if pivot == -1:
                continue

            M[curr_row], M[pivot] = M[pivot], M[curr_row]
            pivot_row_for_col[col] = curr_row

            for r in range(N):
                if r != curr_row and M[r][col] == 1:
                    for k in range(col, N + 1):
                        M[r][k] ^= M[curr_row][k]
            curr_row += 1

        # Inconsistency check
        for r in range(curr_row, N):
            if M[r][N] == 1:
                return {"solvable": False, "moves": []}

        free_cols = [c for c in range(N) if pivot_row_for_col[c] == -1]
        pivot_cols = [c for c in range(N) if pivot_row_for_col[c] != -1]

        num_free = len(free_cols)
        best_sol = None
        min_weight = float('inf')

        for comb in range(1 << num_free):
            x = [0] * N
            for i in range(num_free):
                if (comb >> i) & 1:
                    x[free_cols[i]] = 1

            for col in pivot_cols:
                r = pivot_row_for_col[col]
                val = M[r][N]
                for fc in free_cols:
                    if M[r][fc] == 1:
                        val ^= x[fc]
                x[col] = val

            weight = sum(x)
            if weight < min_weight:
                min_weight = weight
                best_sol = list(x)

        moves = []
        if best_sol:
            for idx, val in enumerate(best_sol):
                if val == 1:
                    moves.append((idx // self.cols, idx % self.cols))

        return {"solvable": True, "moves": moves, "min_weight": min_weight}

    def render(self, hint_coord: Optional[Tuple[int, int]] = None):
        elapsed = int(time.time() - self.start_time)
        mins, secs = divmod(elapsed, 60)
        time_str = f"{mins:02d}:{secs:02d}"

        print("\033[2J\033[H", end="") # Clear screen & home cursor
        print(f"{BOLD}{ORANGE}╔══════════════════════════════════════════════════════╗{RESET}")
        print(f"{BOLD}{ORANGE}║{RESET}  {YELLOW}💡 LIGHTS OUT{RESET} - {WHITE}Handheld Terminal Classic{RESET}          {BOLD}{ORANGE}║{RESET}")
        print(f"{BOLD}{ORANGE}╠══════════════════════════════════════════════════════╣{RESET}")
        print(f"{BOLD}{ORANGE}║{RESET}  Moves: {CYAN}{self.move_count:<4}{RESET}  Time: {GREEN}{time_str:<6}{RESET}  Lit: {YELLOW}{self.active_count():<3}{RESET} (Dim: {self.rows}x{self.cols})   {BOLD}{ORANGE}║{RESET}")
        print(f"{BOLD}{ORANGE}╚══════════════════════════════════════════════════════╝{RESET}\n")

        # Column headers
        col_header = "     " + "   ".join(f"{BOLD}{c + 1}{RESET}" for c in range(self.cols))
        print(col_header)
        print("   ┌" + "───┬" * (self.cols - 1) + "───┐")

        for r in range(self.rows):
            row_str = f" {BOLD}{r + 1}{RESET} │"
            for c in range(self.cols):
                is_on = self.board[r][c] == 1
                is_hint = hint_coord == (r, c)

                if is_hint:
                    cell_display = f"{CYAN}{BOLD} ? {RESET}"
                elif is_on:
                    cell_display = f"{YELLOW}{BOLD} ★ {RESET}"
                else :
                    cell_display = f"{DARK_GRAY} · {RESET}"

                row_str += cell_display + "│"
            print(row_str)

            if r < self.rows - 1:
                print("   ├" + "───┼" * (self.cols - 1) + "───┤")
            else:
                print("   └" + "───┴" * (self.cols - 1) + "───┘")

        print(f"\n{DIM}Commands:{RESET} {WHITE}[r c]{RESET} Toggle (e.g. 1 1) | {WHITE}h{RESET} Hint | {WHITE}s{RESET} Solve | {WHITE}u{RESET} Undo | {WHITE}r{RESET} Reset | {WHITE}n{RESET} New | {WHITE}q{RESET} Quit")


def play_cli():
    game = LightsOutGame(5, 5)
    game.scramble(steps=8)
    hint_coord = None
    status_msg = "Game started! Extinguish all lights."

    while True:
        game.render(hint_coord)
        hint_coord = None

        if status_msg:
            print(f"{BOLD}{CYAN}» {status_msg}{RESET}\n")
            status_msg = ""

        if game.is_solved():
            print(f"{BOLD}{GREEN}🎉 CONGRATULATIONS! ALL LIGHTS OUT!{RESET}")
            print(f"Solved in {BOLD}{game.move_count}{RESET} moves!\n")
            ans = input("Play again? (y/n): ").strip().lower()
            if ans.startswith('y'):
                game.scramble(steps=8)
                status_msg = "Fresh game scrambled!"
                continue
            else:
                print("Thanks for playing Lights Out!")
                break

        try:
            cmd = input(f"{BOLD}LightsOut>{RESET} ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue

        if cmd in ('q', 'quit', 'exit'):
            print("Thanks for playing Lights Out!")
            break

        if cmd in ('h', 'hint'):
            sol = game.solve()
            if sol["solvable"] and sol["moves"]:
                hint = sol["moves"][0]
                hint_coord = hint
                status_msg = f"💡 HINT: Press Row {hint[0] + 1}, Col {hint[1] + 1} ({len(sol['moves'])} moves to clear)"
            else:
                status_msg = "⚠️ No solution exists for this board state!"
            continue

        if cmd in ('s', 'solve'):
            sol = game.solve()
            if sol["solvable"] and sol["moves"]:
                for r, c in sol["moves"]:
                    game.toggle(r, c)
                status_msg = f"🤖 AI Solver cleared board in {len(sol['moves'])} optimal moves!"
            else:
                status_msg = "⚠️ Board cannot be solved!"
            continue

        if cmd in ('u', 'undo'):
            res = game.undo()
            status_msg = f"Undid move at ({res[0] + 1}, {res[1] + 1})" if res else "No moves to undo."
            continue

        if cmd in ('r', 'reset'):
            game.reset_to_initial()
            status_msg = "Reset puzzle to start."
            continue

        if cmd in ('n', 'new'):
            game.scramble(steps=8)
            status_msg = "New puzzle scrambled!"
            continue

        # Try parsing coordinates (e.g. "1 1", "1,1", "11", "a1")
        parts = cmd.replace(',', ' ').split()
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            r = int(parts[0]) - 1
            c = int(parts[1]) - 1
            if game.is_valid_coord(r, c):
                game.toggle(r, c)
            else:
                status_msg = f"Coordinates must be between 1 and {game.rows}."
        elif len(cmd) == 2 and cmd[0].isdigit() and cmd[1].isdigit():
            r = int(cmd[0]) - 1
            c = int(cmd[1]) - 1
            if game.is_valid_coord(r, c):
                game.toggle(r, c)
            else:
                status_msg = f"Coordinates out of bounds."
        else:
            status_msg = "Unknown command. Enter row and column (e.g. '1 1') or 'h' for hint."


if __name__ == '__main__':
    play_cli()
