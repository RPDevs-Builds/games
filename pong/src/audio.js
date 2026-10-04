/**
 * Pong 1972 Authentic Acoustic Synthesizer
 * Pure Web Audio API square-wave frequency generation matching original 1972 TTL sound chips.
 */

export class PongAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = this.checkMuted();
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
    return this.isMuted;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(freq, type = 'square', duration = 0.08, gainMultiplier = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const masterVol = this.getMasterVolume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const targetGain = 0.25 * masterVol * gainMultiplier;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // 1972 Authentic Pong Audio Tones
  playPaddleHit() {
    this.playTone(440, 'square', 0.08, 1.0);
  }

  playWallBounce() {
    this.playTone(220, 'square', 0.06, 0.85);
  }

  playPointScored() {
    this.playTone(110, 'square', 0.35, 1.2);
  }

  playVictory() {
    if (this.isMuted) return;
    const notes = [220, 277, 330, 440, 554, 660];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'square', 0.12, 1.0), idx * 100);
    });
  }

  playDefeat() {
    if (this.isMuted) return;
    const notes = [330, 293, 261, 196, 146];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.15, 0.9), idx * 120);
    });
  }
}
