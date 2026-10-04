/**
 * Falling Blocks (1984) Web Audio Chiptune Synthesizer
 * Pure zero-dependency Web Audio API oscillator synthesis.
 */

class FallingBlocksAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.syncVolume();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  syncVolume() {
    if (!this.masterGain || !this.ctx) return;
    let vol = 0.5;
    if (window.ArcadeVault && typeof window.ArcadeVault.getMasterVolume === 'function') {
      vol = window.ArcadeVault.getMasterVolume();
    }
    if (this.isMuted) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      this.masterGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    this.syncVolume();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.syncVolume();
    return this.isMuted;
  }

  playTone(freq, type = 'square', duration = 0.05, startGain = 0.3, endGain = 0.01) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(startGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(endGain, 0.0001), this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  move() {
    this.playTone(400, 'square', 0.025, 0.15, 0.01);
  }

  rotate() {
    this.playTone(600, 'triangle', 0.04, 0.25, 0.01);
  }

  softDrop() {
    this.playTone(180, 'square', 0.015, 0.1, 0.01);
  }

  hardDrop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  hold() {
    this.playTone(520, 'square', 0.05, 0.2, 0.01);
  }

  clearLine(count = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (count >= 4) {
      // 4-line Tetris fanfare: C5, G5, C6, E6 sustain
      const notes = [523.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.3, now + idx * 0.08);
        const dur = idx === 3 ? 0.35 : 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + dur);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + dur);
      });
    } else {
      // 1-3 lines arpeggio
      const notes = count === 1 ? [523.25, 659.25] : [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.25, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.07);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.07);
      });
    }
  }

  gameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.15);
    });
  }
}

export const audio = new FallingBlocksAudio();
