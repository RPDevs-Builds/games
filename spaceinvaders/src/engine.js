/**
 * Space Invaders (1978) Core Simulation Engine
 * Recreates the iconic 5x11 marching alien matrix, accelerating 4-tone tempo,
 * destructible pixel-erosion bunkers, mystery flying saucer, and single-shot cannon.
 */

export const WIDTH = 480;
export const HEIGHT = 600;

export const ALIEN_CONFIG = {
  squid: { row: 0, points: 30, width: 24, height: 18, color: '#f0f6fc' },
  crab: { rows: [1, 2], points: 20, width: 28, height: 18, color: '#00f0ff' },
  octopus: { rows: [3, 4], points: 10, width: 30, height: 18, color: '#39ff14' }
};

export class SpaceInvadersEngine {
  constructor(options = {}) {
    this.options = options;
    this.onScore = options.onScore || (() => {});
    this.onLives = options.onLives || (() => {});
    this.onWave = options.onWave || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onSound = options.onSound || (() => {});
    this.onAchievement = options.onAchievement || (() => {});

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.state = 'PLAYING'; // PLAYING, PLAYER_DYING, WAVE_CLEARED, GAME_OVER
    this.deathTimer = 0;
    this.waveClearTimer = 0;

    this.player = {
      x: WIDTH / 2 - 14,
      y: HEIGHT - 54,
      width: 28,
      height: 16,
      speed: 3.5,
      isDying: false
    };

    this.playerLaser = null; // Max 1 active player laser
    this.alienBombs = [];
    this.maxAlienBombs = 3;

    this.ufo = null;
    this.ufoTimer = this.getUfoSpawnInterval();

    this.explosions = []; // { x, y, width, height, type, timer }
    this.floatingScores = []; // { x, y, text, timer }

    this.stats = {
      aliensDestroyed: 0,
      ufosDestroyed: 0,
      shotsFired: 0,
      shotsHit: 0,
      bunkersSurviving: 4
    };

    this.initBunkers();
    this.initWave(this.wave);
  }

  initBunkers() {
    this.bunkers = [];
    const count = 4;
    const bunkerWidth = 48;
    const bunkerHeight = 36;
    const spacing = (WIDTH - (count * bunkerWidth)) / (count + 1);
    const startY = HEIGHT - 130;

    for (let i = 0; i < count; i++) {
      const bx = spacing + i * (bunkerWidth + spacing);
      // 12 cols x 9 rows grid of chunks (each chunk 4x4 px)
      const cols = 12;
      const rows = 9;
      const chunkW = 4;
      const chunkH = 4;
      const chunks = [];

      for (let r = 0; r < rows; r++) {
        chunks[r] = [];
        for (let c = 0; c < cols; c++) {
          // Classic bunker shape with top rounded notch and bottom arch cutout
          let active = true;
          // Top-left and top-right slant/notch
          if ((r === 0 && (c < 3 || c >= cols - 3)) ||
              (r === 1 && (c < 1 || c >= cols - 1))) {
            active = false;
          }
          // Bottom arch opening: middle 4 cols, bottom 3 rows
          if (r >= rows - 3 && c >= 4 && c <= 7) {
            active = false;
          }
          chunks[r][c] = active ? 1 : 0;
        }
      }

      this.bunkers.push({
        x: bx,
        y: startY,
        width: bunkerWidth,
        height: bunkerHeight,
        cols,
        rows,
        chunkW,
        chunkH,
        chunks
      });
    }
  }

  initWave(waveNum) {
    this.wave = waveNum;
    this.onWave(this.wave);

    this.aliens = [];
    const cols = 11;
    const rows = 5;
    const startX = 36;
    // Lower start position on higher waves, up to wave 6
    const baseStartY = 70 + Math.min(waveNum - 1, 5) * 16;
    const spacingX = 36;
    const spacingY = 28;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'octopus';
        let points = 10;
        let w = 26;
        let h = 18;
        if (r === 0) {
          type = 'squid';
          points = 30;
          w = 22;
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          w = 26;
        }

        this.aliens.push({
          row: r,
          col: c,
          x: startX + c * spacingX,
          y: baseStartY + r * spacingY,
          width: w,
          height: h,
          type,
          points,
          alive: true
        });
      }
    }

    this.alienDirection = 1; // 1 = right, -1 = left
    this.alienStepDown = false;
    this.alienStepX = 10;
    this.alienStepY = 16;
    this.alienAnimFrame = 0;
    this.heartbeatTone = 0;

    // Movement timer: dynamically accelerates as aliens are eliminated
    this.totalAliens = 55;
    this.stepTimer = 0;
    this.stepInterval = this.calculateStepInterval();

    this.playerLaser = null;
    this.alienBombs = [];
    this.ufo = null;
    this.ufoTimer = this.getUfoSpawnInterval();
  }

  getAliveAliens() {
    return this.aliens.filter(a => a.alive);
  }

  calculateStepInterval() {
    const alive = this.getAliveAliens().length;
    if (alive <= 1) return 3; // Rapid furious rush
    if (alive <= 5) return 8;
    if (alive <= 10) return 14;
    if (alive <= 20) return 22;
    if (alive <= 35) return 34;
    if (alive <= 45) return 44;
    return 52; // Initial leisurely march
  }

  getUfoSpawnInterval() {
    // Spawns every 18-25 seconds (1080 - 1500 frames at 60fps)
    return Math.floor(1000 + Math.random() * 500);
  }

  update(input = {}) {
    // Update visual explosions and floating scores
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer--;
      if (this.explosions[i].timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      this.floatingScores[i].timer--;
      this.floatingScores[i].y -= 0.5;
      if (this.floatingScores[i].timer <= 0) {
        this.floatingScores.splice(i, 1);
      }
    }

    if (this.state === 'GAME_OVER') return;

    if (this.state === 'PLAYER_DYING') {
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        if (this.lives <= 0) {
          this.state = 'GAME_OVER';
          this.onGameOver(this.score);
        } else {
          this.state = 'PLAYING';
          this.player.isDying = false;
          this.player.x = WIDTH / 2 - 14;
          this.alienBombs = [];
          if (this.playerLaser) this.playerLaser = null;
        }
      }
      return;
    }

    if (this.state === 'WAVE_CLEARED') {
      this.waveClearTimer--;
      if (this.waveClearTimer <= 0) {
        this.initWave(this.wave + 1);
        this.state = 'PLAYING';
      }
      return;
    }

    // Normal gameplay
    this.handlePlayerInput(input);
    this.updatePlayerLaser();
    this.updateAlienFleet();
    this.updateAlienBombs();
    this.updateUfo();
    this.checkAlienInvasion();
  }

  handlePlayerInput(input) {
    if (input.left && this.player.x > 16) {
      this.player.x -= this.player.speed;
    }
    if (input.right && this.player.x < WIDTH - 16 - this.player.width) {
      this.player.x += this.player.speed;
    }

    if (input.fire && !this.playerLaser) {
      this.firePlayerLaser();
    }
  }

  firePlayerLaser() {
    this.playerLaser = {
      x: this.player.x + this.player.width / 2 - 1.5,
      y: this.player.y - 8,
      width: 3,
      height: 10,
      speed: 7
    };
    this.stats.shotsFired++;
    this.onSound('laser');
  }

  updatePlayerLaser() {
    if (!this.playerLaser) return;

    this.playerLaser.y -= this.playerLaser.speed;

    // Check hit top border
    if (this.playerLaser.y <= 42) {
      this.explosions.push({
        x: this.playerLaser.x - 3,
        y: this.playerLaser.y,
        width: 8,
        height: 6,
        type: 'splash',
        timer: 6
      });
      this.playerLaser = null;
      return;
    }

    // Check hit UFO
    if (this.ufo && this.checkCollision(this.playerLaser, this.ufo)) {
      this.destroyUfo();
      this.playerLaser = null;
      return;
    }

    // Check hit bunker
    if (this.damageBunkers(this.playerLaser, 'up')) {
      this.playerLaser = null;
      return;
    }

    // Check hit alien bomb
    for (let i = this.alienBombs.length - 1; i >= 0; i--) {
      const bomb = this.alienBombs[i];
      if (this.checkCollision(this.playerLaser, bomb)) {
        this.explosions.push({
          x: bomb.x - 4,
          y: bomb.y - 4,
          width: 10,
          height: 10,
          type: 'splash',
          timer: 8
        });
        this.alienBombs.splice(i, 1);
        this.playerLaser = null;
        this.onSound('bomb_intercept');
        return;
      }
    }

    // Check hit alien
    const aliveAliens = this.getAliveAliens();
    for (const alien of aliveAliens) {
      if (this.checkCollision(this.playerLaser, alien)) {
        alien.alive = false;
        this.score += alien.points;
        this.onScore(this.score);
        this.stats.aliensDestroyed++;
        this.stats.shotsHit++;

        if (this.stats.aliensDestroyed === 1) {
          this.onAchievement('invaders_first_kill');
        }
        if (this.score >= 3000) {
          this.onAchievement('invaders_score_3000');
        }

        this.explosions.push({
          x: alien.x,
          y: alien.y,
          width: alien.width,
          height: alien.height,
          type: 'alien',
          timer: 12
        });

        this.onSound('alien_hit');
        this.playerLaser = null;

        // Accelerate fleet interval immediately
        this.stepInterval = this.calculateStepInterval();

        // Check wave clear
        if (this.getAliveAliens().length === 0) {
          this.handleWaveClear();
        }
        return;
      }
    }
  }

  handleWaveClear() {
    this.state = 'WAVE_CLEARED';
    this.waveClearTimer = 120; // 2 seconds celebration
    this.onAchievement('invaders_wave_clear');

    // Count surviving bunkers
    let survivingBunkers = 0;
    for (const bunker of this.bunkers) {
      let remainingPixels = 0;
      for (let r = 0; r < bunker.rows; r++) {
        for (let c = 0; c < bunker.cols; c++) {
          if (bunker.chunks[r][c] === 1) remainingPixels++;
        }
      }
      if (remainingPixels > 15) survivingBunkers++;
    }
    if (survivingBunkers === 4) {
      this.onAchievement('invaders_bunker_master');
    }

    this.onSound('wave_clear');
  }

  updateAlienFleet() {
    const aliveAliens = this.getAliveAliens();
    if (aliveAliens.length === 0) return;

    this.stepTimer++;
    if (this.stepTimer < this.stepInterval) return;

    this.stepTimer = 0;
    this.alienAnimFrame = 1 - this.alienAnimFrame;

    // Trigger authentic 4-tone descending heartbeat audio
    this.onSound(`heartbeat_${this.heartbeatTone}`);
    this.heartbeatTone = (this.heartbeatTone + 1) % 4;

    // Check if edge reached on previous horizontal step
    if (this.alienStepDown) {
      for (const alien of aliveAliens) {
        alien.y += this.alienStepY;
      }
      this.alienDirection *= -1;
      this.alienStepDown = false;
      return;
    }

    // Normal horizontal march
    let edgeReached = false;
    for (const alien of aliveAliens) {
      alien.x += this.alienStepX * this.alienDirection;
      if (this.alienDirection > 0 && alien.x + alien.width >= WIDTH - 20) {
        edgeReached = true;
      } else if (this.alienDirection < 0 && alien.x <= 20) {
        edgeReached = true;
      }
    }

    if (edgeReached) {
      this.alienStepDown = true;
    }

    // Crush bunkers if aliens overlap them
    for (const alien of aliveAliens) {
      for (const bunker of this.bunkers) {
        if (this.checkCollision(alien, bunker)) {
          this.erodeBunkerArea(bunker, alien.x + alien.width / 2, alien.y + alien.height / 2, 14);
        }
      }
    }

    // Attempt dropping alien bomb
    this.maybeDropAlienBomb(aliveAliens);
  }

  maybeDropAlienBomb(aliveAliens) {
    if (this.alienBombs.length >= this.maxAlienBombs) return;

    // Probability scales inversely with alive count
    const dropOdds = Math.max(8, Math.floor(aliveAliens.length / 2));
    if (Math.floor(Math.random() * dropOdds) !== 0) return;

    // Find bottom-most alien for random active columns
    const columns = {};
    for (const alien of aliveAliens) {
      if (!columns[alien.col] || alien.y > columns[alien.col].y) {
        columns[alien.col] = alien;
      }
    }

    const availableShootAliens = Object.values(columns);
    if (availableShootAliens.length === 0) return;

    const shooter = availableShootAliens[Math.floor(Math.random() * availableShootAliens.length)];

    this.alienBombs.push({
      x: shooter.x + shooter.width / 2 - 1.5,
      y: shooter.y + shooter.height,
      width: 3,
      height: 9,
      speed: 3.2 + Math.min(this.wave * 0.3, 2.0),
      wiggle: 0
    });
    this.onSound('bomb_drop');
  }

  updateAlienBombs() {
    for (let i = this.alienBombs.length - 1; i >= 0; i--) {
      const bomb = this.alienBombs[i];
      bomb.y += bomb.speed;
      bomb.wiggle = (bomb.wiggle + 1) % 12;

      // Bottom boundary hit
      if (bomb.y >= HEIGHT - 40) {
        this.explosions.push({
          x: bomb.x - 3,
          y: HEIGHT - 42,
          width: 8,
          height: 6,
          type: 'splash',
          timer: 6
        });
        this.alienBombs.splice(i, 1);
        continue;
      }

      // Bunker hit
      if (this.damageBunkers(bomb, 'down')) {
        this.alienBombs.splice(i, 1);
        continue;
      }

      // Player hit
      if (this.checkCollision(bomb, this.player) && !this.player.isDying) {
        this.alienBombs.splice(i, 1);
        this.killPlayer();
        return;
      }
    }
  }

  killPlayer() {
    this.player.isDying = true;
    this.lives--;
    this.onLives(this.lives);
    this.state = 'PLAYER_DYING';
    this.deathTimer = 90; // 1.5 seconds death pause

    this.explosions.push({
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
      type: 'player',
      timer: 90
    });

    this.onSound('player_death');
  }

  updateUfo() {
    if (this.ufo) {
      this.ufo.x += this.ufo.speed * this.ufo.direction;

      // Check off-screen
      if ((this.ufo.direction > 0 && this.ufo.x > WIDTH + 40) ||
          (this.ufo.direction < 0 && this.ufo.x < -60)) {
        this.ufo = null;
        this.ufoTimer = this.getUfoSpawnInterval();
        this.onSound('ufo_stop');
      }
      return;
    }

    // Decrement spawn timer
    this.ufoTimer--;
    if (this.ufoTimer <= 0) {
      const fromLeft = Math.random() > 0.5;
      this.ufo = {
        x: fromLeft ? -40 : WIDTH + 10,
        y: 46,
        width: 36,
        height: 16,
        direction: fromLeft ? 1 : -1,
        speed: 1.8
      };
      this.onSound('ufo_start');
    }
  }

  destroyUfo() {
    const possibleScores = [50, 100, 150, 200, 300];
    const pts = possibleScores[Math.floor(Math.random() * possibleScores.length)];
    this.score += pts;
    this.onScore(this.score);
    this.stats.ufosDestroyed++;
    this.stats.shotsHit++;

    this.onAchievement('invaders_ufo_hunter');
    if (this.score >= 3000) {
      this.onAchievement('invaders_score_3000');
    }

    this.floatingScores.push({
      x: this.ufo.x + 4,
      y: this.ufo.y + 6,
      text: `${pts}`,
      timer: 60
    });

    this.explosions.push({
      x: this.ufo.x,
      y: this.ufo.y,
      width: this.ufo.width,
      height: this.ufo.height,
      type: 'ufo',
      timer: 30
    });

    this.ufo = null;
    this.ufoTimer = this.getUfoSpawnInterval();
    this.onSound('ufo_hit');
    this.onSound('ufo_stop');
  }

  damageBunkers(projectile, direction = 'up') {
    for (const bunker of this.bunkers) {
      if (this.checkCollision(projectile, bunker)) {
        // Projectile center coordinates
        const px = projectile.x + projectile.width / 2;
        const py = direction === 'up' ? projectile.y : projectile.y + projectile.height;

        // Check if hitting an active chunk
        const hit = this.erodeBunkerArea(bunker, px, py, 6);
        if (hit) {
          this.explosions.push({
            x: px - 4,
            y: py - 4,
            width: 8,
            height: 8,
            type: 'bunker_chip',
            timer: 6
          });
          this.onSound('bunker_hit');
          return true;
        }
      }
    }
    return false;
  }

  erodeBunkerArea(bunker, hitX, hitY, blastRadius = 6) {
    let chipped = false;
    for (let r = 0; r < bunker.rows; r++) {
      for (let c = 0; c < bunker.cols; c++) {
        if (bunker.chunks[r][c] === 1) {
          const chunkCenterX = bunker.x + c * bunker.chunkW + bunker.chunkW / 2;
          const chunkCenterY = bunker.y + r * bunker.chunkH + bunker.chunkH / 2;
          const dist = Math.hypot(chunkCenterX - hitX, chunkCenterY - hitY);
          if (dist <= blastRadius) {
            bunker.chunks[r][c] = 0;
            chipped = true;
          }
        }
      }
    }
    return chipped;
  }

  checkAlienInvasion() {
    // If any alive alien touches the ground line or player height, alien invasion succeeds
    const aliveAliens = this.getAliveAliens();
    for (const alien of aliveAliens) {
      if (alien.y + alien.height >= this.player.y) {
        this.lives = 0;
        this.onLives(0);
        this.state = 'GAME_OVER';
        this.onGameOver(this.score);
        this.onSound('invasion_failure');
        return;
      }
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}
