#!/usr/bin/env python3
"""
Unit Test Suite for Pong 1972 Simulation Engine
"""

import unittest
import sys
import os

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pong_cli import PongCLI, WIDTH, HEIGHT, PADDLE_HEIGHT


class TestPongEngine(unittest.TestCase):
    def setUp(self):
        self.game = PongCLI(mode="1p", difficulty="medium")

    def test_initialization(self):
        self.assertEqual(self.game.score_p1, 0)
        self.assertEqual(self.game.score_p2, 0)
        self.assertFalse(self.game.game_over)
        self.assertIsNone(self.game.winner)
        self.assertEqual(self.game.p1_y, (HEIGHT - PADDLE_HEIGHT) // 2)
        self.assertEqual(self.game.p2_y, (HEIGHT - PADDLE_HEIGHT) // 2)
        self.assertEqual(self.game.ball_x, WIDTH // 2)
        self.assertEqual(self.game.ball_y, HEIGHT // 2)

    def test_paddle_clamping(self):
        # Move P1 far up
        for _ in range(30):
            self.game.move_p1(-1)
        self.assertEqual(self.game.p1_y, 1)

        # Move P1 far down
        for _ in range(30):
            self.game.move_p1(1)
        self.assertEqual(self.game.p1_y, HEIGHT - PADDLE_HEIGHT - 1)

    def test_wall_bounce(self):
        self.game.ball_x = 30
        self.game.ball_y = 1
        self.game.ball_vx = 1
        self.game.ball_vy = -1

        res = self.game.step()
        self.assertIn("bounce_wall", res["events"])
        self.assertEqual(self.game.ball_vy, 1)

    def test_paddle_1_bounce(self):
        self.game.p1_y = 8
        self.game.ball_x = 3
        self.game.ball_y = 9
        self.game.ball_vx = -1
        self.game.ball_vy = 0

        res = self.game.step()
        self.assertIn("bounce_paddle_p1", res["events"])
        self.assertEqual(self.game.ball_vx, 1)

    def test_paddle_2_bounce(self):
        self.game.p2_y = 8
        self.game.ball_x = WIDTH - 4
        self.game.ball_y = 9
        self.game.ball_vx = 1
        self.game.ball_vy = 0

        res = self.game.step()
        self.assertIn("bounce_paddle_p2", res["events"])
        self.assertEqual(self.game.ball_vx, -1)

    def test_point_scored_p2_when_p1_misses(self):
        self.game.p1_y = 15
        self.game.ball_x = 1
        self.game.ball_y = 2 # Misses paddle at y=15
        self.game.ball_vx = -1
        self.game.ball_vy = 0

        res = self.game.step()
        self.assertIn("point_p2", res["events"])
        self.assertEqual(self.game.score_p2, 1)
        self.assertEqual(self.game.score_p1, 0)

    def test_point_scored_p1_when_p2_misses(self):
        self.game.p2_y = 15
        self.game.ball_x = WIDTH - 2
        self.game.ball_y = 2 # Misses paddle at y=15
        self.game.ball_vx = 1
        self.game.ball_vy = 0

        res = self.game.step()
        self.assertIn("point_p1", res["events"])
        self.assertEqual(self.game.score_p1, 1)
        self.assertEqual(self.game.score_p2, 0)

    def test_game_over_and_winner(self):
        self.game.winning_score = 3
        self.game.score_p1 = 2
        self.game.score_p2 = 1

        self.game.p2_y = 15
        self.game.ball_x = WIDTH - 2
        self.game.ball_y = 2
        self.game.ball_vx = 1
        self.game.ball_vy = 0

        res = self.game.step()
        self.assertIn("game_over", res["events"])
        self.assertTrue(self.game.game_over)
        self.assertEqual(self.game.winner, 1)
        self.assertEqual(self.game.score_p1, 3)


if __name__ == '__main__':
    unittest.main()
