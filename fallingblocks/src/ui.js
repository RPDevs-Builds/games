/**
 * Falling Blocks (1984) UI & Controller
 * 60 FPS Canvas rendering, high-DPI scaling, touch buttons,
 * swipe gestures, keyboard listeners, and Arcade Vault integration.
 */

import { FallingBlocksEngine, COLS, ROWS, SHAPES } from './engine.js';
import { audio } from './audio.js';

export class FallingBlocksUI {
  constructor() {
    this.engine = new FallingBlocksEngine();

    // Canvases
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas ? this.holdCanvas.getContext('2d') : null;

    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas ? this.nextCanvas.getContext('2d') : null;

    // DOM Elements
    this.scoreEl = document.getElementById('stat-score');
    this.levelEl = document.getElementById('stat-level');
    this.linesEl = document.getElementById('stat-lines');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.finalScoreEl = document.getElementById('final-score');

    this.cellSize = 30;
    this.lastTime = 0;
    this.dropCounter = 0;

    // Key repeat timers (DAS/ARR)
    this.keyStates = {};
    this.keyTimers = {};

    this.setupCanvases();
    this.bindEvents();
    this.updateHUD();

    // Start game loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupCanvases() {
    this.canvas.width = COLS * this.cellSize;
    this.canvas.height = ROWS * this.cellSize;

    if (this.holdCanvas) {
      this.holdCanvas.width = 4 * 20;
      this.holdCanvas.height = 4 * 20;
    }
    if (this.nextCanvas) {
      this.nextCanvas.width = 4 * 20;
      this.nextCanvas.height = 3 * (3 * 20);
    }
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Touch on-screen buttons
    const bindBtn = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const trigger = (e) => {
        e.preventDefault();
        audio.init();
        action();
      };
      el.addEventListener('touchstart', trigger, { passive: false });
      el.addEventListener('click', trigger);
    };

    bindBtn('btn-left', () => this.moveLeft());
    bindBtn('btn-right', () => this.moveRight());
    bindBtn('btn-down', () => this.softDrop());
    bindBtn('btn-drop', () => this.hardDrop());
    bindBtn('btn-rot-cw', () => this.rotateCW());
    bindBtn('btn-rot-ccw', () => this.rotateCCW());
    bindBtn('btn-hold', () => this.hold());
    bindBtn('btn-pause', () => this.togglePause());
    bindBtn('btn-reset', () => this.resetGame());
    bindBtn('btn-restart', () => this.resetGame());
    bindBtn('btn-resume', () => this.togglePause());

    // Sound and CRT toggles
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        audio.init();
        const muted = audio.toggleMute();
        soundBtn.textContent = muted ? '🔇 Sound Off' : '🔊 Sound On';
      });
    }

    const crtBtn = document.getElementById('btn-crt');
    if (crtBtn && window.RetroCRT) {
      crtBtn.addEventListener('click', () => {
        window.RetroCRT.toggle();
      });
    }

    // Arcade Navigation Link
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const vault = window.arcadeVault || window.ArcadeVault;
        if (vault && typeof vault.goToArcade === 'function') {
          vault.goToArcade('fallingblocks');
        } else if (window.location.pathname.includes('/fallingblocks/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      });
    }

    // Touch swipe gestures on main canvas
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        audio.init();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const threshold = 28;

        if (Math.abs(dx) > threshold) {
          if (dx > 0) this.moveRight();
          else this.moveLeft();
          touchStartX = e.touches[0].clientX;
        } else if (dy > threshold * 1.5) {
          this.softDrop();
          touchStartY = e.touches[0].clientY;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      const dt = performance.now() - touchStartTime;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      // Quick tap without significant movement -> Rotate CW
      if (dt < 250 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        this.rotateCW();
      }
    }, { passive: true });
  }

  handleKeyDown(e) {
    audio.init();
    if (e.repeat) {
      if (e.code === 'ArrowDown') {
        this.softDrop();
      }
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft();
        this.startKeyRepeat('left', () => this.moveLeft());
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight();
        this.startKeyRepeat('right', () => this.moveRight());
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyX':
        this.rotateCW();
        break;
      case 'KeyZ':
        this.rotateCCW();
        break;
      case 'Space':
        e.preventDefault();
        this.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.hold();
        break;
      case 'KeyP':
      case 'Escape':
        this.togglePause();
        break;
      case 'KeyR':
        this.resetGame();
        break;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.stopKeyRepeat('left');
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.stopKeyRepeat('right');
  }

  startKeyRepeat(key, action) {
    this.stopKeyRepeat(key);
    this.keyTimers[key] = setTimeout(() => {
      this.keyTimers[key] = setInterval(action, 45);
    }, 160);
  }

  stopKeyRepeat(key) {
    if (this.keyTimers[key]) {
      clearTimeout(this.keyTimers[key]);
      clearInterval(this.keyTimers[key]);
      delete this.keyTimers[key];
    }
  }

  moveLeft() {
    if (this.engine.moveLeft()) {
      audio.move();
    }
  }

  moveRight() {
    if (this.engine.moveRight()) {
      audio.move();
    }
  }

  rotateCW() {
    if (this.engine.rotateCW()) {
      audio.rotate();
    }
  }

  rotateCCW() {
    if (this.engine.rotateCCW()) {
      audio.rotate();
    }
  }

  softDrop() {
    const res = this.engine.softDrop();
    if (res.moved) {
      audio.softDrop();
      this.updateHUD();
    } else if (res.locked) {
      this.handleLock(res.clearedLines);
    }
  }

  hardDrop() {
    const res = this.engine.hardDrop();
    audio.hardDrop();
    this.handleLock(res.clearedLines);
  }

  hold() {
    if (this.engine.hold()) {
      audio.hold();
      this.updateHUD();
    }
  }

  handleLock(clearedLines) {
    if (clearedLines > 0) {
      audio.clearLine(clearedLines);
      if (clearedLines === 4 && window.ArcadeVault) {
        window.ArcadeVault.unlockBadge('blocks_tetris');
      }
    }

    if (this.engine.level >= 10 && window.ArcadeVault) {
      window.ArcadeVault.unlockBadge('blocks_speed');
    }

    this.updateHUD();

    if (this.engine.gameOver) {
      audio.gameOver();
      this.onGameOver();
    }
  }

  togglePause() {
    if (this.engine.gameOver) return;
    this.engine.isPaused = !this.engine.isPaused;
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = this.engine.isPaused ? 'flex' : 'none';
    }
  }

  onGameOver() {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.style.display = 'flex';
      if (this.finalScoreEl) {
        this.finalScoreEl.textContent = this.engine.score.toLocaleString();
      }
    }
    if (window.ArcadeVault) {
      window.ArcadeVault.recordScore('fallingblocks', this.engine.score);
      const totalLines = (window.ArcadeVault.getStat('fallingblocks_lines') || 0) + this.engine.lines;
      window.ArcadeVault.setStat('fallingblocks_lines', totalLines);
      if (totalLines >= 100) {
        window.ArcadeVault.unlockBadge('blocks_century');
      }
    }
  }

  resetGame() {
    this.engine.reset();
    if (this.gameOverOverlay) this.gameOverOverlay.style.display = 'none';
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
    this.updateHUD();
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.engine.score.toLocaleString();
    if (this.levelEl) this.levelEl.textContent = this.engine.level;
    if (this.linesEl) this.linesEl.textContent = this.engine.lines;
    this.renderHold();
    this.renderNext();
  }

  renderHold() {
    if (!this.holdCtx) return;
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    if (!this.engine.holdPiece) return;

    const shape = SHAPES[this.engine.holdPiece];
    const matrix = shape.matrices[0];
    const miniCell = 18;
    const offX = Math.floor((this.holdCanvas.width - matrix[0].length * miniCell) / 2);
    const offY = Math.floor((this.holdCanvas.height - matrix.length * miniCell) / 2);

    this.renderMatrix(ctx, matrix, offX, offY, miniCell, shape.color);
  }

  renderNext() {
    if (!this.nextCtx) return;
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    const miniCell = 16;
    this.engine.nextQueue.slice(0, 3).forEach((type, idx) => {
      const shape = SHAPES[type];
      const matrix = shape.matrices[0];
      const offX = Math.floor((this.nextCanvas.width - matrix[0].length * miniCell) / 2);
      const offY = 8 + idx * 56;
      this.renderMatrix(ctx, matrix, offX, offY, miniCell, shape.color);
    });
  }

  renderMatrix(ctx, matrix, offsetX, offsetY, cellSize, color) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          this.drawBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, color);
        }
      }
    }
  }

  drawBlock(ctx, x, y, size, color, isGhost = false) {
    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.globalAlpha = 1.0;
      return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x, y, size, 2);
    ctx.fillRect(x, y, 2, size);

    // Bevel shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x, y + size - 2, size, 2);
    ctx.fillRect(x + size - 2, y, 2, size);

    // Inner outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }

  loop(time) {
    const dt = time - this.lastTime;
    this.lastTime = time;

    if (!this.engine.gameOver && !this.engine.isPaused) {
      this.dropCounter += dt;
      if (this.dropCounter > this.engine.getDropInterval()) {
        this.dropCounter = 0;
        const res = this.engine.softDrop();
        if (res.locked) {
          this.handleLock(res.clearedLines);
        }
      }
    }

    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  draw() {
    this.ctx.fillStyle = '#0a0d14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw subtle grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.cellSize, 0);
      this.ctx.lineTo(c * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.cellSize);
      this.ctx.lineTo(this.canvas.width, r * this.cellSize);
      this.ctx.stroke();
    }

    // Draw settled blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = this.engine.board[r][c];
        if (color) {
          this.drawBlock(this.ctx, c * this.cellSize, r * this.cellSize, this.cellSize, color);
        }
      }
    }

    // Draw ghost piece & current falling piece
    if (this.engine.currentPiece && !this.engine.gameOver) {
      const matrix = this.engine.getCurrentMatrix();
      const ghostY = this.engine.getGhostY();

      // Ghost piece
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            const bx = this.engine.currentPiece.x + c;
            const by = ghostY + r;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
              this.drawBlock(this.ctx, bx * this.cellSize, by * this.cellSize, this.cellSize, this.engine.currentPiece.color, true);
            }
          }
        }
      }

      // Active piece
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            const bx = this.engine.currentPiece.x + c;
            const by = this.engine.currentPiece.y + r;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
              this.drawBlock(this.ctx, bx * this.cellSize, by * this.cellSize, this.cellSize, this.engine.currentPiece.color);
            }
          }
        }
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FallingBlocksUI();
});
