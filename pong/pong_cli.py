#!/usr/bin/env python3
"""
Pong Terminal CLI Edition - 1972 Retro Classic
Zero-dependency discrete 2D ASCII paddle tennis simulation with predictive AI.
"""

import sys
import os
import time
import random
import select

WIDTH = 60
HEIGHT = 20
PADDLE_HEIGHT = 4

# ANSI Colors
CYAN = "\033[96m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
RED = "\033[91m"
WHITE = "\033[97m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


class PongCLI:
    def __init__(self, mode="1p", difficulty="medium"):
        self.width = WIDTH
        self.height = HEIGHT
        self.mode = mode
        self.difficulty = difficulty
        self.winning_score = 11
        self.reset()

    def reset(self):
        self.score_p1 = 0
        self.score_p2 = 0
        self.game_over = False
        self.winner = None

        self.p1_y = (self.height - PADDLE_HEIGHT) // 2
        self.p2_y = (self.height - PADDLE_HEIGHT) // 2

        self.reset_ball(1)

    def reset_ball(self, direction=1):
        self.ball_x = self.width // 2
        self.ball_y = self.height // 2
        self.ball_vx = direction
        self.ball_vy = random.choice([-1, 1])

    def move_p1(self, dy):
        self.p1_y = max(1, min(self.height - PADDLE_HEIGHT - 1, self.p1_y + dy))

    def move_p2(self, dy):
        self.p2_y = max(1, min(self.height - PADDLE_HEIGHT - 1, self.p2_y + dy))

    def update_ai(self):
        if self.mode != "1p":
            return

        target_y = self.ball_y - PADDLE_HEIGHT // 2
        if self.difficulty == "easy":
            if self.ball_vx > 0 and self.ball_x > self.width // 2:
                if random.random() < 0.65:
                    if self.p2_y < target_y:
                        self.move_p2(1)
                    elif self.p2_y > target_y:
                        self.move_p2(-1)
        elif self.difficulty == "medium":
            if self.ball_vx > 0:
                if self.p2_y < target_y:
                    self.move_p2(1)
                elif self.p2_y > target_y:
                    self.move_p2(-1)
        else:  # impossible
            if self.ball_vx > 0:
                if self.p2_y < target_y:
                    self.move_p2(1)
                elif self.p2_y > target_y:
                    self.move_p2(-1)

    def step(self):
        if self.game_over:
            return {"events": ["game_over"]}

        events = []
        self.update_ai()

        # Move Ball
        next_x = self.ball_x + self.ball_vx
        next_y = self.ball_y + self.ball_vy

        # Wall Bounce (Top & Bottom)
        if next_y <= 0:
            next_y = 0
            self.ball_vy = -self.ball_vy
            events.append("bounce_wall")
        elif next_y >= self.height - 1:
            next_y = self.height - 1
            self.ball_vy = -self.ball_vy
            events.append("bounce_wall")

        # Paddle 1 Collision (Left side: x = 2)
        if next_x <= 2 and self.ball_vx < 0:
            if self.p1_y <= next_y < self.p1_y + PADDLE_HEIGHT:
                next_x = 3
                self.ball_vx = -self.ball_vx
                events.append("bounce_paddle_p1")
            elif next_x < 1:
                # P2 Scores
                self.score_p2 += 1
                events.append("point_p2")
                if self.score_p2 >= self.winning_score:
                    self.game_over = True
                    self.winner = 2
                    events.append("game_over")
                else:
                    self.reset_ball(-1)
                return {"events": events}

        # Paddle 2 Collision (Right side: x = self.width - 3)
        if next_x >= self.width - 3 and self.ball_vx > 0:
            if self.p2_y <= next_y < self.p2_y + PADDLE_HEIGHT:
                next_x = self.width - 4
                self.ball_vx = -self.ball_vx
                events.append("bounce_paddle_p2")
            elif next_x > self.width - 2:
                # P1 Scores
                self.score_p1 += 1
                events.append("point_p1")
                if self.score_p1 >= self.winning_score:
                    self.game_over = True
                    self.winner = 1
                    events.append("game_over")
                else:
                    self.reset_ball(1)
                return {"events": events}

        self.ball_x = next_x
        self.ball_y = next_y
        return {"events": events}

    def render(self):
        lines = []
        header = f"{CYAN}{BOLD} P1: {self.score_p1}{RESET}  {DIM}|{RESET}  {YELLOW}{BOLD}{'P2' if self.mode == '2p' else 'CPU'}: {self.score_p2}{RESET}"
        border_top = f"{DIM}+{'-' * (self.width - 2)}+{RESET}"
        lines.append(header)
        lines.append(border_top)

        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Net
                if x == self.width // 2:
                    char = f"{DIM}|{RESET}"
                else:
                    char = " "

                # Ball
                if x == int(self.ball_x) and y == int(self.ball_y):
                    char = f"{WHITE}{BOLD}O{RESET}"
                # Paddle 1
                elif x == 2 and self.p1_y <= y < self.p1_y + PADDLE_HEIGHT:
                    char = f"{CYAN}█{RESET}"
                # Paddle 2
                elif x == self.width - 3 and self.p2_y <= y < self.p2_y + PADDLE_HEIGHT:
                    char = f"{YELLOW}█{RESET}"

                row.append(char)
            lines.append("".join(row))

        border_bottom = f"{DIM}+{'-' * (self.width - 2)}+{RESET}"
        lines.append(border_bottom)

        if self.game_over:
            w_text = f"PLAYER {self.winner} WINS!" if self.mode == "2p" else ("YOU WIN!" if self.winner == 1 else "CPU WINS!")
            lines.append(f"{GREEN}{BOLD}*** {w_text} ***{RESET}")
        else:
            lines.append(f"{DIM}[W/S] Move Paddle  [Q] Quit{RESET}")

        return "\n".join(lines)


def run_interactive():
    game = PongCLI()
    print("\033[2J\033[H", end="")
    print(game.render())
    time.sleep(1)


if __name__ == "__main__":
    run_interactive()
