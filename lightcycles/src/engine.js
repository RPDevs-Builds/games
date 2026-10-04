/**
 * Tron Light Cycles Core Engine
 * 2 Light cycles leaving solid neon barrier walls, 90-degree instantaneous turns,
 * collision detection, boost mechanic, predictive pathfinding AI, and 2-Player mode.
 */

export const ARENA_COLS = 100;
export const ARENA_ROWS = 75;

export const EMPTY = 0;
export const WALL = 1;
export const P1_TRAIL = 2;
export const P2_TRAIL = 3;

export const DIRS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 }
};

export class LightCyclesEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: ARENA_ROWS }, () => new Uint8Array(ARENA_COLS));
    this.gameOver = false;
    this.winner = null; // null, 1 (P1), 2 (P2), or 'draw'

    // Boundary walls
    for (let c = 0; c < ARENA_COLS; c++) {
      this.grid[0][c] = WALL;
      this.grid[ARENA_ROWS - 1][c] = WALL;
    }
    for (let r = 0; r < ARENA_ROWS; r++) {
      this.grid[r][0] = WALL;
      this.grid[r][ARENA_COLS - 1] = WALL;
    }

    // Player 1 (Blue / Left)
    this.p1 = {
      x: 18,
      y: Math.floor(ARENA_ROWS / 2),
      dir: DIRS.RIGHT,
      nextDir: DIRS.RIGHT,
      alive: true,
      boost: 100,
      isBoosting: false,
      score: 0
    };

    // Player 2 (Orange / Right / CPU)
    this.p2 = {
      x: ARENA_COLS - 19,
      y: Math.floor(ARENA_ROWS / 2),
      dir: DIRS.LEFT,
      nextDir: DIRS.LEFT,
      alive: true,
      boost: 100,
      isBoosting: false,
      score: 0
    };

    // Plant initial positions
    this.grid[this.p1.y][this.p1.x] = P1_TRAIL;
    this.grid[this.p2.y][this.p2.x] = P2_TRAIL;
  }

  setDirection(playerNum, dirName) {
    const p = playerNum === 1 ? this.p1 : this.p2;
    const targetDir = DIRS[dirName];
    if (!targetDir) return;

    // Disallow 180-degree suicide reverse
    if (targetDir.dx !== -p.dir.dx || targetDir.dy !== -p.dir.dy) {
      p.nextDir = targetDir;
    }
  }

  setBoost(playerNum, boosting) {
    const p = playerNum === 1 ? this.p1 : this.p2;
    p.isBoosting = boosting && p.boost > 0;
  }

  update() {
    if (this.gameOver) return;

    // Apply next directions
    this.p1.dir = this.p1.nextDir;
    this.p2.dir = this.p2.nextDir;

    // Calculate next step
    const nx1 = this.p1.x + this.p1.dir.dx;
    const ny1 = this.p1.y + this.p1.dir.dy;

    const nx2 = this.p2.x + this.p2.dir.dx;
    const ny2 = this.p2.y + this.p2.dir.dy;

    // Check head-on collision
    if (nx1 === nx2 && ny1 === ny2) {
      this.p1.alive = false;
      this.p2.alive = false;
      this.finishGame('draw');
      return;
    }

    // Check collision for P1
    const p1Hits = this.grid[ny1][nx1] !== EMPTY;
    // Check collision for P2
    const p2Hits = this.grid[ny2][nx2] !== EMPTY;

    if (p1Hits && p2Hits) {
      this.p1.alive = false;
      this.p2.alive = false;
      this.finishGame('draw');
      return;
    } else if (p1Hits) {
      this.p1.alive = false;
      this.finishGame(2);
      return;
    } else if (p2Hits) {
      this.p2.alive = false;
      this.finishGame(1);
      return;
    }

    // Advance P1
    this.p1.x = nx1;
    this.p1.y = ny1;
    this.grid[ny1][nx1] = P1_TRAIL;
    if (this.p1.isBoosting) {
      this.p1.boost = Math.max(0, this.p1.boost - 1.5);
      if (this.p1.boost === 0) this.p1.isBoosting = false;
    } else {
      this.p1.boost = Math.min(100, this.p1.boost + 0.2);
    }

    // Advance P2
    this.p2.x = nx2;
    this.p2.y = ny2;
    this.grid[ny2][nx2] = P2_TRAIL;
    if (this.p2.isBoosting) {
      this.p2.boost = Math.max(0, this.p2.boost - 1.5);
      if (this.p2.boost === 0) this.p2.isBoosting = false;
    } else {
      this.p2.boost = Math.min(100, this.p2.boost + 0.2);
    }
  }

  finishGame(winner) {
    this.gameOver = true;
    this.winner = winner;
    if (winner === 1) this.p1.score++;
    else if (winner === 2) this.p2.score++;
  }

  /**
   * Predictive flood-fill/survival AI for Player 2
   */
  computeAIMove(difficulty = 'medium') {
    if (!this.p2.alive || this.gameOver) return;

    const currentDir = this.p2.dir;
    const possibleDirs = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT].filter(
      d => d.dx !== -currentDir.dx || d.dy !== -currentDir.dy
    );

    let bestDir = currentDir;
    let maxFreeSpace = -1;

    for (const d of possibleDirs) {
      const nx = this.p2.x + d.dx;
      const ny = this.p2.y + d.dy;

      if (this.grid[ny][nx] !== EMPTY) continue; // immediate death

      // Evaluate reachable open space using limited flood fill
      const space = this.floodFillLookahead(nx, ny, 25);
      if (space > maxFreeSpace) {
        maxFreeSpace = space;
        bestDir = d;
      }
    }

    this.p2.nextDir = bestDir;
  }

  floodFillLookahead(startX, startY, maxDepth = 25) {
    const queue = [[startX, startY, 0]];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    let count = 0;

    while (queue.length > 0 && count < maxDepth) {
      const [cx, cy, depth] = queue.shift();
      count++;
      if (depth >= maxDepth) break;

      for (const d of Object.values(DIRS)) {
        const nx = cx + d.dx;
        const ny = cy + d.dy;
        const key = `${nx},${ny}`;
        if (!visited.has(key) && this.grid[ny] && this.grid[ny][nx] === EMPTY) {
          visited.add(key);
          queue.push([nx, ny, depth + 1]);
        }
      }
    }

    return count;
  }
}
