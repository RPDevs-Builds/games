/**
 * Simon Game Logic Engine
 */

export const COLORS = ['green', 'red', 'yellow', 'blue'];

export class SimonEngine {
  constructor(strict = false) {
    this.strict = strict;
    this.sequence = [];
    this.playerStep = 0;
    this.highScore = 0;
    this.gameOver = false;
  }

  start() {
    this.sequence = [];
    this.playerStep = 0;
    this.gameOver = false;
    this.addStep();
    return this.sequence;
  }

  addStep() {
    const nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.sequence.push(nextColor);
    this.playerStep = 0;
    return nextColor;
  }

  handlePlayerInput(color) {
    if (this.gameOver || this.sequence.length === 0) {
      return { status: 'inactive' };
    }

    const expectedColor = this.sequence[this.playerStep];

    if (color !== expectedColor) {
      this.gameOver = true;
      return {
        status: 'error',
        round: this.sequence.length,
        expected: expectedColor,
        strict: this.strict
      };
    }

    this.playerStep++;

    // Completed full sequence for this round!
    if (this.playerStep === this.sequence.length) {
      const currentScore = this.sequence.length;
      if (currentScore > this.highScore) {
        this.highScore = currentScore;
      }
      this.addStep();
      return {
        status: 'round_complete',
        nextRound: this.sequence.length,
        sequence: [...this.sequence]
      };
    }

    return {
      status: 'step_ok',
      remainingInRound: this.sequence.length - this.playerStep
    };
  }

  getSpeed() {
    const len = this.sequence.length;
    if (len < 5) return 420;
    if (len < 9) return 320;
    if (len < 13) return 240;
    return 180;
  }
}
