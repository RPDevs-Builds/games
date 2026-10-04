#!/usr/bin/env python3
"""
RPDevs Terminal CLI Missile Command
ASCII radar grid defense with predictive flak detonations.
"""

import sys
import math
import random
import time


class MissileCommandCLI:
    def __init__(self):
        self.width = 40
        self.height = 20
        self.cities = [True, True, True, True]
        self.ammo = 15
        self.score = 0
        self.wave = 1
        self.missiles = []

    def spawn_missile(self):
        sx = random.randint(2, self.width - 3)
        tx = random.choice([6, 14, 24, 32])
        self.missiles.append({'x': float(sx), 'y': 0.0, 'tx': float(tx), 'ty': float(self.height - 2), 'speed': 0.45})

    def run_wave(self):
        print(f"\n--- WAVE {self.wave} BEGINS ---")
        self.ammo = 15
        missiles_to_spawn = 6 + (self.wave * 2)
        self.missiles = []

        while missiles_to_spawn > 0 or self.missiles:
            if missiles_to_spawn > 0 and random.random() < 0.4:
                self.spawn_missile()
                missiles_to_spawn -= 1

            self.print_screen()
            cmd = input(f"Aim flak (X Y, e.g. '12 8', or Enter to advance, 'q' to quit): ").strip()
            if cmd.lower() == 'q':
                return False

            if cmd:
                try:
                    parts = cmd.split()
                    if len(parts) == 2 and self.ammo > 0:
                        fx, fy = float(parts[0]), float(parts[1])
                        self.ammo -= 1
                        print(f"💥 Flak detonated at ({fx}, {fy})!")
                        # Destroy nearby missiles within radius 4
                        survived = []
                        for m in self.missiles:
                            dist = math.hypot(m['x'] - fx, m['y'] - fy)
                            if dist <= 4.0:
                                print(f"  ⭐ Intercepted warhead at ({int(m['x'])}, {int(m['y'])})! +50 pts")
                                self.score += 50
                            else:
                                survived.append(m)
                        self.missiles = survived
                except ValueError:
                    print("Invalid coordinates!")

            # Advance enemy missiles
            remaining_missiles = []
            for m in self.missiles:
                dx = m['tx'] - m['x']
                dy = m['ty'] - m['y']
                dist = math.hypot(dx, dy)
                if dist > 0:
                    m['x'] += (dx / dist) * m['speed']
                    m['y'] += (dy / dist) * m['speed']

                if m['y'] >= self.height - 2:
                    # Impact!
                    city_idx = None
                    if abs(m['x'] - 6) <= 3: city_idx = 0
                    elif abs(m['x'] - 14) <= 3: city_idx = 1
                    elif abs(m['x'] - 24) <= 3: city_idx = 2
                    elif abs(m['x'] - 32) <= 3: city_idx = 3

                    if city_idx is not None and self.cities[city_idx]:
                        self.cities[city_idx] = False
                        print(f"🔥 City {city_idx + 1} destroyed!")
                else:
                    remaining_missiles.append(m)

            self.missiles = remaining_missiles

            if not any(self.cities):
                print("\n☠️ All cities destroyed! Game Over!")
                return False

        # Wave conquered
        living_cities = sum(self.cities)
        bonus = living_cities * 100 + self.ammo * 10
        self.score += bonus
        print(f"\n🎉 Wave {self.wave} Complete! Bonus: +{bonus} pts")
        self.wave += 1
        return True

    def print_screen(self):
        grid = [[' ' for _ in range(self.width)] for _ in range(self.height)]

        # Draw missiles
        for m in self.missiles:
            mx, my = int(m['x']), int(m['y'])
            if 0 <= mx < self.width and 0 <= my < self.height:
                grid[my][mx] = 'v'

        # Draw ground
        for x in range(self.width):
            grid[self.height - 2][x] = '─'

        # Draw cities
        city_coords = [6, 14, 24, 32]
        for idx, cx in enumerate(city_coords):
            if self.cities[idx]:
                grid[self.height - 1][cx] = '🏢'
            else:
                grid[self.height - 1][cx] = '░░'

        print(f"\nScore: {self.score} | Wave: {self.wave} | Ammo: {self.ammo}")
        print("┌" + "─" * self.width + "┐")
        for row in grid:
            print("│" + "".join(row[:self.width]) + "│")
        print("└" + "─" * self.width + "┘")


def main():
    print("====================================")
    print("🚀 MISSILE COMMAND TERMINAL CLI 💥")
    print("====================================")
    cli = MissileCommandCLI()
    while cli.run_wave():
        pass
    print(f"\nFinal Score: {cli.score}")


if __name__ == '__main__':
    main()
