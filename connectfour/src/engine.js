/**
 * Connect Four Engine - Discrete 7x6 Grid State Machine & Alpha-Beta Minimax AI
 */

export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 0;
export const PLAYER_1 = 1; // Human / Red
export const PLAYER_2 = 2; // AI / Yellow

export class ConnectFourEngine {
  constructor() {
    this.reset();
  }

  reset() {
    // board[row][col] where row 0 is top and row 5 is bottom
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    this.turn = PLAYER_1;
    this.movesHistory = [];
    this.winner = null;
    this.winningCells = []; // [{r, c}, ...]
  }

  isValidColumn(col) {
    if (col < 0 || col >= COLS) return false;
    return this.board[0][col] === EMPTY;
  }

  getValidColumns() {
    // Preferred move ordering: center column outward for optimal pruning
    const preferredOrder = [3, 2, 4, 1, 5, 0, 6];
    return preferredOrder.filter(c => this.isValidColumn(c));
  }

  dropPiece(col, player = this.turn) {
    if (this.winner || !this.isValidColumn(col)) {
      return null;
    }

    // Gravity: find lowest unoccupied row
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === EMPTY) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return null;

    this.board[targetRow][col] = player;
    this.movesHistory.push({ r: targetRow, c: col, player });

    const winCheck = this.checkWinAt(targetRow, col, player);
    if (winCheck.won) {
      this.winner = player;
      this.winningCells = winCheck.cells;
    } else if (this.isBoardFull()) {
      this.winner = 'draw';
    } else {
      this.turn = (this.turn === PLAYER_1) ? PLAYER_2 : PLAYER_1;
    }

    return {
      row: targetRow,
      col,
      player,
      winner: this.winner,
      winningCells: this.winningCells
    };
  }

  undo() {
    if (this.movesHistory.length === 0) return null;
    const last = this.movesHistory.pop();
    this.board[last.r][last.c] = EMPTY;
    this.winner = null;
    this.winningCells = [];
    this.turn = last.player;
    return last;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== EMPTY);
  }

  checkWinAt(r, c, player) {
    const directions = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal \
      [1, -1]  // Diagonal /
    ];

    for (const [dr, dc] of directions) {
      const cells = [{ r, c }];

      // Positive direction
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.board[nr][nc] === player) {
          cells.push({ r: nr, c: nc });
          step++;
        } else {
          break;
        }
      }

      // Negative direction
      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.board[nr][nc] === player) {
          cells.push({ r: nr, c: nc });
          step++;
        } else {
          break;
        }
      }

      if (cells.length >= 4) {
        return { won: true, cells };
      }
    }

    return { won: false, cells: [] };
  }

  /* ========================================================================
     Minimax AI with Alpha-Beta Pruning
     ======================================================================== */

  getAIMove(difficulty = 'medium') {
    const valid = this.getValidColumns();
    if (valid.length === 0) return null;

    // Check for immediate winning move
    for (const col of valid) {
      if (this.simulateMove(col, PLAYER_2).won) return col;
    }

    // Check for immediate opponent block
    for (const col of valid) {
      if (this.simulateMove(col, PLAYER_1).won) return col;
    }

    if (difficulty === 'easy') {
      // 70% random, 30% center preference
      if (Math.random() < 0.5 && valid.includes(3)) return 3;
      return valid[Math.floor(Math.random() * valid.length)];
    }

    const depth = (difficulty === 'hard') ? 5 : 3;
    let bestScore = -Infinity;
    let bestCol = valid[0];

    for (const col of valid) {
      const row = this.simulateDrop(col, PLAYER_2);
      const score = this.minimax(depth - 1, -Infinity, Infinity, false);
      this.undoSimulatedDrop(row, col);

      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    }

    return bestCol;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    const winner = this.evaluateTerminal();
    if (winner === PLAYER_2) return 100000 + depth;
    if (winner === PLAYER_1) return -100000 - depth;
    if (this.isBoardFull() || depth === 0) {
      return this.evaluateHeuristic();
    }

    const valid = this.getValidColumns();

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const col of valid) {
        const row = this.simulateDrop(col, PLAYER_2);
        const score = this.minimax(depth - 1, alpha, beta, false);
        this.undoSimulatedDrop(row, col);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const col of valid) {
        const row = this.simulateDrop(col, PLAYER_1);
        const score = this.minimax(depth - 1, alpha, beta, true);
        this.undoSimulatedDrop(row, col);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minScore;
    }
  }

  simulateDrop(col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === EMPTY) {
        this.board[r][col] = player;
        return r;
      }
    }
    return -1;
  }

  undoSimulatedDrop(row, col) {
    if (row !== -1) {
      this.board[row][col] = EMPTY;
    }
  }

  simulateMove(col, player) {
    const r = this.simulateDrop(col, player);
    const win = (r !== -1) ? this.checkWinAt(r, col, player).won : false;
    this.undoSimulatedDrop(r, col);
    return { won: win };
  }

  evaluateTerminal() {
    // Quick scan for winner
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = this.board[r][c];
        if (p !== EMPTY && this.checkWinAt(r, c, p).won) {
          return p;
        }
      }
    }
    return null;
  }

  evaluateHeuristic() {
    let score = 0;

    // Center Column Control Bonus (Column 3)
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r][3] === PLAYER_2) score += 6;
      else if (this.board[r][3] === PLAYER_1) score -= 6;

      // Adjacent columns 2 and 4
      if (this.board[r][2] === PLAYER_2) score += 3;
      else if (this.board[r][2] === PLAYER_1) score -= 3;
      if (this.board[r][4] === PLAYER_2) score += 3;
      else if (this.board[r][4] === PLAYER_1) score -= 3;
    }

    // Windows of 4 evaluation
    score += this.evaluateWindows();
    return score;
  }

  evaluateWindows() {
    let score = 0;

    const evalWindow = (cells) => {
      let p2 = 0, p1 = 0, empty = 0;
      for (const val of cells) {
        if (val === PLAYER_2) p2++;
        else if (val === PLAYER_1) p1++;
        else empty++;
      }

      if (p2 === 4) return 10000;
      if (p2 === 3 && empty === 1) return 80;
      if (p2 === 2 && empty === 2) return 15;

      if (p1 === 3 && empty === 1) return -90; // Heavily penalize open opponent threat
      if (p1 === 2 && empty === 2) return -15;

      return 0;
    };

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evalWindow([this.board[r][c], this.board[r][c+1], this.board[r][c+2], this.board[r][c+3]]);
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        score += evalWindow([this.board[r][c], this.board[r+1][c], this.board[r+2][c], this.board[r+3][c]]);
      }
    }

    // Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evalWindow([this.board[r][c], this.board[r-1][c+1], this.board[r-2][c+2], this.board[r-3][c+3]]);
      }
    }

    // Diagonal Down-Right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evalWindow([this.board[r][c], this.board[r+1][c+1], this.board[r+2][c+2], this.board[r+3][c+3]]);
      }
    }

    return score;
  }
}
