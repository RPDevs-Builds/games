/**
 * Frogger (1981) Canvas UI & Presentation Layer
 * Renders authentic retro pixel graphics, CRT scanline overlay,
 * responsive mobile touch D-pad, gamepad binding, and Arcade Vault synchronization.
 */

import { FroggerEngine, WIDTH, HEIGHT, GRID_SIZE, COLS, ROWS } from './engine.js';
import { FroggerAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { arcadeGamepad } from '../gamepad.js';

if (typeof window !== 'undefined') {
  if (!window.arcadeVault) window.arcadeVault = arcadeVault;
  if (!window.retroCRT) window.retroCRT = retroCRT;
  if (!window.arcadeGamepad) window.arcadeGamepad = arcadeGamepad;
}

class FroggerUI {
  constructor() {
    this.canvas = document.getElementById('frogger-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new FroggerAudio();

    // DOM Elements
    this.scoreEl = document.getElementById('stat-score');
    this.highScoreEl = document.getElementById('stat-high-score');
    this.levelEl = document.getElementById('stat-level');
    this.livesContainer = document.getElementById('lives-container');
    this.overlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayScore = document.getElementById('overlay-score');
    this.soundBtn = document.getElementById('btn-sound');
    this.crtBtn = document.getElementById('btn-crt');
    this.restartBtn = document.getElementById('btn-restart');
    this.vaultBtn = document.getElementById('btn-vault');

    this.engine = new FroggerEngine({
      onScore: (s) => this.updateScore(s),
      onLives: (l) => this.renderLives(l),
      onLevel: (lvl) => this.updateLevel(lvl),
      onTime: (t) => {},
      onGameOver: (s) => this.handleGameOver(s),
      onSound: (snd) => this.audio.play(snd),
      onAchievement: (ach) => this.handleAchievement(ach)
    });

    this.animId = null;
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupGamepad();
    this.syncAudioState();

    // Register with Arcade Vault
    if (window.arcadeVault) {
      window.arcadeVault.registerPlay('frogger');
      const savedHigh = window.arcadeVault.state.highScores['frogger'] || 0;
      this.highScoreEl.textContent = savedHigh;
    }

    this.renderLives(this.engine.lives);
    this.startGameLoop();
  }

  setupCanvas() {
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
  }

  syncAudioState() {
    if (window.arcadeVault) {
      const muted = window.arcadeVault.isAudioMuted();
      this.audio.setMuted(muted);
      if (this.soundBtn) {
        this.soundBtn.textContent = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.audio.ensureContext();
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.engine.hop('up');
        e.preventDefault();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.engine.hop('down');
        e.preventDefault();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.engine.hop('left');
        e.preventDefault();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.engine.hop('right');
        e.preventDefault();
      } else if (e.code === 'KeyR') {
        this.restartGame();
      }
    });

    // Touch controls
    const bindTouch = (id, direction) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const trigger = (e) => {
        if (e.cancelable) e.preventDefault();
        this.audio.ensureContext();
        this.engine.hop(direction);
      };
      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    };

    bindTouch('btn-touch-up', 'up');
    bindTouch('btn-touch-down', 'down');
    bindTouch('btn-touch-left', 'left');
    bindTouch('btn-touch-right', 'right');

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.restartGame();
      });
    }

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        const nextMuted = !this.audio.muted;
        this.audio.setMuted(nextMuted);
        if (window.arcadeVault) {
          window.arcadeVault.setAudioMuted(nextMuted);
        }
        this.soundBtn.textContent = nextMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
      });
    }

    if (this.crtBtn && window.retroCRT) {
      this.crtBtn.addEventListener('click', () => {
        window.retroCRT.toggle();
      });
    }

    if (this.vaultBtn) {
      this.vaultBtn.addEventListener('click', () => {
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

  setupGamepad() {
    if (window.arcadeGamepad) {
      window.arcadeGamepad.onButtonDown((btn) => {
        this.audio.ensureContext();
        if (btn === 'dpad_up' || btn === 'y') this.engine.hop('up');
        if (btn === 'dpad_down' || btn === 'a') this.engine.hop('down');
        if (btn === 'dpad_left' || btn === 'x') this.engine.hop('left');
        if (btn === 'dpad_right' || btn === 'b') this.engine.hop('right');
        if (btn === 'start' || btn === 'select') this.restartGame();
      });
    }
  }

  restartGame() {
    this.overlay.style.display = 'none';
    this.engine.reset();
    this.scoreEl.textContent = '0';
    this.levelEl.textContent = '1';
    this.renderLives(this.engine.lives);
  }

  updateScore(score) {
    this.scoreEl.textContent = score;
    const currentHigh = parseInt(this.highScoreEl.textContent, 10) || 0;
    if (score > currentHigh) {
      this.highScoreEl.textContent = score;
    }
    if (window.arcadeVault) {
      window.arcadeVault.recordScore('frogger', score);
    }
  }

  updateLevel(lvl) {
    this.levelEl.textContent = lvl;
  }

  renderLives(count) {
    this.livesContainer.innerHTML = '';
    for (let i = 0; i < Math.max(0, count); i++) {
      const icon = document.createElement('span');
      icon.className = 'life-icon';
      icon.innerHTML = '🐸';
      this.livesContainer.appendChild(icon);
    }
  }

  handleGameOver(score) {
    this.overlay.style.display = 'flex';
    this.overlayTitle.textContent = 'GAME OVER';
    this.overlayScore.textContent = `FINAL SCORE: ${score}`;
    if (window.arcadeVault) {
      window.arcadeVault.recordScore('frogger', score);
    }
  }

  handleAchievement(achId) {
    if (window.arcadeVault) {
      window.arcadeVault.unlock(achId);
    }
  }

  startGameLoop() {
    const loop = () => {
      this.engine.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;

    // 1. Draw River Background (Rows 1 to 5)
    ctx.fillStyle = '#001133';
    ctx.fillRect(0, 1 * GRID_SIZE, WIDTH, 5 * GRID_SIZE);

    // 2. Draw Highway Road Background (Rows 7 to 11)
    ctx.fillStyle = '#11141c';
    ctx.fillRect(0, 7 * GRID_SIZE, WIDTH, 5 * GRID_SIZE);

    // Road dashed lane dividers
    ctx.strokeStyle = '#333b4d';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 16]);
    for (let r = 8; r <= 11; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * GRID_SIZE);
      ctx.lineTo(WIDTH, r * GRID_SIZE);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Draw Median Sidewalk (Row 6) & Starting Sidewalk (Row 12)
    ctx.fillStyle = '#552277';
    ctx.fillRect(0, 6 * GRID_SIZE, WIDTH, GRID_SIZE);
    ctx.fillRect(0, 12 * GRID_SIZE, WIDTH, GRID_SIZE);

    // Sidewalk brick pattern lines
    ctx.strokeStyle = '#7733aa';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.strokeRect(c * GRID_SIZE, 6 * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      ctx.strokeRect(c * GRID_SIZE, 12 * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // 4. Draw Goal Docks Bush Line (Row 0)
    ctx.fillStyle = '#005511';
    ctx.fillRect(0, 0, WIDTH, GRID_SIZE);

    // Draw the 5 Home Bays
    for (const home of this.engine.homes) {
      // Open bay channel
      ctx.fillStyle = '#001133';
      ctx.fillRect(home.x, 0, home.width, GRID_SIZE);

      // Bay border
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.strokeRect(home.x, 0, home.width, GRID_SIZE);

      if (home.filled) {
        this.drawFrog(home.x + 6, 6, 28, 28, 'up', false);
      } else if (home.fly) {
        this.drawFly(home.x + 12, 12);
      }
    }

    // 5. Draw River Objects (Logs & Diving Turtles)
    for (let r = 1; r <= 5; r++) {
      const lane = this.engine.lanes[r];
      for (const obj of lane.objects) {
        if (obj.type === 'log') {
          this.drawLog(obj.x, obj.y + 4, obj.width, obj.height);
        } else if (obj.type === 'turtle') {
          this.drawTurtles(obj);
        }
      }
    }

    // 6. Draw Vehicles (Rows 7 to 11)
    for (let r = 7; r <= 11; r++) {
      const lane = this.engine.lanes[r];
      for (const car of lane.objects) {
        this.drawVehicle(car, lane.speed > 0 ? 'right' : 'left');
      }
    }

    // 7. Draw Player Frog
    if (this.engine.state === 'FROG_DYING') {
      this.drawDeathAnimation(this.engine.frog.x, this.engine.frog.y, this.engine.deathType);
    } else {
      this.drawFrog(
        this.engine.frog.x + 6,
        this.engine.frog.y + 6,
        this.engine.frog.width,
        this.engine.frog.height,
        this.engine.frog.direction,
        this.engine.frog.hopping
      );
    }

    // 8. Draw Bottom HUD / Time Bar (Row 13)
    this.renderHUD();
  }

  drawLog(x, y, width, height) {
    const ctx = this.ctx;
    // Log wood body
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(x, y, width, height);

    // Wood texture bark highlights
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(x + 4, y + 4, width - 8, 4);
    ctx.fillRect(x + 10, y + 14, width - 20, 4);

    // End tree-rings
    ctx.fillStyle = '#c8965a';
    ctx.beginPath();
    ctx.arc(x + 6, y + height / 2, 8, 0, Math.PI * 2);
    ctx.arc(x + width - 6, y + height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTurtles(obj) {
    const ctx = this.ctx;
    const count = obj.count;
    const turtleW = obj.width / count;

    if (obj.submergeState === 2) {
      // Submerged: render water ripple bubbles
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        const tx = obj.x + i * turtleW + turtleW / 2;
        ctx.beginPath();
        ctx.arc(tx, obj.y + 16, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }

    // Half submerged opacity
    const alpha = obj.submergeState === 1 ? 0.5 : 1.0;
    ctx.save();
    ctx.globalAlpha = alpha;

    for (let i = 0; i < count; i++) {
      const tx = obj.x + i * turtleW + 4;
      const ty = obj.y + 4;

      // Shell
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.ellipse(tx + 12, ty + 11, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shell pattern
      ctx.strokeStyle = '#880011';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flippers
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(tx + 2, ty - 1, 5, 5);
      ctx.fillRect(tx + 18, ty - 1, 5, 5);
      ctx.fillRect(tx + 2, ty + 18, 5, 5);
      ctx.fillRect(tx + 18, ty + 18, 5, 5);

      // Head
      ctx.beginPath();
      ctx.arc(tx - 1, ty + 11, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawVehicle(car, dir) {
    const ctx = this.ctx;
    const x = car.x;
    const y = car.y + 5;
    const w = car.width;
    const h = car.height;

    ctx.fillStyle = car.color;
    ctx.fillRect(x, y, w, h);

    // Windows
    ctx.fillStyle = '#111822';
    if (car.carType === 'racecar') {
      ctx.fillRect(x + 10, y + 4, w - 20, h - 8);
    } else if (car.carType === 'truck') {
      const cabX = dir === 'right' ? x + w - 22 : x;
      ctx.fillRect(cabX + 4, y + 4, 14, h - 8);
    } else {
      ctx.fillRect(x + 6, y + 4, w - 12, h - 8);
    }

    // Headlights
    ctx.fillStyle = '#ffff66';
    const lightX = dir === 'right' ? x + w - 3 : x;
    ctx.fillRect(lightX, y + 2, 3, 4);
    ctx.fillRect(lightX, y + h - 6, 3, 4);
  }

  drawFrog(x, y, w, h, dir, hopping) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    let angle = 0;
    if (dir === 'right') angle = Math.PI / 2;
    else if (dir === 'down') angle = Math.PI;
    else if (dir === 'left') angle = -Math.PI / 2;
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -7, 4, 0, Math.PI * 2);
    ctx.arc(6, -7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, -8, 2, 0, Math.PI * 2);
    ctx.arc(6, -8, 2, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Flippers
    ctx.fillStyle = '#00ff66';
    if (hopping) {
      // Extended jumping legs
      ctx.fillRect(-12, -4, 4, 12);
      ctx.fillRect(8, -4, 4, 12);
      ctx.fillRect(-14, 8, 6, 4);
      ctx.fillRect(8, 8, 6, 4);
    } else {
      // Resting crouching legs
      ctx.fillRect(-10, 4, 4, 8);
      ctx.fillRect(6, 4, 4, 8);
      ctx.fillRect(-10, -5, 4, 6);
      ctx.fillRect(6, -5, 4, 6);
    }

    ctx.restore();
  }

  drawFly(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    // Wings
    ctx.fillRect(x, y, 6, 4);
    ctx.fillRect(x + 10, y, 6, 4);
    // Body
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 5, y + 2, 6, 8);
  }

  drawDeathAnimation(x, y, type) {
    const ctx = this.ctx;
    if (type === 'splash') {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 20, y + 20, 16, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 20, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Splat skull / cross
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(x + 12, y + 8, 16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 8, y + 16, 24, 6);
      ctx.fillRect(x + 17, y + 8, 6, 22);
    }
  }

  renderHUD() {
    const ctx = this.ctx;
    const hudY = 13 * GRID_SIZE;

    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, hudY, WIDTH, GRID_SIZE);

    // Time Label
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TIME', 14, hudY + 24);

    // Time Bar
    const maxBarW = 260;
    const progress = Math.max(0, this.engine.timeLeft / 30);
    const barW = maxBarW * progress;

    ctx.fillStyle = '#21262d';
    ctx.fillRect(60, hudY + 12, maxBarW, 14);

    ctx.fillStyle = progress > 0.3 ? '#00ff66' : '#ff3344';
    ctx.fillRect(60, hudY + 12, barW, 14);

    // Border
    ctx.strokeStyle = '#3b455b';
    ctx.strokeRect(60, hudY + 12, maxBarW, 14);

    // Saved frogs count
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'right';
    ctx.fillText(`SAVED: ${this.engine.stats.frogsSaved}`, WIDTH - 14, hudY + 24);
  }
}

// DOM Ready initialization
function init() {
  new FroggerUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
