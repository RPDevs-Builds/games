import { DotsAndBoxesEngine } from './engine.js';
import { DotsAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { ArcadeMenu } from '../../arcade_menu.js';

export class DotsAndBoxesUI {
  constructor() {
    this.gridRows = 3;
    this.gridCols = 3;
    this.mode = 'ai';
    this.difficulty = 'medium';

    this.engine = new DotsAndBoxesEngine(this.gridRows, this.gridCols);
    this.audio = new DotsAudio();

    this.svg = document.getElementById('svg-board');
    this.statusEl = document.getElementById('status-banner');
    this.scoreP1El = document.getElementById('score-p1');
    this.scoreP2El = document.getElementById('score-p2');
    this.cardP1 = document.getElementById('card-p1');
    this.cardP2 = document.getElementById('card-p2');
    this.nameP2 = document.getElementById('name-p2');

    this.btnRestart = document.getElementById('btn-restart');
    this.btnUndo = document.getElementById('btn-undo');

    this.menu = new ArcadeMenu({
      gameId: 'dotsandboxes',
      title: 'Dots & Boxes (1889)',
      year: '1889',
      gameOptions: [
        {
          id: 'opt-db-mode',
          label: 'Opponent Mode',
          type: 'select',
          options: [
            { value: 'ai', label: '🤖 vs CPU' },
            { value: 'pvp', label: '👥 2-Player (Local)' }
          ],
          value: this.mode,
          onChange: (val) => {
            this.mode = val;
            this.nameP2.textContent = (this.mode === 'ai') ? 'CPU / AI' : 'PLAYER 2';
            this.startNewGame();
          }
        },
        {
          id: 'opt-db-diff',
          label: 'AI Difficulty',
          type: 'select',
          options: [
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard (Chain Strategy)' }
          ],
          value: this.difficulty,
          onChange: (val) => {
            this.difficulty = val;
            this.startNewGame();
          }
        },
        {
          id: 'opt-db-size',
          label: 'Board Grid Size',
          type: 'select',
          options: [
            { value: '2x2', label: '2×2 (3×3 Dots)' },
            { value: '3x3', label: '3×3 (4×4 Dots)' },
            { value: '4x4', label: '4×4 (5×5 Dots)' },
            { value: '5x5', label: '5×5 (6×6 Dots)' }
          ],
          value: `${this.gridRows}x${this.gridCols}`,
          onChange: (val) => {
            const [r, c] = val.split('x').map(Number);
            this.gridRows = r;
            this.gridCols = c;
            this.engine = new DotsAndBoxesEngine(r, c);
            this.startNewGame();
          }
        }
      ],
      onAudioToggle: (muted) => {
        this.audio.muted = muted;
      }
    });

    this.isAiTurn = false;
    this.bindEvents();
    this.render();
    arcadeVault.recordPlay('dotsandboxes');
  }

  bindEvents() {
    this.btnRestart.onclick = () => this.startNewGame();
    this.btnUndo.onclick = () => this.handleUndo();
  }

  startNewGame() {
    this.engine.reset();
    this.isAiTurn = false;
    this.render();
    this.setStatus('Game started! Player 1 draws first.');
  }

  setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }

  updateScoreboard() {
    this.scoreP1El.textContent = this.engine.scores[1];
    this.scoreP2El.textContent = this.engine.scores[2];

    const p1Turn = this.engine.currentPlayer === 1;
    this.cardP1.classList.toggle('active-turn', p1Turn);
    this.cardP2.classList.toggle('active-turn', !p1Turn);
  }

  render() {
    this.svg.innerHTML = '';
    this.updateScoreboard();

    const viewBoxSize = 400;
    this.svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);

    const pad = 40;
    const availW = viewBoxSize - 2 * pad;
    const availH = viewBoxSize - 2 * pad;
    const stepX = availW / this.engine.boxCols;
    const stepY = availH / this.engine.boxRows;

    // 1. Render Box Fills & Monograms
    for (let r = 0; r < this.engine.boxRows; r++) {
      for (let c = 0; c < this.engine.boxCols; c++) {
        const owner = this.engine.boxes[r][c];
        if (owner) {
          const x = pad + c * stepX;
          const y = pad + r * stepY;

          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', stepX);
          rect.setAttribute('height', stepY);
          rect.setAttribute('class', owner === 1 ? 'box-fill-p1' : 'box-fill-p2');
          this.svg.appendChild(rect);

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', x + stepX / 2);
          text.setAttribute('y', y + stepY / 2);
          text.setAttribute('class', `box-label ${owner === 1 ? 'box-label-p1' : 'box-label-p2'}`);
          text.textContent = owner === 1 ? 'A' : (this.modeSelect.value === 'ai' ? 'CPU' : 'B');
          this.svg.appendChild(text);
        }
      }
    }

    // 2. Render Horizontal Lines
    for (let r = 0; r <= this.engine.boxRows; r++) {
      for (let c = 0; c < this.engine.boxCols; c++) {
        const x1 = pad + c * stepX;
        const y = pad + r * stepY;
        const x2 = x1 + stepX;

        const isPlaced = this.engine.hLines[r][c];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y);

        if (isPlaced) {
          // Find who placed this line from history
          const historyEntry = this.engine.history.find(h => h.type === 'h' && h.r === r && h.c === c);
          const p = historyEntry ? historyEntry.player : 1;
          line.setAttribute('class', p === 1 ? 'line-placed-p1' : 'line-placed-p2');
        } else {
          line.setAttribute('class', 'line-slot');
          line.onclick = () => this.handleLineClick('h', r, c);
        }

        this.svg.appendChild(line);
      }
    }

    // 3. Render Vertical Lines
    for (let r = 0; r < this.engine.boxRows; r++) {
      for (let c = 0; c <= this.engine.boxCols; c++) {
        const x = pad + c * stepX;
        const y1 = pad + r * stepY;
        const y2 = y1 + stepY;

        const isPlaced = this.engine.vLines[r][c];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y2);

        if (isPlaced) {
          const historyEntry = this.engine.history.find(h => h.type === 'v' && h.r === r && h.c === c);
          const p = historyEntry ? historyEntry.player : 1;
          line.setAttribute('class', p === 1 ? 'line-placed-p1' : 'line-placed-p2');
        } else {
          line.setAttribute('class', 'line-slot');
          line.onclick = () => this.handleLineClick('v', r, c);
        }

        this.svg.appendChild(line);
      }
    }

    // 4. Render Dots on top of lines
    for (let r = 0; r <= this.engine.boxRows; r++) {
      for (let c = 0; c <= this.engine.boxCols; c++) {
        const cx = pad + c * stepX;
        const cy = pad + r * stepY;

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', '6');
        dot.setAttribute('class', 'grid-dot');
        this.svg.appendChild(dot);
      }
    }
  }

  handleLineClick(type, r, c) {
    if (this.isAiTurn || this.engine.gameOver) return;

    this.audio.playLineDraw();
    if (window.arcadeVault) window.arcadeVault.vibrate(10);
    const res = this.engine.makeMove(type, r, c);
    if (!res.success) return;

    if (res.boxesCompleted.length > 0) {
      this.audio.playBoxCapture(res.player);
      if (window.arcadeVault) window.arcadeVault.vibrate(25);
    }

    this.render();

    if (res.gameOver) {
      if (window.arcadeVault) window.arcadeVault.vibrate([40, 60, 40, 60, 100]);
      this.handleGameOver();
      return;
    }

    if (res.bonusTurn) {
      this.setStatus(`Box completed! ${res.player === 1 ? 'Player 1' : 'Player 2'} gets a BONUS TURN!`);
    } else {
      const nextP = this.engine.currentPlayer === 1 ? 'Player 1' : (this.modeSelect.value === 'ai' ? 'CPU' : 'Player 2');
      this.setStatus(`${nextP}'s turn.`);
    }

    // Trigger AI if in vs AI mode and it's AI turn
    if (this.modeSelect.value === 'ai' && this.engine.currentPlayer === 2 && !this.engine.gameOver) {
      this.triggerAiTurn();
    }
  }

  async triggerAiTurn() {
    this.isAiTurn = true;
    this.setStatus('CPU is thinking...');

    while (this.engine.currentPlayer === 2 && !this.engine.gameOver) {
      await new Promise(r => setTimeout(r, 450));
      const aiMove = this.engine.getAIMove(this.diffSelect.value);
      if (!aiMove) break;

      this.audio.playLineDraw();
      const res = this.engine.makeMove(aiMove.type, aiMove.r, aiMove.c);
      if (res.boxesCompleted.length > 0) {
        this.audio.playBoxCapture(2);
      }

      this.render();

      if (res.gameOver) {
        this.handleGameOver();
        this.isAiTurn = false;
        return;
      }

      if (res.bonusTurn) {
        this.setStatus('CPU scored a box and takes another turn!');
      } else {
        this.setStatus("Player 1's turn.");
      }
    }

    this.isAiTurn = false;
  }

  handleUndo() {
    if (this.isAiTurn) return;
    const undone = this.engine.undo();
    if (undone) {
      // If vs AI, undo twice to step back before AI's move
      if (this.modeSelect.value === 'ai' && this.engine.history.length > 0 && this.engine.currentPlayer === 2) {
        this.engine.undo();
      }
      this.render();
      this.setStatus('Undid last move.');
    }
  }

  handleGameOver() {
    this.audio.playWin();
    const p1 = this.engine.scores[1];
    const p2 = this.engine.scores[2];

    if (p1 > p2) {
      this.setStatus(`🎉 PLAYER 1 WINS! (${p1} to ${p2})`);
      arcadeVault.recordWin('dotsandboxes');
    } else if (p2 > p1) {
      const winnerName = this.modeSelect.value === 'ai' ? 'CPU' : 'PLAYER 2';
      this.setStatus(`🏆 ${winnerName} WINS! (${p2} to ${p1})`);
    } else {
      this.setStatus(`🤝 IT'S A TIE! (${p1} to ${p2})`);
    }
  }
}
