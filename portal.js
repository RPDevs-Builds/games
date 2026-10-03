/**
 * RPDevs Master Arcade Portal Controller
 */

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
  }
];


class ArcadePortal {
  constructor() {
    this.gridEl = document.getElementById('games-grid');
    this.searchInput = document.getElementById('search-input');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.activeFilter = 'all';

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.searchInput.addEventListener('input', (e) => {
      this.render(e.target.value.toLowerCase());
    });

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.render(this.searchInput.value.toLowerCase());
      });
    });
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
          <span class="year-badge">${game.year}</span>
        </div>
        <div class="card-body">
          <h2 class="game-title">${game.title}</h2>
          <p class="game-desc">${game.desc}</p>
          <div class="card-tags">
            ${game.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="card-footer">
          <a href="${game.rulesUrl}" class="rules-link" title="Read Rules">📖 Rules</a>
          <a href="${game.url}" class="launch-btn">PLAY NOW 🎮</a>
        </div>
      `;
      this.gridEl.appendChild(card);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ArcadePortal();
});
