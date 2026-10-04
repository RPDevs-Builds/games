#!/usr/bin/env python3
"""
Frogger Terminal CLI Edition - 1981 Konami Classic
Zero-dependency 2D arcade frog hop simulator with highway traffic,
river log navigation, diving turtles, home docks, and ANSI graphics.
"""

import sys
import os
import time
import random
import select

WIDTH = 33
HEIGHT = 14

GREEN = "\033[92m"
CYAN = "\033[96m"
BLUE = "\033[94m"
RED = "\033[91m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
WHITE = "\033[97m"
BOLD = "\033[1m"
RESET = "\033[0m"


class FroggerCLI:
    def __init__(self):
        self.reset()

    def reset(self):
        self.score = 0
        self.lives = 3
        self.level = 1
        self.game_over = False
        self.round_cleared = False

        self.homes = [False] * 5  # 5 home bays
        self.init_lanes()
        self.spawn_frog()

    def init_lanes(self):
        # River objects: [(x, width, type)]
        self.river_lanes = [
            {'speed': 0.8, 'objects': [[2, 6, 'log'], [14, 6, 'log'], [26, 6, 'log']]},      # Row 1
            {'speed': -0.7, 'objects': [[4, 5, 'turtle'], [16, 5, 'turtle'], [27, 5, 'turtle']], 'submerged': False, 'sub_timer': 0},  # Row 2
            {'speed': 0.6, 'objects': [[1, 10, 'log'], [18, 10, 'log']]},                     # Row 3
            {'speed': 0.9, 'objects': [[3, 5, 'log'], [15, 5, 'log'], [26, 5, 'log']]},       # Row 4
            {'speed': -0.6, 'objects': [[2, 4, 'turtle'], [12, 4, 'turtle'], [22, 4, 'turtle']], 'submerged': False, 'sub_timer': 0}   # Row 5
        ]

        # Highway vehicles: [(x, width, char, color)]
        self.road_lanes = [
            {'speed': -1.2, 'objects': [[6, 3, '<#>', RED], [18, 3, '<#>', RED], [28, 3, '<#>', RED]]},      # Row 7 (Racecars)
            {'speed': 0.5, 'objects': [[3, 3, '[=]', YELLOW], [16, 3, '[=]', YELLOW], [26, 3, '[=]', YELLOW]]},# Row 8 (Tractors)
            {'speed': -0.7, 'objects': [[4, 3, '(#)', MAGENTA], [16, 3, '(#)', MAGENTA], [27, 3, '(#)', MAGENTA]]}, # Row 9 (Sedans)
            {'speed': 0.8, 'objects': [[5, 4, '[==]', CYAN], [20, 4, '[==]', CYAN]]},                         # Row 10 (Vans)
            {'speed': -0.6, 'objects': [[2, 6, '[====]', YELLOW], [20, 6, '[====]', YELLOW]]}                 # Row 11 (Trucks)
        ]

    def spawn_frog(self):
        self.frog_x = 16.0
        self.frog_y = 12
        self.highest_y = 12
        self.time_left = 30
        self.time_counter = 0
        self.dead_pause = 0

    def step_frog(self, direction):
        if self.game_over or self.dead_pause > 0:
            return

        prev_y = self.frog_y
        if direction == 'up' and self.frog_y > 0:
            self.frog_y -= 1
        elif direction == 'down' and self.frog_y < 12:
            self.frog_y += 1
        elif direction == 'left' and self.frog_x >= 2:
            self.frog_x -= 3
        elif direction == 'right' and self.frog_x <= WIDTH - 5:
            self.frog_x += 3

        # Forward score (+10 pts per new row)
        if self.frog_y < self.highest_y and self.frog_y >= 1:
            self.highest_y = self.frog_y
            self.score += 10

        self.check_landing()

    def update(self):
        if self.game_over:
            return

        if self.dead_pause > 0:
            self.dead_pause -= 1
            if self.dead_pause == 0:
                if self.lives <= 0:
                    self.game_over = True
                else:
                    self.spawn_frog()
            return

        # Timer countdown
        self.time_counter += 1
        if self.time_counter >= 15:  # ~1 sec at 15 ticks/sec
            self.time_counter = 0
            self.time_left -= 1
            if self.time_left <= 0:
                self.kill_frog('timeout')
                return

        # Move river lanes
        for lane in self.river_lanes:
            if 'submerged' in lane:
                lane['sub_timer'] = (lane['sub_timer'] + 1) % 40
                lane['submerged'] = lane['sub_timer'] >= 28

            for obj in lane['objects']:
                obj[0] += lane['speed']
                if lane['speed'] > 0 and obj[0] > WIDTH:
                    obj[0] = -obj[1]
                elif lane['speed'] < 0 and obj[0] + obj[1] < 0:
                    obj[0] = WIDTH

        # Move road lanes
        for lane in self.road_lanes:
            for obj in lane['objects']:
                obj[0] += lane['speed']
                if lane['speed'] > 0 and obj[0] > WIDTH:
                    obj[0] = -obj[1]
                elif lane['speed'] < 0 and obj[0] + obj[1] < 0:
                    obj[0] = WIDTH

        # If riding on river lane, move frog with current
        if 1 <= self.frog_y <= 5:
            lane = self.river_lanes[self.frog_y - 1]
            riding = False
            for obj in lane['objects']:
                ox, ow, otype = obj[0], obj[1], obj[2]
                if ox <= self.frog_x <= ox + ow - 1:
                    if otype == 'turtle' and lane.get('submerged', False):
                        # Drowned on submerged turtle
                        self.kill_frog('drowned')
                        return
                    riding = True
                    self.frog_x += lane['speed']
                    break

            if not riding:
                # Stepped into river water
                self.kill_frog('drowned')
                return

            # Carried off-screen
            if self.frog_x < 0 or self.frog_x >= WIDTH:
                self.kill_frog('drowned')
                return

        # Check vehicle collisions if on road
        if 7 <= self.frog_y <= 11:
            lane = self.road_lanes[self.frog_y - 7]
            for obj in lane['objects']:
                ox, ow = obj[0], obj[1]
                if int(ox) <= int(self.frog_x) <= int(ox) + ow - 1:
                    self.kill_frog('splat')
                    return

    def check_landing(self):
        # Goal bays at row 0
        if self.frog_y == 0:
            bay_indices = [2, 8, 15, 22, 29]
            fx = int(round(self.frog_x))
            matched_bay = None
            for idx, bx in enumerate(bay_indices):
                if abs(fx - bx) <= 1:
                    matched_bay = idx
                    break

            if matched_bay is not None and not self.homes[matched_bay]:
                self.homes[matched_bay] = True
                self.score += 50 + self.time_left * 10
                if all(self.homes):
                    self.score += 1000
                    self.round_cleared = True
                    self.level += 1
                    self.homes = [False] * 5
                    self.init_lanes()
                self.spawn_frog()
            else:
                # Jumped into bush or already occupied bay
                self.kill_frog('splat')

    def kill_frog(self, reason):
        self.lives -= 1
        self.dead_pause = 8
        if self.lives <= 0:
            self.game_over = True

    def render(self):
        grid = [[' ' for _ in range(WIDTH)] for _ in range(HEIGHT)]

        # Row 0: Goal docks
        dock_str = " ## [ ] ## [ ] ## [ ] ## [ ] ## [ ] ##"
        for x, ch in enumerate(dock_str[:WIDTH]):
            grid[0][x] = f"{GREEN}{ch}{RESET}"
        # Fill completed home bays
        bay_positions = [4, 11, 18, 25, 32]
        for idx, bx in enumerate(bay_positions):
            if idx < 5 and self.homes[idx] and bx < WIDTH:
                grid[0][bx] = f"{GREEN}🐸{RESET}"

        # Rows 1 to 5: River
        for r in range(1, 6):
            lane = self.river_lanes[r - 1]
            sub = lane.get('submerged', False)
            for x in range(WIDTH):
                grid[r][x] = f"{BLUE}~{RESET}"
            for obj in lane['objects']:
                ox = int(obj[0])
                ow = obj[1]
                otype = obj[2]
                for i in range(ow):
                    px = ox + i
                    if 0 <= px < WIDTH:
                        if otype == 'log':
                            grid[r][px] = f"{YELLOW}={RESET}"
                        elif otype == 'turtle':
                            grid[r][px] = f"{BLUE}o{RESET}" if sub else f"{CYAN}O{RESET}"

        # Row 6: Median grass
        for x in range(WIDTH):
            grid[6][x] = f"{MAGENTA}={RESET}"

        # Rows 7 to 11: Highway
        for r in range(7, 12):
            lane = self.road_lanes[r - 7]
            for x in range(WIDTH):
                grid[r][x] = f"{WHITE}.{RESET}"
            for obj in lane['objects']:
                ox = int(obj[0])
                c_str = obj[2]
                color = obj[3]
                for i, ch in enumerate(c_str):
                    px = ox + i
                    if 0 <= px < WIDTH:
                        grid[r][px] = f"{color}{ch}{RESET}"

        # Row 12: Sidewalk safe spawn
        for x in range(WIDTH):
            grid[12][x] = f"{MAGENTA}={RESET}"

        # Draw Frog
        fx = int(round(self.frog_x))
        fy = self.frog_y
        if 0 <= fx < WIDTH and 0 <= fy < HEIGHT:
            if self.dead_pause > 0:
                grid[fy][fx] = f"{RED}X{RESET}"
            else:
                grid[fy][fx] = f"{GREEN}{BOLD}🐸{RESET}"

        # Row 13: HUD / Status
        hud = f"SCORE:{self.score:04d} LVL:{self.level} LIVES:{'🐸'*max(0, self.lives)} TIME:{self.time_left:02d}s"
        sys.stdout.write("\033[H")
        for row in grid:
            sys.stdout.write("".join(row) + "\n")
        sys.stdout.write(f"{YELLOW}{hud[:WIDTH]}{RESET}\n")
        sys.stdout.flush()


def run_cli():
    import tty
    import termios

    game = FroggerCLI()
    old_settings = None
    try:
        if sys.stdin.isatty():
            old_settings = termios.tcgetattr(sys.stdin)
            tty.setcbreak(sys.stdin.fileno())

        sys.stdout.write("\033[2J\033[?25l")  # Clear screen, hide cursor

        while not game.game_over:
            action = None
            if sys.stdin.isatty() and select.select([sys.stdin], [], [], 0)[0]:
                ch = sys.stdin.read(1)
                if ch in ('w', 'W', 'k', 'K', '\x1b'):
                    action = 'up'
                elif ch in ('s', 'S', 'j', 'J'):
                    action = 'down'
                elif ch in ('a', 'A', 'h', 'H'):
                    action = 'left'
                elif ch in ('d', 'D', 'l', 'L'):
                    action = 'right'
                elif ch in ('q', 'Q'):
                    break

            if action:
                game.step_frog(action)
            game.update()
            game.render()
            time.sleep(0.08)

        if game.game_over:
            time.sleep(1.5)

    finally:
        sys.stdout.write("\033[?25h\n")
        if old_settings:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)


if __name__ == '__main__':
    run_cli()
