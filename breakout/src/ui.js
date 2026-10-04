/**
 * Breakout UI & Rendering Controller
 * High-performance 60 FPS HTML5 Canvas engine with responsive touch drag, virtual keypad & Gamepad.
 */

import { BreakoutEngine, ARENA_WIDTH, ARENA_HEIGHT } from './engine.js';
import { BreakoutAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';
import { ArcadeMenu } from '../../arcade_menu.js';

export class BreakoutUI {
  constructor() {
    this.engine = new BreakoutEngine();
    this.audio = new BreakoutAudio();

    this.menu = new ArcadeMenu({
      gameId: 'breakout',
      title: 'Breakout',
      year: '1976',
      audio: this.audio
    });

    this.canvas = document.getElementById('breakout-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.scoreEl = document.getElementById('stat-score');
    this.highScoreEl = document.getElementById('stat-high');
    this.livesEl = document.getElementById('stat-lives');
    this.overlayEl = document.getElementById('game-overlay');
    this.overlayMsgEl = document.getElementById('overlay-msg');
    this.btnLaunch = document.getElementById('btn-launch');

    this.highScore = parseInt(localStorage.getItem('breakout_highscore') || '0', 10);
    this.highScoreEl.textContent = this.highScore;

    this.keys = {};
    this.isDragging = false;
    this.rafId = null;

    this.initCanvasSize();
    this.bindEvents();
    this.updateStatsDisplay();

    arcadeVault.recordPlay('breakout');

    // Start game loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  initCanvasSize() {
    // Canvas internal logical resolution is fixed 480x640
    this.canvas.width = ARENA_WIDTH;
    this.canvas.height = ARENA_HEIGHT;
  }

  updateStatsDisplay() {
    this.scoreEl.textContent = this.engine.score;
    if (this.engine.score > this.highScore) {
      this.highScore = this.engine.score;
      localStorage.setItem('breakout_highscore', this.highScore);
      this.highScoreEl.textContent = this.highScore;
    }
    this.livesEl.textContent = '❤️'.repeat(Math.max(0, this.engine.lives));
  }

  bindEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.handleLaunchOrRestart();
      }
      if (e.key === 'r' || e.key === 'R') {
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Touch / Pointer controls on canvas for direct paddle dragging
    const handlePointerMove = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = ARENA_WIDTH / rect.width;
      const arenaX = (clientX - rect.left) * scaleX;
      this.engine.setPaddlePosition(arenaX);
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.canvas.setPointerCapture(e.pointerId);
      handlePointerMove(e.clientX);
      if (this.engine.ballAttached) {
        this.engine.launchBall();
        if (this.btnLaunch) this.btnLaunch.textContent = '🚀 In Play';
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        handlePointerMove(e.clientX);
      }
    });

    const stopDrag = (e) => {
      this.isDragging = false;
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    this.canvas.addEventListener('pointerup', stopDrag);
    this.canvas.addEventListener('pointercancel', stopDrag);

    // Virtual D-pad / Buttons
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    if (btnLeft) {
      const startLeft = (e) => { e.preventDefault(); this.keys['ArrowLeft'] = true; };
      const stopLeft = (e) => { e.preventDefault(); this.keys['ArrowLeft'] = false; };
      btnLeft.addEventListener('pointerdown', startLeft);
      btnLeft.addEventListener('pointerup', stopLeft);
      btnLeft.addEventListener('pointercancel', stopLeft);
    }
    if (btnRight) {
      const startRight = (e) => { e.preventDefault(); this.keys['ArrowRight'] = true; };
      const stopRight = (e) => { e.preventDefault(); this.keys['ArrowRight'] = false; };
      btnRight.addEventListener('pointerdown', startRight);
      btnRight.addEventListener('pointerup', stopRight);
      btnRight.addEventListener('pointercancel', stopRight);
    }

    if (this.btnLaunch) {
      this.btnLaunch.onclick = () => this.handleLaunchOrRestart();
    }

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.onclick = () => this.restartGame();
    }

    const btnVault = document.getElementById('btn-vault');
    if (btnVault) {
      btnVault.onclick = () => {
        if (window.arcadeVault) window.arcadeVault.showModal();
      };
    }

    const btnPortal = document.getElementById('btn-portal');
    if (btnPortal) {
      btnPortal.onclick = (e) => {
        e.preventDefault();
        const vault = window.arcadeVault || window.ArcadeVault;
        if (vault && typeof vault.goToArcade === 'function') {
          vault.goToArcade('breakout');
        } else if (window.location.pathname.includes('/breakout/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }

    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
      btnSound.onclick = (e) => {
        const muted = this.audio.toggleMute();
        e.target.textContent = muted ? '🔇 Sound' : '🔊 Sound';
      };
    }

    const btnCrt = document.getElementById('btn-crt');
    if (btnCrt) {
      btnCrt.onclick = () => retroCRT.toggle();
    }
  }

  handleLaunchOrRestart() {
    if (this.engine.gameOver || this.engine.gameWon) {
      this.restartGame();
      return;
    }
    if (this.engine.ballAttached) {
      this.engine.launchBall();
      if (this.btnLaunch) this.btnLaunch.textContent = '🚀 In Play';
    }
  }

  restartGame() {
    this.engine.reset();
    this.updateStatsDisplay();
    this.overlayEl.style.display = 'none';
    if (this.btnLaunch) this.btnLaunch.textContent = '🚀 Launch';
    arcadeVault.recordPlay('breakout');
  }

  loop(timestamp) {
    // Process input
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.engine.movePaddle(-this.engine.paddleSpeed);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.engine.movePaddle(this.engine.paddleSpeed);
    }

    // Step physics
    const res = this.engine.tick();
    if (res.event === 'brick_hit') {
      this.audio.playBrick(res.brick ? res.brick.row : 7);
      arcadeVault.vibrate(15);
      this.updateStatsDisplay();
      arcadeVault.recordScore('breakout', this.engine.score);
    } else if (res.event === 'paddle_hit') {
      this.audio.playPaddle();
      arcadeVault.vibrate(10);
    } else if (res.event === 'wall_hit') {
      this.audio.playWall();
    } else if (res.event === 'life_lost') {
      this.audio.playLifeLost();
      arcadeVault.vibrate([40, 40, 60]);
      this.updateStatsDisplay();
      if (this.btnLaunch) this.btnLaunch.textContent = '🚀 Launch';
    } else if (res.event === 'game_over') {
      this.audio.playLifeLost();
      arcadeVault.vibrate([80, 50, 120]);
      this.updateStatsDisplay();
      this.overlayMsgEl.innerHTML = `GAME OVER<br><span style="font-size: 0.9rem; font-weight: normal;">Final Score: ${this.engine.score}</span>`;
      this.overlayEl.style.display = 'flex';
      arcadeVault.recordScore('breakout', this.engine.score);
    } else if (res.event === 'game_won') {
      this.audio.playVictory();
      arcadeVault.vibrate([40, 60, 40, 60, 100]);
      this.updateStatsDisplay();
      this.overlayMsgEl.innerHTML = `CONGRATULATIONS!<br><span style="font-size: 0.9rem; font-weight: normal;">All Bricks Cleared! Score: ${this.engine.score}</span>`;
      this.overlayEl.style.display = 'flex';
      arcadeVault.recordWin('breakout', this.engine.score);
      arcadeVault.unlock('breakout_champion');
    }

    // Render frame
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Deep arcade backdrop
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Side border highlights
    ctx.strokeStyle = '#1e2838';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, ARENA_WIDTH - 2, ARENA_HEIGHT - 2);

    // Render Bricks
    for (const b of this.engine.bricks) {
      if (!b.alive) continue;

      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // 3D Bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(b.x, b.y, b.w, 2);
      ctx.fillRect(b.x, b.y, 2, b.h);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2);
      ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h);
    }

    // Render Paddle
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.roundRect(this.engine.paddleX, this.engine.paddleY, this.engine.paddleWidth, this.engine.paddleHeight, 4);
    ctx.fill();

    // Paddle gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(this.engine.paddleX + 2, this.engine.paddleY + 2, this.engine.paddleWidth - 4, 3);

    // Render Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.engine.ballX, this.engine.ballY, this.engine.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ball glow
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
