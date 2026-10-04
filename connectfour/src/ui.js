/**
 * Connect Four UI Controller
 * 1970s Tactile Milton Bradley Arcade Aesthetics with Responsive Touch, Gamepad & Minimax AI
 */

import { ConnectFourEngine, ROWS, COLS, EMPTY, PLAYER_1, PLAYER_2 } from './engine.js';
import { ConnectFourAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';

export class ConnectFourUI {
  constructor() {
    this.engine = new ConnectFourEngine();
    this.audio = new ConnectFourAudio();

    this.mode = localStorage.getItem('c4_mode') || 'ai'; // 'ai' or 'pvp'
    this.difficulty = localStorage.getItem('c4_difficulty') || 'medium'; // 'easy', 'medium', 'hard'
    this.selectedCol = 3; // for keyboard / gamepad
    this.isAIThinking = false;

    // Load stats
    this.stats = JSON.parse(localStorage.getItem('c4_stats') || '{"p1":0,"p2":0,"draws":0}');

    this.boardEl = document.getElementById('c4-board');
    this.colDropPreviewEl = document.getElementById('col-drop-preview');
    this.turnIndicatorEl = document.getElementById('turn-indicator');
    this.statusBannerEl = document.getElementById('status-banner');
    this.scoreP1El = document.getElementById('score-p1');
    this.scoreP2El = document.getElementById('score-p2');
    this.overlayEl = document.getElementById('game-overlay');
    this.overlayMsgEl = document.getElementById('overlay-msg');
    this.selectModeEl = document.getElementById('select-mode');
    this.selectDiffEl = document.getElementById('select-diff');

    this.initControls();
    this.bindEvents();
    this.updateStatsDisplay();
    this.render();

    arcadeVault.recordPlay('connectfour');
  }

  initControls() {
    if (this.selectModeEl) {
      this.selectModeEl.value = this.mode;
      this.selectModeEl.onchange = (e) => {
        this.mode = e.target.value;
        localStorage.setItem('c4_mode', this.mode);
        if (this.selectDiffEl) {
          this.selectDiffEl.style.display = (this.mode === 'ai') ? 'inline-block' : 'none';
        }
        this.resetGame();
      };
    }

    if (this.selectDiffEl) {
      this.selectDiffEl.value = this.difficulty;
      this.selectDiffEl.style.display = (this.mode === 'ai') ? 'inline-block' : 'none';
      this.selectDiffEl.onchange = (e) => {
        this.difficulty = e.target.value;
        localStorage.setItem('c4_difficulty', this.difficulty);
      };
    }
  }

  bindEvents() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.isAIThinking || this.engine.winner) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.shiftSelectedCol(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.shiftSelectedCol(1);
          break;
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.handleColumnClick(this.selectedCol);
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          this.handleUndo();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          this.resetGame();
          break;
      }
    });

    document.getElementById('btn-undo').onclick = () => this.handleUndo();
    document.getElementById('btn-reset').onclick = () => this.resetGame();
    document.getElementById('btn-sound').onclick = (e) => {
      this.audio.muted = !this.audio.muted;
      e.target.textContent = this.audio.muted ? '🔇 Sound' : '🔊 Sound';
    };

    document.getElementById('btn-play-again').onclick = () => {
      this.overlayEl.style.display = 'none';
      this.resetGame();
    };
  }

  shiftSelectedCol(delta) {
    let next = this.selectedCol + delta;
    if (next < 0) next = COLS - 1;
    if (next >= COLS) next = 0;
    this.selectedCol = next;
    this.updatePreviewIndicator();
  }

  updatePreviewIndicator() {
    const indicators = this.colDropPreviewEl.querySelectorAll('.preview-slot');
    indicators.forEach((slot, colIdx) => {
      slot.classList.remove('active', 'p1', 'p2');
      if (colIdx === this.selectedCol && !this.engine.winner && !this.isAIThinking) {
        slot.classList.add('active', this.engine.turn === PLAYER_1 ? 'p1' : 'p2');
      }
    });
  }

  async handleColumnClick(col) {
    if (this.isAIThinking || this.engine.winner) return;
    if (!this.engine.isValidColumn(col)) return;

    this.selectedCol = col;
    const player = this.engine.turn;
    const res = this.engine.dropPiece(col, player);

    if (!res) return;

    this.audio.playDrop(player);
    this.render();

    if (res.winner) {
      this.handleGameOver(res.winner);
      return;
    }

    // If vs AI and now AI's turn
    if (this.mode === 'ai' && this.engine.turn === PLAYER_2) {
      await this.triggerAIMove();
    }
  }

  async triggerAIMove() {
    this.isAIThinking = true;
    this.statusBannerEl.textContent = '🤖 Computer is thinking...';
    this.statusBannerEl.classList.add('thinking');
    this.updatePreviewIndicator();

    // Natural delay so human can track AI moves
    const delay = this.difficulty === 'hard' ? 400 : 300;
    await new Promise(r => setTimeout(r, delay));

    const aiCol = this.engine.getAIMove(this.difficulty);
    this.isAIThinking = false;
    this.statusBannerEl.classList.remove('thinking');

    if (aiCol !== null) {
      this.selectedCol = aiCol;
      const res = this.engine.dropPiece(aiCol, PLAYER_2);
      this.audio.playDrop(PLAYER_2);
      this.render();

      if (res && res.winner) {
        this.handleGameOver(res.winner);
      } else {
        this.statusBannerEl.textContent = 'Your turn (Red)';
      }
    }
  }

  handleUndo() {
    if (this.isAIThinking) return;

    if (this.mode === 'ai') {
      // Undo both AI move and Player move if AI played
      if (this.engine.turn === PLAYER_1 && this.engine.movesHistory.length >= 2) {
        this.engine.undo(); // AI
        this.engine.undo(); // Human
        this.audio.playUndo();
      } else if (this.engine.winner) {
        this.engine.undo();
        if (this.engine.movesHistory.length > 0 && this.engine.turn === PLAYER_2) {
          this.engine.undo();
        }
        this.audio.playUndo();
      }
    } else {
      if (this.engine.undo()) {
        this.audio.playUndo();
      }
    }

    this.overlayEl.style.display = 'none';
    this.statusBannerEl.textContent = this.engine.turn === PLAYER_1 ? 'Player 1 (Red)' : 'Player 2 (Yellow)';
    this.render();
  }

  resetGame() {
    this.engine.reset();
    this.isAIThinking = false;
    this.overlayEl.style.display = 'none';
    this.statusBannerEl.textContent = (this.mode === 'ai') ? 'Your turn (Red)' : 'Player 1 (Red)';
    this.statusBannerEl.classList.remove('thinking');
    this.render();
  }

  handleGameOver(winner) {
    if (winner === PLAYER_1) {
      this.stats.p1++;
      this.audio.playWin();
      this.statusBannerEl.textContent = (this.mode === 'ai') ? '🏆 VICTORY! You won!' : '🏆 Player 1 (Red) Wins!';
      this.overlayMsgEl.textContent = (this.mode === 'ai') ? 'VICTORY!' : 'PLAYER 1 WINS!';
      arcadeVault.recordWin('connectfour', { difficulty: this.difficulty, mode: this.mode });
    } else if (winner === PLAYER_2) {
      this.stats.p2++;
      if (this.mode === 'ai') {
        this.audio.playLoss();
        this.statusBannerEl.textContent = '💀 Computer Won!';
        this.overlayMsgEl.textContent = 'COMPUTER WINS!';
      } else {
        this.audio.playWin();
        this.statusBannerEl.textContent = '🏆 Player 2 (Yellow) Wins!';
        this.overlayMsgEl.textContent = 'PLAYER 2 WINS!';
      }
    } else {
      this.stats.draws++;
      this.audio.playDraw();
      this.statusBannerEl.textContent = '🤝 Stalemate! It\'s a draw!';
      this.overlayMsgEl.textContent = 'STALEMATE DRAW!';
    }

    localStorage.setItem('c4_stats', JSON.stringify(this.stats));
    this.updateStatsDisplay();
    this.render();

    setTimeout(() => {
      this.overlayEl.style.display = 'flex';
    }, 900);
  }

  updateStatsDisplay() {
    if (this.scoreP1El) this.scoreP1El.textContent = this.stats.p1;
    if (this.scoreP2El) this.scoreP2El.textContent = this.stats.p2;
  }

  render() {
    this.updatePreviewIndicator();

    // Turn indicator
    if (this.turnIndicatorEl) {
      if (this.engine.turn === PLAYER_1) {
        this.turnIndicatorEl.textContent = (this.mode === 'ai') ? 'Turn: Human (Red)' : 'Turn: Player 1 (Red)';
        this.turnIndicatorEl.className = 'turn-badge p1';
      } else {
        this.turnIndicatorEl.textContent = (this.mode === 'ai') ? 'Turn: AI (Yellow)' : 'Turn: Player 2 (Yellow)';
        this.turnIndicatorEl.className = 'turn-badge p2';
      }
    }

    // Grid rendering
    this.boardEl.innerHTML = '';
    const winningSet = new Set(this.engine.winningCells.map(c => `${c.r},${c.c}`));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const slot = document.createElement('div');
        slot.className = 'c4-slot';
        slot.dataset.col = c;
        slot.dataset.row = r;

        const disc = document.createElement('div');
        disc.className = 'c4-disc';

        const val = this.engine.board[r][c];
        if (val === PLAYER_1) {
          disc.classList.add('disc-p1');
        } else if (val === PLAYER_2) {
          disc.classList.add('disc-p2');
        } else {
          disc.classList.add('disc-empty');
        }

        if (winningSet.has(`${r},${c}`)) {
          disc.classList.add('disc-winner');
        }

        slot.appendChild(disc);

        // Click / touch to drop in this column
        slot.addEventListener('click', () => {
          this.handleColumnClick(c);
        });

        // Hover effect on column
        slot.addEventListener('mouseenter', () => {
          this.selectedCol = c;
          this.updatePreviewIndicator();
        });

        this.boardEl.appendChild(slot);
      }
    }
  }
}
