#!/usr/bin/env python3
"""
Unit tests for Lights Out Engine & GF(2) Gaussian Elimination Solver.
"""

import sys
import os
import unittest

# Add cli directory to path to import LightsOutGame
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../cli')))
from lightsout_cli import LightsOutGame


class TestLightsOutEngine(unittest.TestCase):

    def setUp(self):
        self.game = LightsOutGame(5, 5)

    def test_initialization(self):
        """Verify initial board is completely dark and dimensions are 5x5."""
        self.assertEqual(self.game.rows, 5)
        self.assertEqual(self.game.cols, 5)
        self.assertTrue(self.game.is_solved())
        self.assertEqual(self.game.active_count(), 0)
        self.assertEqual(self.game.move_count, 0)

    def test_toggle_center(self):
        """Toggling center cell (2, 2) should invert itself and 4 orthogonal neighbors."""
        self.game.toggle(2, 2)
        # Expected active: (2,2), (1,2), (3,2), (2,1), (2,3)
        expected = {(2, 2), (1, 2), (3, 2), (2, 1), (2, 3)}
        for r in range(5):
            for c in range(5):
                if (r, c) in expected:
                    self.assertEqual(self.game.board[r][c], 1, f"Expected (r={r}, c={c}) to be lit")
                else:
                    self.assertEqual(self.game.board[r][c], 0, f"Expected (r={r}, c={c}) to be unlit")
        self.assertEqual(self.game.active_count(), 5)
        self.assertEqual(self.game.move_count, 1)

    def test_toggle_corner(self):
        """Toggling corner (0, 0) should invert itself and 2 neighbors ((0, 1), (1, 0))."""
        self.game.toggle(0, 0)
        expected = {(0, 0), (0, 1), (1, 0)}
        self.assertEqual(self.game.active_count(), 3)
        for r, c in expected:
            self.assertEqual(self.game.board[r][c], 1)

    def test_toggle_edge(self):
        """Toggling edge (0, 2) should invert itself and 3 neighbors ((0, 1), (0, 3), (1, 2))."""
        self.game.toggle(0, 2)
        expected = {(0, 2), (0, 1), (0, 3), (1, 2)}
        self.assertEqual(self.game.active_count(), 4)
        for r, c in expected:
            self.assertEqual(self.game.board[r][c], 1)

    def test_idempotency(self):
        """Clicking the same cell twice returns the board to the exact initial state (A + A = 0 in GF(2))."""
        self.game.toggle(1, 3)
        self.assertFalse(self.game.is_solved())
        self.game.toggle(1, 3)
        self.assertTrue(self.game.is_solved())
        self.assertEqual(self.game.active_count(), 0)

    def test_commutativity(self):
        """Move sequence order does not matter: A then B is identical to B then A."""
        game_a = LightsOutGame(5, 5)
        game_b = LightsOutGame(5, 5)

        # Game A: toggle (1, 1) then (3, 4)
        game_a.toggle(1, 1)
        game_a.toggle(3, 4)

        # Game B: toggle (3, 4) then (1, 1)
        game_b.toggle(3, 4)
        game_b.toggle(1, 1)

        self.assertEqual(game_a.board, game_b.board)

    def test_undo_and_reset(self):
        """Test undo and reset mechanisms."""
        self.game.toggle(0, 0)
        self.game.toggle(4, 4)
        self.assertEqual(self.game.move_count, 2)

        undone = self.game.undo()
        self.assertEqual(undone, (4, 4))
        self.assertEqual(self.game.move_count, 1)
        self.assertEqual(self.game.board[4][4], 0)

        self.game.reset_to_initial()
        self.assertEqual(self.game.move_count, 0)
        self.assertTrue(self.game.is_solved())

    def test_scramble_and_solver(self):
        """Scrambling produces a solvable board that the GF(2) solver can solve."""
        for steps in [3, 7, 12]:
            self.game.scramble(steps=steps)
            self.assertFalse(self.game.is_solved())

            sol = self.game.solve()
            self.assertTrue(sol["solvable"], f"Scrambled board with {steps} steps should be solvable")
            self.assertGreater(len(sol["moves"]), 0)

            # Apply solver moves
            for r, c in sol["moves"]:
                self.game.toggle(r, c)

            self.assertTrue(self.game.is_solved(), "Applying solver moves must result in all lights out")
            self.assertEqual(self.game.active_count(), 0)

    def test_unsolvable_board_detection(self):
        """A board with only cell (0, 0) lit on 5x5 is a known unsolvable configuration."""
        # Setup board with only (0, 0) lit
        self.game.board = [[0 for _ in range(5)] for _ in range(5)]
        self.game.board[0][0] = 1

        sol = self.game.solve()
        self.assertFalse(sol["solvable"])
        self.assertEqual(len(sol["moves"]), 0)

    def test_variable_grid_sizes(self):
        """Test engine and solver on 3x3, 4x4, and 6x6 grids."""
        for size in [3, 4, 6]:
            g = LightsOutGame(size, size)
            g.scramble(steps=4)
            sol = g.solve()
            self.assertTrue(sol["solvable"])
            for r, c in sol["moves"]:
                g.toggle(r, c)
            self.assertTrue(g.is_solved())

    def test_lit_out_mode(self):
        """Test Lit-Out mode where target is all lights ON (1)."""
        g = LightsOutGame(5, 5, target_mode='on')
        self.assertFalse(g.is_solved())
        # All lights on
        g.board = [[1 for _ in range(5)] for _ in range(5)]
        self.assertTrue(g.is_solved())

        # Scramble and solve towards target = 1
        g.scramble(steps=6)
        sol = g.solve()
        self.assertTrue(sol["solvable"])
        for r, c in sol["moves"]:
            g.toggle(r, c)
        self.assertTrue(g.is_solved())
        self.assertEqual(g.active_count(), 25)

    def test_torus_wrap_topology(self):
        """Test Torus wrap-around toggle propagation."""
        g = LightsOutGame(5, 5, wrap_topology=True)
        # Toggling (0, 0) in torus wraps to bottom (4, 0) and right edge (0, 4)
        g.toggle(0, 0)
        self.assertEqual(g.board[0][0], 1)
        self.assertEqual(g.board[0][1], 1)
        self.assertEqual(g.board[1][0], 1)
        self.assertEqual(g.board[4][0], 1) # wrapped up to row 4
        self.assertEqual(g.board[0][4], 1) # wrapped left to col 4
        self.assertEqual(g.active_count(), 5)


if __name__ == '__main__':
    unittest.main()

