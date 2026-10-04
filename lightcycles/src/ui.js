/**
 * Tron Light Cycles UI Controller
 * HTML5 Canvas 800x600, Neon grid glow, Keyboard/Touch/Gamepad controls.
 */

import { LightCyclesEngine, ARENA_COLS, ARENA_ROWS, EMPTY, WALL, P1_TRAIL, P2_TRAIL } from './engine.js';
import { LightCyclesAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { arcadeGamepad } from '../gamepad.js';

export class LightCyclesUI {
  constructor() {
    this.engine = new LightCyclesEngine();
    this.audio = new LightCyclesAudio();

    this.mode = 'ai'; // 'ai' or 'pvp'
    this.diff = 'medium';
    this.fps = 20; // 20 updates per second base speed
    this.lastUpdate = 0;

    this.cacheElements();
    this.bindEvents();
    this.initGamepad();

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    arcadeVault.recordPlay('lightcycles');
    if (arcadeVault && typeof arcadeVault.bindNavigation === 'function') {
      arcadeVault.bindNavigation('lightcycles');
    }
  }

  cacheElements() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreP1El = document.getElementById('score-p1');
    this.scoreP2El = document.getElementById('score-p2');
    this.boostP1El = document.getElementById('boost-p1-bar');
    this.boostP2El = document.getElementById('boost-p2-bar');
    this.overlayEl = document.getElementById('game-overlay');
    this.overlayTitleEl = document.getElementById('overlay-title');
    this.overlayMsgEl = document.getElementById('overlay-msg');
    this.selectModeEl = document.getElementById('select-mode');
    this.btnRestartEl = document.getElementById('btn-restart');
    this.btnSoundEl = document.getElementById('btn-sound');
    this.btnCrtEl = document.getElementById('btn-crt');
  }

  bindEvents() {
    if (this.btnRestartEl) {
      this.btnRestartEl.onclick = () => this.restart();
    }

    if (this.selectModeEl) {
      this.selectModeEl.onchange = (e) => {
        this.mode = e.target.value;
        this.restart();
      };
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

    // Keyboard bindings (P1: Arrows or WASD; P2: IJKL)
    window.addEventListener('keydown', (e) => {
      if (this.engine.gameOver) {
        if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') this.restart();
        return;
      }

      this.audio.startEngineHum();

      // P1 Controls
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.engine.setDirection(1, 'UP');
          this.audio.playTurn();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.engine.setDirection(1, 'DOWN');
          this.audio.playTurn();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.engine.setDirection(1, 'LEFT');
          this.audio.playTurn();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.engine.setDirection(1, 'RIGHT');
          this.audio.playTurn();
          break;
        case 'Shift':
        case ' ':
          this.engine.setBoost(1, true);
          break;
      }

      // P2 Controls (PvP)
      if (this.mode === 'pvp') {
        switch (e.key) {
          case 'i':
          case 'I':
            this.engine.setDirection(2, 'UP');
            this.audio.playTurn();
            break;
          case 'k':
          case 'K':
            this.engine.setDirection(2, 'DOWN');
            this.audio.playTurn();
            break;
          case 'j':
          case 'J':
            this.engine.setDirection(2, 'LEFT');
            this.audio.playTurn();
            break;
          case 'l':
          case 'L':
            this.engine.setDirection(2, 'RIGHT');
            this.audio.playTurn();
            break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key === ' ') {
        this.engine.setBoost(1, false);
      }
    });

    // Touch D-Pad buttons
    ['btn-up', 'btn-down', 'btn-left', 'btn-right'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        const dir = id.replace('btn-', '').toUpperCase();
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.audio.startEngineHum();
          this.engine.setDirection(1, dir);
          this.audio.playTurn();
          arcadeVault.vibrate(10);
        }, { passive: false });
      }
    });
  }

  initGamepad() {
    arcadeGamepad.onButtonDown((btn) => {
      if (this.engine.gameOver && (btn === 'start' || btn === 'a')) {
        this.restart();
        return;
      }

      this.audio.startEngineHum();
      if (btn === 'dpad_up' || btn === 'up') { this.engine.setDirection(1, 'UP'); this.audio.playTurn(); }
      else if (btn === 'dpad_down' || btn === 'down') { this.engine.setDirection(1, 'DOWN'); this.audio.playTurn(); }
      else if (btn === 'dpad_left' || btn === 'left') { this.engine.setDirection(1, 'LEFT'); this.audio.playTurn(); }
      else if (btn === 'dpad_right' || btn === 'right') { this.engine.setDirection(1, 'RIGHT'); this.audio.playTurn(); }
      else if (btn === 'a' || btn === 'r1') { this.engine.setBoost(1, true); }
    });

    arcadeGamepad.onButtonUp((btn) => {
      if (btn === 'a' || btn === 'r1') this.engine.setBoost(1, false);
    });
  }

  restart() {
    this.engine.reset();
    this.overlayEl.style.display = 'none';
    this.audio.startEngineHum();
  }

  loop(timestamp) {
    if (!this.lastUpdate) this.lastUpdate = timestamp;

    const interval = this.engine.p1.isBoosting ? 25 : (1000 / this.fps);
    if (timestamp - this.lastUpdate >= interval) {
      this.lastUpdate = timestamp;

      if (!this.engine.gameOver) {
        if (this.mode === 'ai') {
          this.engine.computeAIMove(this.diff);
        }
        this.engine.update();

        if (this.engine.gameOver) {
          this.handleGameOver();
        }
      }
    }

    this.render();
    requestAnimationFrame(this.loop);
  }

  handleGameOver() {
    this.audio.playDeRezExplosion();
    arcadeVault.vibrate([70, 40, 110]);
    this.overlayEl.style.display = 'flex';

    if (this.engine.winner === 1) {
      this.overlayTitleEl.textContent = 'PLAYER 1 WINS!';
      this.overlayTitleEl.style.color = '#00f0ff';
      this.overlayMsgEl.textContent = 'Opponent de-rezzed into the light trail.';
      arcadeVault.recordWin('lightcycles', { winner: 1, mode: this.mode });
      arcadeVault.unlock('cycle_survivor');
    } else if (this.engine.winner === 2) {
      this.overlayTitleEl.textContent = this.mode === 'ai' ? 'CPU WINS!' : 'PLAYER 2 WINS!';
      this.overlayTitleEl.style.color = '#ff9900';
      this.overlayMsgEl.textContent = 'You hit the light trail barrier.';
    } else {
      this.overlayTitleEl.textContent = 'MUTUAL DE-REZ!';
      this.overlayTitleEl.style.color = '#ffe600';
      this.overlayMsgEl.textContent = 'Head-on collision in the arena grid.';
    }
  }

  render() {
    this.scoreP1El.textContent = this.engine.p1.score;
    this.scoreP2El.textContent = this.engine.p2.score;
    this.boostP1El.style.width = `${this.engine.p1.boost}%`;
    this.boostP2El.style.width = `${this.engine.p2.boost}%`;

    const ctx = this.ctx;
    const cellW = this.canvas.width / ARENA_COLS;
    const cellH = this.canvas.height / ARENA_ROWS;

    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid Lines faint
    ctx.strokeStyle = '#0e1520';
    ctx.lineWidth = 0.5;
    for (let c = 0; c < ARENA_COLS; c += 5) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, this.canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r < ARENA_ROWS; r += 5) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH); ctx.lineTo(this.canvas.width, r * cellH);
      ctx.stroke();
    }

    // Draw Walls and Trails
    for (let r = 0; r < ARENA_ROWS; r++) {
      for (let c = 0; c < ARENA_COLS; c++) {
        const val = this.engine.grid[r][c];
        if (val === WALL) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        } else if (val === P1_TRAIL) {
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        } else if (val === P2_TRAIL) {
          ctx.fillStyle = '#ff9900';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
    }

    // Draw Light Cycle Heads (brighter leading point)
    if (this.engine.p1.alive) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.engine.p1.x * cellW - 1, this.engine.p1.y * cellH - 1, cellW + 2, cellH + 2);
    }
    if (this.engine.p2.alive) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.engine.p2.x * cellW - 1, this.engine.p2.y * cellH - 1, cellW + 2, cellH + 2);
    }
  }
}
