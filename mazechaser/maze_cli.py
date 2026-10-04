#!/usr/bin/env python3
"""
Maze Chaser (1980) Terminal CLI
Pure Python 3 standard library implementation.
"""

import sys
import time
import math
import random

COLS = 19
ROWS = 22

MAZE_MAP = [
  "###################",
  "#*.......#.......*#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###_#_###.####",
  "___#.#_______#.#___",
  "####.#_##-##_#.####",
  "____.__#GGGG#__.____",
  "####.#_#####_#.####",
  "___#.#_______#.#___",
  "####.#_#####_#.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#*..#.........#..*#",
  "###.#.#.#####.#.###",
  "#.....#...#...#.....#",
  "#.#######.#.#######.#",
  "#...................#",
  "###################",
  "                   "
]

COLORS = {
  'WALL': '\033[94m',      # Blue
  'PELLET': '\033[37m',    # White/Peach
  'ENERGY': '\033[93m',    # Yellow
  'PLAYER': '\033[93m',    # Bright Yellow
  'BLINKY': '\033[91m',    # Red
  'PINKY':  '\033[95m',    # Magenta
  'INKY':   '\033[96m',    # Cyan
  'CLYDE':  '\033[33m',    # Orange
  'FRIGHT': '\033[34m',    # Dark Blue
  'RESET':  '\033[0m'
}

DIRS = {
  'UP':    (0, -1),
  'DOWN':  (0, 1),
  'LEFT':  (-1, 0),
  'RIGHT': (1, 0)
}

class TerminalMazeGame:
    def __init__(self):
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.game_won = False
        self.fright_timer = 0
        self.grid = []
        self.total_pellets = 0
        self.pellets_left = 0

        self.px = 9
        self.py = 15
        self.pdir = DIRS['LEFT']

        self.ghosts = {
            'blinky': {'name': 'Blinky', 'x': 9, 'y': 7, 'dir': DIRS['LEFT'], 'color': 'BLINKY', 'mode': 'chase'},
            'pinky':  {'name': 'Pinky',  'x': 9, 'y': 9, 'dir': DIRS['UP'],   'color': 'PINKY',  'mode': 'chase'},
            'inky':   {'name': 'Inky',   'x': 8, 'y': 9, 'dir': DIRS['UP'],   'color': 'INKY',   'mode': 'chase'},
            'clyde':  {'name': 'Clyde',  'x': 10, 'y': 9, 'dir': DIRS['UP'],  'color': 'CLYDE',  'mode': 'chase'}
        }
        self.init_maze()

    def init_maze(self):
        self.grid = []
        self.total_pellets = 0
        for r in range(ROWS):
            row = []
            line = MAZE_MAP[r] if r < len(MAZE_MAP) else ""
            for c in range(COLS):
                char = line[c] if c < len(line) else ' '
                row.append(char)
                if char in ('.', '*'):
                    self.total_pellets += 1
            self.grid.append(row)
        self.pellets_left = self.total_pellets

    def is_wall(self, c, r):
        if r < 0 or r >= ROWS:
            return True
        if c < 0 or c >= COLS:
            return False # Tunnel
        return self.grid[r][c] in ('#', 'G', '-')

    def move_player(self, dir_name):
        if dir_name not in DIRS:
            return
        dx, dy = DIRS[dir_name]
        nx = self.px + dx
        ny = self.py + dy
        if not self.is_wall(nx, ny):
            self.px = nx
            self.py = ny
            self.pdir = (dx, dy)

            # Tunnel wrap
            if self.px < 0:
                self.px = COLS - 1
            elif self.px >= COLS:
                self.px = 0

            # Eat pellet
            tile = self.grid[self.py][self.px]
            if tile == '.':
                self.grid[self.py][self.px] = ' '
                self.score += 10
                self.pellets_left -= 1
            elif tile == '*':
                self.grid[self.py][self.px] = ' '
                self.score += 50
                self.pellets_left -= 1
                self.fright_timer = 20 # 20 steps
                for g in self.ghosts.values():
                    g['mode'] = 'frightened'

            if self.pellets_left <= 0:
                self.game_won = True

    def move_ghosts(self):
        if self.fright_timer > 0:
            self.fright_timer -= 1
            if self.fright_timer == 0:
                for g in self.ghosts.values():
                    g['mode'] = 'chase'

        for gid, g in self.ghosts.items():
            # Target tile
            if g['mode'] == 'frightened':
                tx, ty = random.randint(0, COLS-1), random.randint(0, ROWS-1)
            elif gid == 'blinky':
                tx, ty = self.px, self.py
            elif gid == 'pinky':
                tx = self.px + self.pdir[0] * 4
                ty = self.py + self.pdir[1] * 4
            elif gid == 'inky':
                b = self.ghosts['blinky']
                tx = (self.px + self.pdir[0] * 2) * 2 - b['x']
                ty = (self.py + self.pdir[1] * 2) * 2 - b['y']
            else: # clyde
                dist = math.hypot(g['x'] - self.px, g['y'] - self.py)
                tx, ty = (self.px, self.py) if dist > 8 else (1, 20)

            valid_dirs = []
            for d in DIRS.values():
                nx = g['x'] + d[0]
                ny = g['y'] + d[1]
                if not self.is_wall(nx, ny):
                    valid_dirs.append(d)

            if valid_dirs:
                # Pick direction closest to target
                valid_dirs.sort(key=lambda d: math.hypot(g['x'] + d[0] - tx, g['y'] + d[1] - ty))
                best = valid_dirs[0]
                g['x'] += best[0]
                g['y'] += best[1]
                g['dir'] = best

            # Collision check
            if g['x'] == self.px and g['y'] == self.py:
                if g['mode'] == 'frightened':
                    self.score += 200
                    g['x'] = 9
                    g['y'] = 9
                    g['mode'] = 'chase'
                else:
                    self.lives -= 1
                    if self.lives <= 0:
                        self.game_over = True
                    else:
                        self.px, self.py = 9, 15

    def render(self):
        lines = ["\033[H\033[J"]
        lines.append("🍒 MAZE CHASER (1980) CLI 🍒")
        lines.append(f"Score: {self.score} | Lives: {'💛 ' * self.lives} | Pellets: {self.pellets_left}")
        for r in range(ROWS):
            row_str = ""
            for c in range(COLS):
                if c == self.px and r == self.py:
                    row_str += f"{COLORS['PLAYER']}C{COLORS['RESET']}"
                elif any(g['x'] == c and g['y'] == r for g in self.ghosts.values()):
                    g = next(g for g in self.ghosts.values() if g['x'] == c and g['y'] == r)
                    col = COLORS['FRIGHT'] if g['mode'] == 'frightened' else COLORS[g['color']]
                    char = 'G' if g['mode'] == 'frightened' else g['name'][0]
                    row_str += f"{col}{char}{COLORS['RESET']}"
                else:
                    tile = self.grid[r][c]
                    if tile == '#':
                        row_str += f"{COLORS['WALL']}#{COLORS['RESET']}"
                    elif tile == '.':
                        row_str += f"{COLORS['PELLET']}.{COLORS['RESET']}"
                    elif tile == '*':
                        row_str += f"{COLORS['ENERGY']}*{COLORS['RESET']}"
                    else:
                        row_str += " "
            lines.append(row_str)
        lines.append("Controls: [W] Up [S] Down [A] Left [D] Right [Q] Quit")
        print("\n".join(lines))

if __name__ == '__main__':
    game = TerminalMazeGame()
    game.render()
    print("Maze CLI ready. (Run interactively with input keys)")
