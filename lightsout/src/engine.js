/**
 * Lights Out Core Engine
 * Implements grid physics, neighbor propagation, solvability analysis,
 * GF(2) Gaussian Elimination for optimal move computation,
 * Torus wrap-around topology, Lit-Out invert mode, and Daily Seed puzzles.
 */

export class LightsOutEngine {
  /**
   * @param {number} rows - Grid rows (default: 5)
   * @param {number} cols - Grid columns (default: 5)
   * @param {string} targetMode - 'off' (Lights Out) or 'on' (Lit-Out)
   * @param {boolean} wrapTopology - true for Torus wrap-around
   */
  constructor(rows = 5, cols = 5, targetMode = 'off', wrapTopology = false) {
    this.rows = Math.max(2, Math.min(8, rows));
    this.cols = Math.max(2, Math.min(8, cols));
    this.targetMode = targetMode; // 'off' or 'on'
    this.wrapTopology = wrapTopology;
    this.board = [];
    this.initialBoard = [];
    this.history = [];
    this.redoStack = [];
    this.moveCount = 0;
    this.initBoard();
  }

  /**
   * Initializes the board to all lights OFF (0).
   */
  initBoard() {
    this.board = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0)
    );
    this.initialBoard = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0)
    );
    this.history = [];
    this.redoStack = [];
    this.moveCount = 0;
  }

  /**
   * Clones a 2D grid array.
   */
  cloneBoard(grid = this.board) {
    return grid.map(row => [...row]);
  }

  /**
   * Check if coordinate is within grid bounds (or wraps if wrapTopology).
   */
  isValidCoord(r, c) {
    if (this.wrapTopology) return true;
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /**
   * Resolves row coordinate with wrapping if enabled.
   */
  normalizeRow(r) {
    if (!this.wrapTopology) return r;
    return (r % this.rows + this.rows) % this.rows;
  }

  /**
   * Resolves column coordinate with wrapping if enabled.
   */
  normalizeCol(c) {
    if (!this.wrapTopology) return c;
    return (c % this.cols + this.cols) % this.cols;
  }

  /**
   * Toggles the cell at (r, c) and its orthogonal neighbors.
   * @param {number} r - Row index
   * @param {number} c - Column index
   * @param {boolean} recordHistory - Whether to record in undo history
   * @returns {boolean} True if move was valid
   */
  toggle(r, c, recordHistory = true) {
    if (!this.isValidCoord(r, c)) return false;

    const actualR = this.normalizeRow(r);
    const actualC = this.normalizeCol(c);

    // Deltas: Center, Up, Down, Left, Right
    const deltas = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isValidCoord(nr, nc)) {
        const normR = this.normalizeRow(nr);
        const normC = this.normalizeCol(nc);
        this.board[normR][normC] ^= 1;
      }
    }

    if (recordHistory) {
      this.history.push({ r: actualR, c: actualC });
      this.redoStack = [];
      this.moveCount++;
    }

    return true;
  }

  /**
   * Undo the last move.
   */
  undo() {
    if (this.history.length === 0) return null;
    const lastMove = this.history.pop();
    this.toggle(lastMove.r, lastMove.c, false);
    this.redoStack.push(lastMove);
    this.moveCount = Math.max(0, this.moveCount - 1);
    return lastMove;
  }

  /**
   * Redo the last undone move.
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    const nextMove = this.redoStack.pop();
    this.toggle(nextMove.r, nextMove.c, false);
    this.history.push(nextMove);
    this.moveCount++;
    return nextMove;
  }

  /**
   * Resets the board back to the initial state of the current puzzle.
   */
  resetToInitial() {
    this.board = this.cloneBoard(this.initialBoard);
    this.history = [];
    this.redoStack = [];
    this.moveCount = 0;
  }

  /**
   * Returns true if target condition is met (all lights OFF in classic, or all ON in Lit-Out).
   */
  isSolved() {
    const targetVal = this.targetMode === 'on' ? 1 : 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] !== targetVal) return false;
      }
    }
    return true;
  }

  /**
   * Returns count of active (lit) lights.
   */
  activeCount() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] === 1) count++;
      }
    }
    return count;
  }

  /**
   * Scrambles the board by applying a random sequence of simulated button presses.
   * @param {number} steps - Number of scramble toggle operations
   * @param {Function} [rng=Math.random] - Custom PRNG function
   */
  scramble(steps = 10, rng = Math.random) {
    this.initBoard();
    const totalCells = this.rows * this.cols;
    const pressed = new Set();
    const targetPresses = Math.min(steps, totalCells);
    let attempts = 0;

    while (pressed.size < targetPresses && attempts < totalCells * 10) {
      attempts++;
      const index = Math.floor(rng() * totalCells);
      if (!pressed.has(index)) {
        pressed.add(index);
        const r = Math.floor(index / this.cols);
        const c = index % this.cols;
        this.toggle(r, c, false);
      }
    }

    // If already solved, toggle at least one cell
    if (this.isSolved()) {
      this.toggle(0, 0, false);
    }

    this.initialBoard = this.cloneBoard(this.board);
    this.history = [];
    this.redoStack = [];
    this.moveCount = 0;
  }

  /**
   * Deterministic seed PRNG (Mulberry32)
   */
  static createMulberry32(seed) {
    return function() {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Converts a date string (YYYY-MM-DD) into a numeric 32-bit integer seed.
   */
  static dateToSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  /**
   * Scrambles a deterministic Daily Challenge puzzle for the given date.
   */
  scrambleDaily(dateStr = new Date().toISOString().split('T')[0]) {
    const seed = LightsOutEngine.dateToSeed(dateStr);
    const rng = LightsOutEngine.createMulberry32(seed);
    this.rows = 5;
    this.cols = 5;
    this.targetMode = 'off';
    this.wrapTopology = false;
    this.scramble(9, rng);
    return dateStr;
  }

  /**
   * Computes 1D index from (r, c).
   */
  coordToIndex(r, c) {
    return r * this.cols + c;
  }

  /**
   * Computes (r, c) from 1D index.
   */
  indexToCoord(idx) {
    return {
      r: Math.floor(idx / this.cols),
      c: idx % this.cols
    };
  }

  /**
   * Constructs the toggle adjacency matrix A in GF(2) of dimension N x N.
   */
  buildAdjacencyMatrix() {
    const N = this.rows * this.cols;
    const A = Array.from({ length: N }, () => Array(N).fill(0));

    const deltas = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const j = this.coordToIndex(r, c); // pressing button j
        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (this.isValidCoord(nr, nc)) {
            const normR = this.normalizeRow(nr);
            const normC = this.normalizeCol(nc);
            const i = this.coordToIndex(normR, normC); // affects light i
            A[i][j] = 1;
          }
        }
      }
    }
    return A;
  }

  /**
   * Solves current board configuration using GF(2) Gaussian Elimination.
   * Supports both classic 'off' and inverted 'on' (Lit-Out) targets.
   * @returns {{moves: Array<{r: number, c: number}>, minClicks: number, solvable: boolean}|null}
   */
  solve() {
    const N = this.rows * this.cols;
    const A = this.buildAdjacencyMatrix();
    const targetBit = this.targetMode === 'on' ? 1 : 0;

    // Augmented matrix [A | b']
    // In GF(2), to reach target t: b + A x = t <=> A x = b + t
    const M = Array.from({ length: N }, (unused, i) => {
      const coord = this.indexToCoord(i);
      const currentBit = this.board[coord.r][coord.c];
      const diffBit = currentBit ^ targetBit;
      return [...A[i], diffBit];
    });

    const pivotRowForCol = Array(N).fill(-1);
    let currentRow = 0;

    for (let col = 0; col < N && currentRow < N; col++) {
      let pivot = -1;
      for (let r = currentRow; r < N; r++) {
        if (M[r][col] === 1) {
          pivot = r;
          break;
        }
      }

      if (pivot === -1) continue;

      if (pivot !== currentRow) {
        const temp = M[currentRow];
        M[currentRow] = M[pivot];
        M[pivot] = temp;
      }

      pivotRowForCol[col] = currentRow;

      for (let r = 0; r < N; r++) {
        if (r !== currentRow && M[r][col] === 1) {
          for (let k = col; k <= N; k++) {
            M[r][k] ^= M[currentRow][k];
          }
        }
      }
      currentRow++;
    }

    // Inconsistency check
    for (let r = currentRow; r < N; r++) {
      if (M[r][N] === 1) {
        return { moves: [], minClicks: 0, solvable: false };
      }
    }

    const freeCols = [];
    const pivotCols = [];
    for (let col = 0; col < N; col++) {
      if (pivotRowForCol[col] !== -1) {
        pivotCols.push(col);
      } else {
        freeCols.push(col);
      }
    }

    const numFree = freeCols.length;
    let bestSolution = null;
    let minWeight = Infinity;
    const totalCombinations = 1 << Math.min(numFree, 10); // guard cap

    for (let comb = 0; comb < totalCombinations; comb++) {
      const x = Array(N).fill(0);
      for (let i = 0; i < numFree; i++) {
        if ((comb >> i) & 1) {
          x[freeCols[i]] = 1;
        }
      }

      for (const col of pivotCols) {
        const r = pivotRowForCol[col];
        let val = M[r][N];
        for (const freeCol of freeCols) {
          if (M[r][freeCol] === 1) {
            val ^= x[freeCol];
          }
        }
        x[col] = val;
      }

      const weight = x.reduce((acc, v) => acc + v, 0);
      if (weight < minWeight) {
        minWeight = weight;
        bestSolution = [...x];
      }
    }

    const moves = [];
    if (bestSolution) {
      for (let i = 0; i < N; i++) {
        if (bestSolution[i] === 1) {
          moves.push(this.indexToCoord(i));
        }
      }
    }

    return {
      moves,
      minClicks: minWeight === Infinity ? 0 : minWeight,
      solvable: true
    };
  }

  /**
   * Provides next optimal hint move.
   */
  getHint() {
    if (this.isSolved()) return null;
    const sol = this.solve();
    if (!sol || !sol.solvable || sol.moves.length === 0) return null;

    const nextMove = sol.moves[0];
    return {
      r: nextMove.r,
      c: nextMove.c,
      totalMovesRemaining: sol.moves.length
    };
  }

  /**
   * Generates a Wordle-style copyable emoji result grid.
   */
  generateShareGrid(dateStr = '') {
    const title = dateStr ? `💡 Lights Out Daily (${dateStr})` : '💡 Lights Out Challenge';
    let text = `${title}\nSolved in ${this.moveCount} moves!\n\n`;

    for (let r = 0; r < this.rows; r++) {
      let rowStr = '';
      for (let c = 0; c < this.cols; c++) {
        rowStr += this.board[r][c] === 1 ? '🟨' : '⬛';
      }
      text += rowStr + '\n';
    }
    return text.trim();
  }

  /**
   * Serializes current state to string.
   */
  serialize() {
    const flatBits = this.board.map(row => row.join('')).join('');
    const wrap = this.wrapTopology ? '1' : '0';
    const target = this.targetMode === 'on' ? '1' : '0';
    return `${this.rows}x${this.cols}:${flatBits}:${this.moveCount}:${wrap}:${target}`;
  }

  /**
   * Restores state from string.
   */
  deserialize(str) {
    try {
      const parts = str.split(':');
      if (parts.length < 2) return false;

      const [dim, bits, movesStr, wrapStr, targetStr] = parts;
      const [rowsStr, colsStr] = dim.split('x');
      const rows = parseInt(rowsStr, 10);
      const cols = parseInt(colsStr, 10);

      if (bits.length !== rows * cols) return false;

      this.rows = rows;
      this.cols = cols;
      this.wrapTopology = wrapStr === '1';
      this.targetMode = targetStr === '1' ? 'on' : 'off';
      this.board = [];

      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(bits.charCodeAt(r * cols + c) === 49 ? 1 : 0);
        }
        this.board.push(row);
      }

      this.initialBoard = this.cloneBoard(this.board);
      this.history = [];
      this.redoStack = [];
      this.moveCount = movesStr ? parseInt(movesStr, 10) : 0;
      return true;
    } catch {
      return false;
    }
  }
}
