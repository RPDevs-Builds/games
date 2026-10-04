/**
 * Othello UI Controller
 * Manages green felt board, 3D disc flip animations, turn markers, hints, and event listeners.
 */

import { OthelloEngine, BLACK, WHITE, EMPTY } from './engine.js';
import { OthelloAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';

export class OthelloUI {
  constructor() {
    this.engine = new OthelloEngine();
    this.audio = new OthelloAudio();

    this.mode = 'ai'; // 'ai' or 'pvp'
    this.diff = 'medium'; // 'easy', 'medium', 'hard'
    this.showHints = true;
    this.isAiThinking = false;

    this.cacheElements();
    this.bindEvents();
    this.render();

    arcadeVault.recordPlay('othello');
    if (arcadeVault && typeof arcadeVault.bindNavigation === 'function') {
      arcadeVault.bindNavigation('othello');
    }
  }

  cacheElements() {
    this.boardEl = document.getElementById('board');
    this.scoreBlackEl = document.getElementById('score-black');
    this.scoreWhiteEl = document.getElementById('score-white');
    this.turnBadgeEl = document.getElementById('turn-badge');
    this.statusBannerEl = document.getElementById('status-banner');
    this.selectModeEl = document.getElementById('select-mode');
    this.selectDiffEl = document.getElementById('select-diff');
    this.btnHintsEl = document.getElementById('btn-hints');
    this.btnNewEl = document.getElementById('btn-new');
    this.btnSoundEl = document.getElementById('btn-sound');
    this.btnCrtEl = document.getElementById('btn-crt');
  }

  bindEvents() {
    this.btnNewEl.onclick = () => this.startNewGame();

    this.selectModeEl.onchange = (e) => {
      this.mode = e.target.value;
      this.selectDiffEl.disabled = (this.mode === 'pvp');
      this.startNewGame();
    };

    this.selectDiffEl.onchange = (e) => {
      this.diff = e.target.value;
      this.startNewGame();
    };

    if (this.btnHintsEl) {
      this.btnHintsEl.onclick = () => {
        this.showHints = !this.showHints;
        this.btnHintsEl.textContent = this.showHints ? '💡 Hints: ON' : '💡 Hints: OFF';
        this.render();
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

    // Board click handler
    this.boardEl.onclick = (e) => {
      const cell = e.target.closest('.othello-cell');
      if (!cell || this.isAiThinking || this.engine.gameOver) return;

      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      this.handleUserMove(r, c);
    };
  }

  startNewGame() {
    this.engine.reset();
    this.isAiThinking = false;
    this.statusBannerEl.style.display = 'none';
    this.render();
  }

  handleUserMove(r, c) {
    if (this.engine.turn === WHITE && this.mode === 'ai') return;

    const result = this.engine.playMove(r, c);
    if (!result.success) {
      this.audio.playInvalidMove();
      return;
    }

    this.audio.playDiscPlace();
    result.flips.forEach((_, idx) => {
      this.audio.playDiscFlip(idx * 0.05);
    });

    this.render();

    if (result.pass && !result.gameOver) {
      this.audio.playPass();
      this.showToast('Pass!', 'No valid moves available for opponent. Your turn again!');
    }

    if (result.gameOver) {
      this.handleGameOver();
      return;
    }

    if (this.mode === 'ai' && this.engine.turn === WHITE) {
      this.triggerAIMove();
    }
  }

  triggerAIMove() {
    this.isAiThinking = true;
    this.turnBadgeEl.textContent = 'Thinking... 🤖';

    setTimeout(() => {
      if (this.engine.gameOver) return;
      const aiMove = this.engine.getAIMove(this.diff, WHITE);
      if (!aiMove) {
        // AI must pass
        this.engine.turn = BLACK;
        this.isAiThinking = false;
        this.audio.playPass();
        this.showToast('AI Passed!', 'No moves available for AI. Your turn!');
        this.render();
        return;
      }

      const res = this.engine.playMove(aiMove.r, aiMove.c);
      this.audio.playDiscPlace();
      res.flips.forEach((_, idx) => {
        this.audio.playDiscFlip(idx * 0.05);
      });

      this.isAiThinking = false;
      this.render();

      if (res.gameOver) {
        this.handleGameOver();
      } else if (res.pass) {
        this.audio.playPass();
        this.showToast('You must pass!', 'No valid moves for Black. AI moves again.');
        this.triggerAIMove();
      }
    }, 450);
  }

  handleGameOver() {
    const { black, white } = this.engine.getScores();
    let msg = '';
    if (this.engine.winner === BLACK) {
      msg = `🎉 Black Wins! (${black} - ${white})`;
      this.audio.playVictory();
      arcadeVault.recordWin('othello', { black, white, diff: this.diff });
      arcadeVault.unlock('othello_victor');
    } else if (this.engine.winner === WHITE) {
      msg = `🤖 White Wins! (${white} - ${black})`;
    } else {
      msg = `🤝 It's a Draw! (${black} - ${white})`;
    }

    this.statusBannerEl.textContent = msg;
    this.statusBannerEl.style.display = 'block';
  }

  showToast(title, body) {
    if (window.arcadeVault && typeof window.arcadeVault.showToast === 'function') {
      window.arcadeVault.showToast(title, body);
    }
  }

  render() {
    const { black, white } = this.engine.getScores();
    this.scoreBlackEl.textContent = black;
    this.scoreWhiteEl.textContent = white;

    if (!this.engine.gameOver) {
      if (this.engine.turn === BLACK) {
        this.turnBadgeEl.className = 'turn-badge black-turn';
        this.turnBadgeEl.textContent = '● Turn: Black (P1)';
      } else {
        this.turnBadgeEl.className = 'turn-badge white-turn';
        this.turnBadgeEl.textContent = this.mode === 'ai' ? '○ Turn: White (CPU)' : '○ Turn: White (P2)';
      }
    } else {
      this.turnBadgeEl.className = 'turn-badge game-over-turn';
      this.turnBadgeEl.textContent = 'Game Over';
    }

    const validMoves = this.showHints && !this.engine.gameOver && !(this.mode === 'ai' && this.engine.turn === WHITE)
      ? this.engine.getValidMoves(this.engine.turn)
      : [];

    const validLookup = new Map();
    validMoves.forEach(m => validLookup.set(`${m.r},${m.c}`, m.flips.length));

    this.boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'othello-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        const val = this.engine.board[r][c];
        if (val === BLACK) {
          const disc = document.createElement('div');
          disc.className = 'disc black-disc';
          cell.appendChild(disc);
        } else if (val === WHITE) {
          const disc = document.createElement('div');
          disc.className = 'disc white-disc';
          cell.appendChild(disc);
        } else if (validLookup.has(`${r},${c}`)) {
          const hint = document.createElement('div');
          hint.className = 'hint-dot';
          cell.appendChild(hint);
        }

        this.boardEl.appendChild(cell);
      }
    }
  }
}
