/**
 * Missile Command UI Controller
 * HTML5 Canvas 800x600, Vector drawing, Crosshair mouse/touch control, Gamepad analog targeting.
 */

import { MissileCommandEngine, ARENA_WIDTH, ARENA_HEIGHT } from './engine.js';
import { MissileCommandAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { arcadeGamepad } from '../gamepad.js';

export class MissileCommandUI {
  constructor() {
    this.engine = new MissileCommandEngine();
    this.audio = new MissileCommandAudio();

    this.crosshairX = ARENA_WIDTH / 2;
    this.crosshairY = ARENA_HEIGHT / 2;

    this.cacheElements();
    this.bindEvents();
    this.initGamepad();

    this.engine.startWave(1);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    arcadeVault.recordPlay('missilecommand');
    if (arcadeVault && typeof arcadeVault.bindNavigation === 'function') {
      arcadeVault.bindNavigation('missilecommand');
    }
  }

  cacheElements() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score-val');
    this.waveEl = document.getElementById('wave-val');
    this.ammoLeftEl = document.getElementById('ammo-alpha');
    this.ammoCenterEl = document.getElementById('ammo-delta');
    this.ammoRightEl = document.getElementById('ammo-omega');
    this.overlayEl = document.getElementById('game-overlay');
    this.overlayTitleEl = document.getElementById('overlay-title');
    this.overlayMsgEl = document.getElementById('overlay-msg');
    this.btnRestartEl = document.getElementById('btn-restart');
    this.btnSoundEl = document.getElementById('btn-sound');
    this.btnCrtEl = document.getElementById('btn-crt');
  }

  bindEvents() {
    if (this.btnRestartEl) {
      this.btnRestartEl.onclick = () => this.restart();
    }

    if (this.btnSoundEl) {
      this.btnSoundEl.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
      this.btnSoundEl.onclick = () => {
        const muted = this.audio.toggleMute();
        this.btnSoundEl.textContent = muted ? '🔇 Sound' : '🔊 Sound';
      };
    }

    if (this.btnCrtEl) {
      this.btnCrtEl.onclick = () => retroCRT.toggle();
    }

    // Canvas Mouse & Touch Tracking
    const updateTargetFromEvent = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = ARENA_WIDTH / rect.width;
      const scaleY = ARENA_HEIGHT / rect.height;

      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      this.crosshairX = Math.max(10, Math.min(ARENA_WIDTH - 10, (clientX - rect.left) * scaleX));
      this.crosshairY = Math.max(10, Math.min(ARENA_HEIGHT - 60, (clientY - rect.top) * scaleY));
    };

    this.canvas.addEventListener('mousemove', updateTargetFromEvent);
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      updateTargetFromEvent(e);
    }, { passive: false });

    // Primary fire triggers
    this.canvas.addEventListener('mousedown', (e) => {
      updateTargetFromEvent(e);
      let preferredSilo = null;
      if (e.button === 0 && e.clientX < window.innerWidth / 3) preferredSilo = 0;
      else if (e.button === 0 && e.clientX > (window.innerWidth * 2) / 3) preferredSilo = 2;
      this.handleFire(preferredSilo);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      updateTargetFromEvent(e);
      this.handleFire();
    }, { passive: false });

    // Keyboard controls (A, S, D keys for 3 silos; Space for smart closest silo)
    window.addEventListener('keydown', (e) => {
      if (this.engine.gameOver) {
        if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') this.restart();
        return;
      }

      if (e.key === 'a' || e.key === 'A') this.handleFire(0);
      else if (e.key === 's' || e.key === 'S') this.handleFire(1);
      else if (e.key === 'd' || e.key === 'D') this.handleFire(2);
      else if (e.key === ' ' || e.key === 'Enter') this.handleFire(null);
    });
  }

  initGamepad() {
    arcadeGamepad.onButtonDown((btn) => {
      if (this.engine.gameOver && (btn === 'start' || btn === 'a')) {
        this.restart();
        return;
      }

      if (btn === 'x') this.handleFire(0);
      else if (btn === 'a') this.handleFire(1);
      else if (btn === 'b') this.handleFire(2);
      else if (btn === 'r1' || btn === 'start') this.handleFire(null);
    });

    arcadeGamepad.onAxis((axis, val) => {
      const speed = 7;
      if (axis === 'left_x' || axis === 'right_x') {
        this.crosshairX = Math.max(10, Math.min(ARENA_WIDTH - 10, this.crosshairX + val * speed));
      }
      if (axis === 'left_y' || axis === 'right_y') {
        this.crosshairY = Math.max(10, Math.min(ARENA_HEIGHT - 60, this.crosshairY + val * speed));
      }
    });
  }

  handleFire(preferredSilo = null) {
    if (this.engine.gameOver) return;
    const fired = this.engine.fireInterceptor(this.crosshairX, this.crosshairY, preferredSilo);
    if (fired) {
      this.audio.playLaunch();
    }
  }

  restart() {
    this.engine.reset();
    this.engine.startWave(1);
    this.overlayEl.style.display = 'none';
  }

  loop() {
    const prevExplosionCount = this.engine.explosions.length;
    this.engine.update();

    if (this.engine.explosions.length > prevExplosionCount) {
      this.audio.playExplosion(false);
    }

    this.render();

    if (this.engine.gameOver && this.overlayEl.style.display !== 'flex') {
      this.audio.playGameOver();
      this.overlayTitleEl.textContent = 'THE END';
      this.overlayMsgEl.textContent = `All cities destroyed! Final Score: ${this.engine.score}`;
      this.overlayEl.style.display = 'flex';
      arcadeVault.recordScore('missilecommand', this.engine.score);
      if (this.engine.score >= 5000) arcadeVault.unlock('missile_defender');
    }

    requestAnimationFrame(this.loop);
  }

  render() {
    // Update Scoreboard metrics
    this.scoreEl.textContent = this.engine.score;
    this.waveEl.textContent = this.engine.wave;
    this.ammoLeftEl.textContent = this.engine.silos[0].ammo;
    this.ammoCenterEl.textContent = this.engine.silos[1].ammo;
    this.ammoRightEl.textContent = this.engine.silos[2].ammo;

    const ctx = this.ctx;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw Terrain Ground
    ctx.fillStyle = '#221a11';
    ctx.fillRect(0, 560, ARENA_WIDTH, 40);

    ctx.strokeStyle = '#c28b2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 560);
    ctx.lineTo(ARENA_WIDTH, 560);
    ctx.stroke();

    // Draw Silos
    this.engine.silos.forEach(s => {
      if (s.alive) {
        ctx.fillStyle = '#3b82f6';
        // Draw bunker dome
        ctx.beginPath();
        ctx.arc(s.x, s.y + 10, 24, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ammo bar indicators
        ctx.fillStyle = s.ammo > 3 ? '#00f0ff' : '#ff0055';
        for (let i = 0; i < s.ammo; i++) {
          ctx.fillRect(s.x - 18 + (i * 3.8), s.y + 14, 2.5, 6);
        }
      } else {
        // Destroyed silo rubble
        ctx.fillStyle = '#555';
        ctx.fillRect(s.x - 15, s.y + 6, 30, 4);
      }
    });

    // Draw Cities
    this.engine.cities.forEach(c => {
      if (c.alive) {
        ctx.fillStyle = '#00ff66';
        // 3-building skyline silhouette
        ctx.fillRect(c.x - 14, c.y - 10, 8, 20);
        ctx.fillRect(c.x - 4, c.y - 18, 9, 28);
        ctx.fillRect(c.x + 7, c.y - 12, 8, 22);
      } else {
        // Ruins
        ctx.fillStyle = '#444';
        ctx.fillRect(c.x - 12, c.y + 4, 24, 6);
      }
    });

    // Draw Enemy Ballistic Trails & Warheads
    for (const m of this.engine.enemyMissiles) {
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.startX, m.startY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      // Warhead point
      ctx.fillStyle = '#fff';
      ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3);
    }

    // Draw Interceptor Rockets & Trails
    for (const inc of this.engine.interceptors) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(inc.startX, inc.startY);
      ctx.lineTo(inc.x, inc.y);
      ctx.stroke();

      // Interceptor tip
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(inc.x - 2, inc.y - 2, 4, 4);

      // Target X crosshair mark
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inc.targetX - 4, inc.targetY - 4);
      ctx.lineTo(inc.targetX + 4, inc.targetY + 4);
      ctx.moveTo(inc.targetX + 4, inc.targetY - 4);
      ctx.lineTo(inc.targetX - 4, inc.targetY + 4);
      ctx.stroke();
    }

    // Draw Flak Explosions
    for (const exp of this.engine.explosions) {
      const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, exp.color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Particles
    for (const p of this.engine.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    }

    // Draw Crosshair Target
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    const cx = this.crosshairX;
    const cy = this.crosshairY;
    const sz = 8;
    ctx.beginPath();
    ctx.moveTo(cx - sz, cy); ctx.lineTo(cx + sz, cy);
    ctx.moveTo(cx, cy - sz); ctx.lineTo(cx, cy + sz);
    ctx.stroke();
  }
}
