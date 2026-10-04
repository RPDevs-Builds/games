import { SimonEngine } from './engine.js';
import { SimonAudio } from './audio.js';
import { arcadeVault } from '../arcade_vault.js';
import { retroCRT } from '../crt.js';

export class SimonUI {
  constructor() {
    this.engine = new SimonEngine();
    this.audio = new SimonAudio();
    this.pads = {
      green: document.getElementById('pad-green'),
      red: document.getElementById('pad-red'),
      yellow: document.getElementById('pad-yellow'),
      blue: document.getElementById('pad-blue')
    };
    this.counterEl = document.getElementById('count-display');
    this.statusEl = document.getElementById('status-msg');
    this.btnStart = document.getElementById('btn-start');
    this.btnStrict = document.getElementById('btn-strict');
    this.btnSound = document.getElementById('btn-sound');

    this.isPlayingDemo = false;
    this.bindEvents();
  }

  bindEvents() {
    this.btnStart.onclick = () => this.startGame();
    this.btnStrict.onclick = () => {
      this.engine.strict = !this.engine.strict;
      this.btnStrict.style.background = this.engine.strict ? '#e74c3c' : '#30363d';
    };
    this.btnSound.textContent = this.audio.muted ? '🔇' : '🔊';
    this.btnSound.onclick = () => {
      const muted = this.audio.toggleMute();
      this.btnSound.textContent = muted ? '🔇' : '🔊';
    };
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
          vault.goToArcade('simon');
        } else if (window.location.pathname.includes('/simon/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      };
    }

    // Pad inputs
    Object.keys(this.pads).forEach(color => {
      const pad = this.pads[color];
      pad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.handlePlayerPress(color);
      });
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.isPlayingDemo) return;
      if (e.key === 'q' || e.key === 'Q') this.handlePlayerPress('green');
      if (e.key === 'w' || e.key === 'W') this.handlePlayerPress('red');
      if (e.key === 'a' || e.key === 'A') this.handlePlayerPress('yellow');
      if (e.key === 's' || e.key === 'S') this.handlePlayerPress('blue');
    });
  }

  flashPad(color, duration = 300) {
    const pad = this.pads[color];
    if (!pad) return;
    pad.classList.add('active');
    this.audio.playColor(color, duration / 1000);
    setTimeout(() => {
      pad.classList.remove('active');
    }, duration);
  }

  async playSequence() {
    this.isPlayingDemo = true;
    this.statusEl.textContent = 'WATCH & LISTEN...';
    const speed = this.engine.getSpeed();

    await new Promise(r => setTimeout(r, 600));

    for (const color of this.engine.sequence) {
      this.flashPad(color, speed * 0.7);
      await new Promise(r => setTimeout(r, speed));
    }

    this.isPlayingDemo = false;
    this.statusEl.textContent = 'YOUR TURN!';
  }

  startGame() {
    this.engine.start();
    this.counterEl.textContent = '01';
    this.playSequence();
    arcadeVault.recordPlay('simon');
  }

  handlePlayerPress(color) {
    if (this.isPlayingDemo) return;

    this.flashPad(color, 200);
    if (window.arcadeVault) window.arcadeVault.vibrate(15);
    const res = this.engine.handlePlayerInput(color);

    if (res.status === 'round_complete') {
      const roundStr = res.nextRound.toString().padStart(2, '0');
      this.counterEl.textContent = roundStr;
      this.statusEl.textContent = 'GOOD! NEXT ROUND...';
      if (window.arcadeVault) window.arcadeVault.vibrate([25, 30, 45]);
      arcadeVault.recordScore('simon', res.nextRound - 1);
      if (this.engine.strict && (res.nextRound - 1) >= 15) {
        arcadeVault.unlock('simon_genius');
      }
      setTimeout(() => this.playSequence(), 800);
    } else if (res.status === 'error') {
      this.audio.playError();
      if (window.arcadeVault) window.arcadeVault.vibrate([60, 40, 100]);
      this.counterEl.textContent = '!!';
      this.statusEl.textContent = `MISTAKE! Final Score: ${res.round - 1}`;
      arcadeVault.recordScore('simon', res.round - 1);
      if (this.engine.strict) {
        setTimeout(() => this.startGame(), 1500);
      }
    }
  }
}
