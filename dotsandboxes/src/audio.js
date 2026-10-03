/**
 * Web Audio API synthesizer for Dots and Boxes
 * Generates tactile pencil drawing, box capture chimes, and victory melodies.
 */

export class DotsAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
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

  /**
   * Tactile pencil scratch drawing stroke
   */
  playLineDraw() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Filtered noise buffer for pencil scratch
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  /**
   * Box capture chime
   */
  playBoxCapture(player = 1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const freq = player === 1 ? 523.25 : 659.25; // C5 for P1, E5 for P2/AI
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Victory melody
   */
  playWin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }
}
