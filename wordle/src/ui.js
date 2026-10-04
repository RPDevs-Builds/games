/**
 * Wordle UI Controller
 * Manages grid rendering, animations, virtual keyboard, modals, statistics,
 * audio triggers, and Arcade Vault integration.
 */

class WordleUI {
  constructor() {
    this.engine = new WordleEngine();
    this.audio = new WordleAudio();

    this.currentInput = '';
    this.isRevealing = false;
    this.keypadState = {}; // { 'a': 'correct'|'present'|'absent' }
    this.stats = this.loadStats();

    // DOM references
    this.gridContainer = document.getElementById('grid-container');
    this.keyboardContainer = document.getElementById('keyboard-container');
    this.toastContainer = document.getElementById('toast-container');
    this.statsModal = document.getElementById('stats-modal');
    this.helpModal = document.getElementById('help-modal');
    this.gameOverModal = document.getElementById('gameover-modal');
    this.modeSelector = document.getElementById('mode-selector');
    this.hardModeCheckbox = document.getElementById('hardmode-checkbox');
    this.muteBtn = document.getElementById('mute-btn');
    this.statsBtn = document.getElementById('stats-btn');
    this.helpBtn = document.getElementById('help-btn');
    this.closeModalBtns = document.querySelectorAll('.close-modal');
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.shareBtn = document.getElementById('share-btn');
    this.toastEl = document.getElementById('toast');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboard();
    this.updateSoundIcon();

    // Default to daily challenge or check URL param ?mode=practice
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'practice') {
      this.modeSelector.value = 'practice';
      this.startNewGame('practice');
    } else {
      this.modeSelector.value = 'daily';
      this.startNewGame('daily');
    }
  }

  loadStats() {
    try {
      const saved = localStorage.getItem('wordle_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      lastDailyCompleted: null
    };
  }

  saveStats() {
    try {
      localStorage.setItem('wordle_stats_v1', JSON.stringify(this.stats));
    } catch (e) {}
  }

  startNewGame(mode = 'daily') {
    this.currentInput = '';
    this.isRevealing = false;
    this.keypadState = {};
    this.engine.hardMode = this.hardModeCheckbox.checked;

    if (mode === 'daily') {
      this.engine.startDaily();
    } else {
      this.engine.startPractice();
    }

    this.renderEmptyGrid();
    this.resetKeypadColors();
    this.hardModeCheckbox.disabled = false;

    // Register play in Arcade Vault
    if (window.arcadeVault) {
      window.arcadeVault.registerPlay('wordle');
    }
  }

  setupEventListeners() {
    // Physical Keyboard
    window.addEventListener('keydown', (e) => {
      if (this.isRevealing) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      if (key === 'Enter') {
        this.handleEnter();
      } else if (key === 'Backspace' || key === 'Delete') {
        this.handleDelete();
      } else if (/^[a-zA-Z]$/.test(key)) {
        this.handleLetter(key.toLowerCase());
      }
    });

    // Hard Mode Toggle
    this.hardModeCheckbox.addEventListener('change', () => {
      this.engine.hardMode = this.hardModeCheckbox.checked;
      this.showToast(this.engine.hardMode ? 'Hard Mode Enabled' : 'Hard Mode Disabled');
    });

    // Mode Selector
    this.modeSelector.addEventListener('change', (e) => {
      this.startNewGame(e.target.value);
    });

    // Sound Toggle
    this.muteBtn.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      this.updateSoundIcon();
      this.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
    });

    // Help Modal
    this.helpBtn.addEventListener('click', () => {
      this.openModal(this.helpModal);
    });

    // Stats Modal
    this.statsBtn.addEventListener('click', () => {
      this.renderStatsView();
      this.openModal(this.statsModal);
    });

    // Close Modals
    this.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal);
      });
    });

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });

    // Play Again Button
    this.playAgainBtn.addEventListener('click', () => {
      this.closeModal(this.gameOverModal);
      this.startNewGame(this.modeSelector.value);
    });

    // Share Button
    this.shareBtn.addEventListener('click', () => {
      this.shareScorecard();
    });

    // Arcade Navigation Link
    const navBtn = document.querySelector('.cabinet-header .nav-btn');
    if (navBtn) {
      navBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const vault = window.arcadeVault || window.ArcadeVault;
        if (vault && typeof vault.goToArcade === 'function') {
          vault.goToArcade('wordle');
        } else if (window.location.pathname.includes('/wordle/') || window.location.protocol !== 'file:') {
          window.location.href = '../index.html';
        } else if (window.AndroidArcade && typeof window.AndroidArcade.launchArcade === 'function') {
          window.AndroidArcade.launchArcade();
        } else {
          window.location.href = "intent:#Intent;package=com.rpdevs.games.arcade;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end";
        }
      });
    }
  }

  updateSoundIcon() {
    this.muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
    this.muteBtn.setAttribute('aria-label', this.audio.muted ? 'Unmute Sound' : 'Mute Sound');
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  setupKeyboard() {
    const layout = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'del']
    ];

    this.keyboardContainer.innerHTML = '';
    layout.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      row.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.dataset.key = key;

        if (key === 'enter') {
          btn.textContent = 'ENTER';
          btn.classList.add('key-wide');
          btn.addEventListener('click', () => this.handleEnter());
        } else if (key === 'del') {
          btn.textContent = '⌫';
          btn.classList.add('key-wide');
          btn.addEventListener('click', () => this.handleDelete());
        } else {
          btn.textContent = key.toUpperCase();
          btn.addEventListener('click', () => this.handleLetter(key));
        }

        rowEl.appendChild(btn);
      });

      this.keyboardContainer.appendChild(rowEl);
    });
  }

  resetKeypadColors() {
    const keys = this.keyboardContainer.querySelectorAll('.key-btn');
    keys.forEach(k => {
      k.classList.remove('correct', 'present', 'absent');
    });
  }

  renderEmptyGrid() {
    this.gridContainer.innerHTML = '';
    for (let r = 0; r < this.engine.maxGuesses; r++) {
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.dataset.row = r;

      for (let c = 0; c < this.engine.wordLength; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.col = c;
        row.appendChild(tile);
      }
      this.gridContainer.appendChild(row);
    }
  }

  handleLetter(letter) {
    if (this.engine.status !== 'IN_PROGRESS' || this.isRevealing) return;
    if (this.currentInput.length >= this.engine.wordLength) return;

    this.currentInput += letter;
    this.audio.playKeyClick();
    this.updateActiveRow();
  }

  handleDelete() {
    if (this.engine.status !== 'IN_PROGRESS' || this.isRevealing) return;
    if (this.currentInput.length === 0) return;

    this.currentInput = this.currentInput.slice(0, -1);
    this.audio.playDeleteClick();
    this.updateActiveRow();
  }

  updateActiveRow() {
    const rowIndex = this.engine.guesses.length;
    const rowEl = this.gridContainer.children[rowIndex];
    if (!rowEl) return;

    for (let c = 0; c < this.engine.wordLength; c++) {
      const tile = rowEl.children[c];
      const char = this.currentInput[c] || '';
      const wasEmpty = !tile.textContent;

      tile.textContent = char.toUpperCase();
      if (char) {
        tile.classList.add('active');
        if (wasEmpty) {
          tile.classList.add('pop');
          setTimeout(() => tile.classList.remove('pop'), 120);
        }
      } else {
        tile.classList.remove('active');
      }
    }
  }

  handleEnter() {
    if (this.engine.status !== 'IN_PROGRESS' || this.isRevealing) return;

    if (this.currentInput.length < this.engine.wordLength) {
      this.showToast('Not enough letters');
      this.shakeActiveRow();
      this.audio.playInvalidBuzz();
      if (window.arcadeVault) window.arcadeVault.vibrate(30);
      return;
    }

    // Submit to engine
    const result = this.engine.submitGuess(this.currentInput);
    if (!result.success) {
      this.showToast(result.message);
      this.shakeActiveRow();
      this.audio.playInvalidBuzz();
      if (window.arcadeVault) window.arcadeVault.vibrate(35);
      return;
    }

    // Lock Hard Mode toggle once guess accepted
    this.hardModeCheckbox.disabled = true;

    // Animate reveal
    const rowIndex = this.engine.guesses.length - 1;
    this.animateReveal(rowIndex, result.evaluation, () => {
      this.currentInput = '';
      if (result.status === 'WON') {
        this.handleGameWon();
      } else if (result.status === 'LOST') {
        this.handleGameLost(result.secretWord);
      }
    });
  }

  shakeActiveRow() {
    const rowIndex = this.engine.guesses.length;
    const rowEl = this.gridContainer.children[rowIndex];
    if (rowEl) {
      rowEl.classList.remove('shake');
      void rowEl.offsetWidth; // Trigger reflow
      rowEl.classList.add('shake');
      setTimeout(() => rowEl.classList.remove('shake'), 500);
    }
  }

  animateReveal(rowIndex, evaluation, onComplete) {
    this.isRevealing = true;
    const rowEl = this.gridContainer.children[rowIndex];
    const flipDuration = 350;
    const staggerDelay = 250;

    evaluation.forEach((item, colIndex) => {
      setTimeout(() => {
        const tile = rowEl.children[colIndex];
        tile.classList.add('flip');

        // Play audio chord tone for this flip
        this.audio.playTileFlip(colIndex, item.status);

        // At halfway point (rotation 90deg), apply color
        setTimeout(() => {
          tile.classList.add(item.status);
          this.updateKeypadColor(item.letter, item.status);
        }, flipDuration / 2);

        // When last tile completes
        if (colIndex === evaluation.length - 1) {
          setTimeout(() => {
            this.isRevealing = false;
            if (onComplete) onComplete();
          }, flipDuration + 100);
        }
      }, colIndex * staggerDelay);
    });
  }

  updateKeypadColor(letter, status) {
    const keyBtn = this.keyboardContainer.querySelector(`[data-key="${letter}"]`);
    if (!keyBtn) return;

    const rank = { 'correct': 3, 'present': 2, 'absent': 1 };
    const currentStatus = this.keypadState[letter];
    const currentRank = rank[currentStatus] || 0;
    const newRank = rank[status] || 0;

    if (newRank > currentRank) {
      this.keypadState[letter] = status;
      keyBtn.classList.remove('correct', 'present', 'absent');
      keyBtn.classList.add(status);
    }
  }

  handleGameWon() {
    const attempts = this.engine.guesses.length;
    const praise = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][attempts - 1] || 'Well Done!';

    // Audio
    this.audio.playVictoryFanfare();
    if (window.arcadeVault) window.arcadeVault.vibrate([40, 60, 40, 60, 100]);

    // Bounce winning row
    const winningRow = this.gridContainer.children[attempts - 1];
    if (winningRow) {
      Array.from(winningRow.children).forEach((tile, idx) => {
        setTimeout(() => {
          tile.classList.add('bounce');
        }, idx * 100);
      });
    }

    // Update Stats
    this.stats.played++;
    this.stats.won++;
    this.stats.currentStreak++;
    this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
    this.stats.distribution[attempts] = (this.stats.distribution[attempts] || 0) + 1;
    this.saveStats();

    // Check Achievements in Arcade Vault
    if (window.arcadeVault) {
      // 1. First win
      window.arcadeVault.unlockAchievement('wordle_first_win');

      // 2. Streak of 5
      if (this.stats.currentStreak >= 5) {
        window.arcadeVault.unlockAchievement('wordle_streak_5');
      }

      // 3. Genius (win in <= 2 guesses)
      if (attempts <= 2) {
        window.arcadeVault.unlockAchievement('wordle_genius');
      }

      // 4. Hard Mode win
      if (this.engine.hardMode) {
        window.arcadeVault.unlockAchievement('wordle_hard_mode');
      }

      // 5. Clutch win (6th attempt)
      if (attempts === 6) {
        window.arcadeVault.unlockAchievement('wordle_clutch');
      }

      // Score calculation: (7 - attempts) * 1000 + (hardMode ? 500 : 0)
      const score = (7 - attempts) * 1000 + (this.engine.hardMode ? 500 : 0);
      window.arcadeVault.recordScore('wordle', score);
    }

    // Show toast and gameover modal
    setTimeout(() => {
      this.showToast(praise, 2000);
      this.showGameOverModal(true, praise);
    }, 1200);
  }

  handleGameLost(secretWord) {
    this.audio.playDefeatTone();

    this.stats.played++;
    this.stats.currentStreak = 0;
    this.saveStats();

    const upperWord = (secretWord || '').toUpperCase();
    setTimeout(() => {
      this.showToast(`The word was: ${upperWord}`, 4000);
      this.showGameOverModal(false, upperWord);
    }, 1000);
  }

  showGameOverModal(isWin, message) {
    const titleEl = document.getElementById('gameover-title');
    const subtitleEl = document.getElementById('gameover-subtitle');
    const wordDisplayEl = document.getElementById('gameover-word');

    if (isWin) {
      titleEl.textContent = 'VICTORY!';
      subtitleEl.textContent = `${message} Solved in ${this.engine.guesses.length}/6 attempts.`;
      wordDisplayEl.textContent = this.engine.secretWord.toUpperCase();
    } else {
      titleEl.textContent = 'GAME OVER';
      subtitleEl.textContent = 'Better luck next time!';
      wordDisplayEl.textContent = `Secret word: ${message}`;
    }

    this.renderStatsView('gameover-stats-view');
    this.openModal(this.gameOverModal);
  }

  renderStatsView(containerId = 'stats-view') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const winPercent = this.stats.played > 0
      ? Math.round((this.stats.won / this.stats.played) * 100)
      : 0;

    const maxDist = Math.max(1, ...Object.values(this.stats.distribution));

    let distHtml = '';
    for (let i = 1; i <= 6; i++) {
      const count = this.stats.distribution[i] || 0;
      const pct = Math.max(7, Math.round((count / maxDist) * 100));
      const highlight = (this.engine.status === 'WON' && this.engine.guesses.length === i) ? 'highlight' : '';
      distHtml += `
        <div class="dist-row">
          <span class="dist-num">${i}</span>
          <div class="dist-bar-wrap">
            <div class="dist-bar ${highlight}" style="width: ${pct}%">${count}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-val">${this.stats.played}</div>
          <div class="stat-lbl">Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${winPercent}%</div>
          <div class="stat-lbl">Win %</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this.stats.currentStreak}</div>
          <div class="stat-lbl">Current Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this.stats.maxStreak}</div>
          <div class="stat-lbl">Max Streak</div>
        </div>
      </div>
      <div class="guess-distribution">
        <h3>GUESS DISTRIBUTION</h3>
        ${distHtml}
      </div>
    `;
  }

  shareScorecard() {
    const text = this.engine.generateScorecard();

    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      navigator.share({
        title: 'Wordle - RPDevs Arcade',
        text: text
      }).catch(() => {
        this.copyToClipboard(text);
      });
    } else {
      this.copyToClipboard(text);
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Scorecard copied to clipboard!');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.showToast('Scorecard copied to clipboard!');
    } catch (e) {
      this.showToast('Failed to copy scorecard');
    }
    document.body.removeChild(textarea);
  }

  showToast(message, duration = 1800) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('visible');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, duration);
  }
}

// Auto-initialize robustly whether DOMContentLoaded has already fired or not
function initWordle() {
  if (!window.wordleUI) {
    window.wordleUI = new WordleUI();
    const btnCRT = document.getElementById('btn-crt');
    if (btnCRT) {
      btnCRT.addEventListener('click', () => {
        if (window.retroCRT) window.retroCRT.toggle();
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordle);
} else {
  initWordle();
}
