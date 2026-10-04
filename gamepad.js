/**
 * RPDevs Universal HTML5 Gamepad Controller Manager
 * Supports Xbox, PlayStation DualShock/DualSense, 8BitDo, and standard USB/Bluetooth gamepads.
 */

export class ArcadeGamepad {
  constructor() {
    this.controllers = {};
    this.prevButtons = {};
    this.active = false;
    this.rafId = null;
    this.stickThreshold = 0.5;
    this.stickFired = { up: false, down: false, left: false, right: false };

    this.bindEvents();
  }

  init() {
    // Already bound via constructor
  }

  bindEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.controllers[e.gamepad.index] = e.gamepad;
      this.showToast(`🎮 ${e.gamepad.id.split('(')[0].trim()} Connected`);
      if (!this.active) {
        this.active = true;
        this.loop();
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      delete this.controllers[e.gamepad.index];
      this.showToast(`🎮 Controller Disconnected`);
      if (Object.keys(this.controllers).length === 0) {
        this.active = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
      }
    });
  }

  loop() {
    if (!this.active) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;

      this.processGamepad(gp);
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  processGamepad(gp) {
    const prev = this.prevButtons[gp.index] || {};
    const curr = {};

    const isPressed = (btnIdx) => {
      if (!gp.buttons[btnIdx]) return false;
      return typeof gp.buttons[btnIdx] === 'object' ? gp.buttons[btnIdx].pressed : gp.buttons[btnIdx] > 0.5;
    };

    // Standard Gamepad Mapping:
    // 0: A (Cross)
    // 1: B (Circle)
    // 2: X (Square)
    // 3: Y (Triangle)
    // 12: Dpad Up
    // 13: Dpad Down
    // 14: Dpad Left
    // 15: Dpad Right
    // 9: Start / Options
    // 8: Select / Share

    const justPressed = (btnIdx) => isPressed(btnIdx) && !prev[btnIdx];

    // D-Pad
    if (justPressed(12)) this.dispatchKey('ArrowUp');
    if (justPressed(13)) this.dispatchKey('ArrowDown');
    if (justPressed(14)) this.dispatchKey('ArrowLeft');
    if (justPressed(15)) this.dispatchKey('ArrowRight');

    // Analog Left Stick
    const stickX = gp.axes[0] || 0;
    const stickY = gp.axes[1] || 0;

    if (stickX < -this.stickThreshold) {
      if (!this.stickFired.left) { this.dispatchKey('ArrowLeft'); this.stickFired.left = true; }
    } else { this.stickFired.left = false; }

    if (stickX > this.stickThreshold) {
      if (!this.stickFired.right) { this.dispatchKey('ArrowRight'); this.stickFired.right = true; }
    } else { this.stickFired.right = false; }

    if (stickY < -this.stickThreshold) {
      if (!this.stickFired.up) { this.dispatchKey('ArrowUp'); this.stickFired.up = true; }
    } else { this.stickFired.up = false; }

    if (stickY > this.stickThreshold) {
      if (!this.stickFired.down) { this.dispatchKey('ArrowDown'); this.stickFired.down = true; }
    } else { this.stickFired.down = false; }

    // Action Buttons
    if (justPressed(0)) this.dispatchKey('Enter'); // A -> Enter / Select
    if (justPressed(1)) this.dispatchKey('Escape'); // B -> Back / Escape
    if (justPressed(2)) this.dispatchKey('u');      // X -> Undo
    if (justPressed(3)) this.dispatchKey('r');      // Y -> Restart
    if (justPressed(9)) this.dispatchKey(' ');      // Start -> Pause

    // Record button states
    for (let b = 0; b < gp.buttons.length; b++) {
      curr[b] = isPressed(b);
    }
    this.prevButtons[gp.index] = curr;
  }

  dispatchKey(key) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
  }

  showToast(msg) {
    let toast = document.getElementById('arcade-gamepad-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'arcade-gamepad-toast';
      toast.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        background: #111a2e;
        border: 1px solid #38bdf8;
        color: #38bdf8;
        font-family: monospace;
        font-size: 0.8rem;
        padding: 8px 14px;
        border-radius: 8px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        z-index: 99999;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  }
}

export const arcadeGamepad = new ArcadeGamepad();
