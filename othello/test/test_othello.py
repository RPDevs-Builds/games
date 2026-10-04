import unittest
import sys
import os

# Import OthelloGame logic from CLI module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'cli')))
from othello_cli import OthelloGame, BLACK, WHITE, EMPTY


class TestOthelloLogic(unittest.TestCase):
    def setUp(self):
        self.game = OthelloGame()

    def test_initial_board_setup(self):
        """Verifies initial 4 center squares and score."""
        self.assertEqual(self.game.board[3][3], WHITE)
        self.assertEqual(self.game.board[3][4], BLACK)
        self.assertEqual(self.game.board[4][3], BLACK)
        self.assertEqual(self.game.board[4][4], WHITE)
        b, w = self.game.get_scores()
        self.assertEqual(b, 2)
        self.assertEqual(w, 2)

    def test_initial_valid_moves_black(self):
        """Black should have exactly 4 opening moves on an empty board."""
        moves = self.game.get_valid_moves(BLACK)
        coords = sorted([(r, c) for r, c, _ in moves])
        expected = sorted([(2, 3), (3, 2), (4, 5), (5, 4)])
        self.assertEqual(coords, expected)

    def test_valid_move_execution(self):
        """Playing a valid move should flip adjacent opposing discs and update scores."""
        # Black plays (2, 3) which is D3
        res = self.game.play(2, 3, BLACK)
        self.assertTrue(res)
        self.assertEqual(self.game.board[2][3], BLACK)
        self.assertEqual(self.game.board[3][3], BLACK) # flipped from WHITE
        b, w = self.game.get_scores()
        self.assertEqual(b, 4)
        self.assertEqual(w, 1)

    def test_invalid_move_rejected(self):
        """Playing in non-flanking squares should be rejected."""
        self.assertFalse(self.game.play(0, 0, BLACK))
        self.assertFalse(self.game.play(3, 3, BLACK)) # occupied

    def test_ai_move_generation(self):
        """AI should generate a legal move for White."""
        self.game.play(2, 3, BLACK)
        ai_move = self.game.get_ai_move()
        self.assertIsNotNone(ai_move)
        r, c, flips = ai_move
        self.assertTrue(0 <= r < 8 and 0 <= c < 8)
        self.assertGreater(len(flips), 0)


if __name__ == '__main__':
    unittest.main()
