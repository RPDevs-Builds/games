import unittest
import sys
import os

# Add cli directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'cli')))
from lightcycles_cli import LightCycleCLI, DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT

class TestLightCycles(unittest.TestCase):
    def setUp(self):
        self.game = LightCycleCLI(width=20, height=20)

    def test_initial_state(self):
        self.assertEqual(self.game.width, 20)
        self.assertEqual(self.game.height, 20)
        self.assertTrue(self.game.p1_alive)
        self.assertTrue(self.game.p2_alive)
        self.assertFalse(self.game.game_over)
        self.assertEqual(self.game.grid[self.game.p1_y][self.game.p1_x], 1)
        self.assertEqual(self.game.grid[self.game.p2_y][self.game.p2_x], 2)

    def test_is_safe_bounds(self):
        self.assertTrue(self.game.is_safe(5, 5))
        self.assertFalse(self.game.is_safe(-1, 5))
        self.assertFalse(self.game.is_safe(5, -1))
        self.assertFalse(self.game.is_safe(20, 5))
        self.assertFalse(self.game.is_safe(5, 20))
        # Head position is occupied by trail
        self.assertFalse(self.game.is_safe(self.game.p1_x, self.game.p1_y))

    def test_wall_collision(self):
        # Place player 1 at edge moving into wall
        self.game.p1_x = 0
        self.game.p1_y = 5
        self.game.p1_dir = DIR_LEFT
        self.game.step(DIR_LEFT)
        self.assertTrue(self.game.game_over)
        self.assertFalse(self.game.p1_alive)
        self.assertIn("CPU", self.game.winner)

    def test_trail_collision(self):
        # Create a wall of trail
        self.game.grid[10][11] = 2
        self.game.p1_x = 10
        self.game.p1_y = 10
        self.game.p1_dir = DIR_RIGHT
        # Next move goes to (11, 10) which is occupied
        self.game.step(DIR_RIGHT)
        self.assertFalse(self.game.p1_alive)
        self.assertTrue(self.game.game_over)

    def test_prevent_immediate_180_reversal(self):
        # Player moving right cannot reverse left in one step
        self.game.p1_dir = DIR_RIGHT
        self.game.step(DIR_LEFT) # should ignore left and keep right
        self.assertEqual(self.game.p1_dir, DIR_RIGHT)

    def test_flood_fill_space_counting(self):
        # Open space in 20x20 arena
        space = self.game.get_open_space(5, 5, max_depth=10)
        self.assertGreater(space, 15)

        # Blocked coordinate returns 0
        self.assertEqual(self.game.get_open_space(self.game.p1_x, self.game.p1_y), 0)

    def test_ai_chooses_open_path(self):
        # Move AI away from P1 to a clean location
        self.game.p2_x = 5
        self.game.p2_y = 5
        self.game.p2_dir = DIR_DOWN
        ai_x, ai_y = self.game.p2_x, self.game.p2_y
        self.game.grid[ai_y + 1][ai_x] = 1 # Bottom blocked
        self.game.grid[ai_y - 1][ai_x] = 1 # Top blocked (also 180 reverse)
        self.game.grid[ai_y][ai_x - 1] = 1 # Left blocked
        # Only Right should be open
        chosen = self.game.choose_ai_move()
        self.assertEqual(chosen, DIR_RIGHT)

if __name__ == '__main__':
    unittest.main()
