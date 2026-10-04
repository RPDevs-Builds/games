import unittest
from mazechaser.maze_cli import TerminalMazeGame, COLS, ROWS

class TestMazeEngine(unittest.TestCase):
    def setUp(self):
        self.game = TerminalMazeGame()

    def test_dimensions_and_initial_pellets(self):
        self.assertEqual(len(self.game.grid), ROWS)
        self.assertEqual(len(self.game.grid[0]), COLS)
        self.assertGreater(self.game.total_pellets, 100)
        self.assertEqual(self.game.pellets_left, self.game.total_pellets)

    def test_wall_collision(self):
        # Initial pos: (9, 15). Check wall above (row 14 at col 9 is walkable or wall?)
        # Let's try to walk directly into an established wall:
        # Col 0 is wall in most rows.
        self.game.px = 1
        self.game.py = 1
        # To the left is col 0 (wall)
        self.assertTrue(self.game.is_wall(0, 1))
        self.game.move_player('LEFT')
        # Position should not have moved into the wall
        self.assertEqual(self.game.px, 1)

    def test_eat_pellet_and_score(self):
        initial_score = self.game.score
        initial_pellets = self.game.pellets_left
        # Place pellet in front of player
        self.game.px = 8
        self.game.py = 3
        self.game.grid[3][7] = '.' # Pellet to the left
        self.game.move_player('LEFT')
        self.assertEqual(self.game.score, initial_score + 10)
        self.assertEqual(self.game.pellets_left, initial_pellets - 1)
        self.assertEqual(self.game.grid[3][7], ' ')

    def test_eat_energizer_activates_fright(self):
        self.game.px = 8
        self.game.py = 3
        self.game.grid[3][7] = '*' # Energizer to the left
        self.game.move_player('LEFT')
        self.assertEqual(self.game.score, 50)
        self.assertGreater(self.game.fright_timer, 0)
        for g in self.game.ghosts.values():
            self.assertEqual(g['mode'], 'frightened')

    def test_tunnel_wraparound(self):
        # Row 9 is tunnel row
        self.game.px = 0
        self.game.py = 9
        self.game.move_player('LEFT')
        self.assertEqual(self.game.px, COLS - 1)

        self.game.move_player('RIGHT')
        self.assertEqual(self.game.px, 0)

    def test_blinky_target_pursuit(self):
        # In chase mode on an open corridor (Row 3), Blinky targets player coordinates
        self.game.px = 3
        self.game.py = 3
        self.game.ghosts['blinky']['x'] = 7
        self.game.ghosts['blinky']['y'] = 3
        self.game.move_ghosts()
        # Blinky should step LEFT towards px=3
        self.assertEqual(self.game.ghosts['blinky']['x'], 6)

    def test_player_loss_of_life(self):
        self.assertEqual(self.game.lives, 3)
        # Put player at (5, 3) and Blinky adjacent at (6, 3)
        self.game.px = 5
        self.game.py = 3
        self.game.ghosts['blinky']['x'] = 6
        self.game.ghosts['blinky']['y'] = 3
        self.game.ghosts['blinky']['mode'] = 'chase'
        # Blinky steps left onto player
        self.game.move_ghosts()
        self.assertEqual(self.game.lives, 2)
        self.assertFalse(self.game.game_over)

    def test_game_over_at_zero_lives(self):
        self.game.lives = 1
        self.game.px = 5
        self.game.py = 3
        self.game.ghosts['blinky']['x'] = 6
        self.game.ghosts['blinky']['y'] = 3
        self.game.ghosts['blinky']['mode'] = 'chase'
        self.game.move_ghosts()
        self.assertEqual(self.game.lives, 0)
        self.assertTrue(self.game.game_over)

if __name__ == '__main__':
    unittest.main()
