#!/usr/bin/env python3
"""
Unit tests for 2048 Engine
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from game2048_cli import Game2048CLI

class Test2048(unittest.TestCase):
    def setUp(self):
        self.game = Game2048CLI(4)

    def test_slide_line_merging(self):
        # [2, 2, 0, 0] -> [4, 0, 0, 0]
        res, score = self.game.slide_line([2, 2, 0, 0])
        self.assertEqual(res, [4, 0, 0, 0])
        self.assertEqual(score, 4)

        # [2, 2, 2, 2] -> [4, 4, 0, 0]
        res, score = self.game.slide_line([2, 2, 2, 2])
        self.assertEqual(res, [4, 4, 0, 0])
        self.assertEqual(score, 8)

        # [4, 2, 2, 0] -> [4, 4, 0, 0]
        res, score = self.game.slide_line([4, 2, 2, 0])
        self.assertEqual(res, [4, 4, 0, 0])
        self.assertEqual(score, 4)

    def test_game_over_detection(self):
        self.game.grid = [
            [2, 4, 2, 4],
            [4, 2, 4, 2],
            [2, 4, 2, 4],
            [4, 2, 4, 2]
        ]
        self.assertTrue(self.game.is_game_over())

        # If one pair matches, not game over
        self.game.grid[0][0] = 4
        self.assertFalse(self.game.is_game_over())

if __name__ == '__main__':
    unittest.main()
