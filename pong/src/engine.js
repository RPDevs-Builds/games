/**
 * Pong 1972 Classic Simulation Engine
 * Authentic Atari 1972 2D paddle-ball mechanics, velocity ramping, and predictive AI.
 */

export const ARENA_WIDTH = 640;
export const ARENA_HEIGHT = 480;

export const PADDLE_WIDTH = 12;
export const PADDLE_HEIGHT = 72;
export const BALL_SIZE = 12;

export const PADDLE_SPEED = 340; // px/sec
export const BALL_INITIAL_SPEED = 280; // px/sec
export const BALL_MAX_SPEED = 680; // px/sec
export const SPEED_RAMP = 1.05; // 5% speed increase per return

export const WINNING_SCORE = 11;

export class PongEngine {
  constructor(mode = '1p', difficulty = 'medium') {
    this.mode = mode; // '1p' (vs AI) or '2p' (local)
    this.difficulty = difficulty; // 'easy', 'medium', 'impossible'
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.winningScore = WINNING_SCORE;
    this.state = 'ready'; // 'ready', 'playing', 'point_scored', 'game_over'
    this.winner = null;

    // Paddle Positions
    this.paddle1 = {
      x: 24,
      y: (ARENA_HEIGHT - PADDLE_HEIGHT) / 2,
      vy: 0,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    };

    this.paddle2 = {
      x: ARENA_WIDTH - 24 - PADDLE_WIDTH,
      y: (ARENA_HEIGHT - PADDLE_HEIGHT) / 2,
      vy: 0,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    };

    // Ball
    this.ball = {
      x: (ARENA_WIDTH - BALL_SIZE) / 2,
      y: (ARENA_HEIGHT - BALL_SIZE) / 2,
      vx: 0,
      vy: 0,
      speed: BALL_INITIAL_SPEED,
      size: BALL_SIZE
    };

    this.serveDirection = 1; // 1 = toward P2, -1 = toward P1
    this.resetBall(this.serveDirection);
  }

  resetBall(direction = 1) {
    this.ball.x = (ARENA_WIDTH - BALL_SIZE) / 2;
    this.ball.y = (ARENA_HEIGHT - BALL_SIZE) / 2;
    this.ball.speed = BALL_INITIAL_SPEED;

    // Launch angle between -25 and +25 degrees
    const angle = (Math.random() * 50 - 25) * (Math.PI / 180);
    this.ball.vx = direction * this.ball.speed * Math.cos(angle);
    this.ball.vy = this.ball.speed * Math.sin(angle);
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  setMode(mode) {
    this.mode = mode;
  }

  resetGame() {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.winner = null;
    this.state = 'ready';
    this.paddle1.y = (ARENA_HEIGHT - PADDLE_HEIGHT) / 2;
    this.paddle2.y = (ARENA_HEIGHT - PADDLE_HEIGHT) / 2;
    this.serveDirection = Math.random() > 0.5 ? 1 : -1;
    this.resetBall(this.serveDirection);
  }

  start() {
    if (this.state === 'ready' || this.state === 'point_scored') {
      this.state = 'playing';
    }
  }

  // Set paddle input: -1 = up, 0 = idle, 1 = down
  setPaddle1Input(dir) {
    this.paddle1.vy = dir * PADDLE_SPEED;
  }

  setPaddle2Input(dir) {
    this.paddle2.vy = dir * PADDLE_SPEED;
  }

  // Direct positioning for touch/drag control
  setPaddle1Y(y) {
    this.paddle1.y = Math.max(0, Math.min(ARENA_HEIGHT - PADDLE_HEIGHT, y));
  }

  setPaddle2Y(y) {
    this.paddle2.y = Math.max(0, Math.min(ARENA_HEIGHT - PADDLE_HEIGHT, y));
  }

  updateAI(dt) {
    if (this.mode !== '1p') return;

    let targetY = (ARENA_HEIGHT - PADDLE_HEIGHT) / 2;
    let aiMaxSpeed = PADDLE_SPEED;

    if (this.difficulty === 'easy') {
      aiMaxSpeed = 190;
      // Easy AI only reacts when ball is on its side and has sluggish tracking
      if (this.ball.vx > 0 && this.ball.x > ARENA_WIDTH * 0.45) {
        targetY = this.ball.y - PADDLE_HEIGHT / 2 + 10;
      }
    } else if (this.difficulty === 'medium') {
      aiMaxSpeed = 275;
      if (this.ball.vx > 0) {
        targetY = this.ball.y - PADDLE_HEIGHT / 2;
      }
    } else if (this.difficulty === 'impossible') {
      aiMaxSpeed = PADDLE_SPEED + 40;
      if (this.ball.vx > 0) {
        // Project ball trajectory with wall reflections
        let simX = this.ball.x;
        let simY = this.ball.y;
        let simVx = this.ball.vx;
        let simVy = this.ball.vy;
        const targetX = this.paddle2.x;

        while (simX < targetX && simVx > 0) {
          const timeToWall = simVy > 0 ? (ARENA_HEIGHT - BALL_SIZE - simY) / simVy : -simY / simVy;
          const timeToPaddle = (targetX - simX) / simVx;

          if (timeToWall < timeToPaddle && timeToWall > 0) {
            simX += simVx * timeToWall;
            simY += simVy * timeToWall;
            simVy = -simVy;
          } else {
            simY += simVy * timeToPaddle;
            simX = targetX;
            break;
          }
        }
        targetY = simY - PADDLE_HEIGHT / 2;
      }
    }

    // Clamp paddle movement towards target
    const currentCenter = this.paddle2.y + PADDLE_HEIGHT / 2;
    const targetCenter = targetY + PADDLE_HEIGHT / 2;
    const diff = targetCenter - currentCenter;

    if (Math.abs(diff) > 4) {
      const step = Math.sign(diff) * Math.min(Math.abs(diff), aiMaxSpeed * dt);
      this.paddle2.y += step;
    }

    this.paddle2.y = Math.max(0, Math.min(ARENA_HEIGHT - PADDLE_HEIGHT, this.paddle2.y));
  }

  update(dt) {
    if (this.state !== 'playing') return { events: [] };

    const events = [];

    // 1. Move Paddles
    this.paddle1.y += this.paddle1.vy * dt;
    this.paddle1.y = Math.max(0, Math.min(ARENA_HEIGHT - PADDLE_HEIGHT, this.paddle1.y));

    if (this.mode === '2p') {
      this.paddle2.y += this.paddle2.vy * dt;
      this.paddle2.y = Math.max(0, Math.min(ARENA_HEIGHT - PADDLE_HEIGHT, this.paddle2.y));
    } else {
      this.updateAI(dt);
    }

    // 2. Move Ball
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // 3. Wall Collisions (Top & Bottom)
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy = -this.ball.vy;
      events.push({ type: 'bounce_wall', side: 'top' });
    } else if (this.ball.y + BALL_SIZE >= ARENA_HEIGHT) {
      this.ball.y = ARENA_HEIGHT - BALL_SIZE;
      this.ball.vy = -this.ball.vy;
      events.push({ type: 'bounce_wall', side: 'bottom' });
    }

    // 4. Paddle 1 (Left) Collision Check
    if (
      this.ball.vx < 0 &&
      this.ball.x <= this.paddle1.x + this.paddle1.width &&
      this.ball.x + BALL_SIZE >= this.paddle1.x &&
      this.ball.y + BALL_SIZE >= this.paddle1.y &&
      this.ball.y <= this.paddle1.y + this.paddle1.height
    ) {
      this.ball.x = this.paddle1.x + this.paddle1.width;
      this.ball.speed = Math.min(BALL_MAX_SPEED, this.ball.speed * SPEED_RAMP);

      // Deflection angle calculation (-50 to +50 deg)
      const paddleCenter = this.paddle1.y + this.paddle1.height / 2;
      const ballCenter = this.ball.y + BALL_SIZE / 2;
      const normalizedOffset = Math.max(-1, Math.min(1, (ballCenter - paddleCenter) / (this.paddle1.height / 2)));
      const bounceAngle = normalizedOffset * (50 * Math.PI / 180);

      this.ball.vx = this.ball.speed * Math.cos(bounceAngle);
      this.ball.vy = this.ball.speed * Math.sin(bounceAngle);
      events.push({ type: 'bounce_paddle', player: 1 });
    }

    // 5. Paddle 2 (Right) Collision Check
    if (
      this.ball.vx > 0 &&
      this.ball.x + BALL_SIZE >= this.paddle2.x &&
      this.ball.x <= this.paddle2.x + this.paddle2.width &&
      this.ball.y + BALL_SIZE >= this.paddle2.y &&
      this.ball.y <= this.paddle2.y + this.paddle2.height
    ) {
      this.ball.x = this.paddle2.x - BALL_SIZE;
      this.ball.speed = Math.min(BALL_MAX_SPEED, this.ball.speed * SPEED_RAMP);

      const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
      const ballCenter = this.ball.y + BALL_SIZE / 2;
      const normalizedOffset = Math.max(-1, Math.min(1, (ballCenter - paddleCenter) / (this.paddle2.height / 2)));
      const bounceAngle = normalizedOffset * (50 * Math.PI / 180);

      this.ball.vx = -this.ball.speed * Math.cos(bounceAngle);
      this.ball.vy = this.ball.speed * Math.sin(bounceAngle);
      events.push({ type: 'bounce_paddle', player: 2 });
    }

    // 6. Point Scored Checks
    if (this.ball.x + BALL_SIZE < 0) {
      // P2 Scores
      this.scoreP2++;
      this.serveDirection = -1; // Serve toward P1
      events.push({ type: 'point_scored', scorer: 2, scoreP1: this.scoreP1, scoreP2: this.scoreP2 });

      if (this.scoreP2 >= this.winningScore) {
        this.state = 'game_over';
        this.winner = 2;
        events.push({ type: 'game_over', winner: 2, scoreP1: this.scoreP1, scoreP2: this.scoreP2 });
      } else {
        this.state = 'point_scored';
        this.resetBall(this.serveDirection);
      }
    } else if (this.ball.x > ARENA_WIDTH) {
      // P1 Scores
      this.scoreP1++;
      this.serveDirection = 1; // Serve toward P2
      events.push({ type: 'point_scored', scorer: 1, scoreP1: this.scoreP1, scoreP2: this.scoreP2 });

      if (this.scoreP1 >= this.winningScore) {
        this.state = 'game_over';
        this.winner = 1;
        events.push({ type: 'game_over', winner: 1, scoreP1: this.scoreP1, scoreP2: this.scoreP2 });
      } else {
        this.state = 'point_scored';
        this.resetBall(this.serveDirection);
      }
    }

    return { events };
  }
}
