/**
 * Asteroids (1979) Core Simulation Engine
 * Handles 360-degree Newtonian physics, procedural vector asteroid geometry,
 * laser projectiles, alien saucer AI, particle debris, hyperspace, and wave progression.
 */

export const WIDTH = 800;
export const HEIGHT = 600;

export const ASTEROID_CONFIG = {
  large: { radius: 42, points: 20, minSpeed: 0.8, maxSpeed: 1.8, splitCount: 2, nextSize: 'medium' },
  medium: { radius: 22, points: 50, minSpeed: 1.5, maxSpeed: 2.8, splitCount: 2, nextSize: 'small' },
  small: { radius: 12, points: 100, minSpeed: 2.2, maxSpeed: 3.8, splitCount: 0, nextSize: null }
};

export class AsteroidsEngine {
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
    this.state = 'PLAYING'; // PLAYING, SHIP_DEAD, GAME_OVER
    this.respawnTimer = 0;
    this.nextExtraLife = 10000;

    this.ship = this.createShip();
    this.lasers = [];
    this.asteroids = [];
    this.saucer = null;
    this.saucerLasers = [];
    this.saucerTimer = this.getSaucerSpawnTime();
    this.particles = [];

    // Heartbeat audio tempo
    this.heartbeatTimer = 60;
    this.heartbeatStep = 0;

    this.stats = {
      rocksDestroyed: 0,
      saucersDestroyed: 0,
      shotsFired: 0,
      shotsHit: 0,
      hyperspaceJumps: 0
    };

    this.startWave(this.wave);
  }

  createShip() {
    return {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2, // Facing up
      rotSpeed: 0.08,
      rotateDir: 0, // -1 left, +1 right
      isThrusting: false,
      thrustPower: 0.16,
      friction: 0.985,
      maxSpeed: 8.0,
      radius: 12,
      invulnerableFrames: 180,
      shootCooldown: 0,
      alive: true
    };
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.onWave(this.wave);
    if (this.wave >= 3) {
      this.onAchievement('asteroids_wave_3');
    }

    this.asteroids = [];
    this.saucer = null;
    this.saucerLasers = [];
    this.saucerTimer = this.getSaucerSpawnTime();

    const count = Math.min(4 + (waveNum - 1) * 2, 11);
    for (let i = 0; i < count; i++) {
      this.spawnAsteroid('large');
    }
  }

  getSaucerSpawnTime() {
    return 1200 + Math.floor(Math.random() * 800); // 20-33 seconds at 60 FPS
  }

  createAsteroidVertices(radius, numPoints = 12) {
    const vertices = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
  }

  spawnAsteroid(size, x = null, y = null, parentVx = 0, parentVy = 0) {
    const cfg = ASTEROID_CONFIG[size];
    let posX = x;
    let posY = y;

    if (posX === null || posY === null) {
      // Spawn at border safe distance from ship
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { posX = 0; posY = Math.random() * HEIGHT; }
      else if (edge === 1) { posX = WIDTH; posY = Math.random() * HEIGHT; }
      else if (edge === 2) { posX = Math.random() * WIDTH; posY = 0; }
      else { posX = Math.random() * WIDTH; posY = HEIGHT; }

      // Guarantee minimum 150px clearance from ship
      if (this.ship.alive && Math.hypot(posX - this.ship.x, posY - this.ship.y) < 160) {
        posX = (posX + WIDTH / 2) % WIDTH;
        posY = (posY + HEIGHT / 2) % HEIGHT;
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);
    const vx = Math.cos(angle) * speed + parentVx * 0.3;
    const vy = Math.sin(angle) * speed + parentVy * 0.3;

    const asteroid = {
      x: posX,
      y: posY,
      vx,
      vy,
      size,
      radius: cfg.radius,
      points: cfg.points,
      rotAngle: 0,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      vertices: this.createAsteroidVertices(cfg.radius)
    };

    this.asteroids.push(asteroid);
    return asteroid;
  }

  spawnSaucer() {
    const isSmall = this.wave >= 3 && Math.random() > 0.4;
    const startLeft = Math.random() > 0.5;
    const x = startLeft ? -20 : WIDTH + 20;
    const y = 80 + Math.random() * (HEIGHT - 160);
    const speed = isSmall ? 2.8 : 1.8;
    const vx = startLeft ? speed : -speed;

    this.saucer = {
      x,
      y,
      vx,
      vy: (Math.random() - 0.5) * 1.2,
      isSmall,
      radius: isSmall ? 12 : 20,
      points: isSmall ? 1000 : 200,
      shootTimer: 60 + Math.floor(Math.random() * 60),
      dirChangeTimer: 90
    };

    this.onSound('saucerStart', isSmall);
  }

  fireLaser() {
    if (!this.ship.alive || this.ship.invulnerableFrames > 120 && this.state !== 'PLAYING') return;
    if (this.ship.shootCooldown > 0 || this.lasers.length >= 5) return;

    this.ship.shootCooldown = 12; // 5 shots per second
    const speed = 10.0;
    const tipDist = this.ship.radius + 3;
    const lx = this.ship.x + Math.cos(this.ship.angle) * tipDist;
    const ly = this.ship.y + Math.sin(this.ship.angle) * tipDist;

    this.lasers.push({
      x: lx,
      y: ly,
      vx: Math.cos(this.ship.angle) * speed + this.ship.vx * 0.25,
      vy: Math.sin(this.ship.angle) * speed + this.ship.vy * 0.25,
      life: 55
    });

    this.stats.shotsFired++;
    this.onSound('fire');
  }

  saucerFire() {
    if (!this.saucer) return;
    let angle;
    if (this.saucer.isSmall && this.ship.alive) {
      // Aim at ship with slight random offset
      const dx = this.ship.x - this.saucer.x;
      const dy = this.ship.y - this.saucer.y;
      angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.35;
    } else {
      angle = Math.random() * Math.PI * 2;
    }

    const speed = 5.5;
    this.saucerLasers.push({
      x: this.saucer.x,
      y: this.saucer.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 65
    });
    this.onSound('fire');
  }

  hyperspace() {
    if (!this.ship.alive) return;
    this.stats.hyperspaceJumps++;
    this.onSound('hyperspace');

    // 15% chance of explosion
    if (Math.random() < 0.15) {
      this.destroyShip();
      return;
    }

    this.ship.x = Math.random() * (WIDTH - 100) + 50;
    this.ship.y = Math.random() * (HEIGHT - 100) + 50;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.invulnerableFrames = 60;
    this.onAchievement('asteroids_hyperspace');
  }

  destroyShip() {
    if (!this.ship.alive) return;
    this.ship.alive = false;
    this.onSound('thrustStop');
    this.onSound('explosion', 'large');
    this.createExplosion(this.ship.x, this.ship.y, 16, 2.5);

    this.lives--;
    this.onLives(this.lives);

    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
      this.onGameOver(this.score);
    } else {
      this.state = 'SHIP_DEAD';
      this.respawnTimer = 120; // 2 seconds
    }
  }

  createExplosion(x, y, count = 12, maxSpeed = 2.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * maxSpeed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        length: 4 + Math.random() * 10,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.025
      });
    }
  }

  addScore(pts) {
    this.score += pts;
    this.onScore(this.score);

    if (this.score >= 5000) {
      this.onAchievement('asteroids_score_5000');
    }

    if (this.score >= this.nextExtraLife) {
      this.lives++;
      this.nextExtraLife += 10000;
      this.onLives(this.lives);
      this.onSound('extraLife');
    }
  }

  update() {
    // 1. Ship logic
    if (this.ship.alive) {
      // Rotation
      if (this.ship.rotateDir !== 0) {
        this.ship.angle += this.ship.rotateDir * this.ship.rotSpeed;
      }

      // Thrust
      if (this.ship.isThrusting) {
        this.ship.vx += Math.cos(this.ship.angle) * this.ship.thrustPower;
        this.ship.vy += Math.sin(this.ship.angle) * this.ship.thrustPower;

        const currentSpeed = Math.hypot(this.ship.vx, this.ship.vy);
        if (currentSpeed > this.ship.maxSpeed) {
          this.ship.vx = (this.ship.vx / currentSpeed) * this.ship.maxSpeed;
          this.ship.vy = (this.ship.vy / currentSpeed) * this.ship.maxSpeed;
        }
      }

      // Vacuum friction
      this.ship.vx *= this.ship.friction;
      this.ship.vy *= this.ship.friction;

      // Position update
      this.ship.x += this.ship.vx;
      this.ship.y += this.ship.vy;

      // Wraparound
      this.wrap(this.ship);

      // Invulnerability decay
      if (this.ship.invulnerableFrames > 0) {
        this.ship.invulnerableFrames--;
      }

      // Shoot cooldown
      if (this.ship.shootCooldown > 0) {
        this.ship.shootCooldown--;
      }
    } else if (this.state === 'SHIP_DEAD') {
      this.respawnTimer--;
      if (this.respawnTimer <= 0) {
        // Safe check to respawn
        const clearOfAsteroids = this.asteroids.every(
          a => Math.hypot(a.x - WIDTH / 2, a.y - HEIGHT / 2) > a.radius + 80
        );
        if (clearOfAsteroids || this.respawnTimer < -180) {
          this.ship = this.createShip();
          this.state = 'PLAYING';
        }
      }
    }

    // 2. Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      this.wrap(l);
      l.life--;
      if (l.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }

    // 3. Saucer Lasers
    for (let i = this.saucerLasers.length - 1; i >= 0; i--) {
      const l = this.saucerLasers[i];
      l.x += l.vx;
      l.y += l.vy;
      this.wrap(l);
      l.life--;
      if (l.life <= 0) {
        this.saucerLasers.splice(i, 1);
      }
    }

    // 4. Asteroids
    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rotAngle += a.rotSpeed;
      this.wrap(a, a.radius);
    }

    // 5. Saucer
    if (this.saucer) {
      this.saucer.x += this.saucer.vx;
      this.saucer.y += this.saucer.vy;

      this.saucer.dirChangeTimer--;
      if (this.saucer.dirChangeTimer <= 0) {
        this.saucer.vy = (Math.random() - 0.5) * 1.5;
        this.saucer.dirChangeTimer = 60 + Math.floor(Math.random() * 60);
      }

      // Saucer boundary bounds
      if (this.saucer.y < 40) this.saucer.vy = Math.abs(this.saucer.vy);
      if (this.saucer.y > HEIGHT - 40) this.saucer.vy = -Math.abs(this.saucer.vy);

      // Firing
      this.saucer.shootTimer--;
      if (this.saucer.shootTimer <= 0) {
        this.saucerFire();
        this.saucer.shootTimer = this.saucer.isSmall ? 65 : 90;
      }

      // Check if left screen
      if ((this.saucer.vx > 0 && this.saucer.x > WIDTH + 40) ||
          (this.saucer.vx < 0 && this.saucer.x < -40)) {
        this.saucer = null;
        this.onSound('saucerStop');
        this.saucerTimer = this.getSaucerSpawnTime();
      }
    } else {
      this.saucerTimer--;
      if (this.saucerTimer <= 0 && this.state === 'PLAYING') {
        this.spawnSaucer();
      }
    }

    // 6. Collisions
    this.checkCollisions();

    // 7. Particle debris
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.rotSpeed;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Heartbeat Sound Pulse
    if (this.state === 'PLAYING' && this.asteroids.length > 0) {
      this.heartbeatTimer--;
      if (this.heartbeatTimer <= 0) {
        this.onSound('heartbeat', this.heartbeatStep);
        this.heartbeatStep = 1 - this.heartbeatStep;

        // Dynamic tempo: fastest when few rocks remain
        const totalRocks = this.asteroids.length;
        this.heartbeatTimer = Math.max(14, Math.min(65, totalRocks * 4));
      }
    }

    // 9. Wave Progression
    if (this.state === 'PLAYING' && this.asteroids.length === 0 && !this.saucer) {
      this.startWave(this.wave + 1);
    }
  }

  checkCollisions() {
    // A. Player Lasers vs Asteroids
    for (let li = this.lasers.length - 1; li >= 0; li--) {
      const laser = this.lasers[li];
      let laserHit = false;

      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const ast = this.asteroids[ai];
        const dist = Math.hypot(laser.x - ast.x, laser.y - ast.y);

        if (dist <= ast.radius) {
          laserHit = true;
          this.stats.shotsHit++;
          this.stats.rocksDestroyed++;
          this.onAchievement('asteroids_first_rock');

          this.addScore(ast.points);
          this.onSound('explosion', ast.size);
          this.createExplosion(ast.x, ast.y, ast.size === 'large' ? 14 : 8, ast.size === 'large' ? 2.5 : 1.5);

          // Split asteroid
          const cfg = ASTEROID_CONFIG[ast.size];
          if (cfg.splitCount > 0 && cfg.nextSize) {
            for (let s = 0; s < cfg.splitCount; s++) {
              this.spawnAsteroid(cfg.nextSize, ast.x, ast.y, ast.vx, ast.vy);
            }
          }

          this.asteroids.splice(ai, 1);
          break;
        }
      }

      if (laserHit) {
        this.lasers.splice(li, 1);
        continue;
      }

      // B. Player Lasers vs Saucer
      if (this.saucer) {
        const dist = Math.hypot(laser.x - this.saucer.x, laser.y - this.saucer.y);
        if (dist <= this.saucer.radius) {
          this.stats.shotsHit++;
          this.stats.saucersDestroyed++;
          this.onAchievement('asteroids_saucer_hunter');

          this.addScore(this.saucer.points);
          this.onSound('explosion', 'medium');
          this.createExplosion(this.saucer.x, this.saucer.y, 16, 2.0);

          this.saucer = null;
          this.onSound('saucerStop');
          this.saucerTimer = this.getSaucerSpawnTime();
          this.lasers.splice(li, 1);
          continue;
        }
      }
    }

    // C. Saucer Lasers vs Ship
    if (this.ship.alive && this.ship.invulnerableFrames <= 0) {
      for (let i = this.saucerLasers.length - 1; i >= 0; i--) {
        const sl = this.saucerLasers[i];
        const dist = Math.hypot(sl.x - this.ship.x, sl.y - this.ship.y);
        if (dist <= this.ship.radius) {
          this.saucerLasers.splice(i, 1);
          this.destroyShip();
          break;
        }
      }
    }

    // D. Ship vs Asteroids
    if (this.ship.alive && this.ship.invulnerableFrames <= 0) {
      for (let i = 0; i < this.asteroids.length; i++) {
        const ast = this.asteroids[i];
        const dist = Math.hypot(this.ship.x - ast.x, this.ship.y - ast.y);
        if (dist <= this.ship.radius + ast.radius * 0.85) {
          this.destroyShip();
          break;
        }
      }
    }

    // E. Ship vs Saucer
    if (this.ship.alive && this.ship.invulnerableFrames <= 0 && this.saucer) {
      const dist = Math.hypot(this.ship.x - this.saucer.x, this.ship.y - this.saucer.y);
      if (dist <= this.ship.radius + this.saucer.radius) {
        this.destroyShip();
        this.saucer = null;
        this.onSound('saucerStop');
        this.saucerTimer = this.getSaucerSpawnTime();
      }
    }
  }

  wrap(obj, margin = 0) {
    if (obj.x < -margin) obj.x = WIDTH + margin;
    else if (obj.x > WIDTH + margin) obj.x = -margin;
    if (obj.y < -margin) obj.y = HEIGHT + margin;
    else if (obj.y > HEIGHT + margin) obj.y = -margin;
  }
}
