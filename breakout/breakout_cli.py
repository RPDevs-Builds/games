#!/usr/bin/env python3
"""
Breakout Terminal CLI Edition - 1976 Retro Classic
Zero-dependency discrete 2D ASCII brick breaker with paddle deflection physics.
"""

import sys
import os
import time
import math
import random

WIDTH = 40
HEIGHT = 20
PADDLE_WIDTH = 7

# ANSI Colors
RED = "\033[91m"
ORANGE = "\033[33m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
WHITE = "\033[97m"
BOLD = "\033[1m"
RESET = "\033[0m"

ROW_COLORS = [RED, ORANGE, GREEN, YELLOW]
ROW_POINTS = [7, 5, 3, 1]

class BreakoutCLI:
    def __init__(self):
        self.width = WIDTH
        self.height = HEIGHT
        self.reset()

    def reset(self):
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.game_won = False
        self.paddle_x = (self.width - PADDLE_WIDTH) // 2

        self.init_bricks()
        self.reset_ball()

    def init_bricks(self):
        self.bricks = []
        # 4 rows of bricks
        for r in range(4):
            # 8 bricks per row
            for c in range(8):
                bw = 4
                bx = 3 + c * (bw + 1)
                by = 2 + r
                self.bricks.append({
                    "id": f"{r}-{c}",
                    "row": r,
                    "x": bx,
                    "y": by,
                    "w": bw,
                    "pts": ROW_POINTS[r],
                    "color": ROW_COLORS[r],
                    "alive": True
                })
        self.remaining_bricks = len(self.bricks)

    def reset_ball(self):
        self.ball_attached = True
        self.ball_x = float(self.paddle_x + PADDLE_WIDTH // 2)
        self.ball_y = float(self.height - 3)
        self.ball_vx = 0.0
        self.ball_vy = 0.0

    def launch_ball(self):
        if not self.ball_attached:
            return
        self.ball_attached = False
        self.ball_vx = random.choice([-0.8, -0.5, 0.5, 0.8])
        self.ball_vy = -1.0

    def move_paddle(self, dx):
        self.paddle_x = max(1, min(self.width - PADDLE_WIDTH - 1, self.paddle_x + dx))
        if self.ball_attached:
            self.ball_x = float(self.paddle_x + PADDLE_WIDTH // 2)

    def step(self):
        if self.game_over or self.game_won:
            return "ended"

        if self.ball_attached:
            self.ball_x = float(self.paddle_x + PADDLE_WIDTH // 2)
            return "attached"

        self.ball_x += self.ball_vx
        self.ball_y += self.ball_vy

        # Wall bounce (left/right)
        if self.ball_x <= 1:
            self.ball_x = 1.0
            self.ball_vx = abs(self.ball_vx)
        elif self.ball_x >= self.width - 2:
            self.ball_x = float(self.width - 2)
            self.ball_vx = -abs(self.ball_vx)

        # Top wall bounce
        if self.ball_y <= 1:
            self.ball_y = 1.0
            self.ball_vy = abs(self.ball_vy)

        # Bottom drain
        if self.ball_y >= self.height - 1:
            self.lives -= 1
            if self.lives <= 0:
                self.game_over = True
                return "game_over"
            self.reset_ball()
            return "life_lost"

        # Paddle collision
        py = self.height - 2
        bx_int = int(round(self.ball_x))
        by_int = int(round(self.ball_y))

        if by_int == py and self.ball_vy > 0:
            if self.paddle_x <= bx_int < self.paddle_x + PADDLE_WIDTH:
                # Deflect angle
                offset = (bx_int - (self.paddle_x + PADDLE_WIDTH // 2)) / (PADDLE_WIDTH / 2)
                self.ball_vx = offset * 1.2
                self.ball_vy = -abs(self.ball_vy)
                return "paddle_hit"

        # Brick collision
        for b in self.bricks:
            if not b["alive"]:
                continue
            if b["y"] == by_int and b["x"] <= bx_int < b["x"] + b["w"]:
                b["alive"] = False
                self.remaining_bricks -= 1
                self.score += b["pts"]
                self.ball_vy = -self.ball_vy

                if self.remaining_bricks == 0:
                    self.game_won = True
                    return "game_won"
                return "brick_hit"

        return "step"

    def render_to_string(self):
        lines = []
        lines.append(f"{BOLD}{CYAN}=== 🧱 BREAKOUT 1976 ==={RESET}")
        lines.append(f"SCORE: {BOLD}{self.score}{RESET} | LIVES: {'❤️ ' * max(0, self.lives)}")
        lines.append("+" + "-" * (self.width - 2) + "+")

        bx_int = int(round(self.ball_x))
        by_int = int(round(self.ball_y))

        for y in range(1, self.height - 1):
            row_chars = []
            x = 1
            while x < self.width - 1:
                # Check ball
                if x == bx_int and y == by_int:
                    row_chars.append(f"{BOLD}{WHITE}O{RESET}")
                    x += 1
                    continue

                # Check paddle
                if y == self.height - 2 and self.paddle_x <= x < self.paddle_x + PADDLE_WIDTH:
                    row_chars.append(f"{BOLD}{CYAN}={RESET}")
                    x += 1
                    continue

                # Check brick
                brick_found = False
                for b in self.bricks:
                    if b["alive"] and b["y"] == y and b["x"] <= x < b["x"] + b["w"]:
                        row_chars.append(f"{b['color']}#{RESET}")
                        brick_found = True
                        break

                if not brick_found:
                    row_chars.append(" ")
                x += 1

            lines.append("|" + "".join(row_chars) + "|")

        lines.append("+" + "-" * (self.width - 2) + "+")
        lines.append("Controls: [A] Left, [D] Right, [SPACE] Launch, [Q] Quit")
        return "\n".join(lines)


def main():
    game = BreakoutCLI()
    print(game.render_to_string())
    print("\nBreakout CLI engine loaded successfully.")

if __name__ == "__main__":
    main()
