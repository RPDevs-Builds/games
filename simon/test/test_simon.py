#!/usr/bin/env python3
"""
Unit tests for Simon Game Engine
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from simon_cli import SimonCLI, COLORS

class TestSimonCLI(unittest.TestCase):
    def setUp(self):
        self.game = SimonCLI()

    def test_sequence_growth(self):
        self.assertEqual(len(self.game.sequence), 0)
        self.game.add_step()
        self.assertEqual(len(self.game.sequence), 1)
        self.assertIn(self.game.sequence[0], COLORS)
        self.game.add_step()
        self.assertEqual(len(self.game.sequence), 2)

    def test_colors_validity(self):
        for _ in range(50):
            self.game.add_step()
        for color in self.game.sequence:
            self.assertIn(color, ['G', 'R', 'Y', 'B'])

if __name__ == '__main__':
    unittest.main()
