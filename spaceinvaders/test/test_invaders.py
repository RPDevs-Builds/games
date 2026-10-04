#!/usr/bin/env python3
"""
Unit tests for Space Invaders (1978) engine, mechanics, and simulation logic.
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from spaceinvaders_cli import SpaceInvadersCLI, WIDTH, HEIGHT


class TestSpaceInvaders(unittest.TestCase):
    def setUp(self):
        self.game = SpaceInvadersCLI()

    def test_fleet_initialization(self):
        aliens = self.game.aliens
        self.assertEqual(len(aliens), 50)
        self.assertEqual(len(self.game.get_alive_aliens()), 50)

        # Check alien points and types by row
        for a in aliens:
            if a['row'] == 0:
                self.assertEqual(a['type'], 'squid')
                self.assertEqual(a['points'], 30)
            elif a['row'] in (1, 2):
                self.assertEqual(a['type'], 'crab')
                self.assertEqual(a['points'], 20)
            else:
                self.assertEqual(a['type'], 'octopus')
                self.assertEqual(a['points'], 10)

    def test_bunker_initialization(self):
        self.assertEqual(len(self.game.bunkers), 4)
        for bunker in self.game.bunkers:
            self.assertGreater(len(bunker['blocks']), 0)
            # Check bunker height and width
            self.assertEqual(bunker['width'], 6)
            self.assertEqual(bunker['height'], 2)

    def test_single_laser_restriction(self):
        # Position player in open corridor between bunker 0 (x=4..9) and bunker 1 (x=14..19)
        self.game.player_x = 10
        self.assertIsNone(self.game.player_laser)
        self.game.update(action='fire')
        self.assertIsNotNone(self.game.player_laser)
        first_laser_pos = list(self.game.player_laser)

        # Attempt to fire again while laser is active
        self.game.update(action='fire')
        # Laser should have moved up by 1, not reset to player cannon
        self.assertEqual(self.game.player_laser[1], first_laser_pos[1] - 1)

    def test_laser_destroys_alien_and_scores(self):
        alien = self.game.aliens[0]
        self.assertTrue(alien['alive'])
        # Place laser right below the alien
        self.game.player_laser = [alien['x'] + 1, alien['y'] + 1]

        initial_score = self.game.score
        self.game.update()  # Laser moves into alien['y']

        self.assertFalse(alien['alive'])
        self.assertEqual(self.game.score, initial_score + alien['points'])
        self.assertIsNone(self.game.player_laser)

    def test_tempo_acceleration(self):
        initial_interval = self.game.calculate_step_interval()

        # Kill 25 aliens
        for a in self.game.aliens[:25]:
            a['alive'] = False
        mid_interval = self.game.calculate_step_interval()
        self.assertLess(mid_interval, initial_interval)

        # Kill all but 1 alien
        for a in self.game.aliens[25:-1]:
            a['alive'] = False
        fastest_interval = self.game.calculate_step_interval()
        self.assertEqual(fastest_interval, 1)

    def test_fleet_edge_bounce_and_step_down(self):
        # Shift all alive aliens near right wall
        for a in self.game.aliens:
            a['x'] = WIDTH - 5
        self.game.alien_dir = 1
        self.game.alien_step_down = False
        self.game.step_timer = self.game.step_interval - 1

        self.game.update()
        self.assertTrue(self.game.alien_step_down)

        # Next step should drop aliens down and reverse direction
        initial_y = self.game.aliens[0]['y']
        self.game.step_timer = self.game.step_interval - 1
        self.game.update()

        self.assertEqual(self.game.alien_dir, -1)
        self.assertEqual(self.game.aliens[0]['y'], initial_y + 1)
        self.assertFalse(self.game.alien_step_down)

    def test_bunker_erosion_by_laser_and_bomb(self):
        bunker = self.game.bunkers[0]
        block = next(iter(bunker['blocks']))
        bx, by = block

        # Fire laser into bunker block
        self.game.player_laser = [bx, by + 1]
        self.game.update()

        self.assertNotIn(block, bunker['blocks'])
        self.assertIsNone(self.game.player_laser)

        # Drop bomb into another bunker block
        remaining_block = next(iter(bunker['blocks']))
        rx, ry = remaining_block
        self.game.alien_bombs.append([rx, ry - 1])
        self.game.update()

        self.assertNotIn(remaining_block, bunker['blocks'])

    def test_alien_bomb_damages_player(self):
        initial_lives = self.game.lives
        px = self.game.player_x + 1
        py = self.game.player_y

        self.game.alien_bombs.append([px, py - 1])
        self.game.update()

        self.assertEqual(self.game.lives, initial_lives - 1)
        self.assertGreater(self.game.player_dead_timer, 0)

    def test_ufo_spawn_and_destruction(self):
        self.game.ufo = {
            'x': 20.0,
            'dir': 1,
            'points': 200
        }
        initial_score = self.game.score
        # Place laser right below UFO at y=3
        self.game.player_laser = [21, 3]
        self.game.update()

        self.assertEqual(self.game.score, initial_score + 200)
        self.assertIsNone(self.game.ufo)
        self.assertIsNone(self.game.player_laser)

    def test_invasion_game_over(self):
        # Force alien down to player baseline
        self.game.aliens[0]['y'] = self.game.player_y
        self.game.step_timer = self.game.step_interval - 1
        self.assertFalse(self.game.game_over)

        self.game.update()
        self.assertTrue(self.game.game_over)
        self.assertEqual(self.game.lives, 0)

    def test_wave_clear_advances_wave(self):
        # Kill all aliens except one
        for a in self.game.aliens[1:]:
            a['alive'] = False

        last_alien = self.game.aliens[0]
        self.game.player_laser = [last_alien['x'] + 1, last_alien['y'] + 1]
        self.assertEqual(self.game.wave, 1)

        self.game.update()
        self.assertEqual(self.game.wave, 2)
        self.assertEqual(len(self.game.get_alive_aliens()), 50)


if __name__ == '__main__':
    unittest.main()
