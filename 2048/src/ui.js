import { Game2048Engine } from './engine.js';
import { Game2048Audio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';

export class Game2048UI {
  constructor() {
    this.engine = new Game2048Engine(4);
    this.audio = new Game2048Audio();

    this.gridEl = document.getElementById('grid');
    this.scoreEl = document.getElementById('score-val');
    this.bestEl = document.getElementById('best-val');
    this.overlayEl = document.getElementById('overlay');
    this.overlayMsg = document.getElementById('overlay-msg');
    this.btnNew = document.getElementById('btn-new');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnContinue = document.getElementById('btn-continue');

    this.bestScore = parseInt(localStorage.getItem('2048_best') || '0', 10);
    this.bestEl.textContent = this.bestScore;

    this.bindEvents();
    this.render();
    arcadeVault.recordPlay('game2048');
  }

  bindEvents() {
    this.btnNew.onclick = () => this.startNewGame();
    this.btnUndo.onclick = () => this.handleUndo();
    if (this.btnContinue) {
      this.btnContinue.onclick = () => {
        this.engine.keepPlaying = true;
        this.overlayEl.style.display = 'none';
      };
    }

    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.textContent = this.audio.muted ? '🔇' : '🔊';
      btnSound.onclick = () => {
        const muted = this.audio.toggleMute();
        btnSound.textContent = muted ? '🔇' : '🔊';
      };
    }
    const btnCrt = document.getElementById('btn-crt');
    if (btnCrt) btnCrt.onclick = () => retroCRT.toggle();

    // Keyboard
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.handleMove('right');
          break;
      }
    });

    // Touch Swipe
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) return; // small jitter

      if (absDx > absDy) {
        this.handleMove(dx > 0 ? 'right' : 'left');
      } else {
        this.handleMove(dy > 0 ? 'down' : 'up');
      }
    }, { passive: true });
  }

  handleMove(dir) {
    const res = this.engine.move(dir);
    if (!res.moved) return;

    if (res.scoreEarned > 0) {
      this.audio.playMerge();
    } else {
      this.audio.playSlide();
    }

    this.render();

    const maxTile = Math.max(...this.engine.grid.flat());
    arcadeVault.recordScore('game2048', maxTile);

    if (res.won) {
      this.overlayMsg.textContent = 'YOU WIN!';
      this.btnContinue.style.display = 'inline-block';
      this.overlayEl.style.display = 'flex';
      arcadeVault.recordWin('game2048', maxTile);
    } else if (res.gameOver) {
      this.overlayMsg.textContent = 'GAME OVER!';
      this.btnContinue.style.display = 'none';
      this.overlayEl.style.display = 'flex';
    }
  }

  handleUndo() {
    if (this.engine.undo()) {
      this.overlayEl.style.display = 'none';
      this.render();
    }
  }

  startNewGame() {
    this.engine.reset();
    this.overlayEl.style.display = 'none';
    this.render();
    arcadeVault.recordPlay('game2048');
  }

  render() {
    this.gridEl.innerHTML = '';
    this.scoreEl.textContent = this.engine.score;

    if (this.engine.score > this.bestScore) {
      this.bestScore = this.engine.score;
      localStorage.setItem('2048_best', this.bestScore);
      this.bestEl.textContent = this.bestScore;
    }

    for (let r = 0; r < this.engine.size; r++) {
      for (let c = 0; c < this.engine.size; c++) {
        const val = this.engine.grid[r][c];
        const tile = document.createElement('div');
        tile.className = `tile ${val > 0 ? `t-${val}` : ''}`;
        tile.textContent = val > 0 ? val : '';
        this.gridEl.appendChild(tile);
      }
    }
  }
}
