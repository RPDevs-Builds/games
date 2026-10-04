/**
 * Pong 1972 UI & Canvas Rendering Controller
 * High-performance 60 FPS HTML5 Canvas engine with dual touch zones, virtual keypad, and Gamepad.
 */

import { PongEngine, ARENA_WIDTH, ARENA_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE } from './engine.js';
import { PongAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { arcadeGamepad } from '../gamepad.js';
import { retroCRT } from '../crt.js';

export class PongUI {
  constructor() {
    this.engine = new PongEngine('1p', 'medium');
    this.audio = new PongAudio();

    this.canvas = document.getElementById('pong-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.scoreP1El = document.getElementById('stat-score-p1');
    this.scoreP2El = document.getElementById('stat-score-p2');
    this.labelP2El = document.getElementById('label-p2');
    this.modeSelect = document.getElementById('select-mode');
    this.diffSelect = document.getElementById('select-diff');

    this.overlayEl = document.getElementById('game-overlay');
    this.overlayMsg = document.getElementById('overlay-msg');
    this.btnServe = document.getElementById('btn-serve');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnSound = document.getElementById('btn-sound');
    this.btnCRT = document.getElementById('btn-crt');

    this.keyState = {};
    this.lastTime = performance.now();

    this.initCanvas();
    this.bindEvents();
    this.bindTouchControls();
    this.bindGamepad();

    // Start 60 FPS Animation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initCanvas() {
    this.canvas.width = ARENA_WIDTH;
    this.canvas.height = ARENA_HEIGHT;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keyState[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.handleActionClick();
      } else if (e.code === 'KeyR') {
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyState[e.code] = false;
    });

    if (this.btnServe) {
      this.btnServe.onclick = () => this.handleActionClick();
    }
    if (this.btnRestart) {
      this.btnRestart.onclick = () => this.restartGame();
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
          vault.goToArcade('pong');
        } else if (window.location.pathname.includes('/pong/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }

    if (this.modeSelect) {
      this.modeSelect.onchange = (e) => {
        const mode = e.target.value;
        this.engine.setMode(mode);
        if (this.labelP2El) {
          this.labelP2El.textContent = mode === '2p' ? 'PLAYER 2' : 'CPU (AI)';
        }
        if (this.diffSelect) {
          this.diffSelect.style.display = mode === '2p' ? 'none' : 'inline-block';
        }
        this.restartGame();
      };
    }

    if (this.diffSelect) {
      this.diffSelect.onchange = (e) => {
        this.engine.setDifficulty(e.target.value);
        this.restartGame();
      };
    }

    if (this.btnSound) {
      this.btnSound.onclick = () => {
        const muted = this.audio.toggleMute();
        this.btnSound.textContent = muted ? '🔇 Muted' : '🔊 Sound';
        this.btnSound.classList.toggle('active', !muted);
      };
      this.btnSound.textContent = this.audio.isMuted ? '🔇 Muted' : '🔊 Sound';
    }

    if (this.btnCRT) {
      this.btnCRT.onclick = () => {
        const isCRT = retroCRT.toggle();
        this.btnCRT.classList.toggle('active', isCRT);
      };
      if (retroCRT.enabled) {
        this.btnCRT.classList.add('active');
      }
    }
  }

  bindTouchControls() {
    // Touch Drag on Canvas
    const handleTouch = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = ARENA_HEIGHT / rect.height;
      const scaleX = ARENA_WIDTH / rect.width;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const canvasX = (touch.clientX - rect.left) * scaleX;
        const canvasY = (touch.clientY - rect.top) * scaleY;

        if (this.engine.mode === '2p') {
          if (canvasX < ARENA_WIDTH / 2) {
            this.engine.setPaddle1Y(canvasY - PADDLE_HEIGHT / 2);
          } else {
            this.engine.setPaddle2Y(canvasY - PADDLE_HEIGHT / 2);
          }
        } else {
          // In 1P mode, touching anywhere controls P1
          this.engine.setPaddle1Y(canvasY - PADDLE_HEIGHT / 2);
        }
      }
    };

    this.canvas.addEventListener('touchstart', (e) => {
      this.audio.init();
      if (this.engine.state === 'ready' || this.engine.state === 'point_scored') {
        this.handleActionClick();
      }
      handleTouch(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', handleTouch, { passive: false });

    // Mobile Virtual Touch Buttons (Up / Down)
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');

    if (btnUp) {
      const startUp = (e) => { e.preventDefault(); this.keyState['KeyW'] = true; };
      const endUp = (e) => { e.preventDefault(); this.keyState['KeyW'] = false; };
      btnUp.addEventListener('touchstart', startUp, { passive: false });
      btnUp.addEventListener('touchend', endUp, { passive: false });
      btnUp.addEventListener('mousedown', startUp);
      btnUp.addEventListener('mouseup', endUp);
    }

    if (btnDown) {
      const startDown = (e) => { e.preventDefault(); this.keyState['KeyS'] = true; };
      const endDown = (e) => { e.preventDefault(); this.keyState['KeyS'] = false; };
      btnDown.addEventListener('touchstart', startDown, { passive: false });
      btnDown.addEventListener('touchend', endDown, { passive: false });
      btnDown.addEventListener('mousedown', startDown);
      btnDown.addEventListener('mouseup', endDown);
    }
  }

  bindGamepad() {
    // arcadeGamepad is initialized and dispatches keyboard events
  }

  handleActionClick() {
    this.audio.init();
    if (this.engine.state === 'ready' || this.engine.state === 'point_scored') {
      this.engine.start();
      this.btnServe.textContent = '⏸ Playing...';
      this.overlayEl.style.display = 'none';
      arcadeVault.recordPlay('pong');
    } else if (this.engine.state === 'game_over') {
      this.restartGame();
    }
  }

  restartGame() {
    this.engine.resetGame();
    this.btnServe.textContent = '🏓 Serve (Space)';
    this.overlayEl.style.display = 'none';
    this.updateScoreboard();
  }

  updateScoreboard() {
    this.scoreP1El.textContent = this.engine.scoreP1;
    this.scoreP2El.textContent = this.engine.scoreP2;
  }

  processInputs() {
    // Player 1 Input
    let p1Dir = 0;
    if (this.keyState['KeyW'] || this.keyState['ArrowUp']) {
      p1Dir -= 1;
    }
    if (this.keyState['KeyS'] || this.keyState['ArrowDown']) {
      p1Dir += 1;
    }
    this.engine.setPaddle1Input(p1Dir);

    // Player 2 Input (if 2P mode)
    if (this.engine.mode === '2p') {
      let p2Dir = 0;
      if (this.keyState['KeyI'] || this.keyState['Numpad8']) {
        p2Dir -= 1;
      }
      if (this.keyState['KeyK'] || this.keyState['Numpad2']) {
        p2Dir += 1;
      }
      this.engine.setPaddle2Input(p2Dir);
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.processInputs();
    const result = this.engine.update(dt);

    // Process Events
    if (result && result.events) {
      result.events.forEach((ev) => {
        if (ev.type === 'bounce_paddle') {
          this.audio.playPaddleHit();
        } else if (ev.type === 'bounce_wall') {
          this.audio.playWallBounce();
        } else if (ev.type === 'point_scored') {
          this.audio.playPointScored();
          this.updateScoreboard();
          this.btnServe.textContent = '🏓 Next Point (Space)';
        } else if (ev.type === 'game_over') {
          this.updateScoreboard();
          const p1Won = ev.winner === 1;
          if (p1Won) {
            this.audio.playVictory();
            arcadeVault.recordWin('pong', this.engine.scoreP1);
            arcadeVault.unlock('pong_paddle');
            if (this.engine.scoreP2 === 0) {
              arcadeVault.unlock('pong_shutout');
            }
          } else {
            this.audio.playDefeat();
          }

          const winnerText = this.engine.mode === '2p'
            ? (p1Won ? '🏆 PLAYER 1 WINS!' : '🏆 PLAYER 2 WINS!')
            : (p1Won ? '🏆 VICTORY! YOU BEAT THE CPU!' : '💀 GAME OVER - CPU WINS');

          this.overlayMsg.textContent = winnerText;
          this.overlayEl.style.display = 'flex';
          this.btnServe.textContent = '🔄 Play Again (Space)';
        }
      });
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    const { ctx } = this;

    // 1. CRT Arcade Backdrop
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // 2. Center Dashed Net Line
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(ARENA_WIDTH / 2, 0);
    ctx.lineTo(ARENA_WIDTH / 2, ARENA_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Draw Large Retro Score Shadows
    ctx.font = '80px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.textAlign = 'center';
    ctx.fillText(this.engine.scoreP1.toString(), ARENA_WIDTH / 4, 100);
    ctx.fillText(this.engine.scoreP2.toString(), (3 * ARENA_WIDTH) / 4, 100);

    // 4. Draw Paddle 1 (Phosphor Cyan)
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.engine.paddle1.x, this.engine.paddle1.y, this.engine.paddle1.width, this.engine.paddle1.height);

    // 5. Draw Paddle 2 (Phosphor Yellow / Orange)
    ctx.fillStyle = this.engine.mode === '2p' ? '#ffe600' : '#ff0055';
    ctx.shadowColor = this.engine.mode === '2p' ? '#ffe600' : '#ff0055';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.engine.paddle2.x, this.engine.paddle2.y, this.engine.paddle2.width, this.engine.paddle2.height);

    // 6. Draw Ball (Crisp Retro Square)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillRect(this.engine.ball.x, this.engine.ball.y, this.engine.ball.size, this.engine.ball.size);
    ctx.shadowBlur = 0; // Reset shadow

    // 7. Ready State Guide
    if (this.engine.state === 'ready') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SERVE OR TAP SCREEN TO BEGIN', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 60);
    } else if (this.engine.state === 'point_scored') {
      ctx.fillStyle = 'rgba(255, 230, 0, 0.85)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POINT SCORED! TAP SERVE TO CONTINUE', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 60);
    }
  }
}
