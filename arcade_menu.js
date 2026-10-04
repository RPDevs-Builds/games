/**
 * RPDevs Unified Arcade Menu & Options Component
 * Zero-dependency shared component providing:
 *  - Standardized compact header (Arcade Portal, Game Title, Help, Options, Vault)
 *  - Unified "How to Play" (❓) modal with rules & controls for all 19 games
 *  - Unified "Options" (⚙️) modal with Sound, CRT, Haptic Vibration, plus game-specific options
 *  - Integration with ArcadeVault (🏆) and RetroCRT (📺)
 */

import { arcadeVault } from './arcade_vault.js';
import { retroCRT } from './crt.js';

export const GAME_RULES = {
  '2048': {
    title: '2048 (2014)',
    icon: '🔢',
    objective: 'Slide numbered tiles on the 4×4 grid. When two tiles with the same number collide, they merge into one with double the value! Reach tile 2048 to win.',
    rules: [
      'Each swipe or arrow press shifts all tiles across the grid in that direction.',
      'A new random tile (2 or 4) spawns after every valid move.',
      'Plan your moves to keep your highest tile in a designated corner.'
    ],
    controls: 'Swipe / Arrow Keys / W, A, S, D to slide • U for Undo • R to Restart.'
  },
  'asteroids': {
    title: 'Asteroids (1979 Atari)',
    icon: '🚀',
    objective: 'Pilot a triangular spacecraft trapped in an asteroid field. Blast space rocks into smaller fragments without colliding.',
    rules: [
      'Large asteroids break into two medium asteroids; medium break into two small ones.',
      'Beware of alien flying saucers that target your ship!',
      'Objects that exit one screen boundary wrap around to the opposite side.'
    ],
    controls: 'Left/Right or A/D to Rotate • Up / W to Thrust • Space to Fire • Down / S for Hyperspace.'
  },
  'breakout': {
    title: 'Breakout (1976 Atari)',
    icon: '🧱',
    objective: 'Clear rows of multi-colored bricks using a bouncy ball and a player-controlled paddle.',
    rules: [
      'Deflect the ball with your paddle to keep it in play.',
      'Hitting the ball toward paddle edges reflects it at sharper angles.',
      'Higher colored brick rows award more points and accelerate the ball.'
    ],
    controls: 'Mouse / Touch Drag or Left/Right (A/D) to move paddle • Space to Launch ball.'
  },
  'connectfour': {
    title: 'Connect Four (1974)',
    icon: '🔴',
    objective: 'Be the first player to form a continuous line of four matching discs (horizontal, vertical, or diagonal) on a 7×6 vertical grid.',
    rules: [
      'Players take turns dropping colored discs down one of the 7 columns.',
      'Discs fall straight down, occupying the lowest available slot.',
      'Block your opponent from achieving 4-in-a-row while setting up double-ended traps!'
    ],
    controls: 'Tap a column or use Left/Right + Enter/Space / Down to drop • U for Undo.'
  },
  'dotsandboxes': {
    title: 'Dots and Boxes (1889 Lucas)',
    icon: '📦',
    objective: 'Take turns drawing lines between adjacent dots. Complete the 4th side of a 1×1 square box to claim it and take an immediate bonus turn!',
    rules: [
      'Click or tap between two adjacent dots to draw a boundary wall.',
      'Completing a box awards 1 point and gives you another move.',
      'Avoid opening short chains until you can sweep them all!'
    ],
    controls: 'Tap between adjacent dots to place a wall • U for Undo.'
  },
  'fallingblocks': {
    title: 'Falling Blocks (1984 Tetris)',
    icon: '🧱',
    objective: 'Position and rotate falling tetrominoes to fill complete horizontal lines without letting the stack reach the ceiling.',
    rules: [
      'Full horizontal lines vanish and award points. Clearing 4 lines simultaneously is a Tetris!',
      '7-Bag randomizer guarantees all 7 piece shapes appear once before repeating.',
      'Features Super Rotation System (SRS) wall kicks and ghost piece drop projection.'
    ],
    controls: 'Left/Right to Shift • Up / X to Rotate Clockwise • Z for Counter-Clockwise • Down to Soft Drop • Space to Hard Drop • C to Hold.'
  },
  'frogger': {
    title: 'Frogger (1981 Konami)',
    icon: '🐸',
    objective: 'Safely guide 5 frogs across a bustling highway and treacherous river into the 5 docking bays at the top of the screen.',
    rules: [
      'Avoid passing cars, bulldozers, trucks, and racing autos on the roadway.',
      'Hop onto floating logs and turtles to cross the water. Water immersion is fatal!',
      'Watch out for diving turtles that plunge underwater, and catch bonus flies in docks.'
    ],
    controls: 'Arrow Keys / W, A, S, D or Touch D-Pad to hop Up, Down, Left, Right • R to Reset.'
  },
  'lightcycles': {
    title: 'Tron Light Cycles (1982)',
    icon: '🏍️',
    objective: 'Race high-speed light cycles on a cyber grid. As cycles move, they leave solid light walls in their wake. Force the opponent to crash into a wall first!',
    rules: [
      'Crashing into the arena perimeter, your own trail, or opponent\'s trail results in defeat.',
      'Use limited Turbo Boosts wisely to cut off opponents before they can turn.',
      'You cannot reverse directly into your own heading (180° turns are blocked).'
    ],
    controls: 'P1: Arrow Keys or W/A/S/D • Shift / Space for Turbo Boost • P2: I/J/K/L.'
  },
  'lightsout': {
    title: 'Lights Out (1995 Tiger)',
    icon: '💡',
    objective: 'Extinguish every single illuminated button on the grid.',
    rules: [
      'Pressing any light toggles its state (ON ↔ OFF) and flips all 4 direct orthogonal neighbors.',
      'Order does not matter (A then B = B then A).',
      'Never press any cell twice: optimal solutions press buttons at most once.'
    ],
    controls: 'Tap or click lights • Use Hint (💡) or Auto-Solve (🤖) when stuck.'
  },
  'mazechaser': {
    title: 'Maze Chaser (1980 Pac-Man)',
    icon: '🟡',
    objective: 'Navigate the labyrinth eating all dots and fruit while dodging 4 distinct ghost pursuers.',
    rules: [
      'Each ghost possesses unique AI: Blinky chases directly, Pinky ambushes ahead, Inky flanks, and Clyde roams.',
      'Eating an Energizer power pellet temporarily turns ghosts blue (frightened), allowing you to chomp them for bonus score.',
      'Clear all dots to advance to the next level!'
    ],
    controls: 'Arrow Keys / W, A, S, D or Touch D-Pad to steer • P to Pause.'
  },
  'minesweeper': {
    title: 'Minesweeper (1990 Windows)',
    icon: '💣',
    objective: 'Uncover all non-mine cells on the grid without detonating any hidden landmines.',
    rules: [
      'Numbers indicate how many landmines surround that specific cell in the 8 adjacent squares.',
      'Flag suspected mines to prevent accidental detonation.',
      'Guaranteed first-click safe opening! Clear all safe tiles to win.'
    ],
    controls: 'Click to reveal • Right-click (or Long Press / Flag Mode) to plant flag • Tap Smiley 🙂 to Restart.'
  },
  'missilecommand': {
    title: 'Missile Command (1980 Atari)',
    icon: '🚀',
    objective: 'Defend 6 ground cities from ballistic missile attacks by detonating interceptor counter-missiles in the sky.',
    rules: [
      'Target oncoming enemy warheads with the crosshair and fire from 3 missile batteries (Alpha, Delta, Omega).',
      'Anti-ballistic missile explosions linger and expand, chaining destruction across multiple enemy warheads.',
      'Preserve as many cities and spare missiles as possible to earn multiplier bonus scores.'
    ],
    controls: 'Mouse / Touch to Aim & Fire • Keys A, S, D to launch from Left, Center, or Right battery.'
  },
  'othello': {
    title: 'Othello / Reversi (1883)',
    icon: '⚪',
    objective: 'Trap and flip opponent discs horizontally, vertically, or diagonally between your own pieces. Have the most discs of your color when the board fills!',
    rules: [
      'Every valid move must bracket at least one opposing disc between your new piece and an existing one.',
      'All bracketed opponent discs are flipped to your color.',
      'Corner positions can never be flipped—control them to dominate edges!'
    ],
    controls: 'Tap valid highlighted green spots on the 8×8 board • Toggle Hints anytime.'
  },
  'pong': {
    title: 'Pong (1972 Atari)',
    icon: '🏓',
    objective: 'The foundational electronic table tennis simulator. Deflect the square ball past your opponent\'s paddle to score points.',
    rules: [
      'First player to reach 11 points wins the match.',
      'Ball speed increases with successive paddle rallies.',
      'Deflection angle varies according to where the ball contacts the paddle.'
    ],
    controls: 'W / S or Up / Down or Touch Drag to move paddle • Space to Serve.'
  },
  'simon': {
    title: 'Simon (1978 Milton Bradley)',
    icon: '🔴',
    objective: 'Test and stretch your sequence memory. Watch and listen to the flashing colored lights, then repeat the exact sequence.',
    rules: [
      'Simon adds one new step to the harmonic sequence each round.',
      'In Standard Mode, an error allows replay of the current round.',
      'In Strict Mode, any error terminates the game back to step 1!'
    ],
    controls: 'Tap Green, Red, Yellow, or Blue pads • Keys Q (Green), W (Red), A (Yellow), S (Blue).'
  },
  'snake': {
    title: 'Retro Snake (Nokia 3310)',
    icon: '🐍',
    objective: 'Steer the hungry snake to gobble food pellets. Each meal lengthens the snake and boosts your score.',
    rules: [
      'Do not collide with outer border walls or the snake\'s own lengthening body.',
      'Speed gradually escalates as your snake grows.',
      'Plan sweeping switchbacks to avoid trapping yourself in corners!'
    ],
    controls: 'Arrow Keys / W, A, S, D or Touch D-Pad to steer • Space to Pause.'
  },
  'sokoban': {
    title: 'Sokoban (1982 Thinking Rabbit)',
    icon: '📦',
    objective: 'Guide the warehouse keeper to push all storage crates onto the designated goal storage diamonds.',
    rules: [
      'You can only PUSH crates—crates can never be pulled!',
      'You cannot push two crates at once.',
      'Avoid pushing crates into corners where they cannot be pushed back out.'
    ],
    controls: 'Arrow Keys / W, A, S, D or Touch D-Pad to move • U to Undo • R to Reset.'
  },
  'spaceinvaders': {
    title: 'Space Invaders (1978 Taito)',
    icon: '👾',
    objective: 'Defend Earth from 5 rows of 11 descending alien invaders marching back and forth across the cosmos.',
    rules: [
      'Aliens speed up their march as their ranks thin out.',
      'Use 4 protective destructible bunkers for shelter, but beware of erosion from both enemy and player fire.',
      'Shoot the high-altitude Mystery Saucer UFO for up to 300 bonus points.'
    ],
    controls: 'Left / Right (A / D) to steer laser cannon • Space to Fire • Destroy the fleet before it lands!'
  },
  'wordle': {
    title: 'Wordle (1955 Jotto / 2021)',
    icon: '🔤',
    objective: 'Deduce the secret 5-letter mystery word within 6 guesses.',
    rules: [
      '🟩 GREEN tile: Letter is in the secret word and in the correct spot.',
      '🟨 YELLOW tile: Letter is in the secret word but in a different position.',
      '⬛ DARK tile: Letter is not in the secret word in any position.',
      'Hard Mode: Any revealed hints must be used in subsequent guesses.'
    ],
    controls: 'Type letters using virtual or physical keyboard • Enter to submit • Backspace to delete.'
  }
};

export class ArcadeMenu {
  /**
   * @param {Object} options
   * @param {string} options.gameId Identifier e.g. 'wordle', 'snake', 'frogger'
   * @param {string} options.title Formatted title e.g. '🐍 RETRO SNAKE'
   * @param {string} options.year Release year e.g. '1997'
   * @param {Array<Object>} [options.gameOptions] Array of game-specific option controls
   *   e.g. [{ id: 'opt-grid-size', label: 'Grid Size', type: 'select', options: [...], value: '5x5', onChange: (val)=>{} }]
   * @param {Function} [options.onAudioToggle] Callback when mute toggled
   * @param {Function} [options.onCrtToggle] Callback when CRT toggled
   */
  constructor(options = {}) {
    this.gameId = options.gameId || '';
    this.title = options.title || (GAME_RULES[this.gameId]?.title || 'RPDevs Arcade');
    this.year = options.year || '';
    this.gameOptions = options.gameOptions || [];
    this.onAudioToggle = options.onAudioToggle || null;
    this.onCrtToggle = options.onCrtToggle || null;

    this.isMuted = arcadeVault.isAudioMuted();
    this.crtActive = retroCRT.enabled;
    this.vibrateEnabled = localStorage.getItem('rpdevs_arcade_vibrate') !== 'false';

    this.init();
  }

  init() {
    this.injectStyles();
    this.setupHeaderBindings();
    this.bindStandardButtons();
  }

  bindStandardButtons() {
    // Help button
    const helpBtn = document.getElementById('btn-help') || document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.openHelpModal();
      };
    }

    // Options button
    const optBtn = document.getElementById('btn-options') || document.getElementById('options-btn');
    if (optBtn) {
      optBtn.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.openOptionsModal();
      };
    }

    // Vault button
    const vaultBtn = document.getElementById('btn-vault') || document.getElementById('stats-btn');
    if (vaultBtn) {
      vaultBtn.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        arcadeVault.showModal();
      };
    }

    // Portal button
    const portalBtn = document.getElementById('btn-portal');
    if (portalBtn) {
      portalBtn.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        arcadeVault.goToArcade(this.gameId);
      };
    }
  }

  setupHeaderBindings() {
    // If game has old btn-sound or btn-crt inline, sync them
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn && !soundBtn._menuBound) {
      soundBtn._menuBound = true;
      soundBtn.onclick = () => this.toggleAudio();
    }
    const crtBtn = document.getElementById('btn-crt');
    if (crtBtn && !crtBtn._menuBound) {
      crtBtn._menuBound = true;
      crtBtn.onclick = () => this.toggleCRT();
    }
  }

  toggleAudio() {
    this.isMuted = !this.isMuted;
    arcadeVault.setAudioMuted(this.isMuted);
    if (this.onAudioToggle) this.onAudioToggle(this.isMuted);
    this.updateAudioButtons();
    return this.isMuted;
  }

  toggleCRT() {
    this.crtActive = retroCRT.toggle();
    if (this.onCrtToggle) this.onCrtToggle(this.crtActive);
    this.updateCRTButtons();
    return this.crtActive;
  }

  toggleVibrate() {
    this.vibrateEnabled = !this.vibrateEnabled;
    localStorage.setItem('rpdevs_arcade_vibrate', this.vibrateEnabled ? 'true' : 'false');
    return this.vibrateEnabled;
  }

  updateAudioButtons() {
    const audioCheckbox = document.getElementById('menu-opt-audio');
    if (audioCheckbox) audioCheckbox.checked = !this.isMuted;
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.textContent = this.isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
    }
  }

  updateCRTButtons() {
    const crtCheckbox = document.getElementById('menu-opt-crt');
    if (crtCheckbox) crtCheckbox.checked = this.crtActive;
  }

  openHelpModal() {
    const existing = document.getElementById('arcade-menu-help-modal');
    if (existing) existing.remove();

    const info = GAME_RULES[this.gameId] || {
      title: this.title,
      icon: '🎮',
      objective: 'Master classic arcade gameplay, achieve new high scores, and unlock career achievements.',
      rules: ['Play with skill and precision.'],
      controls: 'Use keyboard, mouse/touch, or connected gamepad.'
    };

    const modal = document.createElement('div');
    modal.id = 'arcade-menu-help-modal';
    modal.className = 'arcade-menu-backdrop';
    modal.innerHTML = `
      <div class="arcade-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
        <div class="menu-modal-header">
          <div class="menu-title-wrap">
            <span class="menu-icon">${info.icon || '❓'}</span>
            <div>
              <h2 id="help-dialog-title" class="menu-dialog-title">How to Play: ${info.title}</h2>
              <span class="menu-dialog-sub">Rules & Controls Guide</span>
            </div>
          </div>
          <button class="menu-close-btn" id="help-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="menu-modal-body">
          <section class="menu-section">
            <h3 class="menu-section-header">🎯 Objective</h3>
            <p class="menu-p">${info.objective}</p>
          </section>

          <section class="menu-section">
            <h3 class="menu-section-header">📜 Rules & Strategy</h3>
            <ul class="menu-ul">
              ${info.rules.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </section>

          <section class="menu-section">
            <h3 class="menu-section-header">🎮 Controls</h3>
            <div class="controls-card">
              <span class="controls-badge">Input</span>
              <p class="controls-text">${info.controls}</p>
            </div>
          </section>
        </div>
        <div class="menu-modal-footer">
          <button class="menu-btn menu-btn-primary" id="help-gotit-btn">Got It! ➔</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    document.getElementById('help-close-btn').onclick = close;
    document.getElementById('help-gotit-btn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
  }

  openOptionsModal() {
    const existing = document.getElementById('arcade-menu-options-modal');
    if (existing) existing.remove();

    let customOptionsHtml = '';
    if (this.gameOptions && this.gameOptions.length > 0) {
      customOptionsHtml = `
        <section class="menu-section">
          <h3 class="menu-section-header">🕹️ Game Settings</h3>
          <div class="options-grid">
            ${this.gameOptions.map(opt => {
              if (opt.type === 'select') {
                return `
                  <div class="option-row">
                    <label for="${opt.id}" class="option-label">${opt.label}</label>
                    <select id="${opt.id}" class="option-select">
                      ${opt.options.map(o => `<option value="${o.value}" ${o.value === opt.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                    </select>
                  </div>
                `;
              } else if (opt.type === 'checkbox') {
                return `
                  <div class="option-row">
                    <span class="option-label">${opt.label}</span>
                    <label class="toggle-switch">
                      <input type="checkbox" id="${opt.id}" ${opt.checked ? 'checked' : ''}>
                      <span class="slider"></span>
                    </label>
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        </section>
      `;
    }

    const modal = document.createElement('div');
    modal.id = 'arcade-menu-options-modal';
    modal.className = 'arcade-menu-backdrop';
    modal.innerHTML = `
      <div class="arcade-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="options-dialog-title">
        <div class="menu-modal-header">
          <div class="menu-title-wrap">
            <span class="menu-icon">⚙️</span>
            <div>
              <h2 id="options-dialog-title" class="menu-dialog-title">Game Options</h2>
              <span class="menu-dialog-sub">Audio, Visuals & Gameplay</span>
            </div>
          </div>
          <button class="menu-close-btn" id="options-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="menu-modal-body">
          <section class="menu-section">
            <h3 class="menu-section-header">🔊 Audio & Display</h3>
            <div class="options-grid">
              <div class="option-row">
                <span class="option-label">Game Sound Effects</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="menu-opt-audio" ${!this.isMuted ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="option-row">
                <span class="option-label">CRT Scanline Shader</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="menu-opt-crt" ${this.crtActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="option-row">
                <span class="option-label">Haptic Vibration</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="menu-opt-vibrate" ${this.vibrateEnabled ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </section>

          ${customOptionsHtml}

          <section class="menu-section">
            <h3 class="menu-section-header">🏛️ Arcade Passport</h3>
            <div style="display: flex; gap: 8px;">
              <button id="menu-btn-open-vault" class="menu-btn" style="flex: 1;">🏆 Career Passport & Stats</button>
              <button id="menu-btn-return-portal" class="menu-btn" style="flex: 1;">🏛️ Exit to Master Arcade</button>
            </div>
          </section>
        </div>
        <div class="menu-modal-footer">
          <button class="menu-btn menu-btn-primary" id="options-done-btn">Save & Resume</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind audio toggle
    const audioInput = document.getElementById('menu-opt-audio');
    audioInput.onchange = (e) => {
      this.isMuted = !e.target.checked;
      arcadeVault.setAudioMuted(this.isMuted);
      if (this.onAudioToggle) this.onAudioToggle(this.isMuted);
      this.updateAudioButtons();
    };

    // Bind CRT toggle
    const crtInput = document.getElementById('menu-opt-crt');
    crtInput.onchange = () => {
      this.toggleCRT();
    };

    // Bind vibration toggle
    const vibInput = document.getElementById('menu-opt-vibrate');
    vibInput.onchange = (e) => {
      this.vibrateEnabled = e.target.checked;
      localStorage.setItem('rpdevs_arcade_vibrate', this.vibrateEnabled ? 'true' : 'false');
    };

    // Bind game-specific option handlers
    this.gameOptions.forEach(opt => {
      const el = document.getElementById(opt.id);
      if (el) {
        el.onchange = (e) => {
          const val = opt.type === 'checkbox' ? e.target.checked : e.target.value;
          if (opt.onChange) opt.onChange(val);
        };
      }
    });

    // Sub-buttons
    document.getElementById('menu-btn-open-vault').onclick = () => {
      modal.remove();
      arcadeVault.showModal();
    };
    document.getElementById('menu-btn-return-portal').onclick = () => {
      modal.remove();
      arcadeVault.goToArcade(this.gameId);
    };

    const close = () => modal.remove();
    document.getElementById('options-close-btn').onclick = close;
    document.getElementById('options-done-btn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
  }

  injectStyles() {
    if (document.getElementById('arcade-menu-styles')) return;
    const style = document.createElement('style');
    style.id = 'arcade-menu-styles';
    style.textContent = `
      /* Standard Unified Header */
      .arcade-unified-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background: #0d1117;
        border-bottom: 1px solid #21262d;
        color: #f0f6fc;
        box-sizing: border-box;
        z-index: 50;
      }

      .arcade-unified-header .header-left,
      .arcade-unified-header .header-right {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .arcade-unified-header .title-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        text-align: center;
        flex: 1;
        overflow: hidden;
      }

      .arcade-unified-header .header-game-title {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #fff;
      }

      .arcade-unified-header .header-badge-year {
        font-size: 0.65rem;
        font-family: monospace;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #c9d1d9;
        padding: 2px 5px;
        border-radius: 4px;
      }

      .icon-nav-btn {
        background: #161b22;
        border: 1px solid #30363d;
        color: #f0f6fc;
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 0.85rem;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: background 0.15s, border-color 0.15s;
        -webkit-tap-highlight-color: transparent;
      }

      .icon-nav-btn:hover {
        background: #21262d;
        border-color: #484f58;
      }

      .icon-nav-btn:active {
        transform: scale(0.95);
      }

      /* Modal Backdrop & Dialog */
      .arcade-menu-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        z-index: 100000;
        animation: menuFadeIn 0.2s ease;
      }

      .arcade-menu-dialog {
        background: #0f141d;
        border: 2px solid #2d3748;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95);
        width: 100%;
        max-width: 480px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        padding: 18px;
        gap: 14px;
        color: #f0f6fc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
      }

      .menu-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #21262d;
        padding-bottom: 10px;
      }

      .menu-title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .menu-icon { font-size: 1.6rem; }
      .menu-dialog-title { font-size: 1.15rem; font-weight: 800; margin: 0; color: #fff; }
      .menu-dialog-sub { font-size: 0.72rem; color: #8b949e; }

      .menu-close-btn {
        background: #21262d;
        border: 1px solid #30363d;
        color: #c9d1d9;
        border-radius: 8px;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .menu-modal-body {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding-right: 4px;
      }

      .menu-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .menu-section-header {
        font-size: 0.82rem;
        font-weight: 700;
        color: #8b949e;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }

      .menu-p {
        font-size: 0.88rem;
        line-height: 1.45;
        color: #c9d1d9;
        margin: 0;
      }

      .menu-ul {
        margin: 0;
        padding-left: 20px;
        font-size: 0.85rem;
        color: #c9d1d9;
        line-height: 1.45;
      }

      .menu-ul li { margin-bottom: 4px; }

      .controls-card {
        background: #161b22;
        border: 1px solid #21262d;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .controls-badge {
        font-size: 0.65rem;
        font-weight: 800;
        color: #00f0ff;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .controls-text {
        font-size: 0.85rem;
        color: #f0f6fc;
        margin: 0;
        line-height: 1.35;
      }

      .options-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #161b22;
        border: 1px solid #21262d;
        border-radius: 8px;
        padding: 12px;
      }

      .option-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .option-label {
        font-size: 0.85rem;
        color: #f0f6fc;
        font-weight: 600;
      }

      .option-select {
        background: #0d1117;
        border: 1px solid #30363d;
        color: #fff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.82rem;
        cursor: pointer;
      }

      /* Toggle switch */
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #21262d;
        border: 1px solid #30363d;
        transition: .25s;
        border-radius: 24px;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: #8b949e;
        transition: .25s;
        border-radius: 50%;
      }

      .toggle-switch input:checked + .slider {
        background-color: #1f6feb;
        border-color: #388bfd;
      }

      .toggle-switch input:checked + .slider:before {
        transform: translateX(20px);
        background-color: #fff;
      }

      .menu-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        border-top: 1px solid #21262d;
        padding-top: 10px;
      }

      .menu-btn {
        background: #21262d;
        border: 1px solid #30363d;
        color: #c9d1d9;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.15s ease;
      }

      .menu-btn:hover {
        background: #30363d;
        color: #fff;
      }

      .menu-btn-primary {
        background: #238636;
        border-color: #2ea043;
        color: #fff;
      }

      .menu-btn-primary:hover {
        background: #2ea043;
      }

      @keyframes menuFadeIn {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }

      @media (max-width: 480px) {
        .arcade-unified-header {
          padding: 4px 6px;
        }
        .arcade-unified-header .header-game-title {
          font-size: 0.92rem;
        }
        .icon-nav-btn {
          padding: 4px 6px;
          font-size: 0.8rem;
        }
        .arcade-menu-dialog {
          padding: 14px;
          gap: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
