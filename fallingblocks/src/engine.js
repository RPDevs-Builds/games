/**
 * Falling Blocks (Tetromino 1984) Pure Core Game Engine
 * Standard 10x20 grid, 7-bag randomizer, SRS wall kicks,
 * ghost projection, hold piece, and combo scoring.
 */

export const COLS = 10;
export const ROWS = 20;

export const SHAPES = {
  I: {
    color: '#00f0f0',
    matrices: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    ]
  },
  O: {
    color: '#f0f000',
    matrices: [
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]]
    ]
  },
  T: {
    color: '#a000f0',
    matrices: [
      [[0,1,0],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,1],[0,1,0]],
      [[0,1,0],[1,1,0],[0,1,0]]
    ]
  },
  S: {
    color: '#00f000',
    matrices: [
      [[0,1,1],[1,1,0],[0,0,0]],
      [[0,1,0],[0,1,1],[0,0,1]],
      [[0,0,0],[0,1,1],[1,1,0]],
      [[1,0,0],[1,1,0],[0,1,0]]
    ]
  },
  Z: {
    color: '#f00000',
    matrices: [
      [[1,1,0],[0,1,1],[0,0,0]],
      [[0,0,1],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,0],[0,1,1]],
      [[0,1,0],[1,1,0],[1,0,0]]
    ]
  },
  J: {
    color: '#0000f0',
    matrices: [
      [[1,0,0],[1,1,1],[0,0,0]],
      [[0,1,1],[0,1,0],[0,1,0]],
      [[0,0,0],[1,1,1],[0,0,1]],
      [[0,1,0],[0,1,0],[1,1,0]]
    ]
  },
  L: {
    color: '#f0a000',
    matrices: [
      [[0,0,1],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,0],[0,1,1]],
      [[0,0,0],[1,1,1],[1,0,0]],
      [[1,1,0],[0,1,0],[0,1,0]]
    ]
  }
};

const KICKS_STANDARD = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [0, 1]
];

const KICKS_I = [
  [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, 1]
];

export class FallingBlocksEngine {
  constructor() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.bag = [];
    this.nextQueue = [];
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.backToBack = false;

    this.refillBag();
    // Pre-fill next queue with 3 pieces
    while (this.nextQueue.length < 3) {
      this.nextQueue.push(this.drawFromBag());
    }
    this.spawnPiece();
  }

  refillBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    // Fisher-Yates shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag = pieces;
  }

  drawFromBag() {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop();
  }

  spawnPiece(type = null) {
    const pieceType = type || this.nextQueue.shift();
    if (!type) {
      this.nextQueue.push(this.drawFromBag());
    }

    const shapeDef = SHAPES[pieceType];
    const initialRot = 0;
    const matrix = shapeDef.matrices[initialRot];
    
    // Spawn centered horizontally at top
    const x = Math.floor((COLS - matrix[0].length) / 2);
    const y = pieceType === 'I' ? -1 : 0;

    this.currentPiece = {
      type: pieceType,
      color: shapeDef.color,
      rotation: initialRot,
      x: x,
      y: y
    };

    this.canHold = true;

    // Check immediate game over collision
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.getCurrentMatrix())) {
      this.gameOver = true;
      return false;
    }
    return true;
  }

  getCurrentMatrix() {
    if (!this.currentPiece) return null;
    return SHAPES[this.currentPiece.type].matrices[this.currentPiece.rotation];
  }

  checkCollision(x, y, matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const boardX = x + c;
          const boardY = y + r;

          // Out of horizontal bounds
          if (boardX < 0 || boardX >= COLS) return true;
          // Floor collision
          if (boardY >= ROWS) return true;
          // Board piece collision (ignore above top bounds y < 0)
          if (boardY >= 0 && this.board[boardY][boardX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  moveLeft() {
    if (this.gameOver || this.isPaused || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, this.getCurrentMatrix())) {
      this.currentPiece.x--;
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.gameOver || this.isPaused || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, this.getCurrentMatrix())) {
      this.currentPiece.x++;
      return true;
    }
    return false;
  }

  rotateCW() {
    return this.rotate(1);
  }

  rotateCCW() {
    return this.rotate(-1);
  }

  rotate(dir = 1) {
    if (this.gameOver || this.isPaused || !this.currentPiece) return false;
    const type = this.currentPiece.type;
    if (type === 'O') return true; // O doesn't change

    const nextRot = (this.currentPiece.rotation + dir + 4) % 4;
    const nextMatrix = SHAPES[type].matrices[nextRot];
    const kicks = type === 'I' ? KICKS_I : KICKS_STANDARD;

    for (const [dx, dy] of kicks) {
      if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, nextMatrix)) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        this.currentPiece.rotation = nextRot;
        return true;
      }
    }
    return false;
  }

  softDrop() {
    if (this.gameOver || this.isPaused || !this.currentPiece) return { moved: false, locked: false, clearedLines: 0 };
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.getCurrentMatrix())) {
      this.currentPiece.y++;
      this.score += 1;
      return { moved: true, locked: false, clearedLines: 0 };
    }
    // Cannot move down, lock in place
    const res = this.lockPiece();
    return { moved: false, locked: true, clearedLines: res.clearedLines };
  }

  hardDrop() {
    if (this.gameOver || this.isPaused || !this.currentPiece) return { cellsDropped: 0, clearedLines: 0 };
    let cells = 0;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.getCurrentMatrix())) {
      this.currentPiece.y++;
      cells++;
    }
    this.score += cells * 2;
    const res = this.lockPiece();
    return { cellsDropped: cells, clearedLines: res.clearedLines };
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, gy + 1, this.getCurrentMatrix())) {
      gy++;
    }
    return gy;
  }

  hold() {
    if (this.gameOver || this.isPaused || !this.currentPiece || !this.canHold) {
      return false;
    }

    const currentType = this.currentPiece.type;
    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnPiece();
    } else {
      const prevHold = this.holdPiece;
      this.holdPiece = currentType;
      this.spawnPiece(prevHold);
    }
    this.canHold = false;
    return true;
  }

  lockPiece() {
    const matrix = this.getCurrentMatrix();
    let lockAboveTop = true;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const bx = this.currentPiece.x + c;
          const by = this.currentPiece.y + r;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            this.board[by][bx] = this.currentPiece.color;
            lockAboveTop = false;
          }
        }
      }
    }

    if (lockAboveTop) {
      this.gameOver = true;
      return { clearedLines: 0, gameOver: true };
    }

    const clearedLines = this.clearLines();
    this.currentPiece = null;

    if (!this.gameOver) {
      this.spawnPiece();
    }

    return { clearedLines: clearedLines, gameOver: this.gameOver };
  }

  clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== null)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(null));
        cleared++;
        r++; // check row at same index again since lines shifted down
      }
    }

    if (cleared > 0) {
      this.lines += cleared;
      const basePoints = [0, 100, 300, 500, 800];
      let pts = basePoints[cleared] || (cleared * 200);

      // Back-to-Back Tetris bonus
      if (cleared === 4) {
        if (this.backToBack) {
          pts = Math.floor(pts * 1.5);
        }
        this.backToBack = true;
      } else {
        this.backToBack = false;
      }

      this.score += pts * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
    }

    return cleared;
  }

  getDropInterval() {
    return Math.max(80, 800 - (this.level - 1) * 65);
  }

  reset() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.bag = [];
    this.nextQueue = [];
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.backToBack = false;

    this.refillBag();
    while (this.nextQueue.length < 3) {
      this.nextQueue.push(this.drawFromBag());
    }
    this.spawnPiece();
  }
}
