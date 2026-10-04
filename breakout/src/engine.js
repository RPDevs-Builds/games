/**
 * Breakout Pure Game & Physics Engine
 * Authentic 1976 2D paddle-ball mechanics with angular deflection and discrete collision.
 */

export const ARENA_WIDTH = 480;
export const ARENA_HEIGHT = 640;
export const BRICK_ROWS = 8;
export const BRICK_COLS = 8;

export const ROW_CONFIG = [
  { color: '#e74c3c', points: 7, speedBoost: 1.15 }, // Red
  { color: '#e74c3c', points: 7, speedBoost: 1.15 },
  { color: '#e67e22', points: 5, speedBoost: 1.05 }, // Orange
  { color: '#e67e22', points: 5, speedBoost: 1.05 },
  { color: '#2ecc71', points: 3, speedBoost: 1.0 },  // Green
  { color: '#2ecc71', points: 3, speedBoost: 1.0 },
  { color: '#f1c40f', points: 1, speedBoost: 1.0 },  // Yellow
  { color: '#f1c40f', points: 1, speedBoost: 1.0 }
];

export class BreakoutEngine {
  constructor() {
    this.width = ARENA_WIDTH;
    this.height = ARENA_HEIGHT;

    this.paddleWidth = 84;
    this.paddleHeight = 14;
    this.paddleY = 600;
    this.paddleSpeed = 10;

    this.ballRadius = 6;
    this.baseSpeed = 6.0;
    this.maxSpeed = 11.0;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;

    this.paddleX = (this.width - this.paddleWidth) / 2;

    this.initBricks();
    this.resetBall();
  }

  initBricks() {
    this.bricks = [];
    const sideMargin = 20;
    const topMargin = 70;
    const spacingX = 5;
    const spacingY = 6;
    const brickW = (this.width - (sideMargin * 2) - (spacingX * (BRICK_COLS - 1))) / BRICK_COLS;
    const brickH = 15;

    for (let r = 0; r < BRICK_ROWS; r++) {
      const cfg = ROW_CONFIG[r];
      for (let c = 0; c < BRICK_COLS; c++) {
        const x = sideMargin + c * (brickW + spacingX);
        const y = topMargin + r * (brickH + spacingY);
        this.bricks.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          x,
          y,
          w: brickW,
          h: brickH,
          color: cfg.color,
          points: cfg.points,
          speedBoost: cfg.speedBoost,
          alive: true
        });
      }
    }
    this.remainingBricks = this.bricks.length;
  }

  resetBall() {
    this.ballAttached = true;
    this.ballSpeed = this.baseSpeed;
    this.ballX = this.paddleX + this.paddleWidth / 2;
    this.ballY = this.paddleY - this.ballRadius;
    this.ballVx = 0;
    this.ballVy = 0;
  }

  launchBall() {
    if (!this.ballAttached || this.gameOver || this.gameWon) return false;
    this.ballAttached = false;
    // Launch at a slight 60-degree angle upward
    const angle = (Math.random() * 0.4 - 0.2) - Math.PI / 2;
    this.ballVx = this.ballSpeed * Math.cos(angle);
    this.ballVy = this.ballSpeed * Math.sin(angle);
    return true;
  }

  movePaddle(dx) {
    if (this.gameOver || this.gameWon) return;
    this.paddleX = Math.max(0, Math.min(this.width - this.paddleWidth, this.paddleX + dx));
    if (this.ballAttached) {
      this.ballX = this.paddleX + this.paddleWidth / 2;
    }
  }

  setPaddlePosition(targetCenterX) {
    if (this.gameOver || this.gameWon) return;
    const newX = targetCenterX - this.paddleWidth / 2;
    this.paddleX = Math.max(0, Math.min(this.width - this.paddleWidth, newX));
    if (this.ballAttached) {
      this.ballX = this.paddleX + this.paddleWidth / 2;
    }
  }

  tick() {
    if (this.gameOver || this.gameWon) return { event: 'none' };

    if (this.ballAttached) {
      this.ballX = this.paddleX + this.paddleWidth / 2;
      return { event: 'attached' };
    }

    // Move ball
    this.ballX += this.ballVx;
    this.ballY += this.ballVy;

    const events = [];

    // Wall collisions (Left & Right)
    if (this.ballX - this.ballRadius <= 0) {
      this.ballX = this.ballRadius;
      this.ballVx = Math.abs(this.ballVx);
      events.push('wall_hit');
    } else if (this.ballX + this.ballRadius >= this.width) {
      this.ballX = this.width - this.ballRadius;
      this.ballVx = -Math.abs(this.ballVx);
      events.push('wall_hit');
    }

    // Top wall collision
    if (this.ballY - this.ballRadius <= 0) {
      this.ballY = this.ballRadius;
      this.ballVy = Math.abs(this.ballVy);
      events.push('wall_hit');
    }

    // Bottom loss
    if (this.ballY - this.ballRadius >= this.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver = true;
        return { event: 'game_over', score: this.score };
      }
      this.resetBall();
      return { event: 'life_lost', remainingLives: this.lives };
    }

    // Paddle collision
    if (
      this.ballVy > 0 &&
      this.ballY + this.ballRadius >= this.paddleY &&
      this.ballY - this.ballRadius <= this.paddleY + this.paddleHeight &&
      this.ballX + this.ballRadius >= this.paddleX &&
      this.ballX - this.ballRadius <= this.paddleX + this.paddleWidth
    ) {
      // Angular deflection based on where on paddle ball landed [-1.0, 1.0]
      const hitRel = (this.ballX - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
      const clampedRel = Math.max(-0.95, Math.min(0.95, hitRel));
      const maxBounceAngle = (65 * Math.PI) / 180;
      const bounceAngle = clampedRel * maxBounceAngle;

      this.ballVx = this.ballSpeed * Math.sin(bounceAngle);
      this.ballVy = -this.ballSpeed * Math.cos(bounceAngle);
      this.ballY = this.paddleY - this.ballRadius;
      events.push('paddle_hit');
    }

    // Brick collisions
    let hitBrick = null;
    for (const b of this.bricks) {
      if (!b.alive) continue;

      if (
        this.ballX + this.ballRadius >= b.x &&
        this.ballX - this.ballRadius <= b.x + b.w &&
        this.ballY + this.ballRadius >= b.y &&
        this.ballY - this.ballRadius <= b.y + b.h
      ) {
        b.alive = false;
        hitBrick = b;
        this.remainingBricks--;
        this.score += b.points;

        // Speed up when reaching higher tier bricks
        if (b.speedBoost > 1.0) {
          this.ballSpeed = Math.min(this.maxSpeed, this.ballSpeed * b.speedBoost);
        }

        // Determine deflection axis
        const prevX = this.ballX - this.ballVx;
        const prevY = this.ballY - this.ballVy;

        if (prevX + this.ballRadius < b.x || prevX - this.ballRadius > b.x + b.w) {
          this.ballVx = -this.ballVx;
        } else {
          this.ballVy = -this.ballVy;
        }

        events.push('brick_hit');
        break; // Max 1 brick per tick to prevent penetration artifacts
      }
    }

    if (this.remainingBricks === 0) {
      this.gameWon = true;
      return { event: 'game_won', score: this.score };
    }

    return {
      event: events.length > 0 ? events[0] : 'step',
      brick: hitBrick,
      score: this.score
    };
  }
}
