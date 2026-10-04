/**
 * Maze Chaser (1980) UI & Canvas Renderer
 * 60 FPS Canvas rendering, retro CRT scanlines, mouth animation,
 * ghost eyes & skirt rendering, touch swipe, and Arcade Vault integration.
 */

import { MazeEngine, COLS, ROWS, DIRS } from './engine.js';
import { audio } from './audio.js';

export class MazeUI {
  constructor() {
    this.engine = new MazeEngine();
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.tileSize = 20;
    this.canvas.width = COLS * this.tileSize;
    this.canvas.height = ROWS * this.tileSize;

    // DOM elements
    this.scoreEl = document.getElementById('stat-score');
    this.livesEl = document.getElementById('stat-lives');
    this.pelletsEl = document.getElementById('stat-pellets');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.victoryOverlay = document.getElementById('victory-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.finalScoreEl = document.getElementById('final-score');
    this.winScoreEl = document.getElementById('win-score');

    this.lastTime = performance.now();
    this.mouthAngle = 0.2;

    this.bindEvents();
    this.updateHUD();

    requestAnimationFrame((t) => this.loop(t));
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      audio.init();
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.engine.setPlayerDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.engine.setPlayerDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.engine.setPlayerDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.engine.setPlayerDirection('RIGHT');
          break;
        case 'KeyP':
        case 'Escape':
          this.togglePause();
          break;
        case 'KeyR':
          this.resetGame();
          break;
      }
    });

    // Touch D-Pad buttons
    const bindBtn = (id, dir) => {
      const el = document.getElementById(id);
      if (!el) return;
      const trigger = (e) => {
        e.preventDefault();
        audio.init();
        this.engine.setPlayerDirection(dir);
      };
      el.addEventListener('touchstart', trigger, { passive: false });
      el.addEventListener('click', trigger);
    };

    bindBtn('btn-up', 'UP');
    bindBtn('btn-down', 'DOWN');
    bindBtn('btn-left', 'LEFT');
    bindBtn('btn-right', 'RIGHT');

    const bindAction = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        audio.init();
        fn();
      });
    };

    bindAction('btn-pause', () => this.togglePause());
    bindAction('btn-reset', () => this.resetGame());
    bindAction('btn-restart', () => this.resetGame());
    bindAction('btn-win-restart', () => this.resetGame());
    bindAction('btn-resume', () => this.togglePause());

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
          vault.goToArcade('mazechaser');
        } else if (window.location.pathname.includes('/mazechaser/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      });
    }

    // Touch Swipe Gestures on Canvas
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        audio.init();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const threshold = 25;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) {
          if (dx > 0) this.engine.setPlayerDirection('RIGHT');
          else this.engine.setPlayerDirection('LEFT');
        }
      } else {
        if (Math.abs(dy) > threshold) {
          if (dy > 0) this.engine.setPlayerDirection('DOWN');
          else this.engine.setPlayerDirection('UP');
        }
      }
    }, { passive: true });
  }

  togglePause() {
    if (this.engine.gameOver || this.engine.gameWon) return;
    this.engine.isPaused = !this.engine.isPaused;
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = this.engine.isPaused ? 'flex' : 'none';
    }
  }

  resetGame() {
    this.engine.reset();
    if (this.gameOverOverlay) this.gameOverOverlay.style.display = 'none';
    if (this.victoryOverlay) this.victoryOverlay.style.display = 'none';
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
    this.updateHUD();
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.engine.score.toLocaleString();
    if (this.livesEl) this.livesEl.textContent = '💛 '.repeat(Math.max(0, this.engine.lives));
    if (this.pelletsEl) this.pelletsEl.textContent = this.engine.pelletsRemaining;
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    const events = this.engine.update(dt);

    if (events.pelletEaten) {
      audio.munch();
      this.updateHUD();
    }
    if (events.energizerEaten) {
      audio.energizer();
      this.updateHUD();
    }
    if (events.ghostEaten) {
      audio.ghostEaten();
      this.updateHUD();
      if (events.ghostEaten.count >= 4 && window.ArcadeVault) {
        window.ArcadeVault.unlockBadge('maze_ghost_hunter');
      }
    }
    if (events.playerDied) {
      audio.death();
      this.updateHUD();
      if (this.engine.gameOver) {
        this.onGameOver();
      }
    }
    if (events.fruitEaten) {
      audio.fruit();
      this.updateHUD();
      if (window.ArcadeVault) {
        window.ArcadeVault.unlockBadge('maze_fruit_lover');
      }
    }
    if (events.gameWon) {
      this.onGameWon();
    }

    this.draw(time);
    requestAnimationFrame((t) => this.loop(t));
  }

  onGameOver() {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.style.display = 'flex';
      if (this.finalScoreEl) {
        this.finalScoreEl.textContent = this.engine.score.toLocaleString();
      }
    }
    if (window.ArcadeVault) {
      window.ArcadeVault.recordScore('mazechaser', this.engine.score);
    }
  }

  onGameWon() {
    if (this.victoryOverlay) {
      this.victoryOverlay.style.display = 'flex';
      if (this.winScoreEl) {
        this.winScoreEl.textContent = this.engine.score.toLocaleString();
      }
    }
    if (window.ArcadeVault) {
      window.ArcadeVault.recordWin('mazechaser', this.engine.score);
      window.ArcadeVault.unlockBadge('maze_clear');
    }
  }

  draw(time) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    // Clear background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Maze Grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.engine.grid[r][c];
        const x = c * ts;
        const y = r * ts;

        if (tile === '#') {
          // Wall
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, ts, ts);
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        } else if (tile === 'G' || tile === '-') {
          // Ghost house & gate
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(x, y, ts, ts);
          if (tile === '-') {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(x, y + ts / 2 - 2, ts, 4);
          }
        } else if (tile === '.') {
          // Pellet
          ctx.fillStyle = '#ffbeaa';
          ctx.beginPath();
          ctx.arc(x + ts / 2, y + ts / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === '*') {
          // Energizer power pellet
          const pulse = Math.sin(time * 0.008) * 1.5;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(x + ts / 2, y + ts / 2, 5 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Fruit (Bonus)
    if (this.engine.fruit && this.engine.fruit.active) {
      const fx = this.engine.fruit.x * ts + ts / 2;
      const fy = this.engine.fruit.y * ts + ts / 2;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(fx - 3, fy, 4, 0, Math.PI * 2);
      ctx.arc(fx + 3, fy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx - 3, fy - 3);
      ctx.quadraticCurveTo(fx, fy - 8, fx + 3, fy - 3);
      ctx.stroke();
    }

    // Draw Ghosts
    for (const g of Object.values(this.engine.ghosts)) {
      this.drawGhost(ctx, g, ts, time);
    }

    // Draw Player
    this.drawPlayer(ctx, this.engine.player, ts, time);
  }

  drawPlayer(ctx, p, ts, time) {
    const cx = p.subX * ts + ts / 2;
    const cy = p.subY * ts + ts / 2;
    const r = ts / 2 - 1.5;

    // Chomp animation angle
    const chomp = Math.abs(Math.sin(time * 0.015)) * 0.25 * Math.PI;

    // Rotation angle based on direction
    let rot = 0;
    if (p.dir.name === 'RIGHT') rot = 0;
    else if (p.dir.name === 'DOWN') rot = Math.PI * 0.5;
    else if (p.dir.name === 'LEFT') rot = Math.PI;
    else if (p.dir.name === 'UP') rot = Math.PI * 1.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(0, 0, r, chomp, Math.PI * 2 - chomp);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawGhost(ctx, g, ts, time) {
    const cx = g.subX * ts + ts / 2;
    const cy = g.subY * ts + ts / 2;
    const r = ts / 2 - 1.5;

    if (g.mode === 'eaten') {
      // Just floating eyes returning to house
      this.drawGhostEyes(ctx, cx, cy, g.dir);
      return;
    }

    // Body color
    let bodyColor = g.color;
    if (g.mode === 'frightened') {
      const isFlashing = this.engine.frightenedTimer < 2.0 && Math.floor(time / 150) % 2 === 0;
      bodyColor = isFlashing ? '#ffffff' : '#1d4ed8';
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Dome top
    ctx.arc(cx, cy - 2, r, Math.PI, 0, false);
    // Skirt bottom with wavy ruffles
    const ruffle = Math.sin(time * 0.015) > 0 ? 3 : -3;
    ctx.lineTo(cx + r, cy + r - 2);
    ctx.lineTo(cx + r / 2, cy + r - 4 + ruffle);
    ctx.lineTo(cx, cy + r - 2);
    ctx.lineTo(cx - r / 2, cy + r - 4 - ruffle);
    ctx.lineTo(cx - r, cy + r - 2);
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (g.mode === 'frightened') {
      // Small frightened eyes
      ctx.fillStyle = '#ffb8de';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this.drawGhostEyes(ctx, cx, cy, g.dir);
    }
  }

  drawGhostEyes(ctx, cx, cy, dir) {
    const eyeOffsetX = dir ? dir.x * 2 : 0;
    const eyeOffsetY = dir ? dir.y * 2 : 0;

    // Sclera (White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 4, cy - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil (Blue)
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.arc(cx - 4 + eyeOffsetX, cy - 2 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 4 + eyeOffsetX, cy - 2 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MazeUI();
});
