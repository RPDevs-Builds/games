/**
 * Space Invaders (1978) Web Audio Sound Engine
 * Synthesizes authentic 1978 arcade audio: 4-tone descending march heartbeat,
 * player laser chirp, white noise explosion bursts, bunker erosion crunches,
 * and the iconic looping UFO saucer siren.
 */

export class SpaceInvadersAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ufoOsc = null;
    this.ufoGain = null;
    this.ufoTimer = null;
    this.muted = false;

    // Heartbeat tones (F3, E3, D#3, D3)
    this.marchFrequencies = [174.61, 164.81, 155.56, 146.83];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported in this environment');
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime);
    }
    if (this.muted && this.ufoGain) {
      this.stopUfo();
    }
  }

  play(soundName) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (soundName.startsWith('heartbeat_')) {
      const idx = parseInt(soundName.split('_')[1], 10) || 0;
      this.playHeartbeat(idx);
      return;
    }

    switch (soundName) {
      case 'laser':
        this.playLaser();
        break;
      case 'alien_hit':
        this.playAlienExplosion();
        break;
      case 'bomb_drop':
        this.playBombDrop();
        break;
      case 'bomb_intercept':
        this.playBombIntercept();
        break;
      case 'bunker_hit':
        this.playBunkerHit();
        break;
      case 'player_death':
        this.playPlayerDeath();
        break;
      case 'ufo_start':
        this.startUfo();
        break;
      case 'ufo_stop':
        this.stopUfo();
        break;
      case 'ufo_hit':
        this.playUfoHit();
        break;
      case 'wave_clear':
        this.playWaveClear();
        break;
      case 'invasion_failure':
        this.playInvasionFailure();
        break;
    }
  }

  playHeartbeat(index) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const freq = this.marchFrequencies[index % 4];
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playLaser() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency sweep down: 900 Hz -> 200 Hz
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playAlienExplosion() {
    const now = this.ctx.currentTime;
    // White noise burst
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.18);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
  }

  playBombDrop() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  playBombIntercept() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playBunkerHit() {
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  playPlayerDeath() {
    const now = this.ctx.currentTime;
    // Layer 1: rumbling noise
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // Layer 2: descending wobble tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.82);
  }

  startUfo() {
    if (this.ufoOsc || this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.ufoOsc = this.ctx.createOscillator();
    this.ufoGain = this.ctx.createGain();

    this.ufoOsc.type = 'triangle';
    this.ufoOsc.frequency.setValueAtTime(400, now);

    this.ufoGain.gain.setValueAtTime(0.18, now);

    this.ufoOsc.connect(this.ufoGain);
    this.ufoGain.connect(this.masterGain);
    this.ufoOsc.start(now);

    // Two-tone warble
    let toggle = false;
    this.ufoTimer = setInterval(() => {
      if (!this.ufoOsc || !this.ctx) return;
      toggle = !toggle;
      this.ufoOsc.frequency.setValueAtTime(toggle ? 480 : 380, this.ctx.currentTime);
    }, 120);
  }

  stopUfo() {
    if (this.ufoTimer) {
      clearInterval(this.ufoTimer);
      this.ufoTimer = null;
    }
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoOsc.disconnect();
      } catch (e) {}
      this.ufoOsc = null;
    }
    if (this.ufoGain) {
      try {
        this.ufoGain.disconnect();
      } catch (e) {}
      this.ufoGain = null;
    }
  }

  playUfoHit() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
      }, idx * 70);
    });
  }

  playWaveClear() {
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
      }, idx * 110);
    });
  }

  playInvasionFailure() {
    const notes = [220.00, 196.00, 174.61, 146.83];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.38);
      }, idx * 160);
    });
  }
}
