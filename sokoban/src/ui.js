/**
 * Sokoban UI Controller
 */

import { SokobanEngine, SOKOBAN_LEVELS } from './engine.js';
import { SokobanAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';

export class SokobanUI {
  constructor() {
    this.currentLevelIdx = parseInt(localStorage.getItem('sokoban_level') || '0', 10);
    if (this.currentLevelIdx >= SOKOBAN_LEVELS.length) this.currentLevelIdx = 0;

    this.engine = new SokobanEngine(SOKOBAN_LEVELS[this.currentLevelIdx]);
    this.audio = new SokobanAudio();

    this.boardEl = document.getElementById('warehouse-grid');
    this.levelSelect = document.getElementById('select-level');
    this.movesEl = document.getElementById('stat-moves');
    this.pushesEl = document.getElementById('stat-pushes');
    this.statusBanner = document.getElementById('status-banner');
    this.overlay = document.getElementById('game-overlay');
    this.btnDeadlock = document.getElementById('btn-deadlock');

    this.showDeadlocks = true;
    this.lastDeadlocks = [];

    this.initLevelSelect();
    this.bindEvents();
    this.render();

    arcadeVault.recordPlay('sokoban');
  }

  initLevelSelect() {
    this.levelSelect.innerHTML = '';
    const solved = JSON.parse(localStorage.getItem('sokoban_solved') || '{}');

    SOKOBAN_LEVELS.forEach((_, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const isDone = !!solved[idx];
      opt.textContent = `Level ${idx + 1} ${isDone ? '★' : ''}`;
      this.levelSelect.appendChild(opt);
    });
    this.levelSelect.value = this.currentLevelIdx;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      let dr = 0, dc = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dr = -1; dc = 0; break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dr = 1; dc = 0; break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dr = 0; dc = -1; break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dr = 0; dc = 1; break;
        case 'u':
        case 'U':
          this.handleUndo();
          return;
        case 'r':
        case 'R':
          this.resetLevel();
          return;
        default:
          return;
      }

      if (dr !== 0 || dc !== 0) {
        e.preventDefault();
        this.handleMove(dr, dc);
      }
    });

    // Virtual D-Pad
    document.getElementById('btn-up').onclick = () => this.handleMove(-1, 0);
    document.getElementById('btn-down').onclick = () => this.handleMove(1, 0);
    document.getElementById('btn-left').onclick = () => this.handleMove(0, -1);
    document.getElementById('btn-right').onclick = () => this.handleMove(0, 1);

    document.getElementById('btn-undo').onclick = () => this.handleUndo();
    document.getElementById('btn-reset').onclick = () => this.resetLevel();
    document.getElementById('btn-sound').onclick = (e) => {
      this.audio.muted = !this.audio.muted;
      e.target.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
    };

    if (this.btnDeadlock) {
      this.btnDeadlock.onclick = () => {
        this.showDeadlocks = !this.showDeadlocks;
        this.btnDeadlock.textContent = this.showDeadlocks ? '⚠️ Assist: ON' : '⚠️ Assist: OFF';
        this.render();
      };
    }

    this.levelSelect.onchange = (e) => {
      this.loadLevel(parseInt(e.target.value, 10));
    };

    // Touch Swipe Gestures on Warehouse Grid
    let touchStartX = 0;
    let touchStartY = 0;
    this.boardEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.boardEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const minSwipe = 24;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) >= minSwipe) {
          this.handleMove(0, dx > 0 ? 1 : -1);
        }
      } else {
        if (Math.abs(dy) >= minSwipe) {
          this.handleMove(dy > 0 ? 1 : -1, 0);
        }
      }
    }, { passive: true });
  }

  handleMove(dr, dc) {
    if (this.engine.checkWin()) return;
    const res = this.engine.move(dr, dc);

    if (res.moved) {
      if (res.pushed) {
        if (res.placedOnGoal) this.audio.playGoal();
        else this.audio.playPush();
      } else {
        this.audio.playStep();
      }

      this.lastDeadlocks = res.deadlocks;
      if (res.deadlocks.length > 0 && !res.isWon) {
        this.audio.playDeadlock();
        this.setStatus(`⚠️ Crate deadlocked! Press Undo (U) to revert.`, 'warn');
      } else {
        this.setStatus(`Push crates onto the gold targets.`);
      }

      if (res.isWon) {
        this.handleVictory();
      }

      this.render();
    }
  }

  handleUndo() {
    if (this.engine.undo()) {
      this.audio.playUndo();
      this.lastDeadlocks = this.engine.detectDeadlocks();
      this.setStatus(`Move undone.`);
      this.render();
    }
  }

  resetLevel() {
    this.engine.loadLevel(SOKOBAN_LEVELS[this.currentLevelIdx]);
    this.lastDeadlocks = [];
    this.setStatus(`Level reset.`);
    this.render();
  }

  loadLevel(idx) {
    this.currentLevelIdx = idx;
    localStorage.setItem('sokoban_level', idx);
    this.levelSelect.value = idx;
    this.engine.loadLevel(SOKOBAN_LEVELS[idx]);
    this.lastDeadlocks = [];
    this.overlay.style.display = 'none';
    this.setStatus(`Level ${idx + 1} loaded.`);
    this.render();
  }

  handleVictory() {
    this.audio.playWin();
    this.setStatus(`🎉 Level ${this.currentLevelIdx + 1} Solved!`, 'win');

    const solved = JSON.parse(localStorage.getItem('sokoban_solved') || '{}');
    solved[this.currentLevelIdx] = true;
    localStorage.setItem('sokoban_solved', JSON.stringify(solved));
    this.initLevelSelect();

    arcadeVault.recordWin('sokoban', { level: this.currentLevelIdx + 1 });

    const overlayMsg = document.getElementById('overlay-msg');
    overlayMsg.textContent = `LEVEL ${this.currentLevelIdx + 1} COMPLETED!`;
    const btnNext = document.getElementById('btn-next-level');
    if (this.currentLevelIdx + 1 < SOKOBAN_LEVELS.length) {
      btnNext.style.display = 'inline-block';
      btnNext.onclick = () => this.loadLevel(this.currentLevelIdx + 1);
    } else {
      btnNext.style.display = 'none';
    }
    this.overlay.style.display = 'flex';
  }

  setStatus(msg, type = 'info') {
    this.statusBanner.textContent = msg;
    if (type === 'warn') {
      this.statusBanner.style.color = '#ff6b6b';
    } else if (type === 'win') {
      this.statusBanner.style.color = '#51cf66';
    } else {
      this.statusBanner.style.color = '#38bdf8';
    }
  }

  render() {
    this.movesEl.textContent = this.engine.movesCount;
    this.pushesEl.textContent = this.engine.pushesCount;

    this.boardEl.innerHTML = '';
    const rows = this.engine.height;
    const cols = this.engine.width;

    // Responsive cell size calculation
    // Keep board aspect ratio clean within viewport
    const maxDimension = Math.max(rows, cols);
    const cellSize = Math.min(44, Math.max(28, Math.floor(340 / maxDimension)));

    this.boardEl.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    this.boardEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

    const deadlockSet = new Set(this.lastDeadlocks.map(d => `${d.r},${d.c}`));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'tile';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;

        const isWall = this.engine.isWall(r, c);
        const isGoal = this.engine.isGoal(r, c);
        const hasBox = this.engine.hasBox(r, c);
        const isPlayer = (this.engine.player.r === r && this.engine.player.c === c);

        if (isWall) {
          cell.classList.add('tile-wall');
          cell.textContent = '#';
        } else {
          cell.classList.add('tile-floor');

          if (isGoal) {
            cell.classList.add('tile-goal');
          }

          if (hasBox) {
            cell.classList.add('tile-box');
            if (isGoal) cell.classList.add('tile-box-goal');

            if (this.showDeadlocks && deadlockSet.has(`${r},${c}`)) {
              cell.classList.add('tile-box-deadlock');
            }
          }

          if (isPlayer) {
            cell.classList.add('tile-player');
          }

          // Tap-to-move pathfinding
          cell.onclick = () => {
            if (!hasBox && !isPlayer && !isWall) {
              const path = this.engine.findPath(r, c);
              if (path && path.length > 0) {
                this.executePath(path);
              }
            }
          };
        }

        this.boardEl.appendChild(cell);
      }
    }
  }

  async executePath(path) {
    for (const step of path) {
      this.handleMove(step.dr, step.dc);
      await new Promise(res => setTimeout(res, 50));
    }
  }
}
