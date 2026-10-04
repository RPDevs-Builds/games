/**
 * Asteroids (1979) Authentic Vector Arcade Synthesizer
 * Generates classic Atari discrete sound effects using pure Web Audio API:
 * - Accelerating two-tone heartbeat thumps
 * - Laser cannon descending chirps
 * - Resonant thruster roar
 * - Multi-tiered noise explosion bursts
 * - Alien flying saucer warbles
 * - Hyperspace jump warp
 */

export class AsteroidsAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = this.checkMuted();
    this.noiseBuffer = null;
    this.saucerOsc = null;
    this.saucerGain = null;
    this.thrustOsc = null;
    this.thrustGain = null;
  }

  checkMuted() {
    try {
      return localStorage.getItem('rpdevs_arcade_audio_muted') === 'true';
    } catch {
      return false;
    }
  }

  getMasterVolume() {
    try {
      const vol = localStorage.getItem('rpdevs_arcade_master_volume');
      return vol !== null ? parseFloat(vol) : 0.25;
    } catch {
      return 0.25;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('rpdevs_arcade_audio_muted', this.isMuted ? 'true' : 'false');
    } catch {}
    if (this.isMuted) {
      this.stopThrust();
      this.stopSaucer();
    }
    return this.isMuted;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  playHeartbeat(step = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const freq = step === 0 ? 55 : 46;
      const masterVol = this.getMasterVolume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(masterVol * 0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }

  playFire() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const masterVol = this.getMasterVolume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(masterVol * 0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }

  startThrust() {
    if (this.isMuted || this.thrustOsc) return;
    this.init();
    if (!this.ctx || !this.noiseBuffer) return;

    try {
      const masterVol = this.getMasterVolume();
      this.thrustNoise = this.ctx.createBufferSource();
      this.thrustNoise.buffer = this.noiseBuffer;
      this.thrustNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.thrustGain = this.ctx.createGain();
      this.thrustGain.gain.setValueAtTime(masterVol * 0.4, this.ctx.currentTime);

      this.thrustNoise.connect(filter);
      filter.connect(this.thrustGain);
      this.thrustGain.connect(this.ctx.destination);

      this.thrustNoise.start();
    } catch {}
  }

  stopThrust() {
    if (this.thrustNoise) {
      try {
        this.thrustNoise.stop();
        this.thrustNoise.disconnect();
      } catch {}
      this.thrustNoise = null;
    }
  }

  playExplosion(type = 'medium') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.noiseBuffer) return;

    try {
      const masterVol = this.getMasterVolume();
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';

      let duration = 0.5;
      let startFreq = 400;

      if (type === 'small') {
        duration = 0.28;
        startFreq = 800;
      } else if (type === 'large') {
        duration = 0.85;
        startFreq = 250;
      }

      filter.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(masterVol * 0.55, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  startSaucer(isSmall = false) {
    if (this.isMuted || this.saucerOsc) return;
    this.init();
    if (!this.ctx) return;

    try {
      const masterVol = this.getMasterVolume();
      this.saucerOsc = this.ctx.createOscillator();
      this.saucerGain = this.ctx.createGain();

      const baseFreq = isSmall ? 800 : 420;
      const modFreq = isSmall ? 10 : 5;

      this.saucerOsc.type = 'sawtooth';
      this.saucerOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      // Simple LFO modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(modFreq, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(baseFreq * 0.15, this.ctx.currentTime);

      lfo.connect(this.saucerOsc.frequency);
      lfo.start();
      this.saucerLFO = lfo;

      this.saucerGain.gain.setValueAtTime(masterVol * 0.25, this.ctx.currentTime);

      this.saucerOsc.connect(this.saucerGain);
      this.saucerGain.connect(this.ctx.destination);

      this.saucerOsc.start();
    } catch {}
  }

  stopSaucer() {
    if (this.saucerOsc) {
      try {
        this.saucerOsc.stop();
        this.saucerOsc.disconnect();
        if (this.saucerLFO) {
          this.saucerLFO.stop();
          this.saucerLFO.disconnect();
          this.saucerLFO = null;
        }
      } catch {}
      this.saucerOsc = null;
    }
  }

  playHyperspace() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const masterVol = this.getMasterVolume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(masterVol * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.29);
    } catch {}
  }

  playExtraLife() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const masterVol = this.getMasterVolume();
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(masterVol * 0.35, this.ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (i + 1) * 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.08);
        osc.stop(this.ctx.currentTime + (i + 1) * 0.08);
      });
    } catch {}
  }
}
