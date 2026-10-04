/**
 * RPDevs Retro CRT Controller
 * Toggles CRT scanline & curvature effects across the arcade suite.
 */

export class RetroCRT {
  constructor() {
    this.storageKey = 'rpdevs_arcade_crt_mode';
    this.enabled = localStorage.getItem(this.storageKey) === 'true';
    this.apply();
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(this.storageKey, this.enabled ? 'true' : 'false');
    this.apply();
    return this.enabled;
  }

  apply() {
    if (this.enabled) {
      document.body.classList.add('crt-active');
    } else {
      document.body.classList.remove('crt-active');
    }
  }
}

export const retroCRT = new RetroCRT();
if (typeof window !== 'undefined') {
  window.retroCRT = retroCRT;
  window.RetroCRT = RetroCRT;
}
