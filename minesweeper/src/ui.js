import { MinesweeperEngine } from './engine.js';
import { MinesweeperAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';

export class MinesweeperUI {
  constructor() {
    this.engine = new MinesweeperEngine(9, 9, 10);
    this.audio = new MinesweeperAudio();
    this.boardEl = document.getElementById('minefield');
    this.mineCountEl = document.getElementById('display-mines');
    this.timerEl = document.getElementById('display-timer');
    this.faceBtn = document.getElementById('btn-face');
    this.diffSelect = document.getElementById('select-diff');
    this.flagModeBtn = document.getElementById('btn-flag-mode');

    this.flagMode = false;
    this.timer = null;
    this.seconds = 0;

    this.bindEvents();
    this.render();
    arcadeVault.recordPlay('minesweeper');
  }

  bindEvents() {
    this.faceBtn.onclick = () => this.startNewGame();
    this.diffSelect.onchange = (e) => {
      const val = e.target.value;
      if (val === 'beginner') this.engine = new MinesweeperEngine(9, 9, 10);
      else if (val === 'intermediate') this.engine = new MinesweeperEngine(16, 16, 40);
      else if (val === 'expert') this.engine = new MinesweeperEngine(16, 30, 99);
      this.startNewGame();
    };

    if (this.flagModeBtn) {
      this.flagModeBtn.onclick = () => {
        this.flagMode = !this.flagMode;
        this.flagModeBtn.textContent = this.flagMode ? '🚩 Flag: ON' : '🚩 Flag: OFF';
      };
    }

    const menuSound = document.getElementById('menu-sound');
    if (menuSound) {
      menuSound.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
      menuSound.onclick = () => {
        const muted = this.audio.toggleMute();
        menuSound.textContent = muted ? '🔇 Sound' : '🔊 Sound';
      };
    }
    const menuCrt = document.getElementById('menu-crt');
    if (menuCrt) menuCrt.onclick = () => retroCRT.toggle();

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
          vault.goToArcade('minesweeper');
        } else if (window.location.pathname.includes('/minesweeper/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }
  }

  startTimer() {
    if (this.timer) return;
    this.seconds = 0;
    this.timer = setInterval(() => {
      this.seconds = Math.min(999, this.seconds + 1);
      this.timerEl.textContent = this.seconds.toString().padStart(3, '0');
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startNewGame() {
    this.stopTimer();
    this.engine.reset();
    this.seconds = 0;
    this.timerEl.textContent = '000';
    this.faceBtn.textContent = '🙂';
    this.updateMineCount();
    this.render();
  }

  updateMineCount() {
    const rem = Math.max(-99, this.engine.totalMines - this.engine.flagsCount);
    this.mineCountEl.textContent = rem.toString().padStart(3, '0');
  }

  render() {
    this.boardEl.innerHTML = '';
    const cellSize = this.engine.cols <= 9 ? 30 : (this.engine.cols <= 16 ? 24 : 22);
    this.boardEl.style.gridTemplateRows = `repeat(${this.engine.rows}, ${cellSize}px)`;
    this.boardEl.style.gridTemplateColumns = `repeat(${this.engine.cols}, ${cellSize}px)`;

    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const btn = document.createElement('button');
        btn.className = 'cell-btn';
        btn.style.width = cellSize + 'px';
        btn.style.height = cellSize + 'px';
        btn.dataset.r = r;
        btn.dataset.c = c;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.flagMode) {
            this.handleRightClick(r, c);
          } else {
            this.handleClick(r, c);
          }
        });

        btn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.handleRightClick(r, c);
        });

        this.boardEl.appendChild(btn);
      }
    }
  }

  handleClick(r, c) {
    if (this.engine.gameOver || this.engine.gameWon) return;
    this.startTimer();
    this.audio.playClick();

    const res = this.engine.reveal(r, c);
    if (!res) return;

    if (res.status === 'exploded') {
      this.stopTimer();
      this.audio.playExplode();
      this.faceBtn.textContent = '😵';
      this.revealAllMines(r, c);
      return;
    }

    // Update revealed cells
    for (const item of res.revealed) {
      const cellEl = this.boardEl.querySelector(`[data-r="${item.r}"][data-c="${item.c}"]`);
      if (cellEl) {
        cellEl.classList.add('revealed');
        cellEl.textContent = item.val > 0 ? item.val : '';
        if (item.val > 0) cellEl.classList.add(`n-${item.val}`);
      }
    }

    if (res.status === 'won') {
      this.stopTimer();
      this.audio.playWin();
      this.faceBtn.textContent = '😎';
      this.flagAllMines();
      arcadeVault.recordWin('minesweeper', { difficulty: this.diffSelect ? this.diffSelect.value : 'beginner' });
    }
  }

  handleRightClick(r, c) {
    if (this.engine.gameOver || this.engine.gameWon) return;
    this.audio.playClick();
    const isFlagged = this.engine.toggleFlag(r, c);
    const cellEl = this.boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (cellEl) {
      cellEl.textContent = isFlagged ? '🚩' : '';
    }
    this.updateMineCount();
  }

  revealAllMines(explodedR, explodedC) {
    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const cell = this.engine.grid[r][c];
        const cellEl = this.boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (cell.isMine) {
          cellEl.classList.add('revealed');
          cellEl.textContent = '💣';
          if (r === explodedR && c === explodedC) {
            cellEl.classList.add('exploded');
          }
        }
      }
    }
  }

  flagAllMines() {
    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        if (this.engine.grid[r][c].isMine) {
          const cellEl = this.boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
          cellEl.textContent = '🚩';
        }
      }
    }
    this.mineCountEl.textContent = '000';
  }
}
