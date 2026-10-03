import { SimonEngine } from './engine.js';
import { SimonAudio } from './audio.js';

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
    this.btnSound.onclick = () => {
      this.audio.muted = !this.audio.muted;
      this.btnSound.textContent = this.audio.muted ? '🔇' : '🔊';
    };

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
  }

  handlePlayerPress(color) {
    if (this.isPlayingDemo) return;

    this.flashPad(color, 200);
    const res = this.engine.handlePlayerInput(color);

    if (res.status === 'round_complete') {
      const roundStr = res.nextRound.toString().padStart(2, '0');
      this.counterEl.textContent = roundStr;
      this.statusEl.textContent = 'GOOD! NEXT ROUND...';
      setTimeout(() => this.playSequence(), 800);
    } else if (res.status === 'error') {
      this.audio.playError();
      this.counterEl.textContent = '!!';
      this.statusEl.textContent = `MISTAKE! Final Score: ${res.round - 1}`;
      if (this.engine.strict) {
        setTimeout(() => this.startGame(), 1500);
      }
    }
  }
}
