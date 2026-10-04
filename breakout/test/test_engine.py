#!/usr/bin/env python3
"""
Unit Test Suite for Breakout 1976 Game Engine
Verifies physics, paddle deflection, wall reflection, brick destruction, and win/loss states.
"""

import unittest
from breakout.breakout_cli import BreakoutCLI, WIDTH, HEIGHT, PADDLE_WIDTH

class TestBreakoutEngine(unittest.TestCase):
    def setUp(self):
        self.game = BreakoutCLI()

    def test_initial_state(self):
        self.assertEqual(self.game.score, 0)
        self.assertEqual(self.game.lives, 3)
        self.assertFalse(self.game.game_over)
        self.assertFalse(self.game.game_won)
        self.assertTrue(self.game.ball_attached)
        self.assertEqual(len(self.game.bricks), 32)
        self.assertEqual(self.game.remaining_bricks, 32)

    def test_paddle_movement_bounds(self):
        # Move far left
        for _ in range(50):
            self.game.move_paddle(-2)
        self.assertEqual(self.game.paddle_x, 1)

        # Move far right
        for _ in range(50):
            self.game.move_paddle(2)
        self.assertEqual(self.game.paddle_x, WIDTH - PADDLE_WIDTH - 1)

    def test_ball_launch(self):
        self.assertTrue(self.game.ball_attached)
        self.game.launch_ball()
        self.assertFalse(self.game.ball_attached)
        self.assertLess(self.game.ball_vy, 0)  # Moving upward

    def test_paddle_collision_and_deflection(self):
        self.game.launch_ball()
        # Position ball directly above paddle center
        self.game.paddle_x = 15
        self.game.ball_x = 15 + PADDLE_WIDTH // 2
        self.game.ball_y = HEIGHT - 3
        self.game.ball_vy = 1.0  # Falling down

        ev = self.game.step()
        self.assertEqual(ev, "paddle_hit")
        self.assertLess(self.game.ball_vy, 0)  # Bounced up

    def test_wall_reflection(self):
        self.game.ball_attached = False
        # Place near left wall moving left
        self.game.ball_x = 1.5
        self.game.ball_y = 10.0
        self.game.ball_vx = -1.0
        self.game.ball_vy = 0.5

        self.game.step()
        self.assertGreater(self.game.ball_vx, 0)  # Reflected right

    def test_brick_hit_and_score(self):
        self.game.ball_attached = False
        target_brick = self.game.bricks[0]
        self.game.ball_x = target_brick["x"] + 1
        self.game.ball_y = target_brick["y"] + 1
        self.game.ball_vy = -1.0

        ev = self.game.step()
        self.assertEqual(ev, "brick_hit")
        self.assertFalse(target_brick["alive"])
        self.assertEqual(self.game.remaining_bricks, 31)
        self.assertEqual(self.game.score, target_brick["pts"])
        self.assertGreater(self.game.ball_vy, 0)  # Reflected down

    def test_life_lost_and_game_over(self):
        self.game.ball_attached = False
        self.game.ball_x = 20.0
        self.game.ball_y = HEIGHT - 1.5
        self.game.ball_vy = 1.0  # Falling past paddle

        ev = self.game.step()
        self.assertEqual(ev, "life_lost")
        self.assertEqual(self.game.lives, 2)
        self.assertTrue(self.game.ball_attached)

        # Deplete all lives
        self.game.lives = 1
        self.game.ball_attached = False
        self.game.ball_x = 20.0
        self.game.ball_y = HEIGHT - 1.5
        self.game.ball_vy = 1.0

        ev = self.game.step()
        self.assertEqual(ev, "game_over")
        self.assertTrue(self.game.game_over)

    def test_win_condition(self):
        # Kill all bricks except one
        for b in self.game.bricks[1:]:
            b["alive"] = False
        self.game.remaining_bricks = 1

        last_brick = self.game.bricks[0]
        self.game.ball_attached = False
        self.game.ball_x = last_brick["x"] + 1
        self.game.ball_y = last_brick["y"] + 1
        self.game.ball_vy = -1.0

        ev = self.game.step()
        self.assertEqual(ev, "game_won")
        self.assertTrue(self.game.game_won)
        self.assertEqual(self.game.remaining_bricks, 0)

if __name__ == "__main__":
    unittest.main()
