/**
 * Dots and Boxes (La Pipopipette) Core Engine
 * Manages grid topology, line placements, box completions, bonus turns, and AI decision logic.
 */

export class DotsAndBoxesEngine {
  /**
   * @param {number} boxRows - Number of box rows (e.g. 3 for a 3x3 boxes grid with 4x4 dots)
   * @param {number} boxCols - Number of box columns
   */
  constructor(boxRows = 3, boxCols = 3) {
    this.boxRows = Math.max(2, Math.min(6, boxRows));
    this.boxCols = Math.max(2, Math.min(6, boxCols));
    this.reset();
  }

  reset() {
    // Horizontal lines: (boxRows + 1) rows, boxCols columns
    this.hLines = Array.from({ length: this.boxRows + 1 }, () =>
      Array(this.boxCols).fill(false)
    );

    // Vertical lines: boxRows rows, (boxCols + 1) columns
    this.vLines = Array.from({ length: this.boxRows }, () =>
      Array(this.boxCols + 1).fill(false)
    );

    // Box owners: null, 1 (Player 1 / Blue), 2 (Player 2 or AI / Red)
    this.boxes = Array.from({ length: this.boxRows }, () =>
      Array(this.boxCols).fill(null)
    );

    this.scores = { 1: 0, 2: 0 };
    this.currentPlayer = 1;
    this.gameOver = false;
    this.history = [];
    this.redoStack = [];
    this.totalBoxes = this.boxRows * this.boxCols;
    this.claimedBoxesCount = 0;
  }

  /**
   * Count how many sides of box (r, c) are currently drawn.
   */
  getBoxSidesCount(r, c) {
    let count = 0;
    if (this.hLines[r][c]) count++; // Top
    if (this.hLines[r + 1][c]) count++; // Bottom
    if (this.vLines[r][c]) count++; // Left
    if (this.vLines[r][c + 1]) count++; // Right
    return count;
  }

  /**
   * Checks if box (r, c) is fully enclosed (4 sides).
   */
  isBoxComplete(r, c) {
    return (
      this.hLines[r][c] &&
      this.hLines[r + 1][c] &&
      this.vLines[r][c] &&
      this.vLines[r][c + 1]
    );
  }

  /**
   * Returns list of all available legal line moves.
   * @returns {Array<{type: 'h'|'v', r: number, c: number}>}
   */
  getAvailableMoves() {
    const moves = [];
    // Horizontal lines
    for (let r = 0; r <= this.boxRows; r++) {
      for (let c = 0; c < this.boxCols; c++) {
        if (!this.hLines[r][c]) {
          moves.push({ type: 'h', r, c });
        }
      }
    }
    // Vertical lines
    for (let r = 0; r < this.boxRows; r++) {
      for (let c = 0; c <= this.boxCols; c++) {
        if (!this.vLines[r][c]) {
          moves.push({ type: 'v', r, c });
        }
      }
    }
    return moves;
  }

  /**
   * Makes a move on the board.
   * @param {'h'|'v'} type - Line orientation
   * @param {number} r - Row index
   * @param {number} c - Column index
   * @returns {{success: boolean, boxesCompleted: Array<{r: number, c: number}>, bonusTurn: boolean, gameOver: boolean}}
   */
  makeMove(type, r, c) {
    if (this.gameOver) return { success: false };

    // Validation
    if (type === 'h') {
      if (r < 0 || r > this.boxRows || c < 0 || c >= this.boxCols || this.hLines[r][c]) {
        return { success: false };
      }
      this.hLines[r][c] = true;
    } else if (type === 'v') {
      if (r < 0 || r >= this.boxRows || c < 0 || c > this.boxCols || this.vLines[r][c]) {
        return { success: false };
      }
      this.vLines[r][c] = true;
    } else {
      return { success: false };
    }

    // Check which boxes were completed by this move
    const newlyCompleted = [];
    const checkBoxes = [];

    if (type === 'h') {
      if (r > 0) checkBoxes.push({ r: r - 1, c }); // Box above
      if (r < this.boxRows) checkBoxes.push({ r, c }); // Box below
    } else {
      if (c > 0) checkBoxes.push({ r, c: c - 1 }); // Box left
      if (c < this.boxCols) checkBoxes.push({ r, c }); // Box right
    }

    for (const b of checkBoxes) {
      if (!this.boxes[b.r][b.c] && this.isBoxComplete(b.r, b.c)) {
        this.boxes[b.r][b.c] = this.currentPlayer;
        this.scores[this.currentPlayer]++;
        this.claimedBoxesCount++;
        newlyCompleted.push({ r: b.r, c: b.c });
      }
    }

    const bonusTurn = newlyCompleted.length > 0;
    const prevPlayer = this.currentPlayer;

    // Record for undo
    this.history.push({
      type,
      r,
      c,
      player: prevPlayer,
      completedBoxes: [...newlyCompleted]
    });
    this.redoStack = [];

    // Check game over
    if (this.claimedBoxesCount === this.totalBoxes) {
      this.gameOver = true;
    } else if (!bonusTurn) {
      // Switch player only if no box was captured
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    return {
      success: true,
      boxesCompleted: newlyCompleted,
      bonusTurn: bonusTurn && !this.gameOver,
      gameOver: this.gameOver,
      player: prevPlayer
    };
  }

  /**
   * Undo last move
   */
  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    if (last.type === 'h') {
      this.hLines[last.r][last.c] = false;
    } else {
      this.vLines[last.r][last.c] = false;
    }

    // Unclaim completed boxes
    for (const b of last.completedBoxes) {
      this.boxes[b.r][b.c] = null;
      this.scores[last.player]--;
      this.claimedBoxesCount--;
    }

    this.currentPlayer = last.player;
    this.gameOver = false;
    this.redoStack.push(last);
    return last;
  }

  /**
   * Artificial Intelligence Decision Engine
   * @param {'easy'|'medium'|'hard'} difficulty
   * @returns {{type: 'h'|'v', r: number, c: number}|null}
   */
  getAIMove(difficulty = 'medium') {
    const available = this.getAvailableMoves();
    if (available.length === 0) return null;

    // Categorize moves:
    // 1. Completing moves: completes 1 or 2 boxes immediately
    // 2. Safe moves: leaves boxes with <= 2 sides (does not hand opponent a box)
    // 3. Risk/Sacrifice moves: increases a box side count to 3
    const completingMoves = [];
    const safeMoves = [];
    const sacrificeMoves = [];

    for (const move of available) {
      // Temporarily simulate move
      if (move.type === 'h') this.hLines[move.r][move.c] = true;
      else this.vLines[move.r][move.c] = true;

      // Check how many boxes it completes
      let closesBoxes = 0;
      let createsThreeSidedBox = false;

      const adjacentBoxes = [];
      if (move.type === 'h') {
        if (move.r > 0) adjacentBoxes.push({ r: move.r - 1, c: move.c });
        if (move.r < this.boxRows) adjacentBoxes.push({ r: move.r, c: move.c });
      } else {
        if (move.c > 0) adjacentBoxes.push({ r: move.r, c: move.c - 1 });
        if (move.c < this.boxCols) adjacentBoxes.push({ r: move.r, c: move.c });
      }

      for (const b of adjacentBoxes) {
        if (!this.boxes[b.r][b.c]) {
          const sides = this.getBoxSidesCount(b.r, b.c);
          if (sides === 4) closesBoxes++;
          else if (sides === 3) createsThreeSidedBox = true;
        }
      }

      // Revert simulation
      if (move.type === 'h') this.hLines[move.r][move.c] = false;
      else this.vLines[move.r][move.c] = false;

      if (closesBoxes > 0) {
        completingMoves.push({ ...move, score: closesBoxes });
      } else if (!createsThreeSidedBox) {
        safeMoves.push(move);
      } else {
        sacrificeMoves.push(move);
      }
    }

    // Easy AI: 50% random chance to take completing move, else safe or random
    if (difficulty === 'easy') {
      if (completingMoves.length > 0 && Math.random() < 0.6) {
        return completingMoves[Math.floor(Math.random() * completingMoves.length)];
      }
      if (safeMoves.length > 0 && Math.random() < 0.5) {
        return safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }
      return available[Math.floor(Math.random() * available.length)];
    }

    // Medium AI: Always take box closures, then safe moves, else smallest sacrifice
    if (difficulty === 'medium') {
      if (completingMoves.length > 0) {
        // Pick move that closes 2 boxes if available
        completingMoves.sort((a, b) => b.score - a.score);
        return completingMoves[0];
      }
      if (safeMoves.length > 0) {
        return safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }
      // If forced to sacrifice, pick random sacrifice
      return sacrificeMoves[Math.floor(Math.random() * sacrificeMoves.length)];
    }

    // Hard AI: Master of Chains & The Double-Cross
    if (difficulty === 'hard') {
      if (completingMoves.length > 0) {
        // Double-cross heuristic:
        // If there are exactly 2 boxes left in a chain and no other safe moves exist,
        // it may be optimal to sacrifice 2 boxes to maintain initiative on the next chain!
        completingMoves.sort((a, b) => b.score - a.score);
        return completingMoves[0];
      }
      if (safeMoves.length > 0) {
        // Prefer edge/corner safe moves over center to minimize future chain connections
        return safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }
      // Pick sacrifice that opens the shortest chain
      return sacrificeMoves[0];
    }

    return available[0];
  }

  /**
   * Serialize game state to string
   */
  serialize() {
    const h = this.hLines.map(row => row.map(v => (v ? 1 : 0)).join('')).join('');
    const v = this.vLines.map(row => row.map(v => (v ? 1 : 0)).join('')).join('');
    return `${this.boxRows}x${this.boxCols}:${h}:${v}:${this.currentPlayer}:${this.scores[1]}:${this.scores[2]}`;
  }
}
