/**
 * LocalStorage Manager for Lights Out
 * Persists high scores, campaign progression, statistics, and user settings.
 */

const STORAGE_KEY = 'lightsout_data_v1';

export class GameStorage {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return this.getDefaults();
  }

  getDefaults() {
    return {
      highScores: {}, // key: "5x5_medium" -> { moves: 12, time: 25.4, date: "2026-10-03" }
      campaignUnlocked: 1, // Max level unlocked (1-10)
      campaignStars: {}, // level -> 1, 2, or 3 stars
      theme: 'retro', // 'retro' (90s handheld neon) or 'cyber' (clean dark)
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalMoves: 0,
        hintsUsed: 0
      }
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore quota errors
    }
  }

  recordGamePlayed() {
    this.data.stats.gamesPlayed++;
    this.save();
  }

  recordMove() {
    this.data.stats.totalMoves++;
    this.save();
  }

  recordHint() {
    this.data.stats.hintsUsed++;
    this.save();
  }

  recordWin(key, moves, seconds) {
    this.data.stats.gamesWon++;

    if (!this.data.highScores[key]) {
      this.data.highScores[key] = { moves, seconds, date: new Date().toISOString() };
    } else {
      const current = this.data.highScores[key];
      if (moves < current.moves || (moves === current.moves && seconds < current.seconds)) {
        this.data.highScores[key] = { moves, seconds, date: new Date().toISOString() };
      }
    }
    this.save();
    return this.data.highScores[key];
  }

  getHighScore(key) {
    return this.data.highScores[key] || null;
  }

  getCampaignUnlocked() {
    return this.data.campaignUnlocked || 1;
  }

  unlockNextCampaignLevel(currentLevel) {
    if (currentLevel >= this.data.campaignUnlocked && currentLevel < 12) {
      this.data.campaignUnlocked = currentLevel + 1;
      this.save();
    }
  }

  getTheme() {
    return this.data.theme || 'retro';
  }

  setTheme(theme) {
    this.data.theme = theme;
    this.save();
  }

  getStats() {
    return this.data.stats;
  }
}
