/**
 * Maze Chaser (1980) Pure Core Game Engine
 * Grid maze representation, authentic 4-ghost AI targeting,
 * scatter/chase wave scheduling, energizer fright mode, and fruit bonuses.
 */

export const COLS = 19;
export const ROWS = 22;

// Maze layout:
// # = Wall, . = Pellet, * = Energizer, _ = Empty/Walkable, G = Ghost House, - = Ghost Gate
export const MAZE_MAP = [
  "###################",
  "#*.......#.......*#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###_#_###.####",
  "___#.#_______#.#___",
  "####.#_##-##_#.####",
  "____.__#GGGG#__.____", // Row 9: Tunnel at cols 0-3 and 15-18
  "####.#_#####_#.####",
  "___#.#_______#.#___",
  "####.#_#####_#.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#*..#.........#..*#",
  "###.#.#.#####.#.###",
  "#.....#...#...#.....#",
  "#.#######.#.#######.#",
  "#...................#",
  "###################",
  "                   " // Status row padding
];

export const DIRS = {
  UP:    { x: 0, y: -1, name: 'UP' },
  DOWN:  { x: 0, y: 1,  name: 'DOWN' },
  LEFT:  { x: -1, y: 0, name: 'LEFT' },
  RIGHT: { x: 1, y: 0,  name: 'RIGHT' }
};

export const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

export class MazeEngine {
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.isPaused = false;

    this.grid = [];
    this.totalPellets = 0;
    this.pelletsRemaining = 0;

    this.player = {
      x: 9,
      y: 15,
      subX: 9,
      subY: 15,
      dir: DIRS.LEFT,
      nextDir: DIRS.LEFT,
      speed: 4.2
    };

    // 4 Ghosts with authentic personalities
    this.ghosts = {
      blinky: {
        id: 'blinky',
        color: '#ff0000',
        name: 'Blinky',
        x: 9, y: 7, subX: 9, subY: 7,
        dir: DIRS.LEFT,
        scatterCorner: { x: 17, y: 0 },
        mode: 'scatter', // 'chase', 'scatter', 'frightened', 'eaten'
        inHouse: false
      },
      pinky: {
        id: 'pinky',
        color: '#ffb8ff',
        name: 'Pinky',
        x: 9, y: 9, subX: 9, subY: 9,
        dir: DIRS.UP,
        scatterCorner: { x: 1, y: 0 },
        mode: 'scatter',
        inHouse: true
      },
      inky: {
        id: 'inky',
        color: '#00ffff',
        name: 'Inky',
        x: 8, y: 9, subX: 8, subY: 9,
        dir: DIRS.UP,
        scatterCorner: { x: 17, y: 20 },
        mode: 'scatter',
        inHouse: true
      },
      clyde: {
        id: 'clyde',
        color: '#ffb852',
        name: 'Clyde',
        x: 10, y: 9, subX: 10, subY: 9,
        dir: DIRS.UP,
        scatterCorner: { x: 1, y: 20 },
        mode: 'scatter',
        inHouse: true
      }
    };

    this.frightenedTimer = 0;
    this.ghostsEatenInFright = 0;
    this.waveTimer = 0;
    this.waveState = 'scatter'; // 'scatter' or 'chase'
    this.fruit = null; // { x, y, active, timer }

    this.initMaze();
  }

  initMaze() {
    this.grid = [];
    this.totalPellets = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      const line = MAZE_MAP[r] || "";
      for (let c = 0; c < COLS; c++) {
        const char = line[c] || ' ';
        row.push(char);
        if (char === '.' || char === '*') {
          this.totalPellets++;
        }
      }
      this.grid.push(row);
    }
    this.pelletsRemaining = this.totalPellets;
  }

  resetPositions() {
    this.player.x = 9;
    this.player.y = 15;
    this.player.subX = 9;
    this.player.subY = 15;
    this.player.dir = DIRS.LEFT;
    this.player.nextDir = DIRS.LEFT;

    this.ghosts.blinky.x = 9;
    this.ghosts.blinky.y = 7;
    this.ghosts.blinky.subX = 9;
    this.ghosts.blinky.subY = 7;
    this.ghosts.blinky.dir = DIRS.LEFT;
    this.ghosts.blinky.mode = this.waveState;
    this.ghosts.blinky.inHouse = false;

    this.ghosts.pinky.x = 9;
    this.ghosts.pinky.y = 9;
    this.ghosts.pinky.subX = 9;
    this.ghosts.pinky.subY = 9;
    this.ghosts.pinky.dir = DIRS.UP;
    this.ghosts.pinky.mode = this.waveState;
    this.ghosts.pinky.inHouse = true;

    this.ghosts.inky.x = 8;
    this.ghosts.inky.y = 9;
    this.ghosts.inky.subX = 8;
    this.ghosts.inky.subY = 9;
    this.ghosts.inky.dir = DIRS.UP;
    this.ghosts.inky.mode = this.waveState;
    this.ghosts.inky.inHouse = true;

    this.ghosts.clyde.x = 10;
    this.ghosts.clyde.y = 9;
    this.ghosts.clyde.subX = 10;
    this.ghosts.clyde.subY = 9;
    this.ghosts.clyde.dir = DIRS.UP;
    this.ghosts.clyde.mode = this.waveState;
    this.ghosts.clyde.inHouse = true;
  }

  setPlayerDirection(dirKey) {
    if (DIRS[dirKey]) {
      this.player.nextDir = DIRS[dirKey];
    }
  }

  isWall(col, row) {
    if (row < 0 || row >= ROWS) return true;
    // Tunnel wraps horizontally
    if (col < 0 || col >= COLS) return false;
    const tile = this.grid[row][col];
    return tile === '#' || tile === 'G' || tile === '-';
  }

  isGhostWalkable(col, row, isEaten = false) {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) return true; // tunnel
    const tile = this.grid[row][col];
    if (tile === '#') return false;
    if (tile === '-' || tile === 'G') return isEaten;
    return true;
  }

  update(dt) {
    if (this.gameOver || this.gameWon || this.isPaused) return {};

    const events = {
      pelletEaten: false,
      energizerEaten: false,
      ghostEaten: null,
      playerDied: false,
      fruitEaten: false,
      gameWon: false
    };

    // Update Wave Timers (Scatter vs Chase)
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        this.ghostsEatenInFright = 0;
        for (const g of Object.values(this.ghosts)) {
          if (g.mode === 'frightened') {
            g.mode = this.waveState;
          }
        }
      }
    } else {
      this.waveTimer += dt;
      // 7s Scatter, then 20s Chase
      if (this.waveState === 'scatter' && this.waveTimer > 7.0) {
        this.waveState = 'chase';
        this.waveTimer = 0;
        for (const g of Object.values(this.ghosts)) {
          if (g.mode === 'scatter') g.mode = 'chase';
        }
      } else if (this.waveState === 'chase' && this.waveTimer > 20.0) {
        this.waveState = 'scatter';
        this.waveTimer = 0;
        for (const g of Object.values(this.ghosts)) {
          if (g.mode === 'chase') g.mode = 'scatter';
        }
      }
    }

    // Move Player
    this.updatePlayer(dt, events);

    // Release Ghosts from House
    this.updateGhostHouse(dt);

    // Move Ghosts
    this.updateGhosts(dt, events);

    // Check Collisions between Player and Ghosts
    this.checkCollisions(events);

    // Fruit spawn / decay
    if (this.fruit && this.fruit.active) {
      this.fruit.timer -= dt;
      if (this.fruit.timer <= 0) this.fruit.active = false;
      else if (Math.round(this.player.subX) === this.fruit.x && Math.round(this.player.subY) === this.fruit.y) {
        this.score += 200 * this.level;
        this.fruit.active = false;
        events.fruitEaten = true;
      }
    }

    return events;
  }

  updatePlayer(dt, events) {
    const p = this.player;

    // Check if nextDir can be applied (at integer intersection or reversing)
    if (p.nextDir) {
      const isReverse = (p.nextDir.x === -p.dir.x && p.nextDir.y === -p.dir.y);
      const isAligned = Math.abs(p.subX - Math.round(p.subX)) < 0.15 && Math.abs(p.subY - Math.round(p.subY)) < 0.15;

      if (isReverse || isAligned) {
        const checkX = Math.round(p.subX) + p.nextDir.x;
        const checkY = Math.round(p.subY) + p.nextDir.y;
        if (!this.isWall(checkX, checkY)) {
          p.dir = p.nextDir;
          p.subX = Math.round(p.subX);
          p.subY = Math.round(p.subY);
        }
      }
    }

    // Move along current direction
    const nextSubX = p.subX + p.dir.x * p.speed * dt;
    const nextSubY = p.subY + p.dir.y * p.speed * dt;

    // Tunnel wrap-around check
    if (nextSubX < -0.5) {
      p.subX = COLS - 0.5;
    } else if (nextSubX > COLS - 0.5) {
      p.subX = -0.5;
    } else {
      const targetCol = Math.round(nextSubX + p.dir.x * 0.45);
      const targetRow = Math.round(nextSubY + p.dir.y * 0.45);

      if (!this.isWall(targetCol, targetRow)) {
        p.subX = nextSubX;
        p.subY = nextSubY;
      } else {
        p.subX = Math.round(p.subX);
        p.subY = Math.round(p.subY);
      }
    }

    p.x = Math.round(p.subX);
    p.y = Math.round(p.subY);

    // Consume Pellets & Energizers
    if (p.y >= 0 && p.y < ROWS && p.x >= 0 && p.x < COLS) {
      const tile = this.grid[p.y][p.x];
      if (tile === '.') {
        this.grid[p.y][p.x] = ' ';
        this.score += 10;
        this.pelletsRemaining--;
        events.pelletEaten = true;
      } else if (tile === '*') {
        this.grid[p.y][p.x] = ' ';
        this.score += 50;
        this.pelletsRemaining--;
        this.frightenedTimer = 7.0; // 7 seconds frightened
        this.ghostsEatenInFright = 0;
        for (const g of Object.values(this.ghosts)) {
          if (g.mode !== 'eaten') {
            g.mode = 'frightened';
          }
        }
        events.energizerEaten = true;
      }

      // Check Fruit Spawn threshold (at 70 pellets cleared)
      if (this.totalPellets - this.pelletsRemaining === 70 && !this.fruit) {
        this.fruit = { x: 9, y: 11, active: true, timer: 10.0 };
      }

      // Check Victory
      if (this.pelletsRemaining <= 0) {
        this.gameWon = true;
        events.gameWon = true;
      }
    }
  }

  updateGhostHouse(dt) {
    // Progressively release Pinky, Inky, Clyde
    const eaten = this.totalPellets - this.pelletsRemaining;
    if (this.ghosts.pinky.inHouse && eaten >= 5) {
      this.ghosts.pinky.y = 7;
      this.ghosts.pinky.subY = 7;
      this.ghosts.pinky.inHouse = false;
    }
    if (this.ghosts.inky.inHouse && eaten >= 30) {
      this.ghosts.inky.y = 7;
      this.ghosts.inky.subY = 7;
      this.ghosts.inky.inHouse = false;
    }
    if (this.ghosts.clyde.inHouse && eaten >= 60) {
      this.ghosts.clyde.y = 7;
      this.ghosts.clyde.subY = 7;
      this.ghosts.clyde.inHouse = false;
    }
  }

  getGhostTarget(g) {
    if (g.mode === 'eaten') {
      return { x: 9, y: 7 }; // Return to house door
    }
    if (g.mode === 'scatter') {
      return g.scatterCorner;
    }
    if (g.mode === 'frightened') {
      return null; // Random wandering
    }

    // CHASE MODE PERSONALITIES
    const p = this.player;
    switch (g.id) {
      case 'blinky':
        // Direct target: player tile
        return { x: p.x, y: p.y };

      case 'pinky':
        // Ambush target: 4 tiles ahead of player
        return {
          x: p.x + p.dir.x * 4,
          y: p.y + p.dir.y * 4
        };

      case 'inky': {
        // Flank target: vector from Blinky to (player + 2 tiles) doubled
        const p2X = p.x + p.dir.x * 2;
        const p2Y = p.y + p.dir.y * 2;
        const b = this.ghosts.blinky;
        return {
          x: p2X + (p2X - b.x),
          y: p2Y + (p2Y - b.y)
        };
      }

      case 'clyde': {
        // Coward target: chase if >8 tiles away, else scatter corner
        const dist = Math.hypot(g.x - p.x, g.y - p.y);
        if (dist > 8) {
          return { x: p.x, y: p.y };
        }
        return g.scatterCorner;
      }
      default:
        return { x: p.x, y: p.y };
    }
  }

  updateGhosts(dt, events) {
    for (const g of Object.values(this.ghosts)) {
      if (g.inHouse) continue;

      let speed = 3.6;
      if (g.mode === 'frightened') speed = 2.4;
      if (g.mode === 'eaten') speed = 6.0;

      // Check if at tile center
      const isAligned = Math.abs(g.subX - Math.round(g.subX)) < 0.1 && Math.abs(g.subY - Math.round(g.subY)) < 0.1;

      if (isAligned) {
        g.subX = Math.round(g.subX);
        g.subY = Math.round(g.subY);
        g.x = g.subX;
        g.y = g.subY;

        // If eaten and reached house door, respawn
        if (g.mode === 'eaten' && g.x === 9 && g.y === 7) {
          g.mode = this.waveState;
        }

        const target = this.getGhostTarget(g);
        const possibleDirs = [];

        for (const [key, d] of Object.entries(DIRS)) {
          // Cannot reverse direction directly
          if (key === OPPOSITE[g.dir.name]) continue;

          const nx = g.x + d.x;
          const ny = g.y + d.y;
          if (this.isGhostWalkable(nx, ny, g.mode === 'eaten')) {
            possibleDirs.push(d);
          }
        }

        if (possibleDirs.length > 0) {
          if (target === null) {
            // Random direction in frightened mode
            g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
          } else {
            // Find direction that minimizes distance to target
            possibleDirs.sort((d1, d2) => {
              const dist1 = Math.hypot(g.x + d1.x - target.x, g.y + d1.y - target.y);
              const dist2 = Math.hypot(g.x + d2.x - target.x, g.y + d2.y - target.y);
              return dist1 - dist2;
            });
            g.dir = possibleDirs[0];
          }
        }
      }

      // Move ghost
      g.subX += g.dir.x * speed * dt;
      g.subY += g.dir.y * speed * dt;

      // Tunnel wrap
      if (g.subX < -0.5) g.subX = COLS - 0.5;
      else if (g.subX > COLS - 0.5) g.subX = -0.5;

      g.x = Math.round(g.subX);
      g.y = Math.round(g.subY);
    }
  }

  checkCollisions(events) {
    const p = this.player;
    for (const g of Object.values(this.ghosts)) {
      const dist = Math.hypot(p.subX - g.subX, p.subY - g.subY);
      if (dist < 0.65) {
        if (g.mode === 'frightened') {
          // Player eats ghost!
          g.mode = 'eaten';
          this.ghostsEatenInFright++;
          const pts = 200 * Math.pow(2, this.ghostsEatenInFright - 1);
          this.score += pts;
          events.ghostEaten = { id: g.id, pts: pts, count: this.ghostsEatenInFright };
        } else if (g.mode !== 'eaten') {
          // Ghost catches player!
          this.lives--;
          events.playerDied = true;
          if (this.lives <= 0) {
            this.gameOver = true;
          } else {
            this.resetPositions();
          }
          break;
        }
      }
    }
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.isPaused = false;
    this.frightenedTimer = 0;
    this.ghostsEatenInFright = 0;
    this.waveTimer = 0;
    this.waveState = 'scatter';
    this.fruit = null;
    this.initMaze();
    this.resetPositions();
  }
}
