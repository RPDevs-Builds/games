/**
 * Breakout Web Audio API Synthesizer
 * Authentic 1970s discrete acoustic sounds without external audio assets.
 */

export class BreakoutAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.25;

    this.loadSettings();
  }

  loadSettings() {
    try {
      const globalMute = localStorage.getItem('rpdevs_arcade_audio_muted');
      if (globalMute !== null) {
        this.muted = globalMute === 'true';
      }
      const vol = localStorage.getItem('rpdevs_arcade_master_volume');
      if (vol !== null) {
        this.masterVolume = Math.max(0.0, Math.min(1.0, parseFloat(vol)));
      }
    } catch {
      // fallback
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

  setVolume(vol) {
    this.masterVolume = Math.max(0.0, Math.min(1.0, vol));
    try {
      localStorage.setItem('rpdevs_arcade_master_volume', this.masterVolume);
    } catch {
      // ignore
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(freq, duration = 0.05, type = 'square', peakGain = 0.2) {
    if (this.muted || this.masterVolume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const effectiveGain = peakGain * this.masterVolume;
    gain.gain.setValueAtTime(effectiveGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playPaddle() {
    if (this.muted || this.masterVolume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

    gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playBrick(row = 7) {
    // Pitch scales with row height (row 0 highest, row 7 lowest)
    const pitches = [880, 830, 740, 660, 587, 523, 440, 392];
    const freq = pitches[row] || 440;
    this.playTone(freq, 0.07, 'square', 0.18);
  }

  playWall() {
    this.playTone(120, 0.04, 'sine', 0.15);
  }

  playLifeLost() {
    if (this.muted || this.masterVolume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);

    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playVictory() {
    const melody = [440, 554, 659, 880];
    melody.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.25), idx * 120);
    });
  }
}
