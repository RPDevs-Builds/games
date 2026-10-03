/**
 * Retro Snake Core Engine
 * Manages grid physics, movement vectors, food generation, and collision detection.
 */

export const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export class SnakeEngine {
  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    const midX = Math.floor(this.width / 2);
    const midY = Math.floor(this.height / 2);

    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY }
    ];
    this.dir = DIRECTION.RIGHT;
    this.nextDir = DIRECTION.RIGHT;
    this.score = 0;
    this.gameOver = false;
    this.spawnFood();
  }

  setDirection(newDir) {
    // Prevent 180-degree self reversal
    if (this.dir.x + newDir.x === 0 && this.dir.y + newDir.y === 0) {
      return false;
    }
    this.nextDir = newDir;
    return true;
  }

  spawnFood() {
    const emptyCells = [];
    const snakeOccupied = new Set(this.snake.map(s => `${s.x},${s.y}`));

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (!snakeOccupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Board completely full (victory!)
      this.food = null;
      return;
    }

    const idx = Math.floor(Math.random() * emptyCells.length);
    this.food = emptyCells[idx];
  }

  tick() {
    if (this.gameOver) return { event: 'gameover' };

    this.dir = this.nextDir;
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.dir.x,
      y: head.y + this.dir.y
    };

    // Wall collision check
    if (newHead.x < 0 || newHead.x >= this.width || newHead.y < 0 || newHead.y >= this.height) {
      this.gameOver = true;
      return { event: 'collision_wall' };
    }

    // Self collision check
    for (let i = 0; i < this.snake.length - 1; i++) {
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.gameOver = true;
        return { event: 'collision_self' };
      }
    }

    this.snake.unshift(newHead);

    // Food check
    if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.spawnFood();
      return { event: 'eat', score: this.score };
    } else {
      this.snake.pop();
      return { event: 'move' };
    }
  }
}
