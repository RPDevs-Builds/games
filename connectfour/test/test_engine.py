import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from connectfour_cli import ConnectFourCLI, PLAYER_1, PLAYER_2, ROWS, COLS, EMPTY

class TestConnectFourEngine(unittest.TestCase):
    def setUp(self):
        self.game = ConnectFourCLI()

    def test_initial_state(self):
        self.assertEqual(self.game.turn, PLAYER_1)
        self.assertIsNone(self.game.winner)
        self.assertEqual(len(self.game.moves_history), 0)
        self.assertTrue(all(self.game.board[r][c] == EMPTY for r in range(ROWS) for c in range(COLS)))

    def test_gravity_drop(self):
        # Drop first piece in col 3 -> should fall to bottom row (5)
        res1 = self.game.drop_piece(3)
        self.assertIsNotNone(res1)
        self.assertEqual(res1["row"], 5)
        self.assertEqual(res1["col"], 3)
        self.assertEqual(self.game.board[5][3], PLAYER_1)
        self.assertEqual(self.game.turn, PLAYER_2)

        # Drop second piece in col 3 -> should land at row 4
        res2 = self.game.drop_piece(3)
        self.assertIsNotNone(res2)
        self.assertEqual(res2["row"], 4)
        self.assertEqual(res2["col"], 3)
        self.assertEqual(self.game.board[4][3], PLAYER_2)
        self.assertEqual(self.game.turn, PLAYER_1)

    def test_column_full_rejection(self):
        col = 0
        for _ in range(ROWS):
            self.assertIsNotNone(self.game.drop_piece(col))
        # 7th drop must fail
        self.assertFalse(self.game.is_valid_column(col))
        self.assertIsNone(self.game.drop_piece(col))

    def test_horizontal_win(self):
        # P1: (0, 1, 2, 3), P2: col 0 alternate
        # P1: col 0, P2: col 0
        # Let's cleanly drop pieces:
        # P1 drops col 0
        self.game.drop_piece(0, PLAYER_1)
        # P1 drops col 1
        self.game.drop_piece(1, PLAYER_1)
        # P1 drops col 2
        self.game.drop_piece(2, PLAYER_1)
        # P1 drops col 3
        res = self.game.drop_piece(3, PLAYER_1)
        self.assertEqual(res["winner"], PLAYER_1)
        self.assertEqual(len(res["winning_cells"]), 4)

    def test_vertical_win(self):
        # P1 drops 4 pieces in col 4
        for _ in range(3):
            self.game.drop_piece(4, PLAYER_1)
        res = self.game.drop_piece(4, PLAYER_1)
        self.assertEqual(res["winner"], PLAYER_1)
        self.assertEqual(self.game.winner, PLAYER_1)

    def test_diagonal_win(self):
        # Setup board for diagonal:
        # col 0: P1 (row 5)
        # col 1: P2, P1 (row 4)
        # col 2: P2, P2, P1 (row 3)
        # col 3: P2, P2, P2, P1 (row 2)
        self.game.drop_piece(0, PLAYER_1) # (5, 0)

        self.game.drop_piece(1, PLAYER_2) # (5, 1)
        self.game.drop_piece(1, PLAYER_1) # (4, 1)

        self.game.drop_piece(2, PLAYER_2) # (5, 2)
        self.game.drop_piece(2, PLAYER_2) # (4, 2)
        self.game.drop_piece(2, PLAYER_1) # (3, 2)

        self.game.drop_piece(3, PLAYER_2) # (5, 3)
        self.game.drop_piece(3, PLAYER_2) # (4, 3)
        self.game.drop_piece(3, PLAYER_2) # (3, 3)
        res = self.game.drop_piece(3, PLAYER_1) # (2, 3)

        self.assertEqual(res["winner"], PLAYER_1)

    def test_undo(self):
        self.game.drop_piece(2)
        self.assertEqual(self.game.board[5][2], PLAYER_1)
        self.assertEqual(self.game.turn, PLAYER_2)

        undone = self.game.undo()
        self.assertEqual(undone, (5, 2, PLAYER_1))
        self.assertEqual(self.game.board[5][2], EMPTY)
        self.assertEqual(self.game.turn, PLAYER_1)

    def test_ai_blocks_threat(self):
        # P1 has cols 0, 1, 2 on bottom row
        self.game.drop_piece(0, PLAYER_1)
        self.game.drop_piece(1, PLAYER_1)
        self.game.drop_piece(2, PLAYER_1)

        # AI (P2) must block col 3
        best_col = self.game.get_ai_move("medium")
        self.assertEqual(best_col, 3)

if __name__ == '__main__':
    unittest.main()
