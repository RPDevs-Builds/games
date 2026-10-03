#!/usr/bin/env python3
"""
Unit tests for Dots and Boxes Game Engine
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from dotsandboxes_cli import DotsAndBoxesCLI

class TestDotsAndBoxes(unittest.TestCase):
    def setUp(self):
        # 2x2 boxes (3x3 dots)
        self.game = DotsAndBoxesCLI(2, 2)

    def test_initial_state(self):
        self.assertEqual(self.game.scores[1], 0)
        self.assertEqual(self.game.scores[2], 0)
        self.assertEqual(self.game.current_player, 1)
        self.assertFalse(self.game.game_over)
        # Total lines for 2x2: (2+1)*2 + 2*(2+1) = 6 + 6 = 12 lines
        self.assertEqual(len(self.game.get_available_moves()), 12)

    def test_single_box_completion_and_bonus_turn(self):
        # Enclose box (0, 0)
        # Top line: h 0 0 (Player 1)
        self.game.make_move('h', 0, 0)
        self.assertEqual(self.game.current_player, 2)

        # Bottom line: h 1 0 (Player 2)
        self.game.make_move('h', 1, 0)
        self.assertEqual(self.game.current_player, 1)

        # Left line: v 0 0 (Player 1)
        self.game.make_move('v', 0, 0)
        self.assertEqual(self.game.current_player, 2)

        # Right line: v 0 1 (Player 2 closes box (0, 0)!)
        self.game.make_move('v', 0, 1)

        # Box (0, 0) should belong to Player 2
        self.assertEqual(self.game.boxes[0][0], 2)
        self.assertEqual(self.game.scores[2], 1)
        self.assertEqual(self.game.scores[1], 0)

        # Player 2 gets a bonus turn!
        self.assertEqual(self.game.current_player, 2)

    def test_double_box_completion(self):
        # Box (0, 0) and Box (0, 1) share middle vertical line v 0 1
        # Set up 3 outer lines for Box (0, 0)
        self.game.h_lines[0][0] = True
        self.game.h_lines[1][0] = True
        self.game.v_lines[0][0] = True

        # Set up 3 outer lines for Box (0, 1)
        self.game.h_lines[0][1] = True
        self.game.h_lines[1][1] = True
        self.game.v_lines[0][2] = True

        # Middle line v 0 1 is still open
        self.assertFalse(self.game.v_lines[0][1])

        # Player 1 places v 0 1
        self.game.current_player = 1
        self.game.make_move('v', 0, 1)

        # Both boxes should be claimed by Player 1
        self.assertEqual(self.game.boxes[0][0], 1)
        self.assertEqual(self.game.boxes[0][1], 1)
        self.assertEqual(self.game.scores[1], 2)
        self.assertEqual(self.game.current_player, 1) # Bonus turn

    def test_ai_captures_free_box(self):
        # Set up 3 sides for box (1, 1)
        self.game.h_lines[1][1] = True
        self.game.h_lines[2][1] = True
        self.game.v_lines[1][1] = True
        # Open side is v 1 2

        ai_move = self.game.get_ai_move()
        self.assertEqual(ai_move, ('v', 1, 2))

if __name__ == '__main__':
    unittest.main()
