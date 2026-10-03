/**
 * Retro Sound Synthesizer via Web Audio API
 * Generates authentic 90s handheld audio effects without external audio files.
 */

export class RetroAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.25;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const storedMute = localStorage.getItem('lightsout_audio_muted');
      if (storedMute !== null) {
        this.muted = storedMute === 'true';
      }
    } catch {
      // LocalStorage fallback
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('lightsout_audio_muted', this.muted);
    } catch {
      // Ignore
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.saveSettings();
    if (!this.muted) {
      this.playClick();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Short tactile button click
   */
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /**
   * Toggle chime modulated by cell coordinate
   * Gives a delightful musical spatial awareness
   */
  playToggle(r = 0, c = 0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const baseFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Pentatonic scale (C, D, E, G, A, C)
    const baseFreq = baseFreqs[(r + c) % baseFreqs.length];

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.08);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq / 2, this.ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    subOsc.start();
    osc.stop(this.ctx.currentTime + 0.12);
    subOsc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Hint chime: harmonic bright ping
   */
  playHint() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [659.25, 880.00]; // E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.volume * 0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  /**
   * Error or impossible move buzzer
   */
  playError() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Joyful victory arpeggio fanfare
   */
  playVictory() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Victory arpeggio (C4, E4, G4, C5, E5, G5)
    const melody = [
      { f: 261.63, d: 0.1 },
      { f: 329.63, d: 0.1 },
      { f: 392.00, d: 0.1 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.4 }
    ];

    let t = this.ctx.currentTime + 0.05;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(this.volume * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.9;
    });
  }
}
