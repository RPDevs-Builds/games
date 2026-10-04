/**
 * Missile Command Game Engine
 * 6 Cities, 3 Silos, Incoming ICBM ballistic trajectories, MIRV splits,
 * Flak blast expansion and dissipation radius, score multipliers.
 */

export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;

export const SILO_AMMO_PER_WAVE = 10;
export const BLAST_MAX_RADIUS = 36;
export const BLAST_EXPAND_SPEED = 1.6;
export const BLAST_FADE_SPEED = 0.8;
export const INTERCEPTOR_SPEED = 12;

export class MissileCommandEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.waveActive = false;

    // 6 Cities: x coordinates distributed across bottom
    this.cities = [
      { id: 0, x: 140, y: 550, alive: true },
      { id: 1, x: 220, y: 550, alive: true },
      { id: 2, x: 300, y: 550, alive: true },
      { id: 3, x: 500, y: 550, alive: true },
      { id: 4, x: 580, y: 550, alive: true },
      { id: 5, x: 660, y: 550, alive: true }
    ];

    // 3 Silos (Left, Center, Right)
    this.silos = [
      { id: 0, name: 'Alpha', x: 60, y: 550, ammo: SILO_AMMO_PER_WAVE, alive: true },
      { id: 1, name: 'Delta', x: 400, y: 550, ammo: SILO_AMMO_PER_WAVE, alive: true },
      { id: 2, name: 'Omega', x: 740, y: 550, ammo: SILO_AMMO_PER_WAVE, alive: true }
    ];

    this.enemyMissiles = [];
    this.interceptors = [];
    this.explosions = [];
    this.particles = [];

    this.missilesToSpawn = 0;
    this.spawnTimer = 0;
    this.intermissionTimer = 0;
  }

  startWave(waveNum = 1) {
    this.wave = waveNum;
    this.waveActive = true;
    this.intermissionTimer = 0;

    // Replenish ammo in surviving silos
    this.silos.forEach(s => {
      if (s.alive) s.ammo = SILO_AMMO_PER_WAVE;
    });

    // Waves scale: more missiles, faster velocity
    this.missilesToSpawn = 10 + (this.wave * 3);
    this.spawnInterval = Math.max(30, 90 - (this.wave * 5));
    this.spawnTimer = 0;
    this.enemyMissiles = [];
    this.interceptors = [];
  }

  /**
   * Fires an anti-ballistic missile from the optimal surviving silo toward target (tx, ty).
   */
  fireInterceptor(tx, ty, preferredSiloId = null) {
    if (this.gameOver || !this.waveActive) return null;
    if (ty >= 520) return null; // Don't fire into ground

    let chosenSilo = null;

    if (preferredSiloId !== null && this.silos[preferredSiloId] && this.silos[preferredSiloId].alive && this.silos[preferredSiloId].ammo > 0) {
      chosenSilo = this.silos[preferredSiloId];
    } else {
      // Find closest alive silo with ammo
      let minDist = Infinity;
      for (const s of this.silos) {
        if (s.alive && s.ammo > 0) {
          const dist = Math.hypot(s.x - tx, s.y - ty);
          if (dist < minDist) {
            minDist = dist;
            chosenSilo = s;
          }
        }
      }
    }

    if (!chosenSilo) return null;

    chosenSilo.ammo--;

    const dx = tx - chosenSilo.x;
    const dy = ty - chosenSilo.y;
    const totalDist = Math.hypot(dx, dy);
    const speed = INTERCEPTOR_SPEED;

    const interceptor = {
      startX: chosenSilo.x,
      startY: chosenSilo.y,
      x: chosenSilo.x,
      y: chosenSilo.y,
      targetX: tx,
      targetY: ty,
      vx: (dx / totalDist) * speed,
      vy: (dy / totalDist) * speed,
      active: true
    };

    this.interceptors.push(interceptor);
    return interceptor;
  }

  triggerExplosion(x, y, isAntiMissile = true) {
    const explosion = {
      x,
      y,
      radius: 2,
      maxRadius: BLAST_MAX_RADIUS,
      state: 'expanding', // 'expanding' or 'contracting'
      isAntiMissile,
      color: isAntiMissile ? '#00f0ff' : '#ff0055'
    };
    this.explosions.push(explosion);

    // Particle burst
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 25 + Math.random() * 15,
        color: isAntiMissile ? '#ffe600' : '#ff5500'
      });
    }
  }

  spawnEnemyMissile() {
    const startX = 40 + Math.random() * (ARENA_WIDTH - 80);
    const startY = 0;

    // Target either a living city or living silo
    const potentialTargets = [];
    this.cities.forEach(c => { if (c.alive) potentialTargets.push({ x: c.x, y: c.y, type: 'city', ref: c }); });
    this.silos.forEach(s => { if (s.alive) potentialTargets.push({ x: s.x, y: s.y, type: 'silo', ref: s }); });

    if (potentialTargets.length === 0) {
      this.finishGame();
      return;
    }

    const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
    const dx = target.x - startX;
    const dy = target.y - startY;
    const totalDist = Math.hypot(dx, dy);

    // Velocity scales with wave number
    const speed = 1.0 + (this.wave * 0.22);

    this.enemyMissiles.push({
      startX,
      startY,
      x: startX,
      y: startY,
      targetX: target.x,
      targetY: target.y,
      vx: (dx / totalDist) * speed,
      vy: (dy / totalDist) * speed,
      targetRef: target.ref,
      targetType: target.type,
      active: true,
      canSplit: (this.wave >= 2 && Math.random() < 0.25)
    });
  }

  update() {
    if (this.gameOver) return;

    // Wave spawning
    if (this.waveActive) {
      if (this.missilesToSpawn > 0) {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
          this.spawnTimer = 0;
          this.spawnEnemyMissile();
          this.missilesToSpawn--;
        }
      } else if (this.enemyMissiles.length === 0 && this.interceptors.length === 0 && this.explosions.length === 0) {
        // Wave conquered
        this.endWave();
      }
    } else {
      // Intermission between waves
      this.intermissionTimer++;
      if (this.intermissionTimer > 150) { // 2.5 seconds
        this.startWave(this.wave + 1);
      }
    }

    // Update Interceptors
    for (const inc of this.interceptors) {
      inc.x += inc.vx;
      inc.y += inc.vy;

      // Check if reached detonation target
      const distToTarget = Math.hypot(inc.targetX - inc.x, inc.targetY - inc.y);
      if (distToTarget <= INTERCEPTOR_SPEED || inc.y <= inc.targetY) {
        inc.active = false;
        this.triggerExplosion(inc.targetX, inc.targetY, true);
      }
    }
    this.interceptors = this.interceptors.filter(i => i.active);

    // Update Explosions
    for (const exp of this.explosions) {
      if (exp.state === 'expanding') {
        exp.radius += BLAST_EXPAND_SPEED;
        if (exp.radius >= exp.maxRadius) {
          exp.state = 'contracting';
        }
      } else {
        exp.radius -= BLAST_FADE_SPEED;
      }
    }
    this.explosions = this.explosions.filter(e => e.radius > 0);

    // Update Enemy ICBMs & Collisions
    for (const m of this.enemyMissiles) {
      m.x += m.vx;
      m.y += m.vy;

      // MIRV Split behavior
      if (m.canSplit && m.y > 140 && m.y < 220) {
        m.canSplit = false;
        // Split into 2 sub-warheads
        this.splitMIRV(m);
      }

      // Check collision with any active explosion blast
      let destroyed = false;
      for (const exp of this.explosions) {
        const dist = Math.hypot(m.x - exp.x, m.y - exp.y);
        if (dist <= exp.radius) {
          destroyed = true;
          this.triggerExplosion(m.x, m.y, true);
          this.score += 25 * this.wave;
          break;
        }
      }

      if (destroyed) {
        m.active = false;
        continue;
      }

      // Check impact with ground / target
      if (m.y >= m.targetY) {
        m.active = false;
        this.triggerExplosion(m.targetX, m.targetY, false);

        if (m.targetType === 'city' && m.targetRef.alive) {
          m.targetRef.alive = false;
        } else if (m.targetType === 'silo' && m.targetRef.alive) {
          m.targetRef.alive = false;
          m.targetRef.ammo = 0;
        }

        // Check if all cities destroyed -> Game Over
        if (this.cities.every(c => !c.alive)) {
          this.finishGame();
        }
      }
    }
    this.enemyMissiles = this.enemyMissiles.filter(m => m.active);

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  splitMIRV(parent) {
    const livingTargets = this.cities.filter(c => c.alive);
    if (livingTargets.length === 0) return;

    for (let i = 0; i < 2; i++) {
      const tgt = livingTargets[Math.floor(Math.random() * livingTargets.length)];
      const dx = tgt.x - parent.x;
      const dy = tgt.y - parent.y;
      const totalDist = Math.hypot(dx, dy);
      const speed = 1.1 + (this.wave * 0.22);

      this.enemyMissiles.push({
        startX: parent.x,
        startY: parent.y,
        x: parent.x,
        y: parent.y,
        targetX: tgt.x,
        targetY: tgt.y,
        vx: (dx / totalDist) * speed,
        vy: (dy / totalDist) * speed,
        targetRef: tgt,
        targetType: 'city',
        active: true,
        canSplit: false
      });
    }
  }

  endWave() {
    this.waveActive = false;
    // Tally bonus points
    const aliveCities = this.cities.filter(c => c.alive).length;
    const remainingAmmo = this.silos.reduce((acc, s) => acc + (s.alive ? s.ammo : 0), 0);

    const cityBonus = aliveCities * 100 * this.wave;
    const ammoBonus = remainingAmmo * 5 * this.wave;
    this.score += (cityBonus + ammoBonus);

    // Check if player has survived with 0 cities
    if (aliveCities === 0) {
      this.finishGame();
    }
  }

  finishGame() {
    this.gameOver = true;
    this.waveActive = false;
  }
}
