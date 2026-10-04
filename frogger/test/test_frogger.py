#!/usr/bin/env python3
"""
Unit tests for Frogger (1981) arcade engine, mechanics, and simulation logic.
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from frogger_cli import FroggerCLI, WIDTH, HEIGHT


class TestFrogger(unittest.TestCase):
    def setUp(self):
        self.game = FroggerCLI()

    def test_initialization(self):
        self.assertEqual(self.game.lives, 3)
        self.assertEqual(self.game.score, 0)
        self.assertEqual(self.game.level, 1)
        self.assertFalse(self.game.game_over)
        self.assertEqual(len(self.game.homes), 5)
        self.assertFalse(any(self.game.homes))
        self.assertEqual(self.game.frog_y, 12)

    def test_hop_movement_and_boundaries(self):
        initial_y = self.game.frog_y
        self.game.step_frog('up')
        self.assertEqual(self.game.frog_y, initial_y - 1)

        # Bottom boundary check
        self.game.step_frog('down')
        self.assertEqual(self.game.frog_y, 12)
        self.game.step_frog('down')
        self.assertEqual(self.game.frog_y, 12)  # Should not exceed bottom

    def test_forward_progress_scoring(self):
        self.assertEqual(self.game.score, 0)
        # Hop up 1 row
        self.game.step_frog('up')
        self.assertEqual(self.game.score, 10)

        # Hop down and back up: should not score duplicate for row 11
        self.game.step_frog('down')
        self.assertEqual(self.game.score, 10)
        self.game.step_frog('up')
        self.assertEqual(self.game.score, 10)

        # Hop up into row 10 (new row)
        self.game.step_frog('up')
        self.assertEqual(self.game.score, 20)

    def test_highway_traffic_collision(self):
        initial_lives = self.game.lives
        # Row 11 is truck row: obj at [2, 6, '[====]']
        self.game.frog_y = 11
        self.game.frog_x = 4.0  # Directly inside truck at x=2..7

        self.game.update()
        self.assertEqual(self.game.lives, initial_lives - 1)
        self.assertGreater(self.game.dead_pause, 0)

    def test_river_log_riding(self):
        # Row 1 is log row: obj at [2, 6, 'log'] with speed 0.8
        self.game.frog_y = 1
        self.game.frog_x = 4.0
        initial_x = self.game.frog_x

        self.game.update()
        # Frog should be alive and carried with log velocity
        self.assertGreater(self.game.frog_x, initial_x)
        self.assertEqual(self.game.dead_pause, 0)
        self.assertEqual(self.game.lives, 3)

    def test_river_water_drowning(self):
        initial_lives = self.game.lives
        # Row 1 has logs at x=2..7, x=14..19, x=26..31
        # Place frog in open water at x=10
        self.game.frog_y = 1
        self.game.frog_x = 10.0

        self.game.update()
        self.assertEqual(self.game.lives, initial_lives - 1)
        self.assertGreater(self.game.dead_pause, 0)

    def test_turtle_diving_drowning(self):
        initial_lives = self.game.lives
        # Row 2 is turtle row
        lane = self.game.river_lanes[1]
        self.game.frog_y = 2
        self.game.frog_x = 5.0  # inside first turtle group

        # Set turtle timer into diving cycle
        lane['sub_timer'] = 29
        self.game.update()

        self.assertEqual(self.game.lives, initial_lives - 1)
        self.assertGreater(self.game.dead_pause, 0)

    def test_home_bay_docking(self):
        # Bay 2 is centered at x=15
        self.game.frog_y = 1
        self.game.frog_x = 15.0
        initial_score = self.game.score

        self.game.step_frog('up')  # lands at y=0, x=15
        self.assertTrue(self.game.homes[2])
        self.assertGreater(self.game.score, initial_score + 50)
        # Frog should respawn at start
        self.assertEqual(self.game.frog_y, 12)

    def test_bush_collision_at_row_zero(self):
        initial_lives = self.game.lives
        # Place frog between bays (e.g. at x=5, where bush barrier is)
        self.game.frog_y = 1
        self.game.frog_x = 5.0

        self.game.step_frog('up')
        self.assertEqual(self.game.lives, initial_lives - 1)
        self.assertGreater(self.game.dead_pause, 0)

    def test_round_clear(self):
        # Pre-fill 4 bays
        self.game.homes[0] = True
        self.game.homes[1] = True
        self.game.homes[2] = True
        self.game.homes[3] = True

        # Dock 5th bay at x=29
        self.game.frog_y = 1
        self.game.frog_x = 29.0
        initial_score = self.game.score

        self.game.step_frog('up')
        self.assertTrue(self.game.round_cleared)
        self.assertEqual(self.game.level, 2)
        # Round clear bonus 1000 pts
        self.assertGreaterEqual(self.game.score, initial_score + 1050)

    def test_timer_countdown_and_timeout(self):
        initial_lives = self.game.lives
        self.game.time_left = 1
        self.game.time_counter = 14

        self.game.update()  # reaches timeout
        self.assertEqual(self.game.lives, initial_lives - 1)


if __name__ == '__main__':
    unittest.main()
