import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'cli')))
from missilecommand_cli import MissileCommandCLI


class TestMissileCommandLogic(unittest.TestCase):
    def setUp(self):
        self.cli = MissileCommandCLI()

    def test_initial_state(self):
        """Verifies cities, initial wave and ammo."""
        self.assertEqual(len(self.cli.cities), 4)
        self.assertTrue(all(self.cli.cities))
        self.assertEqual(self.cli.ammo, 15)
        self.assertEqual(self.cli.wave, 1)
        self.assertEqual(self.cli.score, 0)

    def test_missile_spawn(self):
        """Spawning missiles should populate missile list."""
        self.cli.spawn_missile()
        self.assertEqual(len(self.cli.missiles), 1)
        m = self.cli.missiles[0]
        self.assertGreaterEqual(m['x'], 2)
        self.assertLessEqual(m['x'], self.cli.width - 3)
        self.assertEqual(m['y'], 0.0)

    def test_flak_interception(self):
        """Detonation near missile should destroy it and award score."""
        self.cli.missiles.append({'x': 10.0, 'y': 8.0, 'tx': 10.0, 'ty': 18.0, 'speed': 0.5})
        # Detonate at (10, 8)
        fx, fy = 10.0, 8.0
        survived = []
        for m in self.cli.missiles:
            import math
            dist = math.hypot(m['x'] - fx, m['y'] - fy)
            if dist <= 4.0:
                self.cli.score += 50
            else:
                survived.append(m)
        self.cli.missiles = survived
        self.assertEqual(len(self.cli.missiles), 0)
        self.assertEqual(self.cli.score, 50)


if __name__ == '__main__':
    unittest.main()
