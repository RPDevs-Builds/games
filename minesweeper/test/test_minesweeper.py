#!/usr/bin/env python3
"""
Unit tests for Minesweeper Engine
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from minesweeper_cli import MinesweeperCLI

class TestMinesweeper(unittest.TestCase):
    def setUp(self):
        self.game = MinesweeperCLI(9, 9, 10)

    def test_first_click_safety(self):
        # Click (4, 4)
        res = self.game.reveal(4, 4)
        self.assertIn(res, ('ok', 'won'))
        self.assertNotIn((4, 4), self.game.mines)
        # Verify 3x3 surrounding (4, 4) is free of mines
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                self.assertNotIn((4 + dr, 4 + dc), self.game.mines)

    def test_flagging(self):
        self.game.toggle_flag(1, 1)
        self.assertIn((1, 1), self.game.flags)
        # Cannot reveal flagged cell
        res = self.game.reveal(1, 1)
        self.assertEqual(res, 'already')
        # Unflag
        self.game.toggle_flag(1, 1)
        self.assertNotIn((1, 1), self.game.flags)

    def test_total_mines_count(self):
        self.game.reveal(0, 0)
        self.assertEqual(len(self.game.mines), 10)

if __name__ == '__main__':
    unittest.main()
