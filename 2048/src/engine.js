/**
 * 2048 Core Engine
 * Manages 4x4 matrix sliding, merging, tile spawning, and loss/win detection.
 */

export class Game2048Engine {
  constructor(size = 4) {
    this.size = size;
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.won = false;
    this.keepPlaying = false;
    this.gameOver = false;
    this.previousState = null;

    this.spawnTile();
    this.spawnTile();
  }

  saveState() {
    this.previousState = {
      grid: this.grid.map(row => [...row]),
      score: this.score,
      won: this.won,
      gameOver: this.gameOver
    };
  }

  undo() {
    if (!this.previousState) return false;
    this.grid = this.previousState.grid.map(row => [...row]);
    this.score = this.previousState.score;
    this.won = this.previousState.won;
    this.gameOver = this.previousState.gameOver;
    this.previousState = null;
    return true;
  }

  spawnTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) return null;

    const idx = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[idx];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c, val: this.grid[r][c] };
  }

  // Slide & merge a single line
  slideLine(line) {
    const nonZero = line.filter(v => v !== 0);
    const result = [];
    let scoreGained = 0;

    for (let i = 0; i < nonZero.length; i++) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        result.push(mergedVal);
        scoreGained += mergedVal;
        if (mergedVal === 2048 && !this.won) {
          this.won = true;
        }
        i++; // skip next tile
      } else {
        result.push(nonZero[i]);
      }
    }

    while (result.length < this.size) {
      result.push(0);
    }

    return { line: result, score: scoreGained };
  }

  move(direction) { // 'up', 'down', 'left', 'right'
    if (this.gameOver) return { moved: false };

    let moved = false;
    let scoreEarned = 0;
    const oldGrid = this.grid.map(row => [...row]);

    if (direction === 'left') {
      for (let r = 0; r < this.size; r++) {
        const res = this.slideLine(this.grid[r]);
        this.grid[r] = res.line;
        scoreEarned += res.score;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < this.size; r++) {
        const res = this.slideLine([...this.grid[r]].reverse());
        this.grid[r] = res.line.reverse();
        scoreEarned += res.score;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < this.size; c++) {
        const col = [];
        for (let r = 0; r < this.size; r++) col.push(this.grid[r][c]);
        const res = this.slideLine(col);
        for (let r = 0; r < this.size; r++) this.grid[r][c] = res.line[r];
        scoreEarned += res.score;
      }
    } else if (direction === 'down') {
      for (let c = 0; c < this.size; c++) {
        const col = [];
        for (let r = 0; r < this.size; r++) col.push(this.grid[r][c]);
        const res = this.slideLine(col.reverse());
        res.line.reverse();
        for (let r = 0; r < this.size; r++) this.grid[r][c] = res.line[r];
        scoreEarned += res.score;
      }
    }

    // Check if board changed
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (oldGrid[r][c] !== this.grid[r][c]) {
          moved = true;
          break;
        }
      }
    }

    if (moved) {
      this.previousState = {
        grid: oldGrid,
        score: this.score,
        won: this.won,
        gameOver: this.gameOver
      };
      this.score += scoreEarned;
      this.spawnTile();
      this.checkGameOver();
    }

    return { moved, scoreEarned, won: this.won && !this.keepPlaying, gameOver: this.gameOver };
  }

  checkGameOver() {
    // Check for empty cells
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }

    // Check for horizontal or vertical adjacent merges
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        if (c < this.size - 1 && this.grid[r][c + 1] === val) return false;
        if (r < this.size - 1 && this.grid[r + 1][c] === val) return false;
      }
    }

    this.gameOver = true;
    return true;
  }
}
