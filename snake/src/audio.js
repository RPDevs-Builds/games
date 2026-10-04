/**
 * Web Audio API synthesizer for Retro Snake
 * Generates classic Nokia-style piezoelectric square wave bleeps.
 */

export class SnakeAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem('rpdevs_arcade_audio_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('rpdevs_arcade_audio_muted', this.muted);
    } catch {
      // ignore
    }
    return this.muted;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.05, type = 'square') {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playEat() {
    this.playTone(880, 0.08, 'square'); // High A5
  }

  playTurn() {
    this.playTone(330, 0.02, 'triangle'); // Soft click
  }

  playGameOver() {
    this.playTone(220, 0.15, 'sawtooth');
    setTimeout(() => this.playTone(165, 0.3, 'sawtooth'), 150);
  }
}
