/**
 * Wordle Web Audio Synthesizer
 * Provides acoustic feedback for typing, tile flips, invalid words, victory, and game over.
 */

class WordleAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initStorage();
  }

  initStorage() {
    try {
      const saved = localStorage.getItem('wordle_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  ensureContext() {
    if (this.muted) return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('wordle_sound_muted', this.muted);
    } catch (e) {}
    return this.muted;
  }

  /**
   * Short crisp click for typing letters
   */
  playKeyClick() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Low click for backspace/delete
   */
  playDeleteClick() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Sound played as a tile reveals. Frequency scales with index and correctness.
   */
  playTileFlip(index, status) {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale base frequencies (C4, D4, E4, G4, A4)
    const basePitches = [261.63, 293.66, 329.63, 392.00, 440.00];
    let freq = basePitches[Math.min(index, 4)];

    if (status === 'correct') {
      freq *= 1.5; // Up a fifth for green
      osc.type = 'triangle';
    } else if (status === 'present') {
      freq *= 1.25; // Up a major third for yellow
      osc.type = 'sine';
    } else {
      osc.type = 'sine'; // Muted root for absent
    }

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Buzzing alert when word is invalid or violates Hard Mode
   */
  playInvalidBuzz() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Upbeat victory fanfare
   */
  playVictoryFanfare() {
    if (!this.ensureContext()) return;
    const notes = [
      { f: 523.25, d: 0.12, offset: 0.00 }, // C5
      { f: 659.25, d: 0.12, offset: 0.12 }, // E5
      { f: 783.99, d: 0.12, offset: 0.24 }, // G5
      { f: 1046.50, d: 0.40, offset: 0.36 } // C6
    ];

    notes.forEach(note => {
      const now = this.ctx.currentTime + note.offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + note.d);
    });
  }

  /**
   * Somber defeat sequence
   */
  playDefeatTone() {
    if (!this.ensureContext()) return;
    const notes = [
      { f: 392.00, d: 0.2, offset: 0.00 }, // G4
      { f: 349.23, d: 0.2, offset: 0.20 }, // F4
      { f: 311.13, d: 0.2, offset: 0.40 }, // Eb4
      { f: 261.63, d: 0.4, offset: 0.60 }  // C4
    ];

    notes.forEach(note => {
      const now = this.ctx.currentTime + note.offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + note.d);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordleAudio;
}
