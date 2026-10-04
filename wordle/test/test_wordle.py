#!/usr/bin/env python3
"""
Unit tests for Wordle deduction engine, two-pass duplicate scoring,
Hard Mode constraints, daily seed determinism, and scorecard formatting.
"""

import unittest
import sys
import os
import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from wordle_cli import evaluate_guess, get_daily_word, WordleGame
from src.words import TARGET_WORDS, VALID_WORDS_SET


class TestWordleEngine(unittest.TestCase):

    def test_all_correct(self):
        """Guess matches secret word exactly."""
        res = evaluate_guess("CRANE", "CRANE")
        expected = [
            ('c', 'correct'),
            ('r', 'correct'),
            ('a', 'correct'),
            ('n', 'correct'),
            ('e', 'correct')
        ]
        self.assertEqual(res, expected)

    def test_all_absent(self):
        """No shared letters between guess and target."""
        res = evaluate_guess("PLUMB", "FIGHT")
        expected = [
            ('p', 'absent'),
            ('l', 'absent'),
            ('u', 'absent'),
            ('m', 'absent'),
            ('b', 'absent')
        ]
        self.assertEqual(res, expected)

    def test_duplicate_letters_speed_erase(self):
        """Target SPEED vs Guess ERASE."""
        # SPEED: S:1, P:1, E:2, D:1
        # ERASE:
        # Pass 1: no exact match at same index.
        # Pass 2:
        # idx 0: E -> present (1 E remaining)
        # idx 1: R -> absent
        # idx 2: A -> absent
        # idx 3: S -> present (0 S remaining)
        # idx 4: E -> present (0 E remaining)
        res = evaluate_guess("ERASE", "SPEED")
        statuses = [s for _, s in res]
        self.assertEqual(statuses, ['present', 'absent', 'absent', 'present', 'present'])

    def test_duplicate_letter_precedence_exact_match(self):
        """Target CLONE (1 'O' at idx 2) vs Guess GOOLY (2 'O's at idx 1, 2)."""
        # Pass 1: GOOLY[2]=='O' == CLONE[2]=='O' -> correct! Remaining 'O' in target = 0.
        # Pass 2: GOOLY[1]=='O' -> target count is 0 -> absent!
        res = evaluate_guess("GOOLY", "CLONE")
        statuses = [s for _, s in res]
        self.assertEqual(statuses[1], 'absent')
        self.assertEqual(statuses[2], 'correct')

    def test_duplicate_letter_abbey_babes(self):
        """Target ABBEY vs Guess BABES."""
        # Index 0: B vs A -> present
        # Index 1: A vs B -> present
        # Index 2: B vs B -> correct (exact match!)
        # Index 3: E vs E -> correct (exact match!)
        # Index 4: S vs Y -> absent
        res = evaluate_guess("BABES", "ABBEY")
        statuses = [s for _, s in res]
        self.assertEqual(statuses, ['present', 'present', 'correct', 'correct', 'absent'])

    def test_hard_mode_enforcement(self):
        """Hard mode requires reusing revealed green and yellow letters."""
        game = WordleGame("CRANE", hard_mode=True)
        # Guess 1: CRATE -> C, R, A, E are in target (C, R, A are green, E is yellow/green? E is green at 4!)
        # CRANE vs CRATE: C: green, R: green, A: green, T: absent, E: green.
        success, msg = game.submit_guess("CRATE")
        self.assertTrue(success)
        self.assertEqual(game.status, 'IN_PROGRESS')

        # Invalid Hard Mode guess: BRACE (missing green C at pos 1)
        success, msg = game.submit_guess("BRACE")
        self.assertFalse(success)
        self.assertIn("1st letter must be 'C'", msg)

        # Valid Hard Mode guess: CRANE (correct positions)
        success, msg = game.submit_guess("CRANE")
        self.assertTrue(success)
        self.assertEqual(game.status, 'WON')

    def test_hard_mode_yellow_requirement(self):
        """Hard mode requires including revealed yellow letters."""
        game = WordleGame("LIGHT", hard_mode=True)
        # Guess: HOTEL -> H and T are in LIGHT (H is yellow, T is yellow)
        success, _ = game.submit_guess("HOTEL")
        self.assertTrue(success)

        # Next guess: RAINS (does not contain H or T)
        success, msg = game.submit_guess("RAINS")
        self.assertFalse(success)
        self.assertIn("Guess must contain", msg)

    def test_dictionary_validation(self):
        """Invalid words or invalid length must be rejected."""
        game = WordleGame("SLATE")
        # Too short
        success, msg = game.submit_guess("CAT")
        self.assertFalse(success)
        # Non-alphabetic
        success, msg = game.submit_guess("C4TS!")
        self.assertFalse(success)
        # Fake word
        success, msg = game.submit_guess("ZZZZZ")
        self.assertFalse(success)
        self.assertEqual(msg, "Not in word list")

    def test_daily_seed_determinism(self):
        """Daily seed must be deterministic for identical dates."""
        d1 = datetime.date(2026, 10, 4)
        word1, day_num1 = get_daily_word(d1)
        word2, day_num2 = get_daily_word(d1)
        self.assertEqual(word1, word2)
        self.assertEqual(day_num1, day_num2)

        d2 = datetime.date(2026, 10, 5)
        word_next, _ = get_daily_word(d2)
        # Next day's word index increments
        self.assertIn(word_next, TARGET_WORDS)

    def test_game_loss_after_six_attempts(self):
        """After 6 incorrect guesses, game transitions to LOST."""
        game = WordleGame("TIGER")
        wrong_guesses = ["SLATE", "CRONY", "CHAMP", "PLUMB", "FIGHT", "DOWDY"]
        for g in wrong_guesses:
            success, _ = game.submit_guess(g)
            self.assertTrue(success)
        self.assertEqual(game.status, 'LOST')
        self.assertEqual(len(game.guesses), 6)

    def test_scorecard_format(self):
        """Scorecard contains correct title and emoji rows."""
        game = WordleGame("CRANE", hard_mode=True, is_daily=True, day_num=1933)
        game.submit_guess("CRATE")
        game.submit_guess("CRANE")
        scorecard = game.generate_scorecard()
        self.assertIn("Wordle 1933 2/6*", scorecard)
        self.assertIn("🟩🟩🟩⬛🟩", scorecard) # CRATE
        self.assertIn("🟩🟩🟩🟩🟩", scorecard) # CRANE
        self.assertIn("RPDevs Arcade Vault", scorecard)


if __name__ == '__main__':
    unittest.main()
