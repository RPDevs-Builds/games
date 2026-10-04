/**
 * Wordle Game Engine
 * Handles deduction logic, two-pass duplicate letter scoring, daily seed,
 * hard mode constraints, statistics, and emoji scorecard generation.
 */

class WordleEngine {
  constructor(options = {}) {
    this.targetWords = options.targetWords || (typeof TARGET_WORDS !== 'undefined' ? TARGET_WORDS : []);
    this.validWordsSet = options.validWordsSet || (typeof VALID_WORDS_SET !== 'undefined' ? VALID_WORDS_SET : new Set());
    this.hardMode = options.hardMode || false;
    this.maxGuesses = 6;
    this.wordLength = 5;

    this.reset();
  }

  reset() {
    this.guesses = []; // Array of strings (lowercase)
    this.evaluations = []; // Array of arrays: [{ letter, status: 'correct'|'present'|'absent' }]
    this.secretWord = '';
    this.isDaily = false;
    this.dateString = '';
    this.dayNumber = 0;
    this.status = 'IN_PROGRESS'; // 'IN_PROGRESS' | 'WON' | 'LOST'
    this.revealedHints = {
      correct: Array(this.wordLength).fill(null), // char at index
      present: new Set() // chars that must appear
    };
  }

  /**
   * Initializes a daily challenge puzzle using YYYY-MM-DD.
   */
  startDaily(date = new Date()) {
    this.reset();
    this.isDaily = true;
    
    // Format YYYY-MM-DD in local time
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    this.dateString = `${y}-${m}-${d}`;

    // Epoch based on 2021-06-19 (Wordle Day 0)
    const epoch = new Date('2021-06-19T00:00:00Z').getTime();
    const current = new Date(`${this.dateString}T00:00:00Z`).getTime();
    const dayDiff = Math.max(0, Math.floor((current - epoch) / (1000 * 60 * 60 * 24)));
    this.dayNumber = dayDiff;

    const index = dayDiff % this.targetWords.length;
    this.secretWord = this.targetWords[index].toLowerCase();
    return this.secretWord;
  }

  /**
   * Initializes a practice/free play puzzle with a random or specified target.
   */
  startPractice(customWord = null) {
    this.reset();
    this.isDaily = false;
    this.dateString = 'PRACTICE';
    this.dayNumber = 0;

    if (customWord && customWord.length === this.wordLength) {
      this.secretWord = customWord.toLowerCase();
    } else {
      const index = Math.floor(Math.random() * this.targetWords.length);
      this.secretWord = this.targetWords[index].toLowerCase();
    }
    return this.secretWord;
  }

  /**
   * Evaluates a guess against a target word using two-pass algorithm.
   * Returns array of { letter, status: 'correct' | 'present' | 'absent' }
   */
  static evaluateGuess(guess, target) {
    guess = guess.toLowerCase();
    target = target.toLowerCase();
    const len = target.length;
    const result = Array(len).fill(null);
    const targetCounts = {};

    // Count letters in target
    for (let i = 0; i < len; i++) {
      const c = target[i];
      targetCounts[c] = (targetCounts[c] || 0) + 1;
    }

    // Pass 1: exact matches (correct / green)
    for (let i = 0; i < len; i++) {
      if (guess[i] === target[i]) {
        result[i] = { letter: guess[i], status: 'correct' };
        targetCounts[guess[i]]--;
      }
    }

    // Pass 2: wrong-position matches (present / yellow) or absent (gray)
    for (let i = 0; i < len; i++) {
      if (result[i]) continue; // Already marked correct

      const g = guess[i];
      if (targetCounts[g] && targetCounts[g] > 0) {
        result[i] = { letter: g, status: 'present' };
        targetCounts[g]--;
      } else {
        result[i] = { letter: g, status: 'absent' };
      }
    }

    return result;
  }

  /**
   * Validates if a guess satisfies Hard Mode rules.
   */
  validateHardMode(guess) {
    if (!this.hardMode) return { valid: true };
    guess = guess.toLowerCase();

    // 1. Must use previously revealed green letters in exact position
    for (let i = 0; i < this.wordLength; i++) {
      const expectedChar = this.revealedHints.correct[i];
      if (expectedChar && guess[i] !== expectedChar) {
        const pos = i + 1;
        const ordinal = pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`;
        return {
          valid: false,
          message: `${ordinal} letter must be ${expectedChar.toUpperCase()}`
        };
      }
    }

    // 2. Must contain previously revealed yellow letters
    for (const char of this.revealedHints.present) {
      if (!guess.includes(char)) {
        return {
          valid: false,
          message: `Guess must contain ${char.toUpperCase()}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Submits a guess.
   * Returns: { success: boolean, message?: string, evaluation?: array, status?: string }
   */
  submitGuess(guess) {
    if (this.status !== 'IN_PROGRESS') {
      return { success: false, message: 'Game already finished' };
    }

    guess = (guess || '').trim().toLowerCase();
    if (guess.length !== this.wordLength) {
      return { success: false, message: 'Word must be 5 letters' };
    }

    if (!/^[a-z]+$/.test(guess)) {
      return { success: false, message: 'Only alphabetic letters allowed' };
    }

    // Check dictionary
    if (this.validWordsSet.size > 0 && !this.validWordsSet.has(guess)) {
      return { success: false, message: 'Not in word list' };
    }

    // Check Hard Mode constraints
    const hardCheck = this.validateHardMode(guess);
    if (!hardCheck.valid) {
      return { success: false, message: hardCheck.message };
    }

    // Evaluate
    const evaluation = WordleEngine.evaluateGuess(guess, this.secretWord);
    this.guesses.push(guess);
    this.evaluations.push(evaluation);

    // Update hints for Hard Mode
    evaluation.forEach((item, idx) => {
      if (item.status === 'correct') {
        this.revealedHints.correct[idx] = item.letter;
        this.revealedHints.present.delete(item.letter);
      } else if (item.status === 'present') {
        if (!this.revealedHints.correct.includes(item.letter)) {
          this.revealedHints.present.add(item.letter);
        }
      }
    });

    // Check Win/Loss
    if (guess === this.secretWord) {
      this.status = 'WON';
    } else if (this.guesses.length >= this.maxGuesses) {
      this.status = 'LOST';
    }

    return {
      success: true,
      evaluation,
      status: this.status,
      guessesRemaining: this.maxGuesses - this.guesses.length,
      secretWord: (this.status !== 'IN_PROGRESS') ? this.secretWord : null
    };
  }

  /**
   * Generates a shareable emoji scorecard string.
   */
  generateScorecard() {
    const title = this.isDaily
      ? `Wordle ${this.dayNumber} ${this.status === 'WON' ? this.guesses.length : 'X'}/${this.maxGuesses}${this.hardMode ? '*' : ''}`
      : `Wordle Practice ${this.status === 'WON' ? this.guesses.length : 'X'}/${this.maxGuesses}${this.hardMode ? '*' : ''}`;

    const rows = this.evaluations.map(row => {
      return row.map(cell => {
        if (cell.status === 'correct') return '🟩';
        if (cell.status === 'present') return '🟨';
        return '⬛';
      }).join('');
    });

    return `${title}\n\n${rows.join('\n')}\n\nRPDevs Arcade Vault`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordleEngine;
}
