import unittest
from fallingblocks.blocks_cli import TerminalFallingBlocks, COLS, ROWS

class TestFallingBlocksEngine(unittest.TestCase):
    def setUp(self):
        self.game = TerminalFallingBlocks()

    def test_initial_board_dimensions(self):
        self.assertEqual(len(self.game.board), ROWS)
        for row in self.game.board:
            self.assertEqual(len(row), COLS)
            self.assertTrue(all(cell is None for cell in row))

    def test_7bag_distribution(self):
        bag_items = []
        # Empty current bag
        self.game.bag = []
        for _ in range(7):
            bag_items.append(self.game.draw_from_bag())
        self.assertEqual(len(set(bag_items)), 7)
        self.assertEqual(set(bag_items), {'I', 'O', 'T', 'S', 'Z', 'J', 'L'})

    def test_move_bounds(self):
        # Move far left
        for _ in range(15):
            self.game.move_left()
        mat = self.game.get_matrix()
        # Find leftmost filled block
        leftmost_col = min(c for r in range(len(mat)) for c in range(len(mat[r])) if mat[r][c])
        self.assertEqual(self.game.px + leftmost_col, 0)

        # Move far right
        for _ in range(20):
            self.game.move_right()
        rightmost_col = max(c for r in range(len(mat)) for c in range(len(mat[r])) if mat[r][c])
        self.assertEqual(self.game.px + rightmost_col, COLS - 1)

    def test_rotation(self):
        self.game.current_type = 'T'
        self.game.current_rot = 0
        self.game.px = 4
        self.game.py = 4
        self.assertTrue(self.game.rotate_cw())
        self.assertEqual(self.game.current_rot, 1)

    def test_hard_drop_locks_piece(self):
        self.game.current_type = 'O'
        self.game.px = 4
        self.game.py = 0
        self.game.hard_drop()
        # Bottom two rows (ROWS-1, ROWS-2) should contain 'O' at cols 4, 5
        self.assertEqual(self.game.board[ROWS - 1][4], 'O')
        self.assertEqual(self.game.board[ROWS - 1][5], 'O')
        self.assertEqual(self.game.board[ROWS - 2][4], 'O')
        self.assertEqual(self.game.board[ROWS - 2][5], 'O')

    def test_clear_single_line(self):
        # Fill bottom row except column 0
        for c in range(1, COLS):
            self.game.board[ROWS - 1][c] = 'T'
        self.game.board[ROWS - 1][0] = 'T' # Full row!
        self.game.clear_lines()
        self.assertEqual(self.game.lines, 1)
        self.assertEqual(self.game.score, 100)
        # Bottom row should now be empty
        self.assertTrue(all(c is None for c in self.game.board[ROWS - 1]))

    def test_clear_tetris_four_lines(self):
        # Fill bottom 4 rows completely
        for r in range(ROWS - 4, ROWS):
            for c in range(COLS):
                self.game.board[r][c] = 'I'
        self.game.clear_lines()
        self.assertEqual(self.game.lines, 4)
        self.assertEqual(self.game.score, 800)

    def test_level_progression(self):
        self.game.lines = 9
        self.game.level = 1
        # Fill 1 line
        for c in range(COLS):
            self.game.board[ROWS - 1][c] = 'O'
        self.game.clear_lines()
        self.assertEqual(self.game.lines, 10)
        self.assertEqual(self.game.level, 2)

if __name__ == '__main__':
    unittest.main()
