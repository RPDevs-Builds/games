import { SnakeEngine, DIRECTION } from './engine.js';
import { SnakeAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';

export class SnakeUI {
  constructor() {
    this.engine = new SnakeEngine(20, 20);
    this.audio = new SnakeAudio();
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score-val');
    this.highScoreEl = document.getElementById('high-val');
    this.overlay = document.getElementById('overlay');
    this.overlayMsg = document.getElementById('overlay-msg');

    this.highScore = parseInt(localStorage.getItem('snake_highscore') || '0', 10);
    this.highScoreEl.textContent = this.highScore;

    this.tickRate = 130;
    this.loopId = null;
    this.paused = false;

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.engine.setDirection(DIRECTION.UP)) this.audio.playTurn();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.engine.setDirection(DIRECTION.DOWN)) this.audio.playTurn();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.engine.setDirection(DIRECTION.LEFT)) this.audio.playTurn();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.engine.setDirection(DIRECTION.RIGHT)) this.audio.playTurn();
          break;
        case ' ':
          this.togglePause();
          break;
        case 'r':
        case 'R':
          this.start();
          break;
      }
    });

    document.getElementById('btn-up').onclick = () => { if (this.engine.setDirection(DIRECTION.UP)) { this.audio.playTurn(); arcadeVault.vibrate(10); } };
    document.getElementById('btn-down').onclick = () => { if (this.engine.setDirection(DIRECTION.DOWN)) { this.audio.playTurn(); arcadeVault.vibrate(10); } };
    document.getElementById('btn-left').onclick = () => { if (this.engine.setDirection(DIRECTION.LEFT)) { this.audio.playTurn(); arcadeVault.vibrate(10); } };
    document.getElementById('btn-right').onclick = () => { if (this.engine.setDirection(DIRECTION.RIGHT)) { this.audio.playTurn(); arcadeVault.vibrate(10); } };
    document.getElementById('btn-pause').onclick = () => this.togglePause();
    document.getElementById('btn-restart').onclick = () => this.start();
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
      btnSound.onclick = (e) => {
        const muted = this.audio.toggleMute();
        e.target.textContent = muted ? '🔇 Sound' : '🔊 Sound';
      };
    }
    const btnCrt = document.getElementById('btn-crt');
    if (btnCrt) btnCrt.onclick = () => retroCRT.toggle();

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
          vault.goToArcade('snake');
        } else if (window.location.pathname.includes('/snake/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }

    // Touch swipe gesture controls on LCD screen
    let touchStartX = 0;
    let touchStartY = 0;
    const screenEl = document.querySelector('.lcd-screen');
    if (screenEl) {
      screenEl.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      screenEl.addEventListener('touchend', (e) => {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const minSwipe = 20;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) >= minSwipe) {
            const dir = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
            if (this.engine.setDirection(dir)) this.audio.playTurn();
          }
        } else {
          if (Math.abs(dy) >= minSwipe) {
            const dir = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
            if (this.engine.setDirection(dir)) this.audio.playTurn();
          }
        }
      }, { passive: true });
    }
  }

  start() {
    this.engine.reset();
    this.scoreEl.textContent = '0';
    this.overlay.style.display = 'none';
    this.paused = false;
    this.tickRate = 130;
    if (this.loopId) clearInterval(this.loopId);
    this.loopId = setInterval(() => this.update(), this.tickRate);
    arcadeVault.recordPlay('snake');
  }

  togglePause() {
    if (this.engine.gameOver) {
      this.start();
      return;
    }
    this.paused = !this.paused;
    if (this.paused) {
      clearInterval(this.loopId);
      this.overlayMsg.textContent = 'PAUSED';
      this.overlay.style.display = 'flex';
    } else {
      this.overlay.style.display = 'none';
      this.loopId = setInterval(() => this.update(), this.tickRate);
    }
  }

  update() {
    const res = this.engine.tick();
    if (res.event.startsWith('collision')) {
      clearInterval(this.loopId);
      this.audio.playGameOver();
      arcadeVault.vibrate([60, 40, 100]);
      arcadeVault.recordScore('snake', this.engine.score);
      if (this.engine.score > this.highScore) {
        this.highScore = this.engine.score;
        localStorage.setItem('snake_highscore', this.highScore);
        this.highScoreEl.textContent = this.highScore;
      }
      this.overlayMsg.innerHTML = `GAME OVER<br><span style="font-size: 0.8rem; font-weight: normal;">Score: ${this.engine.score}</span>`;
      this.overlay.style.display = 'flex';
    } else if (res.event === 'eat') {
      this.audio.playEat();
      arcadeVault.vibrate(20);
      this.scoreEl.textContent = res.score;
      arcadeVault.recordScore('snake', res.score);
      // Progressive speed increase
      if (this.tickRate > 60) {
        this.tickRate = Math.max(60, this.tickRate - 3);
        clearInterval(this.loopId);
        this.loopId = setInterval(() => this.update(), this.tickRate);
      }
    }
    this.draw();
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cellSize = w / this.engine.width;

    this.ctx.fillStyle = '#879b35';
    this.ctx.fillRect(0, 0, w, h);

    // Draw snake
    this.ctx.fillStyle = '#182806';
    for (let i = 0; i < this.engine.snake.length; i++) {
      const seg = this.engine.snake[i];
      this.ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    // Draw food
    if (this.engine.food) {
      const fx = this.engine.food.x * cellSize;
      const fy = this.engine.food.y * cellSize;
      this.ctx.fillRect(fx + 2, fy + 2, cellSize - 4, cellSize - 4);
    }
  }
}
