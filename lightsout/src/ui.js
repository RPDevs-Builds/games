/**
 * Lights Out UI Controller
 * Manages DOM updates, touch/keyboard interactions, timer, modals, and animations.
 */

import { LightsOutEngine } from './engine.js';
import { RetroAudio } from './audio.js';
import { GameStorage } from './storage.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';

// Pre-defined campaign levels (guaranteed solvable puzzles with target par moves)
const CAMPAIGN_LEVELS = [
  { level: 1, name: 'The First Spark', rows: 3, cols: 3, moves: [{ r: 1, c: 1 }], par: 1 },
  { level: 2, name: 'Crossroad', rows: 3, cols: 3, moves: [{ r: 0, c: 1 }, { r: 2, c: 1 }], par: 2 },
  { level: 3, name: 'Four Corners', rows: 3, cols: 3, moves: [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 }], par: 4 },
  { level: 4, name: 'Center Stage', rows: 4, cols: 4, moves: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }], par: 3 },
  { level: 5, name: 'Checkerboard', rows: 4, cols: 4, moves: [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }], par: 4 },
  { level: 6, name: 'Classic 1995', rows: 5, cols: 5, moves: [{ r: 2, c: 2 }], par: 1 },
  { level: 7, name: 'Constellation', rows: 5, cols: 5, moves: [{ r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 4 }, { r: 4, c: 2 }], par: 4 },
  { level: 8, name: 'Diamond Edge', rows: 5, cols: 5, moves: [{ r: 1, c: 2 }, { r: 2, c: 1 }, { r: 2, c: 3 }, { r: 3, c: 2 }], par: 4 },
  { level: 9, name: 'Tiger Cross', rows: 5, cols: 5, moves: [{ r: 0, c: 0 }, { r: 0, c: 4 }, { r: 4, c: 0 }, { r: 4, c: 4 }, { r: 2, c: 2 }], par: 5 },
  { level: 10, name: 'The Maze', rows: 5, cols: 5, moves: [{ r: 0, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }, { r: 4, c: 3 }, { r: 2, c: 2 }], par: 5 },
  { level: 11, name: 'Supernova', rows: 5, cols: 5, moves: [{ r: 1, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 0, c: 2 }, { r: 4, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 4 }], par: 8 },
  { level: 12, name: 'Grandmaster 6x6', rows: 6, cols: 6, moves: [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }, { r: 2, c: 2 }, { r: 3, c: 3 }], par: 6 }
];

export class LightsOutUI {
  constructor() {
    this.engine = new LightsOutEngine(5, 5);
    this.audio = new RetroAudio();
    this.storage = new GameStorage();

    this.currentMode = 'random'; // 'random', 'campaign', 'custom'
    this.currentLevel = 1;
    this.currentDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.timerInterval = null;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.isGameActive = false;
    this.focusR = 0;
    this.focusC = 0;
    this.isSolving = false;

    this.cacheElements();
    this.bindEvents();
    this.applyTheme(this.storage.getTheme());
    this.checkUrlForPuzzle();
    arcadeVault.recordPlay('lightsout');
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
          vault.goToArcade('lightsout');
        } else if (window.location.pathname.includes('/lightsout/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }
  }

  cacheElements() {
    this.boardEl = document.getElementById('game-board');
    this.movesEl = document.getElementById('stat-moves');
    this.timerEl = document.getElementById('stat-timer');
    this.remainingEl = document.getElementById('stat-remaining');
    this.statusBanner = document.getElementById('status-banner');

    this.btnNew = document.getElementById('btn-new');
    this.btnHint = document.getElementById('btn-hint');
    this.btnSolve = document.getElementById('btn-solve');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnReset = document.getElementById('btn-reset');
    this.btnAudio = document.getElementById('btn-audio');
    this.btnTheme = document.getElementById('btn-theme');
    this.btnShare = document.getElementById('btn-share');
    this.btnRules = document.getElementById('btn-rules');
    this.btnStats = document.getElementById('btn-stats');

    this.modeSelector = document.getElementById('mode-selector');
    this.sizeSelector = document.getElementById('size-selector');
    this.diffSelector = document.getElementById('difficulty-selector');
    this.targetSelector = document.getElementById('target-selector');
    this.btnWrap = document.getElementById('btn-wrap');
    this.levelSelectorContainer = document.getElementById('campaign-level-container');
    this.levelSelector = document.getElementById('campaign-level-select');

    // Modals
    this.modalRules = document.getElementById('modal-rules');
    this.modalStats = document.getElementById('modal-stats');
    this.modalWin = document.getElementById('modal-win');
    this.btnCloseModals = document.querySelectorAll('.modal-close');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnWinPlayAgain = document.getElementById('btn-win-again');
  }

  bindEvents() {
    // Buttons
    this.btnNew.addEventListener('click', () => this.startNewGame());
    this.btnHint.addEventListener('click', () => this.showHint());
    this.btnSolve.addEventListener('click', () => this.autoSolve());
    this.btnUndo.addEventListener('click', () => this.handleUndo());
    this.btnReset.addEventListener('click', () => this.handleReset());
    this.btnAudio.addEventListener('click', () => this.toggleAudio());
    this.btnTheme.addEventListener('click', () => this.toggleTheme());
    this.btnShare.addEventListener('click', () => this.sharePuzzle());
    this.btnRules.addEventListener('click', () => this.openModal(this.modalRules));
    this.btnStats.addEventListener('click', () => this.showStatsModal());

    // Selectors
    this.modeSelector.addEventListener('change', (e) => {
      this.currentMode = e.target.value;
      this.updateModeUI();
      this.startNewGame();
    });

    this.sizeSelector.addEventListener('change', (e) => {
      const [r, c] = e.target.value.split('x').map(Number);
      const target = this.targetSelector ? this.targetSelector.value : 'off';
      const wrap = this.engine ? this.engine.wrapTopology : false;
      this.engine = new LightsOutEngine(r, c, target, wrap);
      this.startNewGame();
    });

    this.diffSelector.addEventListener('change', (e) => {
      this.currentDifficulty = e.target.value;
      this.startNewGame();
    });

    if (this.targetSelector) {
      this.targetSelector.addEventListener('change', (e) => {
        this.engine.targetMode = e.target.value;
        this.setStatus(`Target goal changed: ${e.target.value === 'on' ? 'Lit-Out (All ON)' : 'Lights Out (All OFF)'}`);
        if (this.engine.isSolved()) {
          this.handleVictory();
        }
      });
    }

    if (this.btnWrap) {
      this.btnWrap.addEventListener('click', () => {
        this.engine.wrapTopology = !this.engine.wrapTopology;
        this.btnWrap.textContent = `🌐 Wrap: ${this.engine.wrapTopology ? 'On' : 'Off'}`;
        this.btnWrap.style.color = this.engine.wrapTopology ? 'var(--accent-cyan)' : 'inherit';
        this.setStatus(`Torus wrap topology: ${this.engine.wrapTopology ? 'ENABLED' : 'DISABLED'}`);
      });
    }

    this.levelSelector.addEventListener('change', (e) => {
      this.currentLevel = parseInt(e.target.value, 10);
      this.loadCampaignLevel(this.currentLevel);
    });


    // Modals
    this.btnCloseModals.forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.closeAllModals();
      }
    });

    if (this.btnNextLevel) {
      this.btnNextLevel.addEventListener('click', () => {
        this.closeAllModals();
        if (this.currentLevel < CAMPAIGN_LEVELS.length) {
          this.currentLevel++;
          this.loadCampaignLevel(this.currentLevel);
        } else {
          this.startNewGame();
        }
      });
    }

    if (this.btnWinPlayAgain) {
      this.btnWinPlayAgain.addEventListener('click', () => {
        this.closeAllModals();
        this.startNewGame();
      });
    }

    // Keyboard support
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Audio icon update
    this.updateAudioButton();
  }

  checkUrlForPuzzle() {
    const hash = window.location.hash.slice(1);
    if (hash && hash.includes(':')) {
      if (this.engine.deserialize(hash)) {
        this.currentMode = 'custom';
        this.modeSelector.value = 'custom';
        this.updateModeUI();
        this.renderBoard();
        this.startTimer();
        this.setStatus('Loaded shared puzzle! Can you solve it?');
        return;
      }
    }
    // Default initial game
    this.populateCampaignLevels();
    this.startNewGame();
  }

  updateModeUI() {
    const isCampaign = this.currentMode === 'campaign';
    const isDaily = this.currentMode === 'daily';
    const isCustom = this.currentMode === 'custom';

    if (this.levelSelectorContainer) {
      this.levelSelectorContainer.style.display = isCampaign ? 'flex' : 'none';
    }
    if (this.sizeSelector && this.sizeSelector.parentElement) {
      this.sizeSelector.parentElement.style.display = (isCampaign || isDaily) ? 'none' : 'flex';
    }
    if (this.diffSelector && this.diffSelector.parentElement) {
      this.diffSelector.parentElement.style.display = (isCampaign || isDaily || isCustom) ? 'none' : 'flex';
    }
    if (this.btnShare) {
      const parent = this.btnShare.parentElement;
      if (parent && parent.classList.contains('select-wrapper')) {
        parent.style.display = isCampaign ? 'none' : 'flex';
      } else {
        this.btnShare.style.display = isCampaign ? 'none' : 'inline-flex';
      }
    }
  }

  populateCampaignLevels() {
    this.levelSelector.innerHTML = '';
    const unlocked = this.storage.getCampaignUnlocked();

    CAMPAIGN_LEVELS.forEach(lvl => {
      const opt = document.createElement('option');
      opt.value = lvl.level;
      const isLocked = lvl.level > unlocked;
      opt.disabled = isLocked;
      opt.textContent = `Lvl ${lvl.level}: ${lvl.name} (${lvl.rows}x${lvl.cols}) ${isLocked ? '🔒' : '⭐'}`;
      this.levelSelector.appendChild(opt);
    });
    this.levelSelector.value = this.currentLevel;
  }

  startNewGame() {
    if (this.isSolving) return;
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.timerEl.textContent = '00:00';
    this.movesEl.textContent = '0';
    this.isGameActive = false;

    if (this.currentMode === 'campaign') {
      this.loadCampaignLevel(this.currentLevel);
      return;
    }

    if (this.currentMode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      this.engine.scrambleDaily(today);
      this.renderBoard();
      this.startTimer();
      this.storage.recordGamePlayed();
      this.setStatus(`📅 Daily Challenge (${today})! Can you solve it?`);
      this.audio.playClick();
      return;
    }

    if (this.currentMode === 'custom') {
      this.engine.initBoard();
      this.renderBoard();
      this.setStatus('Editor mode: Click lights to toggle custom design!');
      return;
    }


    // Random mode: scramble according to difficulty
    let steps = 8;
    if (this.currentDifficulty === 'easy') steps = 4;
    if (this.currentDifficulty === 'hard') steps = 14;

    this.engine.scramble(steps);
    this.renderBoard();
    this.startTimer();
    this.storage.recordGamePlayed();
    this.setStatus('Game started! Extinguish all lights.');
    this.audio.playClick();
  }

  loadCampaignLevel(levelNum) {
    const lvl = CAMPAIGN_LEVELS.find(l => l.level === levelNum) || CAMPAIGN_LEVELS[0];
    this.engine = new LightsOutEngine(lvl.rows, lvl.cols);
    this.engine.initBoard();

    // Apply pre-set moves to construct the puzzle
    for (const move of lvl.moves) {
      this.engine.toggle(move.r, move.c, false);
    }
    this.engine.initialBoard = this.engine.cloneBoard(this.engine.board);
    this.engine.history = [];
    this.engine.moveCount = 0;

    this.renderBoard();
    this.startTimer();
    this.storage.recordGamePlayed();
    this.setStatus(`Level ${lvl.level}: ${lvl.name} (Par: ${lvl.par} moves)`);
    this.levelSelector.value = levelNum;
  }

  renderBoard() {
    this.boardEl.innerHTML = '';
    this.boardEl.style.gridTemplateRows = `repeat(${this.engine.rows}, 1fr)`;
    this.boardEl.style.gridTemplateColumns = `repeat(${this.engine.cols}, 1fr)`;

    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `light-btn ${this.engine.board[r][c] === 1 ? 'is-on' : 'is-off'}`;
        btn.dataset.row = r;
        btn.dataset.col = c;
        btn.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}: ${this.engine.board[r][c] ? 'Light ON' : 'Light OFF'}`);
        btn.setAttribute('role', 'gridcell');

        // Tactile pointer events (fast touch response without delay)
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.handleCellClick(r, c);
        });

        this.boardEl.appendChild(btn);
      }
    }

    this.updateStatsDisplay();
  }

  applyMove(r, c) {
    if (!this.isGameActive && this.currentMode !== 'custom') {
      this.startTimer();
    }

    this.engine.toggle(r, c);
    this.audio.playToggle(r, c);
    arcadeVault.vibrate(12);
    this.storage.recordMove();
    this.updateBoardView();
    this.focusR = r;
    this.focusC = c;

    // Check win condition
    if (this.engine.isSolved()) {
      arcadeVault.vibrate([40, 50, 40, 50, 80]);
      this.handleVictory();
    }
  }

  handleCellClick(r, c) {
    if (this.isSolving) return;
    this.applyMove(r, c);
  }

  updateBoardView() {
    const buttons = this.boardEl.querySelectorAll('.light-btn');
    buttons.forEach(btn => {
      const r = parseInt(btn.dataset.row, 10);
      const c = parseInt(btn.dataset.col, 10);
      const isLit = this.engine.board[r][c] === 1;

      btn.classList.toggle('is-on', isLit);
      btn.classList.toggle('is-off', !isLit);
      btn.classList.remove('hint-pulse');
      btn.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}: ${isLit ? 'Light ON' : 'Light OFF'}`);
    });

    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    this.movesEl.textContent = this.engine.moveCount;
    this.remainingEl.textContent = this.engine.activeCount();
  }

  handleUndo() {
    if (this.isSolving) return;
    const move = this.engine.undo();
    if (move) {
      this.audio.playClick();
      this.updateBoardView();
      this.setStatus(`Undid move at (${move.r + 1}, ${move.c + 1})`);
    } else {
      this.audio.playError();
      this.setStatus('No moves to undo.');
    }
  }

  handleReset() {
    if (this.isSolving) return;
    this.engine.resetToInitial();
    this.audio.playClick();
    this.updateBoardView();
    this.setStatus('Reset to puzzle start.');
  }

  showHint() {
    if (this.isSolving) return;
    const hint = this.engine.getHint();
    if (!hint) {
      if (this.engine.isSolved()) {
        this.setStatus('Board is already solved!');
      } else {
        this.audio.playError();
        this.setStatus('This board configuration is mathematically unsolvable in GF(2)!');
      }
      return;
    }

    this.audio.playHint();
    this.storage.recordHint();

    // Pulse target button
    const targetBtn = this.boardEl.querySelector(`[data-row="${hint.r}"][data-col="${hint.c}"]`);
    if (targetBtn) {
      targetBtn.classList.add('hint-pulse');
      targetBtn.focus();
    }

    this.setStatus(`Hint: Press Row ${hint.r + 1}, Col ${hint.c + 1} (${hint.totalMovesRemaining} moves to win)`);
  }

  async autoSolve() {
    if (this.isSolving) return;
    const sol = this.engine.solve();
    if (!sol || !sol.solvable || sol.moves.length === 0) {
      this.audio.playError();
      this.setStatus('No solution exists for this board!');
      return;
    }

    this.isSolving = true;
    this.setStatus(`AI Solver executing ${sol.moves.length} optimal moves...`);

    for (const move of sol.moves) {
      await new Promise(res => setTimeout(res, 280));
      this.applyMove(move.r, move.c);
    }
    this.isSolving = false;
  }

  handleVictory() {
    this.stopTimer();
    this.audio.playVictory();
    arcadeVault.recordWin('lightsout', { size: Math.max(this.engine.rows, this.engine.cols) });

    const scoreKey = `${this.engine.rows}x${this.engine.cols}_${this.currentMode}`;
    const best = this.storage.recordWin(scoreKey, this.engine.moveCount, this.elapsedSeconds);

    let victoryMsg = `🎉 LIGHTS OUT! Solved in ${this.engine.moveCount} moves and ${this.formatTime(this.elapsedSeconds)}!`;
    if (best && best.moves === this.engine.moveCount && best.seconds === this.elapsedSeconds) {
      victoryMsg += ' 🏆 NEW PERSONAL RECORD!';
    }
    this.setStatus(victoryMsg);

    // Open Win Modal
    document.getElementById('win-moves').textContent = this.engine.moveCount;
    document.getElementById('win-time').textContent = this.formatTime(this.elapsedSeconds);
    document.getElementById('win-best').textContent = `${best.moves} moves (${this.formatTime(best.seconds)})`;

    if (this.currentMode === 'campaign') {
      this.storage.unlockNextCampaignLevel(this.currentLevel);
      this.populateCampaignLevels();
      if (this.btnNextLevel) {
        this.btnNextLevel.style.display = this.currentLevel < CAMPAIGN_LEVELS.length ? 'inline-block' : 'none';
      }
    } else {
      if (this.btnNextLevel) this.btnNextLevel.style.display = 'none';
    }

    this.openModal(this.modalWin);
  }

  startTimer() {
    if (this.timerInterval) return;
    this.isGameActive = true;
    this.startTime = Date.now() - (this.elapsedSeconds * 1000);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.timerEl.textContent = this.formatTime(this.elapsedSeconds);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isGameActive = false;
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  setStatus(msg) {
    if (this.statusBanner) {
      this.statusBanner.textContent = msg;
    }
  }

  toggleAudio() {
    const isMuted = this.audio.toggleMute();
    this.updateAudioButton();
    this.setStatus(isMuted ? 'Sound muted.' : 'Sound enabled.');
  }

  updateAudioButton() {
    this.btnAudio.innerHTML = this.audio.isMuted() ? '🔇 <span class="btn-text">Unmute</span>' : '🔊 <span class="btn-text">Mute</span>';
  }

  toggleTheme() {
    const current = this.storage.getTheme();
    const next = current === 'retro' ? 'cyber' : 'retro';
    this.storage.setTheme(next);
    this.applyTheme(next);
    this.setStatus(`Theme set to ${next.toUpperCase()}`);
    this.audio.playClick();
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-retro', 'theme-cyber');
    document.body.classList.add(`theme-${theme}`);
    this.btnTheme.innerHTML = theme === 'retro' ? '🕹️ <span class="btn-text">Retro</span>' : '⚡ <span class="btn-text">Cyber</span>';
  }

  sharePuzzle() {
    let shareText;
    if (this.currentMode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      const grid = this.engine.generateShareGrid(today);
      shareText = `${grid}\nPlay at: ${window.location.origin}${window.location.pathname}`;
    } else {
      const code = this.engine.serialize();
      shareText = `${window.location.origin}${window.location.pathname}#${code}`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        this.setStatus('📋 Share text copied to clipboard!');
        this.audio.playClick();
      }).catch(() => {
        prompt('Copy this puzzle link to share:', shareText);
      });
    } else {
      prompt('Copy this puzzle link to share:', shareText);
    }
  }


  openModal(modal) {
    if (!modal) return;
    this.audio.playClick();
    modal.classList.add('is-active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('is-active'));
  }

  showStatsModal() {
    const stats = this.storage.getStats();
    document.getElementById('stat-total-games').textContent = stats.gamesPlayed;
    document.getElementById('stat-total-won').textContent = stats.gamesWon;
    document.getElementById('stat-win-rate').textContent = stats.gamesPlayed > 0
      ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
      : '0%';
    document.getElementById('stat-total-moves-all').textContent = stats.totalMoves;
    document.getElementById('stat-hints-used').textContent = stats.hintsUsed;
    this.openModal(this.modalStats);
  }

  handleKeyDown(e) {
    if (this.isSolving) return;

    // Prevent default scrolling for arrows and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        e.preventDefault();
      }
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.focusR = Math.max(0, this.focusR - 1);
        this.focusGridCell();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.focusR = Math.min(this.engine.rows - 1, this.focusR + 1);
        this.focusGridCell();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.focusC = Math.max(0, this.focusC - 1);
        this.focusGridCell();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.focusC = Math.min(this.engine.cols - 1, this.focusC + 1);
        this.focusGridCell();
        break;
      case ' ':
      case 'Enter':
        if (document.activeElement && document.activeElement.classList.contains('light-btn')) {
          const r = parseInt(document.activeElement.dataset.row, 10);
          const c = parseInt(document.activeElement.dataset.col, 10);
          this.handleCellClick(r, c);
        } else {
          this.handleCellClick(this.focusR, this.focusC);
        }
        break;
      case 'h':
      case 'H':
        this.showHint();
        break;
      case 'u':
      case 'U':
        this.handleUndo();
        break;
      case 'r':
      case 'R':
        this.handleReset();
        break;
      case 'n':
      case 'N':
        this.startNewGame();
        break;
      case 'Escape':
        this.closeAllModals();
        break;
    }
  }

  focusGridCell() {
    const btn = this.boardEl.querySelector(`[data-row="${this.focusR}"][data-col="${this.focusC}"]`);
    if (btn) btn.focus();
  }
}
