/**
 * Asteroids (1979) UI & Vector Canvas Rendering Controller
 * High-performance 60 FPS HTML5 Canvas engine with authentic Atari vector beam aesthetics,
 * glowing phosphor shaders, virtual touch keypad, and Gamepad controller support.
 */

import { AsteroidsEngine, WIDTH, HEIGHT } from './engine.js';
import { AsteroidsAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { arcadeGamepad } from '../gamepad.js';

if (typeof window !== 'undefined') {
  if (!window.arcadeVault) window.arcadeVault = arcadeVault;
  if (!window.retroCRT) window.retroCRT = retroCRT;
  if (!window.arcadeGamepad) window.arcadeGamepad = arcadeGamepad;
}

export class AsteroidsUI {
  constructor() {
    this.canvas = document.getElementById('asteroids-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.scoreEl = document.getElementById('stat-score');
    this.highScoreEl = document.getElementById('stat-high-score');
    this.waveEl = document.getElementById('stat-wave');
    this.livesContainer = document.getElementById('lives-container');

    this.overlayEl = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayScore = document.getElementById('overlay-score');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnSound = document.getElementById('btn-sound');
    this.btnCRT = document.getElementById('btn-crt');

    this.audio = new AsteroidsAudio();
    this.engine = new AsteroidsEngine({
      onScore: (score) => this.handleScoreUpdate(score),
      onLives: (lives) => this.renderLives(lives),
      onWave: (wave) => this.handleWaveUpdate(wave),
      onGameOver: (finalScore) => this.handleGameOver(finalScore),
      onSound: (sound, ...args) => this.handleSound(sound, ...args),
      onAchievement: (id) => this.handleAchievement(id)
    });

    this.keys = {};
    this.touchState = { left: false, right: false, thrust: false, fire: false };
    this.highScore = this.loadHighScore();

    this.initCanvas();
    this.bindEvents();
    this.bindTouch();
    this.renderLives(this.engine.lives);
    this.updateHUD();

    if (window.arcadeVault) {
      window.arcadeVault.registerPlay('asteroids');
    }

    // 60 FPS Animation loop
    requestAnimationFrame(() => this.loop());
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('rpdevs_asteroids_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      try {
        localStorage.setItem('rpdevs_asteroids_highscore', this.highScore.toString());
      } catch {}
      this.highScoreEl.textContent = this.highScore.toLocaleString();
      if (window.arcadeVault) {
        window.arcadeVault.recordHighScore('asteroids', this.highScore);
      }
    }
  }

  initCanvas() {
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key] = true;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) ||
          [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        if (this.engine.state === 'GAME_OVER') {
          this.restart();
        } else {
          this.engine.fireLaser();
        }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyH' || e.key === 'h' || e.key === 'H' || e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        this.engine.hyperspace();
      } else if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        this.restart();
      } else if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        this.toggleSound();
      } else if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
        this.toggleCRT();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
      if (['ArrowUp', 'KeyW'].includes(e.code) || ['ArrowUp', 'w', 'W'].includes(e.key)) {
        this.audio.stopThrust();
      }
    });

    this.btnRestart?.addEventListener('click', () => this.restart());
    this.btnSound?.addEventListener('click', () => this.toggleSound());
    this.btnCRT?.addEventListener('click', () => this.toggleCRT());

    const vaultBtn = document.getElementById('btn-vault');
    if (vaultBtn) {
      vaultBtn.addEventListener('click', () => {
        if (window.arcadeVault) {
          window.arcadeVault.showModal();
        }
      });
    }

    const portalLink = document.getElementById('btn-portal');
    if (portalLink) {
      if (window.location.protocol === 'file:') {
        portalLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.arcadeVault) {
            window.arcadeVault.showModal();
          }
        });
      }
    }
  }

  bindTouch() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const down = (e) => {
        e.preventDefault();
        onDown();
      };
      const up = (e) => {
        e.preventDefault();
        onUp();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    };

    bindBtn('btn-touch-left',
      () => { this.touchState.left = true; },
      () => { this.touchState.left = false; }
    );
    bindBtn('btn-touch-right',
      () => { this.touchState.right = true; },
      () => { this.touchState.right = false; }
    );
    bindBtn('btn-touch-thrust',
      () => {
        this.touchState.thrust = true;
        this.audio.startThrust();
      },
      () => {
        this.touchState.thrust = false;
        this.audio.stopThrust();
      }
    );
    bindBtn('btn-touch-fire',
      () => {
        if (this.engine.state === 'GAME_OVER') this.restart();
        else this.engine.fireLaser();
      },
      () => {}
    );
    bindBtn('btn-touch-hyper',
      () => { this.engine.hyperspace(); },
      () => {}
    );
  }

  handleSound(sound, ...args) {
    if (sound === 'heartbeat') this.audio.playHeartbeat(...args);
    else if (sound === 'fire') this.audio.playFire();
    else if (sound === 'thrustStart') this.audio.startThrust();
    else if (sound === 'thrustStop') this.audio.stopThrust();
    else if (sound === 'explosion') this.audio.playExplosion(...args);
    else if (sound === 'saucerStart') this.audio.startSaucer(...args);
    else if (sound === 'saucerStop') this.audio.stopSaucer();
    else if (sound === 'hyperspace') this.audio.playHyperspace();
    else if (sound === 'extraLife') this.audio.playExtraLife();
  }

  handleAchievement(id) {
    if (window.arcadeVault) {
      window.arcadeVault.unlock(id);
    }
  }

  toggleSound() {
    const isMuted = this.audio.toggleMute();
    if (this.btnSound) {
      this.btnSound.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
    }
  }

  toggleCRT() {
    if (window.retroCRT) {
      window.retroCRT.toggle();
      if (this.btnCRT) {
        this.btnCRT.classList.toggle('active', window.retroCRT.isEnabled());
      }
    }
  }

  handleScoreUpdate(score) {
    this.scoreEl.textContent = score.toLocaleString();
    this.saveHighScore(score);
  }

  handleWaveUpdate(wave) {
    this.waveEl.textContent = wave.toString();
  }

  handleGameOver(finalScore) {
    this.audio.stopThrust();
    this.audio.stopSaucer();
    this.saveHighScore(finalScore);
    this.overlayTitle.textContent = 'GAME OVER';
    this.overlayScore.textContent = `FINAL SCORE: ${finalScore.toLocaleString()}`;
    this.overlayEl.style.display = 'flex';
  }

  renderLives(lives) {
    if (!this.livesContainer) return;
    this.livesContainer.innerHTML = '';
    for (let i = 0; i < Math.max(0, lives); i++) {
      const shipIcon = document.createElement('span');
      shipIcon.className = 'life-icon';
      shipIcon.innerHTML = `
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="7,1 13,16 7,12 1,16" />
        </svg>
      `;
      this.livesContainer.appendChild(shipIcon);
    }
  }

  updateHUD() {
    this.scoreEl.textContent = this.engine.score.toLocaleString();
    this.highScoreEl.textContent = this.highScore.toLocaleString();
    this.waveEl.textContent = this.engine.wave.toString();
  }

  restart() {
    this.overlayEl.style.display = 'none';
    this.audio.stopThrust();
    this.audio.stopSaucer();
    this.engine.reset();
    this.updateHUD();
    this.renderLives(this.engine.lives);
  }

  updateInput() {
    if (this.engine.state !== 'PLAYING') return;

    // Steering
    let dir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a'] || this.keys['A'] || this.touchState.left) {
      dir -= 1;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d'] || this.keys['D'] || this.touchState.right) {
      dir += 1;
    }
    this.engine.ship.rotateDir = Math.max(-1, Math.min(1, dir));

    // Thrust
    const thrusting = this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['w'] || this.keys['W'] || this.touchState.thrust;

    if (thrusting && !this.engine.ship.isThrusting) {
      this.audio.startThrust();
    } else if (!thrusting && this.engine.ship.isThrusting) {
      this.audio.stopThrust();
    }

    this.engine.ship.isThrusting = thrusting;
  }

  loop() {
    this.updateInput();
    this.engine.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
    const ctx = this.ctx;

    // Deep vector space black
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Vector Phosphor Glow Settings
    ctx.save();
    ctx.shadowColor = 'rgba(120, 240, 255, 0.45)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Render Asteroids
    for (const ast of this.engine.asteroids) {
      ctx.strokeStyle = '#e6ffff';
      ctx.beginPath();
      const cosA = Math.cos(ast.rotAngle);
      const sinA = Math.sin(ast.rotAngle);

      for (let i = 0; i < ast.vertices.length; i++) {
        const v = ast.vertices[i];
        const rx = v.x * cosA - v.y * sinA;
        const ry = v.x * sinA + v.y * cosA;
        if (i === 0) ctx.moveTo(ast.x + rx, ast.y + ry);
        else ctx.lineTo(ast.x + rx, ast.y + ry);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. Render Lasers
    ctx.strokeStyle = '#50ffb0';
    ctx.fillStyle = '#ffffff';
    for (const l of this.engine.lasers) {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Render Saucer Lasers
    ctx.strokeStyle = '#ff5577';
    ctx.fillStyle = '#ff7799';
    for (const l of this.engine.saucerLasers) {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 4. Render Saucer
    if (this.engine.saucer) {
      const s = this.engine.saucer;
      const r = s.radius;
      ctx.strokeStyle = '#ff4466';
      ctx.beginPath();

      // Lower saucer rim
      ctx.moveTo(s.x - r, s.y);
      ctx.lineTo(s.x + r, s.y);
      ctx.lineTo(s.x + r * 0.6, s.y + r * 0.45);
      ctx.lineTo(s.x - r * 0.6, s.y + r * 0.45);
      ctx.closePath();

      // Upper cockpit rim
      ctx.moveTo(s.x - r * 0.6, s.y);
      ctx.lineTo(s.x - r * 0.35, s.y - r * 0.4);
      ctx.lineTo(s.x + r * 0.35, s.y - r * 0.4);
      ctx.lineTo(s.x + r * 0.6, s.y);

      ctx.stroke();
    }

    // 5. Render Ship
    const ship = this.engine.ship;
    if (ship.alive) {
      const showShip = ship.invulnerableFrames <= 0 || Math.floor(ship.invulnerableFrames / 6) % 2 === 0;
      if (showShip) {
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();

        const r = ship.radius;
        const angle = ship.angle;

        const tipX = ship.x + Math.cos(angle) * (r * 1.2);
        const tipY = ship.y + Math.sin(angle) * (r * 1.2);
        const leftX = ship.x + Math.cos(angle + 2.5) * r;
        const leftY = ship.y + Math.sin(angle + 2.5) * r;
        const notchX = ship.x - Math.cos(angle) * (r * 0.4);
        const notchY = ship.y - Math.sin(angle) * (r * 0.4);
        const rightX = ship.x + Math.cos(angle - 2.5) * r;
        const rightY = ship.y + Math.sin(angle - 2.5) * r;

        ctx.moveTo(tipX, tipY);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(notchX, notchY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.stroke();

        // Thrust flame flickering
        if (ship.isThrusting && Math.random() > 0.15) {
          ctx.strokeStyle = '#ffaa33';
          ctx.beginPath();
          const flameTipX = ship.x - Math.cos(angle) * (r * (0.8 + Math.random() * 0.6));
          const flameTipY = ship.y - Math.sin(angle) * (r * (0.8 + Math.random() * 0.6));
          const flameLeftX = ship.x + Math.cos(angle + 2.8) * (r * 0.55);
          const flameLeftY = ship.y + Math.sin(angle + 2.8) * (r * 0.55);
          const flameRightX = ship.x + Math.cos(angle - 2.8) * (r * 0.55);
          const flameRightY = ship.y + Math.sin(angle - 2.8) * (r * 0.55);

          ctx.moveTo(flameLeftX, flameLeftY);
          ctx.lineTo(flameTipX, flameTipY);
          ctx.lineTo(flameRightX, flameRightY);
          ctx.stroke();
        }
      }
    }

    // 6. Render Debris Particles
    for (const p of this.engine.particles) {
      ctx.strokeStyle = `rgba(230, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      const hx = Math.cos(p.angle) * (p.length / 2);
      const hy = Math.sin(p.angle) * (p.length / 2);
      ctx.moveTo(p.x - hx, p.y - hy);
      ctx.lineTo(p.x + hx, p.y + hy);
      ctx.stroke();
    }

    ctx.restore();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => new AsteroidsUI());
} else {
  new AsteroidsUI();
}
