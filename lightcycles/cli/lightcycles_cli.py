#!/usr/bin/env python3
"""
Tron Light Cycles - Terminal ASCII / Curses Arena
1982 Cyber Grid Survival
"""

import sys
import time
import random
from collections import deque

GRID_WIDTH = 50
GRID_HEIGHT = 25

DIR_UP = (0, -1)
DIR_DOWN = (0, 1)
DIR_LEFT = (-1, 0)
DIR_RIGHT = (1, 0)

class LightCycleCLI:
    def __init__(self, width=GRID_WIDTH, height=GRID_HEIGHT):
        self.width = width
        self.height = height
        self.reset()

    def reset(self):
        # 0: empty, 1: p1 trail, 2: p2 trail, -1: wall
        self.grid = [[0 for _ in range(self.width)] for _ in range(self.height)]
        
        # Player 1 (Blue/Cyan)
        self.p1_x = 10
        self.p1_y = self.height // 2
        self.p1_dir = DIR_RIGHT
        self.p1_alive = True
        self.p1_boost = 100
        self.grid[self.p1_y][self.p1_x] = 1

        # Player 2 / AI (Orange)
        self.p2_x = self.width - 11
        self.p2_y = self.height // 2
        self.p2_dir = DIR_LEFT
        self.p2_alive = True
        self.p2_boost = 100
        self.grid[self.p2_y][self.p2_x] = 2

        self.game_over = False
        self.winner = None

    def is_safe(self, x, y):
        if x < 0 or x >= self.width or y < 0 or y >= self.height:
            return False
        return self.grid[y][x] == 0

    def get_open_space(self, start_x, start_y, max_depth=40):
        if not self.is_safe(start_x, start_y):
            return 0
        visited = set([(start_x, start_y)])
        queue = deque([(start_x, start_y, 0)])
        count = 0
        while queue:
            cx, cy, d = queue.popleft()
            count += 1
            if d >= max_depth:
                continue
            for dx, dy in [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT]:
                nx, ny = cx + dx, cy + dy
                if self.is_safe(nx, ny) and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny, d + 1))
        return count

    def choose_ai_move(self):
        cur_dx, cur_dy = self.p2_dir
        candidates = []
        for d in [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT]:
            # No 180 turn
            if d[0] == -cur_dx and d[1] == -cur_dy:
                continue
            candidates.append(d)

        best_dir = cur_dx, cur_dy
        best_space = -1

        random.shuffle(candidates)
        # Prioritize current dir slightly
        candidates.sort(key=lambda d: 1 if d == (cur_dx, cur_dy) else 0, reverse=True)

        for d in candidates:
            nx = self.p2_x + d[0]
            ny = self.p2_y + d[1]
            space = self.get_open_space(nx, ny)
            if space > best_space:
                best_space = space
                best_dir = d

        return best_dir

    def step(self, p1_next_dir=None):
        if self.game_over:
            return

        # P1 direction update
        if p1_next_dir:
            cur_dx, cur_dy = self.p1_dir
            if not (p1_next_dir[0] == -cur_dx and p1_next_dir[1] == -cur_dy):
                self.p1_dir = p1_next_dir

        # AI direction update
        self.p2_dir = self.choose_ai_move()

        # Compute next positions
        next_p1_x = self.p1_x + self.p1_dir[0]
        next_p1_y = self.p1_y + self.p1_dir[1]

        next_p2_x = self.p2_x + self.p2_dir[0]
        next_p2_y = self.p2_y + self.p2_dir[1]

        # Head-on collision
        if next_p1_x == next_p2_x and next_p1_y == next_p2_y:
            self.p1_alive = False
            self.p2_alive = False
            self.game_over = True
            self.winner = "DRAW (HEAD-ON)"
            return

        p1_safe = self.is_safe(next_p1_x, next_p1_y)
        p2_safe = self.is_safe(next_p2_x, next_p2_y)

        if not p1_safe:
            self.p1_alive = False
        if not p2_safe:
            self.p2_alive = False

        if not self.p1_alive or not self.p2_alive:
            self.game_over = True
            if not self.p1_alive and not self.p2_alive:
                self.winner = "DRAW"
            elif not self.p1_alive:
                self.winner = "CPU (ORANGE) WINS"
            else:
                self.winner = "PLAYER 1 (CYAN) WINS"
            return

        # Move forward
        self.p1_x, self.p1_y = next_p1_x, next_p1_y
        self.p2_x, self.p2_y = next_p2_x, next_p2_y
        self.grid[self.p1_y][self.p1_x] = 1
        self.grid[self.p2_y][self.p2_x] = 2

    def render(self):
        lines = []
        border_top = "+" + "-" * self.width + "+"
        lines.append(border_top)
        for y in range(self.height):
            row = ["|"]
            for x in range(self.width):
                if x == self.p1_x and y == self.p1_y:
                    row.append("\033[96m▲\033[0m" if self.p1_dir == DIR_UP else 
                               "\033[96m▼\033[0m" if self.p1_dir == DIR_DOWN else
                               "\033[96m◀\033[0m" if self.p1_dir == DIR_LEFT else "\033[96m▶\033[0m")
                elif x == self.p2_x and y == self.p2_y:
                    row.append("\033[91m▲\033[0m" if self.p2_dir == DIR_UP else 
                               "\033[91m▼\033[0m" if self.p2_dir == DIR_DOWN else
                               "\033[91m◀\033[0m" if self.p2_dir == DIR_LEFT else "\033[91m▶\033[0m")
                elif self.grid[y][x] == 1:
                    row.append("\033[96m#\033[0m")
                elif self.grid[y][x] == 2:
                    row.append("\033[91m#\033[0m")
                else:
                    row.append(" ")
            row.append("|")
            lines.append("".join(row))
        lines.append(border_top)
        status = f"P1: ({self.p1_x},{self.p1_y})  |  CPU: ({self.p2_x},{self.p2_y})"
        if self.game_over:
            status += f"  *** {self.winner} ***"
        lines.append(status)
        return "\n".join(lines)

def run_simulation(steps=50):
    game = LightCycleCLI(width=30, height=15)
    print("=== TRON LIGHT CYCLES TERMINAL SIMULATION ===")
    for i in range(steps):
        if game.game_over:
            break
        # Alternate turns or let AI guide both
        game.step()
    print(game.render())
    return game

if __name__ == "__main__":
    run_simulation(60)
