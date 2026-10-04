#!/usr/bin/env python3
"""
Space Invaders Terminal CLI Edition - 1978 Taito Arcade Classic
Zero-dependency 2D arcade shooter with marching alien matrix, accelerating tempo,
destructible bunkers, mystery flying saucer, and ANSI graphics.
"""

import sys
import os
import time
import random
import select

WIDTH = 48
HEIGHT = 22

# ANSI Color codes
GREEN = "\033[92m"
CYAN = "\033[96m"
RED = "\033[91m"
YELLOW = "\033[93m"
WHITE = "\033[97m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


class SpaceInvadersCLI:
    def __init__(self):
        self.reset()

    def reset(self):
        self.score = 0
        self.lives = 3
        self.wave = 1
        self.game_over = False
        self.victory = False

        self.player_x = WIDTH // 2 - 1
        self.player_y = HEIGHT - 2
        self.player_width = 3
        self.player_dead_timer = 0

        self.player_laser = None  # (x, y) - Only 1 active
        self.alien_bombs = []     # [(x, y)]

        self.ufo = None           # {'x': float, 'dir': int, 'points': int}
        self.ufo_timer = random.randint(150, 300)

        self.init_bunkers()
        self.init_wave(self.wave)

    def init_bunkers(self):
        self.bunkers = []
        bunker_count = 4
        bw = 6
        spacing = (WIDTH - (bunker_count * bw)) // (bunker_count + 1)
        by = HEIGHT - 5

        for i in range(bunker_count):
            bx = spacing + i * (bw + spacing)
            # 2 rows of blocks
            # Row 0: [######]
            # Row 1: [##  ##]
            blocks = set()
            for r in range(2):
                for c in range(bw):
                    if r == 1 and (c == 2 or c == 3):
                        continue
                    blocks.add((bx + c, by + r))
            self.bunkers.append({
                'x': bx,
                'y': by,
                'width': bw,
                'height': 2,
                'blocks': blocks
            })

    def init_wave(self, wave):
        self.wave = wave
        self.aliens = []
        cols = 10
        rows = 5
        start_x = 4
        start_y = 3

        for r in range(rows):
            for c in range(cols):
                atype = 'squid' if r == 0 else ('crab' if r in (1, 2) else 'octopus')
                pts = 30 if r == 0 else (20 if r in (1, 2) else 10)
                char = '{O}' if r == 0 else ('|M|' if r in (1, 2) else '<W>')
                self.aliens.append({
                    'row': r,
                    'col': c,
                    'x': start_x + c * 4,
                    'y': start_y + r * 2,
                    'type': atype,
                    'points': pts,
                    'char': char,
                    'alive': True
                })

        self.alien_dir = 1
        self.alien_step_down = False
        self.step_timer = 0
        self.step_interval = self.calculate_step_interval()
        self.anim_frame = 0

    def get_alive_aliens(self):
        return [a for a in self.aliens if a['alive']]

    def calculate_step_interval(self):
        alive = len(self.get_alive_aliens())
        if alive <= 1:
            return 1
        if alive <= 5:
            return 2
        if alive <= 12:
            return 4
        if alive <= 25:
            return 7
        if alive <= 38:
            return 10
        return 14

    def update(self, action=None):
        if self.game_over:
            return

        if self.player_dead_timer > 0:
            self.player_dead_timer -= 1
            if self.player_dead_timer == 0:
                if self.lives <= 0:
                    self.game_over = True
                else:
                    self.player_x = WIDTH // 2 - 1
            return

        # Handle Action
        if action == 'left' and self.player_x > 2:
            self.player_x -= 1
        elif action == 'right' and self.player_x < WIDTH - self.player_width - 2:
            self.player_x += 1
        elif action == 'fire' and self.player_laser is None:
            self.player_laser = [self.player_x + 1, self.player_y - 1]

        # Update Player Laser
        if self.player_laser:
            self.player_laser[1] -= 1
            lx, ly = self.player_laser

            # Top of screen
            if ly <= 1:
                self.player_laser = None
            # Hit UFO
            elif self.ufo and int(self.ufo['x']) <= lx <= int(self.ufo['x']) + 4 and ly == 2:
                self.score += self.ufo['points']
                self.ufo = None
                self.ufo_timer = random.randint(150, 300)
                self.player_laser = None
            else:
                # Hit Bunker
                hit_bunker = False
                for bunker in self.bunkers:
                    if (lx, ly) in bunker['blocks']:
                        bunker['blocks'].remove((lx, ly))
                        hit_bunker = True
                        self.player_laser = None
                        break

                # Hit Alien
                if not hit_bunker:
                    for alien in self.get_alive_aliens():
                        if alien['x'] <= lx < alien['x'] + 3 and alien['y'] == ly:
                            alien['alive'] = False
                            self.score += alien['points']
                            self.player_laser = None
                            self.step_interval = self.calculate_step_interval()
                            if len(self.get_alive_aliens()) == 0:
                                self.init_wave(self.wave + 1)
                            break

        # Update Alien Fleet
        alive_aliens = self.get_alive_aliens()
        if alive_aliens:
            self.step_timer += 1
            if self.step_timer >= self.step_interval:
                self.step_timer = 0
                self.anim_frame = 1 - self.anim_frame

                if self.alien_step_down:
                    for a in alive_aliens:
                        a['y'] += 1
                    self.alien_dir *= -1
                    self.alien_step_down = False
                else:
                    hit_wall = False
                    for a in alive_aliens:
                        a['x'] += self.alien_dir
                        if self.alien_dir > 0 and a['x'] >= WIDTH - 5:
                            hit_wall = True
                        elif self.alien_dir < 0 and a['x'] <= 2:
                            hit_wall = True
                    if hit_wall:
                        self.alien_step_down = True

                # Crush bunkers if alien touches
                for a in alive_aliens:
                    for bunker in self.bunkers:
                        for ax in range(a['x'], a['x'] + 3):
                            if (ax, a['y']) in bunker['blocks']:
                                bunker['blocks'].remove((ax, a['y']))

                # Invasion touch-down check
                for a in alive_aliens:
                    if a['y'] >= self.player_y:
                        self.lives = 0
                        self.game_over = True
                        return

                # Random alien bomb drop
                if len(self.alien_bombs) < 3 and random.random() < 0.35:
                    cols_map = {}
                    for a in alive_aliens:
                        if a['col'] not in cols_map or a['y'] > cols_map[a['col']]['y']:
                            cols_map[a['col']] = a
                    shooter = random.choice(list(cols_map.values()))
                    self.alien_bombs.append([shooter['x'] + 1, shooter['y'] + 1])

        # Update Alien Bombs
        for bomb in list(self.alien_bombs):
            bomb[1] += 1
            bx, by = bomb
            if by >= HEIGHT - 1:
                self.alien_bombs.remove(bomb)
                continue

            # Check hit bunker
            hit_b = False
            for bunker in self.bunkers:
                if (bx, by) in bunker['blocks']:
                    bunker['blocks'].remove((bx, by))
                    self.alien_bombs.remove(bomb)
                    hit_b = True
                    break
            if hit_b:
                continue

            # Check hit player
            if by == self.player_y and self.player_x <= bx < self.player_x + self.player_width:
                self.alien_bombs.remove(bomb)
                self.lives -= 1
                self.player_dead_timer = 15
                if self.lives <= 0:
                    self.game_over = True
                break

        # Update UFO
        if self.ufo:
            self.ufo['x'] += self.ufo['dir'] * 0.5
            if (self.ufo['dir'] > 0 and self.ufo['x'] > WIDTH - 5) or (self.ufo['dir'] < 0 and self.ufo['x'] < 1):
                self.ufo = None
                self.ufo_timer = random.randint(150, 300)
        else:
            self.ufo_timer -= 1
            if self.ufo_timer <= 0:
                direction = random.choice([1, -1])
                start_x = 1 if direction > 0 else WIDTH - 6
                self.ufo = {
                    'x': float(start_x),
                    'dir': direction,
                    'points': random.choice([50, 100, 150, 200, 300])
                }

    def render(self):
        screen = [[' ' for _ in range(WIDTH)] for _ in range(HEIGHT)]

        # Header info
        header = f" SCORE: {self.score:05d}   WAVE: {self.wave}   LIVES: {'▲ ' * max(0, self.lives)}"
        for i, ch in enumerate(header[:WIDTH]):
            screen[0][i] = ch

        # Border
        for x in range(WIDTH):
            screen[1][x] = '─'
            screen[HEIGHT - 1][x] = '─'

        # UFO
        if self.ufo:
            ux = int(self.ufo['x'])
            ufo_str = "<UFO>"
            for i, ch in enumerate(ufo_str):
                if 0 <= ux + i < WIDTH:
                    screen[2][ux + i] = f"{RED}{BOLD}{ch}{RESET}"

        # Aliens
        for alien in self.get_alive_aliens():
            ax, ay = alien['x'], alien['y']
            color = WHITE if alien['type'] == 'squid' else (CYAN if alien['type'] == 'crab' else GREEN)
            char = alien['char']
            for i, ch in enumerate(char):
                if 0 <= ax + i < WIDTH and 0 <= ay < HEIGHT:
                    screen[ay][ax + i] = f"{color}{ch}{RESET}"

        # Bunkers
        for bunker in self.bunkers:
            for bx, by in bunker['blocks']:
                if 0 <= bx < WIDTH and 0 <= by < HEIGHT:
                    screen[by][bx] = f"{GREEN}#{RESET}"

        # Player Cannon
        if self.player_dead_timer % 2 == 0:
            cannon_str = "/█\\"
            for i, ch in enumerate(cannon_str):
                px = self.player_x + i
                if 0 <= px < WIDTH:
                    screen[self.player_y][px] = f"{GREEN}{BOLD}{ch}{RESET}"

        # Player Laser
        if self.player_laser:
            lx, ly = self.player_laser
            if 0 <= lx < WIDTH and 0 <= ly < HEIGHT:
                screen[ly][lx] = f"{CYAN}{BOLD}│{RESET}"

        # Alien Bombs
        for bx, by in self.alien_bombs:
            if 0 <= bx < WIDTH and 0 <= by < HEIGHT:
                screen[by][bx] = f"{YELLOW}!{RESET}"

        # Overlay if Game Over
        if self.game_over:
            msg = " G A M E   O V E R "
            mx = (WIDTH - len(msg)) // 2
            for i, ch in enumerate(msg):
                screen[HEIGHT // 2][mx + i] = f"{RED}{BOLD}{ch}{RESET}"

        # Print screen
        output = "\033[H" + "\n".join("".join(row) for row in screen)
        sys.stdout.write(output)
        sys.stdout.flush()


def run_cli():
    import tty
    import termios

    game = SpaceInvadersCLI()
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
                if ch in ('a', 'A', 'h', 'H'):
                    action = 'left'
                elif ch in ('d', 'D', 'l', 'L'):
                    action = 'right'
                elif ch in (' ', 'w', 'W', 'k', 'K'):
                    action = 'fire'
                elif ch in ('q', 'Q'):
                    break

            game.update(action)
            game.render()
            time.sleep(0.04)

        if game.game_over:
            time.sleep(1.5)

    finally:
        sys.stdout.write("\033[?25h\n")  # Restore cursor
        if old_settings:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)


if __name__ == '__main__':
    run_cli()
