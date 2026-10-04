/**
 * RPDevs Arcade Vault & Achievement Engine
 * Zero-dependency cross-game player passport, statistics tracker, and achievement manager.
 */

export const ACHIEVEMENTS = [
  { id: 'arcade_initiate', title: 'Arcade Initiate', icon: '🎟️', desc: 'Play your first game in the RPDevs Retro Arcade.' },
  { id: 'grandmaster', title: 'Grandmaster of the Arcade', icon: '👑', desc: 'Play at least once across all 8 classic arcade games.' },
  { id: 'lightsout_apprentice', title: 'Illuminator', icon: '💡', desc: 'Solve your first Lights Out puzzle.' },
  { id: 'lightsout_expert', title: 'Master of GF(2)', icon: '⚡', desc: 'Solve a 5×5 or larger Lights Out puzzle.' },
  { id: 'snake_charmer', title: 'Snake Charmer', icon: '🐍', desc: 'Reach a score of at least 10 in Retro Snake.' },
  { id: 'snake_legend', title: 'Nokia Legend', icon: '🏆', desc: 'Reach a score of 25+ in Retro Snake.' },
  { id: 'simon_adept', title: 'Harmonic Memory', icon: '🔴', desc: 'Complete 8 consecutive sequence steps in Simon.' },
  { id: 'simon_genius', title: 'Perfect Pitch', icon: '🎶', desc: 'Complete 15 sequence steps in Simon Strict Mode.' },
  { id: 'mine_sweeper', title: 'Mine Sweeper', icon: '💣', desc: 'Clear a Beginner Minesweeper board safely.' },
  { id: 'bomb_squad', title: 'Bomb Squad Elite', icon: '🚩', desc: 'Clear an Intermediate or Expert Minesweeper board.' },
  { id: 'tile_combiner', title: 'Powers of Two', icon: '🔢', desc: 'Synthesize a 1024 or 2048 tile in 2048.' },
  { id: 'box_capturer', title: 'Combinatorial Strategist', icon: '📦', desc: 'Win a game of Dots & Boxes against CPU.' },
  { id: 'warehouse_manager', title: 'Warehouse Foreman', icon: '👷', desc: 'Solve a Sokoban box-pushing puzzle.' },
  { id: 'connect_champion', title: 'Vertical Tactician', icon: '🟡', desc: 'Beat the Connect Four AI opponent.' }
];

export class ArcadeVault {
  constructor() {
    this.storageKey = 'rpdevs_arcade_vault';
    this.state = this.loadState();
    this.injectStyles();
    this.checkArcadeWideAchievements();
  }

  loadState() {
    const defaults = {
      version: 1,
      createdAt: new Date().toISOString(),
      gamesPlayed: {
        lightsout: 0,
        snake: 0,
        simon: 0,
        minesweeper: 0,
        game2048: 0,
        dotsandboxes: 0,
        sokoban: 0,
        connectfour: 0
      },
      gamesWon: {
        lightsout: 0,
        snake: 0,
        simon: 0,
        minesweeper: 0,
        game2048: 0,
        dotsandboxes: 0,
        sokoban: 0,
        connectfour: 0
      },
      highScores: {},
      unlockedAchievements: {}
    };

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        gamesPlayed: { ...defaults.gamesPlayed, ...(parsed.gamesPlayed || {}) },
        gamesWon: { ...defaults.gamesWon, ...(parsed.gamesWon || {}) },
        unlockedAchievements: { ...defaults.unlockedAchievements, ...(parsed.unlockedAchievements || {}) },
        highScores: { ...defaults.highScores, ...(parsed.highScores || {}) }
      };
    } catch {
      return defaults;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Unable to persist ArcadeVault state:', e);
    }
  }

  recordPlay(gameId) {
    if (!this.state.gamesPlayed[gameId]) {
      this.state.gamesPlayed[gameId] = 0;
    }
    this.state.gamesPlayed[gameId]++;
    this.unlock('arcade_initiate');
    this.checkArcadeWideAchievements();
    this.saveState();
  }

  recordWin(gameId, scoreOrMeta = null) {
    if (!this.state.gamesWon[gameId]) {
      this.state.gamesWon[gameId] = 0;
    }
    this.state.gamesWon[gameId]++;

    if (scoreOrMeta !== null) {
      if (typeof scoreOrMeta === 'number') {
        const prev = this.state.highScores[gameId] || 0;
        if (scoreOrMeta > prev) {
          this.state.highScores[gameId] = scoreOrMeta;
        }
      }
    }

    // Specific achievement unlocks
    if (gameId === 'lightsout') {
      this.unlock('lightsout_apprentice');
      if (scoreOrMeta && scoreOrMeta.size && parseInt(scoreOrMeta.size) >= 5) {
        this.unlock('lightsout_expert');
      }
    } else if (gameId === 'minesweeper') {
      this.unlock('mine_sweeper');
      if (scoreOrMeta && (scoreOrMeta.difficulty === 'intermediate' || scoreOrMeta.difficulty === 'expert')) {
        this.unlock('bomb_squad');
      }
    } else if (gameId === 'dotsandboxes') {
      this.unlock('box_capturer');
    } else if (gameId === 'sokoban') {
      this.unlock('warehouse_manager');
    } else if (gameId === 'connectfour') {
      this.unlock('connect_champion');
    }

    this.checkArcadeWideAchievements();
    this.saveState();
  }

  recordScore(gameId, score) {
    const prev = this.state.highScores[gameId] || 0;
    if (score > prev) {
      this.state.highScores[gameId] = score;
    }

    if (gameId === 'snake') {
      if (score >= 10) this.unlock('snake_charmer');
      if (score >= 25) this.unlock('snake_legend');
    } else if (gameId === 'simon') {
      if (score >= 8) this.unlock('simon_adept');
    } else if (gameId === 'game2048') {
      if (score >= 1024) this.unlock('tile_combiner');
    }

    this.saveState();
  }

  unlock(achId) {
    if (this.state.unlockedAchievements[achId]) return; // already unlocked
    const ach = ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return;

    this.state.unlockedAchievements[achId] = new Date().toISOString();
    this.saveState();
    this.showAchievementToast(ach);
  }

  checkArcadeWideAchievements() {
    const required = ['lightsout', 'snake', 'simon', 'minesweeper', 'game2048', 'dotsandboxes', 'sokoban', 'connectfour'];
    const allPlayed = required.every(id => (this.state.gamesPlayed[id] || 0) > 0);
    if (allPlayed) {
      this.unlock('grandmaster');
    }
  }

  showAchievementToast(ach) {
    const toast = document.createElement('div');
    toast.className = 'arcade-achievement-toast';
    toast.innerHTML = `
      <div class="ach-icon">${ach.icon}</div>
      <div class="ach-content">
        <div class="ach-header">★ ACHIEVEMENT UNLOCKED! ★</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  getTotalGamesPlayed() {
    return Object.values(this.state.gamesPlayed).reduce((a, b) => a + b, 0);
  }

  getTotalWins() {
    return Object.values(this.state.gamesWon).reduce((a, b) => a + b, 0);
  }

  getUnlockedCount() {
    return Object.keys(this.state.unlockedAchievements).length;
  }

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        this.state = parsed;
        this.saveState();
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  renderModal() {
    const existing = document.getElementById('arcade-vault-modal');
    if (existing) existing.remove();

    const unlockedCount = this.getUnlockedCount();
    const totalCount = ACHIEVEMENTS.length;
    const progressPct = Math.round((unlockedCount / totalCount) * 100);

    const modal = document.createElement('div');
    modal.id = 'arcade-vault-modal';
    modal.className = 'arcade-vault-backdrop';
    modal.innerHTML = `
      <div class="arcade-vault-dialog" role="dialog" aria-modal="true" aria-label="Arcade Passport & Achievements">
        <div class="vault-header">
          <div class="vault-title-wrap">
            <span class="vault-icon">🏆</span>
            <div>
              <h2 class="vault-title">RPDevs Player Passport</h2>
              <div class="vault-subtitle">Cross-Game Career Vault & Achievements</div>
            </div>
          </div>
          <button id="btn-vault-close" class="vault-close-btn" aria-label="Close">✕</button>
        </div>

        <div class="vault-stats-grid">
          <div class="vault-stat-card">
            <span class="vstat-num">${this.getTotalGamesPlayed()}</span>
            <span class="vstat-label">Total Plays</span>
          </div>
          <div class="vault-stat-card">
            <span class="vstat-num">${this.getTotalWins()}</span>
            <span class="vstat-label">Total Victories</span>
          </div>
          <div class="vault-stat-card">
            <span class="vstat-num">${unlockedCount} / ${totalCount}</span>
            <span class="vstat-label">Badges (${progressPct}%)</span>
          </div>
        </div>

        <div class="vault-progress-bar-wrap">
          <div class="vault-progress-fill" style="width: ${progressPct}%"></div>
        </div>

        <h3 class="vault-section-title">Career Achievements</h3>
        <div class="vault-ach-list">
          ${ACHIEVEMENTS.map(ach => {
            const isUnlocked = !!this.state.unlockedAchievements[ach.id];
            const unlockedDate = isUnlocked ? new Date(this.state.unlockedAchievements[ach.id]).toLocaleDateString() : null;
            return `
              <div class="vault-ach-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="vach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="vach-info">
                  <div class="vach-name">${ach.title} ${isUnlocked ? '✓' : ''}</div>
                  <div class="vach-desc">${ach.desc}</div>
                  ${unlockedDate ? `<div class="vach-date">Unlocked ${unlockedDate}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="vault-footer-actions">
          <button id="btn-export-vault" class="vault-btn">📥 Backup Passport</button>
          <label class="vault-btn">
            📤 Restore
            <input type="file" id="input-import-vault" accept=".json" style="display: none;">
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-vault-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document.getElementById('btn-export-vault').onclick = () => {
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(this.exportJSON());
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `rpdevs_arcade_passport_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    };

    document.getElementById('input-import-vault').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (this.importJSON(event.target.result)) {
          alert('Player Passport restored successfully!');
          modal.remove();
          this.renderModal();
        } else {
          alert('Invalid passport JSON backup file.');
        }
      };
      reader.readAsText(file);
    };
  }

  injectStyles() {
    if (document.getElementById('arcade-vault-styles')) return;
    const style = document.createElement('style');
    style.id = 'arcade-vault-styles';
    style.textContent = `
      .arcade-achievement-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #141b26;
        border: 2px solid #e3a018;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(227, 160, 24, 0.4);
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        color: #fff;
        z-index: 99999;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
        max-width: 360px;
        pointer-events: none;
      }
      .arcade-achievement-toast.visible {
        transform: translateY(0);
        opacity: 1;
      }
      .ach-icon { font-size: 2.2rem; }
      .ach-header { font-size: 0.65rem; font-weight: 800; color: #e3a018; letter-spacing: 1px; font-family: monospace; }
      .ach-title { font-size: 0.95rem; font-weight: 800; margin: 2px 0; color: #fff; }
      .ach-desc { font-size: 0.75rem; color: #8b949e; line-height: 1.2; }

      .arcade-vault-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 100000;
        animation: fadeIn 0.2s ease;
      }
      .arcade-vault-dialog {
        background: #0f141d;
        border: 2px solid #2d3748;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 14px;
        color: #f0f6fc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .vault-header { display: flex; justify-content: space-between; align-items: center; }
      .vault-title-wrap { display: flex; align-items: center; gap: 10px; }
      .vault-icon { font-size: 1.8rem; }
      .vault-title { font-size: 1.2rem; font-weight: 800; margin: 0; color: #fff; }
      .vault-subtitle { font-size: 0.72rem; color: #8b949e; }
      .vault-close-btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; }
      .vault-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .vault-stat-card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 8px; text-align: center; display: flex; flex-direction: column; }
      .vstat-num { font-size: 1.2rem; font-weight: 800; color: #e3a018; font-family: monospace; }
      .vstat-label { font-size: 0.65rem; color: #8b949e; text-transform: uppercase; margin-top: 2px; }
      .vault-progress-bar-wrap { height: 8px; background: #21262d; border-radius: 4px; overflow: hidden; }
      .vault-progress-fill { height: 100%; background: linear-gradient(90deg, #e3a018, #00f0ff); transition: width 0.4s ease; }
      .vault-section-title { font-size: 0.85rem; font-weight: 700; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0 0; }
      .vault-ach-list { overflow-y: auto; display: flex; flex-direction: column; gap: 8px; max-height: 45vh; padding-right: 4px; }
      .vault-ach-item { display: flex; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #161b22; border: 1px solid #21262d; align-items: center; }
      .vault-ach-item.unlocked { border-color: rgba(227, 160, 24, 0.4); background: rgba(227, 160, 24, 0.05); }
      .vault-ach-item.locked { opacity: 0.55; }
      .vach-icon { font-size: 1.5rem; min-width: 32px; text-align: center; }
      .vach-info { flex: 1; }
      .vach-name { font-size: 0.85rem; font-weight: 700; color: #fff; }
      .vach-desc { font-size: 0.72rem; color: #8b949e; margin-top: 2px; }
      .vach-date { font-size: 0.62rem; color: #e3a018; margin-top: 2px; font-family: monospace; }
      .vault-footer-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
      .vault-btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .vault-btn:hover { background: #30363d; color: #fff; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }
}

// Global Singleton
export const arcadeVault = new ArcadeVault();
