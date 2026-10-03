#!/usr/bin/env python3
"""
Retro Snake - Terminal CLI Edition
"""

import sys
import random
from typing import List, Tuple, Optional

class SnakeGame:
    def __init__(self, width: int = 20, height: int = 15):
        self.width = width
        self.height = height
        self.reset()

    def reset(self):
        mid_x = self.width // 2
        mid_y = self.height // 2
        self.snake = [(mid_x, mid_y), (mid_x - 1, mid_y), (mid_x - 2, mid_y)]
        self.dir = (1, 0) # RIGHT
        self.score = 0
        self.game_over = False
        self.spawn_food()

    def spawn_food(self):
        occupied = set(self.snake)
        empty = [(x, y) for x in range(self.width) for y in range(self.height) if (x, y) not in occupied]
        self.food = random.choice(empty) if empty else None

    def change_dir(self, dx: int, dy: int) -> bool:
        if self.dir[0] + dx == 0 and self.dir[1] + dy == 0:
            return False
        self.dir = (dx, dy)
        return True

    def step(self) -> str:
        if self.game_over:
            return 'game_over'

        head_x, head_y = self.snake[0]
        new_head = (head_x + self.dir[0], head_y + self.dir[1])

        # Wall check
        if not (0 <= new_head[0] < self.width and 0 <= new_head[1] < self.height):
            self.game_over = True
            return 'wall'

        # Self check
        if new_head in self.snake[:-1]:
            self.game_over = True
            return 'self'

        self.snake.insert(0, new_head)

        if self.food and new_head == self.food:
            self.score += 10
            self.spawn_food()
            return 'eat'
        else:
            self.snake.pop()
            return 'move'

    def render(self):
        print("\033[2J\033[H", end="")
        print(f"🐍 RETRO SNAKE | Score: {self.score}")
        print("+" + "-" * (self.width * 2) + "+")
        for y in range(self.height):
            line = "|"
            for x in range(self.width):
                if (x, y) == self.snake[0]:
                    line += "██"
                elif (x, y) in self.snake:
                    line += "▓▓"
                elif (x, y) == self.food:
                    line += "★ "
                else:
                    line += "  "
            line += "|"
            print(line)
        print("+" + "-" * (self.width * 2) + "+")
        print("Controls: [w] Up | [s] Down | [a] Left | [d] Right | [q] Quit")


def play_cli():
    game = SnakeGame(16, 10)
    print("Welcome to Retro Snake CLI!")
    while not game.game_over:
        game.render()
        try:
            cmd = input("Move (w/a/s/d, enter to advance): ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            break

        if cmd == 'q':
            break
        elif cmd == 'w': game.change_dir(0, -1)
        elif cmd == 's': game.change_dir(0, 1)
        elif cmd == 'a': game.change_dir(-1, 0)
        elif cmd == 'd': game.change_dir(1, 0)

        res = game.step()
        if res in ('wall', 'self'):
            game.render()
            print(f"💥 GAME OVER! Final Score: {game.score}")
            break

if __name__ == '__main__':
    play_cli()
