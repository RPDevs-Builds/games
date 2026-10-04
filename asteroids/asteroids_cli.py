#!/usr/bin/env python3
"""
Asteroids Terminal CLI Edition - 1979 Atari Classic
Zero-dependency 2D vector space shooter with 360-degree Newtonian physics,
asteroid splitting hierarchy, alien saucers, and ASCII canvas rendering.
"""

import sys
import math
import random
import time

WIDTH = 60
HEIGHT = 24

# ANSI Color codes
CYAN = "\033[96m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
RED = "\033[91m"
MAGENTA = "\033[95m"
WHITE = "\033[97m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


class Ship:
    def __init__(self, x=WIDTH / 2.0, y=HEIGHT / 2.0):
        self.x = float(x)
        self.y = float(y)
        self.vx = 0.0
        self.vy = 0.0
        self.angle = -math.pi / 2.0  # Facing up
        self.rot_speed = 0.25
        self.thrust_power = 0.35
        self.friction = 0.96
        self.max_speed = 3.0
        self.alive = True
        self.invulnerable = 20

    def rotate(self, direction):
        self.angle += direction * self.rot_speed

    def thrust(self):
        self.vx += math.cos(self.angle) * self.thrust_power
        self.vy += math.sin(self.angle) * self.thrust_power
        speed = math.hypot(self.vx, self.vy)
        if speed > self.max_speed:
            self.vx = (self.vx / speed) * self.max_speed
            self.vy = (self.vy / speed) * self.max_speed

    def update(self):
        self.vx *= self.friction
        self.vy *= self.friction
        self.x += self.vx
        self.y += self.vy

        # Screen wrap
        if self.x < 0:
            self.x += WIDTH
        elif self.x >= WIDTH:
            self.x -= WIDTH
        if self.y < 0:
            self.y += HEIGHT
        elif self.y >= HEIGHT:
            self.y -= HEIGHT

        if self.invulnerable > 0:
            self.invulnerable -= 1


class Laser:
    def __init__(self, x, y, angle, parent_vx=0.0, parent_vy=0.0):
        speed = 2.0
        self.x = float(x)
        self.y = float(y)
        self.vx = math.cos(angle) * speed + parent_vx * 0.2
        self.vy = math.sin(angle) * speed + parent_vy * 0.2
        self.life = 25

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.x < 0:
            self.x += WIDTH
        elif self.x >= WIDTH:
            self.x -= WIDTH
        if self.y < 0:
            self.y += HEIGHT
        elif self.y >= HEIGHT:
            self.y -= HEIGHT
        self.life -= 1


class Asteroid:
    def __init__(self, size='large', x=None, y=None, vx=None, vy=None):
        self.size = size  # 'large', 'medium', 'small'
        if size == 'large':
            self.radius = 3.5
            self.points = 20
            self.char = 'O'
            speed = random.uniform(0.3, 0.7)
        elif size == 'medium':
            self.radius = 2.2
            self.points = 50
            self.char = 'o'
            speed = random.uniform(0.6, 1.1)
        else:
            self.radius = 1.2
            self.points = 100
            self.char = '.'
            speed = random.uniform(0.9, 1.5)

        self.x = float(x) if x is not None else float(random.randint(0, WIDTH - 1))
        self.y = float(y) if y is not None else float(random.randint(0, HEIGHT - 1))

        if vx is not None and vy is not None:
            self.vx = float(vx)
            self.vy = float(vy)
        else:
            angle = random.uniform(0, 2 * math.pi)
            self.vx = math.cos(angle) * speed
            self.vy = math.sin(angle) * speed

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.x < 0:
            self.x += WIDTH
        elif self.x >= WIDTH:
            self.x -= WIDTH
        if self.y < 0:
            self.y += HEIGHT
        elif self.y >= HEIGHT:
            self.y -= HEIGHT


class Saucer:
    def __init__(self, is_small=False):
        self.is_small = is_small
        self.radius = 1.5 if is_small else 2.5
        self.points = 1000 if is_small else 200
        self.char = 'V' if is_small else 'U'
        self.x = 0.0 if random.random() > 0.5 else float(WIDTH - 1)
        self.y = float(random.randint(3, HEIGHT - 4))
        speed = 1.0 if is_small else 0.6
        self.vx = speed if self.x == 0.0 else -speed
        self.vy = random.uniform(-0.3, 0.3)
        self.shoot_timer = 15

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.y < 2:
            self.vy = abs(self.vy)
        elif self.y >= HEIGHT - 2:
            self.vy = -abs(self.vy)


class AsteroidsCLI:
    def __init__(self, num_asteroids=4):
        self.width = WIDTH
        self.height = HEIGHT
        self.score = 0
        self.lives = 3
        self.wave = 1
        self.game_over = False
        self.next_life_score = 10000

        self.ship = Ship()
        self.lasers = []
        self.asteroids = []
        self.saucer = None
        self.saucer_lasers = []

        self.stats = {
            'rocks_destroyed': 0,
            'saucers_destroyed': 0,
            'shots_fired': 0,
            'shots_hit': 0,
            'hyperspace_jumps': 0
        }

        self.start_wave(self.wave, num_asteroids)

    def start_wave(self, wave_num, count=None):
        self.wave = wave_num
        self.asteroids = []
        self.saucer = None
        self.saucer_lasers = []

        if count is None:
            count = min(4 + (wave_num - 1) * 2, 10)

        for _ in range(count):
            # Safe distance from ship
            ax = random.uniform(0, WIDTH)
            ay = random.uniform(0, HEIGHT)
            while math.hypot(ax - self.ship.x, ay - self.ship.y) < 12.0:
                ax = random.uniform(0, WIDTH)
                ay = random.uniform(0, HEIGHT)
            self.asteroids.append(Asteroid('large', x=ax, y=ay))

    def fire_laser(self):
        if not self.ship.alive or len(self.lasers) >= 5:
            return False
        lx = self.ship.x + math.cos(self.ship.angle) * 1.5
        ly = self.ship.y + math.sin(self.ship.angle) * 1.5
        self.lasers.append(Laser(lx, ly, self.ship.angle, self.ship.vx, self.ship.vy))
        self.stats['shots_fired'] += 1
        return True

    def hyperspace(self):
        if not self.ship.alive:
            return False
        self.stats['hyperspace_jumps'] += 1
        if random.random() < 0.15:
            self.destroy_ship()
            return False
        self.ship.x = random.uniform(5, WIDTH - 5)
        self.ship.y = random.uniform(3, HEIGHT - 3)
        self.ship.vx = 0.0
        self.ship.vy = 0.0
        self.ship.invulnerable = 15
        return True

    def destroy_ship(self):
        self.ship.alive = False
        self.lives -= 1
        if self.lives <= 0:
            self.game_over = True
        else:
            # Respawn
            self.ship = Ship()

    def split_asteroid(self, index):
        if index < 0 or index >= len(self.asteroids):
            return
        ast = self.asteroids.pop(index)
        self.stats['rocks_destroyed'] += 1
        self.add_score(ast.points)

        if ast.size == 'large':
            for _ in range(2):
                ang = random.uniform(0, 2 * math.pi)
                spd = random.uniform(0.7, 1.2)
                vx = math.cos(ang) * spd + ast.vx * 0.3
                vy = math.sin(ang) * spd + ast.vy * 0.3
                self.asteroids.append(Asteroid('medium', x=ast.x, y=ast.y, vx=vx, vy=vy))
        elif ast.size == 'medium':
            for _ in range(2):
                ang = random.uniform(0, 2 * math.pi)
                spd = random.uniform(1.0, 1.6)
                vx = math.cos(ang) * spd + ast.vx * 0.3
                vy = math.sin(ang) * spd + ast.vy * 0.3
                self.asteroids.append(Asteroid('small', x=ast.x, y=ast.y, vx=vx, vy=vy))

    def add_score(self, pts):
        self.score += pts
        if self.score >= self.next_life_score:
            self.lives += 1
            self.next_life_score += 10000

    def spawn_saucer(self, is_small=False):
        self.saucer = Saucer(is_small)

    def step(self, rotate=0, thrust=False, fire=False, hyper=False):
        if self.game_over:
            return

        # 1. Ship input
        if self.ship.alive:
            if rotate != 0:
                self.ship.rotate(rotate)
            if thrust:
                self.ship.thrust()
            if fire:
                self.fire_laser()
            if hyper:
                self.hyperspace()

            self.ship.update()

        # 2. Lasers
        for l in self.lasers[:]:
            l.update()
            if l.life <= 0:
                self.lasers.remove(l)

        # 3. Asteroids
        for a in self.asteroids:
            a.update()

        # 4. Saucer
        if self.saucer:
            self.saucer.update()
            self.saucer.shoot_timer -= 1
            if self.saucer.shoot_timer <= 0:
                # Saucer fires
                if self.saucer.is_small and self.ship.alive:
                    dx = self.ship.x - self.saucer.x
                    dy = self.ship.y - self.saucer.y
                    ang = math.atan2(dy, dx) + random.uniform(-0.25, 0.25)
                else:
                    ang = random.uniform(0, 2 * math.pi)
                self.saucer_lasers.append(Laser(self.saucer.x, self.saucer.y, ang))
                self.saucer.shoot_timer = 20

            # Saucer bounds
            if self.saucer.x < -2 or self.saucer.x > WIDTH + 2:
                self.saucer = None

        for sl in self.saucer_lasers[:]:
            sl.update()
            if sl.life <= 0:
                self.saucer_lasers.remove(sl)

        # 5. Collisions
        self.check_collisions()

        # 6. Wave check
        if len(self.asteroids) == 0 and self.saucer is None and not self.game_over:
            self.start_wave(self.wave + 1)

    def check_collisions(self):
        # A. Lasers vs Asteroids
        for l in self.lasers[:]:
            for i, a in enumerate(self.asteroids[:]):
                dist = math.hypot(l.x - a.x, l.y - a.y)
                if dist <= a.radius:
                    if l in self.lasers:
                        self.lasers.remove(l)
                    self.stats['shots_hit'] += 1
                    self.split_asteroid(i)
                    break

        # B. Lasers vs Saucer
        if self.saucer:
            for l in self.lasers[:]:
                dist = math.hypot(l.x - self.saucer.x, l.y - self.saucer.y)
                if dist <= self.saucer.radius:
                    if l in self.lasers:
                        self.lasers.remove(l)
                    self.stats['shots_hit'] += 1
                    self.stats['saucers_destroyed'] += 1
                    self.add_score(self.saucer.points)
                    self.saucer = None
                    break

        # C. Saucer Lasers vs Ship
        if self.ship.alive and self.ship.invulnerable <= 0:
            for sl in self.saucer_lasers[:]:
                dist = math.hypot(sl.x - self.ship.x, sl.y - self.ship.y)
                if dist <= 1.5:
                    self.saucer_lasers.remove(sl)
                    self.destroy_ship()
                    break

        # D. Ship vs Asteroids
        if self.ship.alive and self.ship.invulnerable <= 0:
            for a in self.asteroids:
                dist = math.hypot(self.ship.x - a.x, self.ship.y - a.y)
                if dist <= a.radius + 1.0:
                    self.destroy_ship()
                    break

        # E. Ship vs Saucer
        if self.ship.alive and self.ship.invulnerable <= 0 and self.saucer:
            dist = math.hypot(self.ship.x - self.saucer.x, self.ship.y - self.saucer.y)
            if dist <= self.saucer.radius + 1.0:
                self.destroy_ship()
                self.saucer = None

    def render(self):
        grid = [[' ' for _ in range(self.width)] for _ in range(self.height)]

        # Render Asteroids
        for a in self.asteroids:
            ix, iy = int(round(a.x)) % self.width, int(round(a.y)) % self.height
            grid[iy][ix] = a.char

        # Render Saucer
        if self.saucer:
            ix, iy = int(round(self.saucer.x)) % self.width, int(round(self.saucer.y)) % self.height
            grid[iy][ix] = self.saucer.char

        # Render Lasers
        for l in self.lasers:
            ix, iy = int(round(l.x)) % self.width, int(round(l.y)) % self.height
            grid[iy][ix] = '*'

        for sl in self.saucer_lasers:
            ix, iy = int(round(sl.x)) % self.width, int(round(sl.y)) % self.height
            grid[iy][ix] = '+'

        # Render Ship
        if self.ship.alive:
            ix, iy = int(round(self.ship.x)) % self.width, int(round(self.ship.y)) % self.height
            # Choose ship direction glyph
            ang = (self.ship.angle % (2 * math.pi))
            if 7 * math.pi / 4 <= ang or ang < math.pi / 4:
                char = '>'
            elif math.pi / 4 <= ang < 3 * math.pi / 4:
                char = 'v'
            elif 3 * math.pi / 4 <= ang < 5 * math.pi / 4:
                char = '<'
            else:
                char = '^'
            grid[iy][ix] = char

        # Build output
        header = f"{CYAN}{BOLD}🚀 ASTEROIDS (1979){RESET} | SCORE: {GREEN}{self.score}{RESET} | LIVES: {RED}{'▲ ' * self.lives}{RESET}| WAVE: {YELLOW}{self.wave}{RESET}"
        border_top = f"{DIM}+{'-' * self.width}+{RESET}"
        lines = [header, border_top]

        for row in grid:
            lines.append(f"{DIM}|{RESET}{''.join(row)}{DIM}|{RESET}")
        lines.append(border_top)

        if self.game_over:
            lines.append(f"{RED}{BOLD}*** GAME OVER *** Final Score: {self.score}{RESET}")

        return "\n".join(lines)


def main():
    game = AsteroidsCLI()
    print("Welcome to Asteroids (1979) CLI Edition!")
    print("Simulating 15 frames of vector space flight...")
    for f in range(15):
        # Steer, thrust occasionally, fire
        game.step(rotate=1 if f % 3 == 0 else 0, thrust=(f < 6), fire=(f % 4 == 0))
        print(f"\n--- Frame {f + 1} ---")
        print(game.render())
        time.sleep(0.05)


if __name__ == '__main__':
    main()
