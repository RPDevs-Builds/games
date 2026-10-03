#!/usr/bin/env python3
"""
Unit tests for Retro Snake Engine
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from snake_cli import SnakeGame

class TestSnakeGame(unittest.TestCase):
    def setUp(self):
        self.game = SnakeGame(10, 10)

    def test_initial_state(self):
        self.assertEqual(len(self.game.snake), 3)
        self.assertEqual(self.game.score, 0)
        self.assertFalse(self.game.game_over)
        self.assertIsNotNone(self.game.food)

    def test_movement(self):
        head = self.game.snake[0]
        res = self.game.step()
        new_head = self.game.snake[0]
        self.assertEqual(new_head, (head[0] + 1, head[1]))
        self.assertEqual(len(self.game.snake), 3)

    def test_reverse_direction_prevention(self):
        # Moving right (1, 0), moving left (-1, 0) should be rejected
        res = self.game.change_dir(-1, 0)
        self.assertFalse(res)
        self.assertEqual(self.game.dir, (1, 0))

    def test_wall_collision(self):
        # Steer towards wall
        self.game.snake = [(9, 5), (8, 5), (7, 5)]
        self.game.dir = (1, 0)
        res = self.game.step()
        self.assertEqual(res, 'wall')
        self.assertTrue(self.game.game_over)

    def test_self_collision(self):
        # Construct loop
        self.game.snake = [(5, 5), (5, 6), (4, 6), (4, 5), (3, 5)]
        self.game.dir = (0, 1) # Down into (5, 6)
        res = self.game.step()
        self.assertEqual(res, 'self')
        self.assertTrue(self.game.game_over)

    def test_food_consumption_and_growth(self):
        # Put food right in front of head
        head = self.game.snake[0]
        self.game.food = (head[0] + 1, head[1])
        res = self.game.step()
        self.assertEqual(res, 'eat')
        self.assertEqual(self.game.score, 10)
        self.assertEqual(len(self.game.snake), 4)

if __name__ == '__main__':
    unittest.main()
