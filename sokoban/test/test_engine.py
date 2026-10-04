import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sokoban_cli import SokobanCLI

class TestSokobanEngine(unittest.TestCase):
    def setUp(self):
        self.game = SokobanCLI(1) # Level 2 (simple 2-box puzzle)

    def test_initial_state(self):
        self.assertEqual(self.game.moves, 0)
        self.assertEqual(self.game.pushes, 0)
        self.assertFalse(self.game.is_won())

    def test_wall_collision(self):
        # Initial pos of level 2 is (1, 1). Up is wall (0, 1)
        moved = self.game.move(-1, 0)
        self.assertFalse(moved)
        self.assertEqual(self.game.player_r, 1)
        self.assertEqual(self.game.player_c, 1)

    def test_box_push_and_undo(self):
        # In level 2, (1, 2) is floor, (2, 2) is box, (3, 2) is floor
        self.assertTrue(self.game.move(0, 1)) # player at (1, 2)
        self.assertTrue(self.game.has_box(2, 2))
        
        # Push box down
        self.assertTrue(self.game.move(1, 0)) # player at (2, 2), box at (3, 2)
        self.assertEqual(self.game.player_r, 2)
        self.assertEqual(self.game.player_c, 2)
        self.assertTrue(self.game.has_box(3, 2))
        self.assertEqual(self.game.pushes, 1)

        # Test Undo
        self.assertTrue(self.game.undo())
        self.assertEqual(self.game.player_r, 1)
        self.assertEqual(self.game.player_c, 2)
        self.assertTrue(self.game.has_box(2, 2))
        self.assertEqual(self.game.pushes, 0)

    def test_corner_deadlock_detection(self):
        # Push box into corner
        self.game.move(1, 0)
        self.game.move(0, 1) # push box to (2, 3)
        # (2, 3) has wall at (2, 4) right and wall at (1, 4) / (0, 3) up/down?
        # Check if deadlocks method executes without errors
        deadlocks = self.game.detect_corner_deadlocks()
        self.assertIsInstance(deadlocks, list)

if __name__ == '__main__':
    unittest.main()
