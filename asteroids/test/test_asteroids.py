#!/usr/bin/env python3
"""
Unit tests for Asteroids (1979) engine and mechanics.
"""

import unittest
import math
import sys
import os

# Add parent directory to path to import asteroids_cli
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from asteroids_cli import AsteroidsCLI, Ship, Laser, Asteroid, Saucer, WIDTH, HEIGHT


class TestAsteroids(unittest.TestCase):
    def setUp(self):
        self.game = AsteroidsCLI(num_asteroids=4)

    def test_ship_initialization_and_rotation(self):
        ship = self.game.ship
        self.assertTrue(ship.alive)
        self.assertEqual(ship.x, WIDTH / 2.0)
        self.assertEqual(ship.y, HEIGHT / 2.0)
        self.assertAlmostEqual(ship.angle, -math.pi / 2.0)

        initial_angle = ship.angle
        ship.rotate(1)
        self.assertGreater(ship.angle, initial_angle)

        ship.rotate(-2)
        self.assertLess(ship.angle, initial_angle)

    def test_ship_thrust_acceleration_and_friction(self):
        ship = self.game.ship
        self.assertEqual(ship.vx, 0.0)
        self.assertEqual(ship.vy, 0.0)

        # Facing up: cos(-pi/2) ~ 0, sin(-pi/2) = -1
        ship.thrust()
        self.assertLess(ship.vy, 0.0)
        initial_vy = ship.vy

        # Update should apply friction
        ship.update()
        self.assertGreater(ship.vy, initial_vy)  # Less negative, i.e., slowing down
        self.assertLess(ship.y, HEIGHT / 2.0)

    def test_screen_wraparound(self):
        ship = self.game.ship
        ship.x = -1.0
        ship.update()
        self.assertGreaterEqual(ship.x, 0)
        self.assertLess(ship.x, WIDTH)

        ship.y = HEIGHT + 5.0
        ship.update()
        self.assertGreaterEqual(ship.y, 0)
        self.assertLess(ship.y, HEIGHT)

    def test_laser_firing_and_decay(self):
        self.assertEqual(len(self.game.lasers), 0)
        fired = self.game.fire_laser()
        self.assertTrue(fired)
        self.assertEqual(len(self.game.lasers), 1)

        laser = self.game.lasers[0]
        initial_life = laser.life
        self.game.step()
        self.assertLess(laser.life, initial_life)

        # Max 5 active lasers
        for _ in range(10):
            self.game.fire_laser()
        self.assertLessEqual(len(self.game.lasers), 5)

    def test_asteroid_splitting_hierarchy(self):
        self.game.asteroids = [Asteroid('large', x=10.0, y=10.0, vx=0.0, vy=0.0)]
        self.assertEqual(len(self.game.asteroids), 1)

        # Split large -> 2 mediums + 20 points
        self.game.split_asteroid(0)
        self.assertEqual(len(self.game.asteroids), 2)
        self.assertEqual(self.game.asteroids[0].size, 'medium')
        self.assertEqual(self.game.asteroids[1].size, 'medium')
        self.assertEqual(self.game.score, 20)

        # Split medium -> 2 smalls + 50 points
        self.game.split_asteroid(0)
        self.assertEqual(len(self.game.asteroids), 3)  # 1 medium + 2 smalls
        self.assertEqual(self.game.score, 70)

        # Split remaining medium -> 2 smalls + 50 points
        self.game.split_asteroid(0)
        self.assertEqual(len(self.game.asteroids), 4)  # 4 smalls
        self.assertEqual(self.game.score, 120)

        # Split small -> 0 + 100 points
        self.game.split_asteroid(0)
        self.assertEqual(len(self.game.asteroids), 3)
        self.assertEqual(self.game.score, 220)

    def test_laser_asteroid_collision(self):
        # Place large asteroid directly in front of laser
        ast = Asteroid('large', x=30.0, y=30.0, vx=0.0, vy=0.0)
        self.game.asteroids = [ast]
        laser = Laser(x=30.0, y=30.0, angle=0.0)
        self.game.lasers = [laser]

        self.game.check_collisions()
        # Laser removed on hit
        self.assertEqual(len(self.game.lasers), 0)
        # Asteroid split into 2 mediums
        self.assertEqual(len(self.game.asteroids), 2)
        self.assertEqual(self.game.score, 20)

    def test_saucer_spawning_and_destruction(self):
        self.game.spawn_saucer(is_small=False)
        self.assertIsNotNone(self.game.saucer)
        self.assertEqual(self.game.saucer.points, 200)

        # Laser collides with saucer
        laser = Laser(x=self.game.saucer.x, y=self.game.saucer.y, angle=0.0)
        self.game.lasers = [laser]
        self.game.check_collisions()

        self.assertIsNone(self.game.saucer)
        self.assertEqual(self.game.score, 200)

        # Small saucer
        self.game.spawn_saucer(is_small=True)
        self.assertEqual(self.game.saucer.points, 1000)

    def test_hyperspace_and_extra_life(self):
        # Extra life at 10,000 points
        initial_lives = self.game.lives
        self.game.add_score(10500)
        self.assertEqual(self.game.lives, initial_lives + 1)

        # Hyperspace position change
        old_x, old_y = self.game.ship.x, self.game.ship.y
        # Seed random to ensure safe warp
        import random
        random.seed(42)
        warped = self.game.hyperspace()
        if warped:
            self.assertNotEqual((self.game.ship.x, self.game.ship.y), (old_x, old_y))
            self.assertEqual(self.game.stats['hyperspace_jumps'], 1)


if __name__ == '__main__':
    unittest.main()
