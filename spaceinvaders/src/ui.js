/**
 * Space Invaders (1978) Canvas UI & Presentation Layer
 * Renders authentic phosphor pixel art, CRT scanline overlay,
 * responsive mobile controls, gamepad binding, and Arcade Vault synchronization.
 */

import { SpaceInvadersEngine, WIDTH, HEIGHT } from './engine.js';
import { SpaceInvadersAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';
import { arcadeGamepad } from '../gamepad.js';

if (typeof window !== 'undefined') {
  if (!window.arcadeVault) window.arcadeVault = arcadeVault;
  if (!window.retroCRT) window.retroCRT = retroCRT;
  if (!window.arcadeGamepad) window.arcadeGamepad = arcadeGamepad;
}

// Bitmaps for procedural sprite drawing
const SPRITES = {
  squid: [
    [
      '00011000',
      '00111100',
      '01111110',
      '11011011',
      '11111111',
      '00100100',
      '01011010',
      '10100101'
    ],
    [
      '00011000',
      '00111100',
      '01111110',
      '11011011',
      '11111111',
      '01011010',
      '10000001',
      '01000010'
    ]
  ],
  crab: [
    [
      '00100000100',
      '00010001000',
      '00111111100',
      '01101110110',
      '11111111111',
      '10111111101',
      '10100000101',
      '00011011000'
    ],
    [
      '00100000100',
      '10010001001',
      '10111111101',
      '11101110111',
      '11111111111',
      '01111111110',
      '00100000100',
      '01000000010'
    ]
  ],
  octopus: [
    [
      '000011110000',
      '011111111110',
      '111111111111',
      '111001100111',
      '111111111111',
      '000110011000',
      '001101101100',
      '110000000011'
    ],
    [
      '000011110000',
      '011111111110',
      '111111111111',
      '111001100111',
      '111111111111',
      '001100001100',
      '011001100110',
      '001100001100'
    ]
  ],
  cannon: [
    '0000001000000',
    '0000011100000',
    '0000011100000',
    '0111111111110',
    '1111111111111',
    '1111111111111',
    '1111111111111',
    '1111111111111'
  ],
  ufo: [
    '0000011111100000',
    '0001111111111000',
    '0011111111111100',
    '0110110110110110',
    '1111111111111111',
    '0001110001110000',
    '0000100000100000'
  ],
  alienExplosion: [
    '0001000001000',
    '1000100010001',
    '0100010100010',
    '0010000001000',
    '0000000000000',
    '0010000001000',
    '0100010100010',
    '1000100010001'
  ],
  playerExplosion: [
    '0001000001000',
    '1010101010101',
    '0101010101010',
    '1100110011001',
    '0011001100110',
    '1110111011101',
    '0101010101010',
    '1000100010001'
  ]
};

class SpaceInvadersUI {
  constructor() {
    this.canvas = document.getElementById('invaders-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new SpaceInvadersAudio();

    // DOM Elements
    this.scoreEl = document.getElementById('stat-score');
    this.highScoreEl = document.getElementById('stat-high-score');
    this.waveEl = document.getElementById('stat-wave');
    this.livesContainer = document.getElementById('lives-container');
    this.overlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayScore = document.getElementById('overlay-score');
    this.soundBtn = document.getElementById('btn-sound');
    this.crtBtn = document.getElementById('btn-crt');
    this.restartBtn = document.getElementById('btn-restart');

    // Input state
    this.keys = {
      left: false,
      right: false,
      fire: false
    };

    this.engine = new SpaceInvadersEngine({
      onScore: (s) => this.updateScore(s),
      onLives: (l) => this.renderLives(l),
      onWave: (w) => this.updateWave(w),
      onGameOver: (s) => this.handleGameOver(s),
      onSound: (snd) => {
        this.audio.play(snd);
        if (window.arcadeVault) {
          if (snd === 'shoot') window.arcadeVault.vibrate(10);
          else if (snd === 'invaderKilled') window.arcadeVault.vibrate(20);
          else if (snd === 'playerDeath') window.arcadeVault.vibrate([60, 40, 100]);
          else if (snd === 'ufo') window.arcadeVault.vibrate(15);
        }
      },
      onAchievement: (ach) => this.handleAchievement(ach)
    });

    this.lastTime = 0;
    this.animId = null;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupGamepad();
    this.syncAudioState();

    // Register game play with Arcade Vault
    if (window.arcadeVault) {
      window.arcadeVault.registerPlay('spaceinvaders');
      const savedHigh = window.arcadeVault.state.highScores['spaceinvaders'] || 0;
      this.highScoreEl.textContent = savedHigh;
    }

    this.renderLives(this.engine.lives);
    this.startGameLoop();
  }

  setupCanvas() {
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
  }

  syncAudioState() {
    if (window.arcadeVault) {
      const muted = window.arcadeVault.isAudioMuted();
      this.audio.setMuted(muted);
      if (this.soundBtn) {
        this.soundBtn.textContent = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.audio.ensureContext();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
      } else if (e.code === 'Space') {
        this.keys.fire = true;
        e.preventDefault();
      } else if (e.code === 'KeyR') {
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      } else if (e.code === 'Space') {
        this.keys.fire = false;
      }
    });

    // Touch controls
    const bindTouch = (id, prop) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        this.audio.ensureContext();
        this.keys[prop] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.keys[prop] = false;
      };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    bindTouch('btn-touch-left', 'left');
    bindTouch('btn-touch-right', 'right');
    bindTouch('btn-touch-fire', 'fire');

    // UI Buttons
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.restartGame();
      });
    }

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        const nextMuted = !this.audio.muted;
        this.audio.setMuted(nextMuted);
        if (window.arcadeVault) {
          window.arcadeVault.setAudioMuted(nextMuted);
        }
        this.soundBtn.textContent = nextMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
      });
    }

    if (this.crtBtn && window.retroCRT) {
      this.crtBtn.addEventListener('click', () => {
        window.retroCRT.toggle();
      });
    }

    const vaultBtn = document.getElementById('btn-vault');
    if (vaultBtn) {
      vaultBtn.addEventListener('click', () => {
        if (window.arcadeVault) {
          window.arcadeVault.showModal();
        }
      });
    }

    const portalLink = document.getElementById('btn-portal');
    if (portalLink) {
      portalLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.arcadeVault && typeof window.arcadeVault.goToArcade === 'function') {
          window.arcadeVault.goToArcade('spaceinvaders');
        } else if (window.location.pathname.includes('/spaceinvaders/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      });
    }
  }

  setupGamepad() {
    if (window.arcadeGamepad) {
      window.arcadeGamepad.onButtonDown((btn) => {
        this.audio.ensureContext();
        if (btn === 'dpad_left') this.keys.left = true;
        if (btn === 'dpad_right') this.keys.right = true;
        if (btn === 'a' || btn === 'b' || btn === 'x' || btn === 'y' || btn === 'rt') this.keys.fire = true;
        if (btn === 'start' || btn === 'select') this.restartGame();
      });

      window.arcadeGamepad.onButtonUp((btn) => {
        if (btn === 'dpad_left') this.keys.left = false;
        if (btn === 'dpad_right') this.keys.right = false;
        if (btn === 'a' || btn === 'b' || btn === 'x' || btn === 'y' || btn === 'rt') this.keys.fire = false;
      });

      window.arcadeGamepad.onAxis((axis, val) => {
        if (axis === 'lx') {
          if (val < -0.4) {
            this.keys.left = true;
            this.keys.right = false;
          } else if (val > 0.4) {
            this.keys.right = true;
            this.keys.left = false;
          } else {
            this.keys.left = false;
            this.keys.right = false;
          }
        }
      });
    }
  }

  restartGame() {
    this.overlay.style.display = 'none';
    this.engine.reset();
    this.scoreEl.textContent = '0';
    this.waveEl.textContent = '1';
    this.renderLives(this.engine.lives);
  }

  updateScore(score) {
    this.scoreEl.textContent = score;
    const currentHigh = parseInt(this.highScoreEl.textContent, 10) || 0;
    if (score > currentHigh) {
      this.highScoreEl.textContent = score;
    }
    if (window.arcadeVault) {
      window.arcadeVault.recordScore('spaceinvaders', score);
    }
  }

  updateWave(wave) {
    this.waveEl.textContent = wave;
  }

  renderLives(count) {
    this.livesContainer.innerHTML = '';
    for (let i = 0; i < Math.max(0, count); i++) {
      const icon = document.createElement('span');
      icon.className = 'life-icon';
      icon.innerHTML = '▲';
      this.livesContainer.appendChild(icon);
    }
  }

  handleGameOver(score) {
    this.overlay.style.display = 'flex';
    this.overlayTitle.textContent = 'GAME OVER';
    this.overlayScore.textContent = `FINAL SCORE: ${score}`;
    if (window.arcadeVault) {
      window.arcadeVault.recordScore('spaceinvaders', score);
    }
  }

  handleAchievement(achId) {
    if (window.arcadeVault) {
      window.arcadeVault.unlock(achId);
    }
  }

  startGameLoop() {
    const loop = (timestamp) => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update() {
    this.engine.update(this.keys);
  }

  render() {
    const ctx = this.ctx;

    // Clear arena
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw red top line for mystery saucer arena
    ctx.strokeStyle = '#331111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(WIDTH, 38);
    ctx.stroke();

    // Render UFO Mystery Saucer
    if (this.engine.ufo) {
      this.drawBitmapSprite(SPRITES.ufo, this.engine.ufo.x, this.engine.ufo.y, this.engine.ufo.width, this.engine.ufo.height, '#ff2244');
    }

    // Render Alien Fleet
    const frame = this.engine.alienAnimFrame;
    for (const alien of this.engine.aliens) {
      if (!alien.alive) continue;
      let spriteMatrix = SPRITES[alien.type][frame];
      let color = ALIEN_CONFIG[alien.type].color;
      this.drawBitmapSprite(spriteMatrix, alien.x, alien.y, alien.width, alien.height, color);
    }

    // Render Bunkers
    for (const bunker of this.engine.bunkers) {
      this.renderBunker(bunker);
    }

    // Render Ground Line
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, HEIGHT - 38);
    ctx.lineTo(WIDTH - 10, HEIGHT - 38);
    ctx.stroke();

    // Render Player Cannon
    if (!this.engine.player.isDying) {
      this.drawBitmapSprite(
        SPRITES.cannon,
        this.engine.player.x,
        this.engine.player.y,
        this.engine.player.width,
        this.engine.player.height,
        '#00ff66'
      );
    }

    // Render Player Laser
    if (this.engine.playerLaser) {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(
        this.engine.playerLaser.x,
        this.engine.playerLaser.y,
        this.engine.playerLaser.width,
        this.engine.playerLaser.height
      );
      ctx.shadowBlur = 0;
    }

    // Render Alien Bombs
    for (const bomb of this.engine.alienBombs) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 4;
      const wiggleOffset = Math.sin(bomb.wiggle) * 1.5;
      ctx.fillRect(bomb.x + wiggleOffset, bomb.y, bomb.width, bomb.height);
      ctx.shadowBlur = 0;
    }

    // Render Explosions and Debris
    for (const exp of this.engine.explosions) {
      if (exp.type === 'alien') {
        this.drawBitmapSprite(SPRITES.alienExplosion, exp.x, exp.y, exp.width, exp.height, '#ffffff');
      } else if (exp.type === 'player') {
        this.drawBitmapSprite(SPRITES.playerExplosion, exp.x, exp.y, exp.width, exp.height, '#00ff66');
      } else if (exp.type === 'ufo') {
        this.drawBitmapSprite(SPRITES.alienExplosion, exp.x, exp.y, exp.width, exp.height, '#ff2244');
      } else {
        // Bunker chip or splash
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(exp.x, exp.y, exp.width, exp.height);
      }
    }

    // Render Floating Scores
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    for (const fs of this.engine.floatingScores) {
      ctx.fillStyle = '#ff2244';
      ctx.fillText(fs.text, fs.x, fs.y);
    }
  }

  renderBunker(bunker) {
    const ctx = this.ctx;
    ctx.fillStyle = '#00ff66';
    for (let r = 0; r < bunker.rows; r++) {
      for (let c = 0; c < bunker.cols; c++) {
        if (bunker.chunks[r][c] === 1) {
          ctx.fillRect(
            bunker.x + c * bunker.chunkW,
            bunker.y + r * bunker.chunkH,
            bunker.chunkW,
            bunker.chunkH
          );
        }
      }
    }
  }

  drawBitmapSprite(matrix, x, y, width, height, color) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const pixelW = width / cols;
    const pixelH = height / rows;

    this.ctx.fillStyle = color;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === '1') {
          this.ctx.fillRect(x + c * pixelW, y + r * pixelH, pixelW + 0.2, pixelH + 0.2);
        }
      }
    }
  }
}

// DOM Ready initialization
function init() {
  new SpaceInvadersUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
