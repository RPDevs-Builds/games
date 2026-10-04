/**
 * RPDevs Master Arcade Portal Controller
 */

import { arcadeVault } from './arcade_vault.js';
import { retroCRT } from './crt.js';

const GAMES_DATA = [
  {
    id: 'lightsout',
    title: 'Lights Out',
    year: '1995',
    icon: '💡',
    category: 'logic',
    desc: 'The iconic Tiger Electronics handheld logic puzzle with built-in GF(2) Gaussian elimination solver, daily seed challenges, and retro audio.',
    tags: ['GF(2) Solver', 'PWA Offline', 'Terminal CLI', 'Handheld'],
    url: './lightsout/index.html',
    rulesUrl: './lightsout/RULES.md'
  },
  {
    id: 'snake',
    title: 'Retro Snake',
    year: '1997',
    icon: '🐍',
    category: 'retro',
    desc: 'Classic Nokia 3310 green LCD monochrome snake. Reflexes, speed progression, piezoelectric sound synthesis, and touch D-pad.',
    tags: ['Nokia 3310', 'Reflexes', 'PWA Offline', 'Terminal CLI'],
    url: './snake/index.html',
    rulesUrl: './snake/RULES.md'
  },
  {
    id: 'simon',
    title: 'Simon',
    year: '1978',
    icon: '🔴🟢',
    category: 'handheld',
    desc: 'Authentic 1978 Milton Bradley handheld electronic memory game with exact historical harmonic pitches (209Hz to 415Hz) and strict mode.',
    tags: ['1978 Classic', 'Acoustic Synthesis', 'Memory', 'PWA Offline'],
    url: './simon/index.html',
    rulesUrl: './simon/RULES.md'
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    year: '1992',
    icon: '💣',
    category: 'logic',
    desc: 'Windows 95/98 classic with authentic grey bevels, digital LED timer, smiley face button, and guaranteed first-click safety.',
    tags: ['Windows 95', 'Deductive Logic', 'PWA Offline', 'Terminal CLI'],
    url: './minesweeper/index.html',
    rulesUrl: './minesweeper/RULES.md'
  },
  {
    id: '2048',
    title: '2048',
    year: '2014',
    icon: '🔢',
    category: 'logic',
    desc: 'Mathematical sliding number puzzle with smooth touch gestures, merge harmonics, undo support, and endless mode.',
    tags: ['Math Puzzle', 'Touch Gestures', 'PWA Offline', 'Terminal CLI'],
    url: './2048/index.html',
    rulesUrl: './2048/RULES.md'
  },
  {
    id: 'dotsandboxes',
    title: 'Dots and Boxes',
    year: '1889',
    icon: '📦',
    category: 'logic',
    desc: 'Édouard Lucas 1889 mathematical strategy game with 3-tier AI (chain capture & double-cross), blueprint styling, and 2-player pass-and-play.',
    tags: ['Lucas 1889', 'Combinatorial Math', 'AI Opponent', 'PWA Offline', 'Terminal CLI'],
    url: './dotsandboxes/index.html',
    rulesUrl: './dotsandboxes/RULES.md'
  },
  {
    id: 'sokoban',
    title: 'Sokoban',
    year: '1982',
    icon: '📦',
    category: 'logic',
    desc: 'Discrete warehouse keeper classic with 60 levels, deadlock detection assistant, tap-to-move pathfinding, and industrial synth audio.',
    tags: ['Thinking Rabbit 1982', 'Deadlock Detection', 'PWA Offline', 'Terminal CLI'],
    url: './sokoban/index.html',
    rulesUrl: './sokoban/RULES.md'
  },
  {
    id: 'connectfour',
    title: 'Connect Four',
    year: '1974',
    icon: '🔴🟡',
    category: 'retro',
    desc: 'Iconic 1974 Milton Bradley vertical drop strategy game featuring Minimax AI with Alpha-Beta pruning, 2-player pass-and-play, and tactile plastic audio.',
    tags: ['Milton Bradley 1974', 'Minimax Alpha-Beta', 'Tactile Audio', 'PWA Offline', 'Terminal CLI'],
    url: './connectfour/index.html',
    rulesUrl: './connectfour/RULES.md'
  },
  {
    id: 'breakout',
    title: 'Breakout',
    year: '1976',
    icon: '🧱',
    category: 'retro',
    desc: 'Iconic 1976 Atari paddle arcade classic with 2D angular deflection, destructible colored brick layers, acoustic synthesis, and touch drag controls.',
    tags: ['Atari 1976', 'Paddle Physics', 'Retro Audio', 'PWA Offline', 'Terminal CLI'],
    url: './breakout/index.html',
    rulesUrl: './breakout/RULES.md'
  },
  {
    id: 'pong',
    title: 'Pong',
    year: '1972',
    icon: '🏓',
    category: 'retro',
    desc: 'The original 1972 Atari paddle tennis arcade classic. 2D deflection physics, 1P vs predictive AI, 2-player local mode, and authentic square-wave audio.',
    tags: ['Atari 1972', 'Paddle Physics', 'Local 2P', 'PWA Offline', 'Terminal CLI'],
    url: './pong/index.html',
    rulesUrl: './pong/RULES.md'
  },
  {
    id: 'fallingblocks',
    title: 'Falling Blocks',
    year: '1984',
    icon: '🧱',
    category: 'retro',
    desc: 'The iconic 1984 tetromino stacker. Features 7-bag RNG, SRS wall kicks, ghost piece projection, hold queue, next piece preview, and 8-bit chiptune audio.',
    tags: ['Classic 1984', '7-Bag RNG', 'SRS Kicks', '8-Bit Audio', 'PWA Offline', 'Terminal CLI'],
    url: './fallingblocks/index.html',
    rulesUrl: './fallingblocks/RULES.md'
  },
  {
    id: 'mazechaser',
    title: 'Maze Chaser',
    year: '1980',
    icon: '🍒',
    category: 'retro',
    desc: 'The legendary 1980 arcade maze classic. Outsmart Blinky, Pinky, Inky, and Clyde with authentic algorithmic AI targeting, energizers, and fruit bonuses.',
    tags: ['Namco 1980', '4 Ghost AI', 'Scatter/Chase', 'Chiptune Audio', 'PWA Offline', 'Terminal CLI'],
    url: './mazechaser/index.html',
    rulesUrl: './mazechaser/RULES.md'
  }
];


class ArcadePortal {
  constructor() {
    this.gridEl = document.getElementById('games-grid');
    this.searchInput = document.getElementById('search-input');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.activeFilter = 'all';

    this.bindEvents();
    this.bindArcadeControls();
    this.initAttractMode();
    this.render();
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.render(e.target.value.toLowerCase());
      });
    }

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.render(this.searchInput ? this.searchInput.value.toLowerCase() : '');
      });
    });
  }

  bindArcadeControls() {
    const btnVault = document.getElementById('btn-vault');
    if (btnVault) {
      btnVault.onclick = () => {
        arcadeVault.showModal();
      };
    }

    const btnCRT = document.getElementById('btn-crt');
    if (btnCRT) {
      btnCRT.onclick = () => {
        const isCRT = retroCRT.toggle();
        btnCRT.classList.toggle('active', isCRT);
      };
      if (retroCRT.enabled) {
        btnCRT.classList.add('active');
      }
    }
  }

  render(searchTerm = '') {
    this.gridEl.innerHTML = '';

    const filtered = GAMES_DATA.filter(game => {
      const matchesFilter = this.activeFilter === 'all' || game.category === this.activeFilter;
      const matchesSearch = game.title.toLowerCase().includes(searchTerm) ||
                            game.desc.toLowerCase().includes(searchTerm) ||
                            game.tags.some(t => t.toLowerCase().includes(searchTerm));
      return matchesFilter && matchesSearch;
    });

    filtered.forEach(game => {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="card-header">
          <span class="card-icon">${game.icon}</span>
          <div class="card-meta">
            <a href="${game.rulesUrl}" class="mobile-rules-btn" title="Rules">📖</a>
            <span class="year-badge">${game.year}</span>
          </div>
        </div>
        <div class="card-body">
          <h2 class="game-title">${game.title}</h2>
          <p class="game-desc">${game.desc}</p>
          <div class="card-tags">
            ${game.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="card-footer">
          <a href="${game.rulesUrl}" class="rules-link desktop-only" title="Read Rules">📖 Rules</a>
          <a href="${game.url}" class="launch-btn">PLAY NOW 🎮</a>
        </div>
      `;
      this.gridEl.appendChild(card);
    });
  }

  initAttractMode() {
    this.idleTimer = null;
    this.attractActive = false;
    this.attractEl = null;

    const resetIdle = () => {
      if (this.attractActive) {
        this.exitAttractMode();
      }
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.enterAttractMode(), 45000); // 45 seconds idle
    };

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      window.addEventListener(evt, resetIdle, { passive: true });
    });

    this.idleTimer = setTimeout(() => this.enterAttractMode(), 45000);
  }

  enterAttractMode() {
    if (this.attractActive) return;
    this.attractActive = true;

    this.attractEl = document.createElement('div');
    this.attractEl.id = 'arcade-attract-overlay';
    this.attractEl.className = 'arcade-attract-overlay';
    this.attractEl.innerHTML = `
      <div class="attract-cabinet-frame">
        <div class="attract-marquee">
          <div class="marquee-neon">★ RPDevs RETRO ARCADE ★</div>
          <div class="marquee-subtitle">10 ZERO-DEPENDENCY CLASSIC HITS</div>
        </div>
        <div class="attract-featured">
          <div id="attract-game-icon" class="attract-icon">🏓</div>
          <div id="attract-game-title" class="attract-title">PONG (1972)</div>
          <div id="attract-game-tag" class="attract-tag">THE REVOLUTION THAT STARTED IT ALL</div>
        </div>
        <div class="attract-coin-slot">
          <div class="insert-coin-blink">★ INSERT COIN OR TAP TO PLAY ★</div>
          <div class="attract-credits">FREE PLAY • CREDITS: 99</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.attractEl);

    // Cycle through all games in attract mode every 3 seconds
    let idx = 0;
    this.attractInterval = setInterval(() => {
      if (!this.attractActive) return;
      idx = (idx + 1) % GAMES_DATA.length;
      const g = GAMES_DATA[idx];
      const iconEl = document.getElementById('attract-game-icon');
      const titleEl = document.getElementById('attract-game-title');
      const tagEl = document.getElementById('attract-game-tag');
      if (iconEl && titleEl && tagEl) {
        iconEl.textContent = g.icon;
        titleEl.textContent = `${g.title.toUpperCase()} (${g.year})`;
        tagEl.textContent = g.tags[0] || g.desc;
      }
    }, 3000);

    this.attractEl.onclick = () => this.exitAttractMode();
  }

  exitAttractMode() {
    if (!this.attractActive) return;
    this.attractActive = false;
    clearInterval(this.attractInterval);
    if (this.attractEl) {
      this.attractEl.classList.add('fade-out');
      setTimeout(() => {
        if (this.attractEl) this.attractEl.remove();
        this.attractEl = null;
      }, 300);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ArcadePortal();
});
