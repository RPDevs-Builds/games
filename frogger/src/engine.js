/**
 * Frogger (1981) Core Simulation Engine
 * Recreates authentic Konami 14-row grid simulation: river rapids, floating logs,
 * submerging diving turtles, highway traffic, 5 goal dock bays, and bonus flies.
 */

export const WIDTH = 440;
export const HEIGHT = 560;
export const GRID_SIZE = 40;
export const COLS = 11;
export const ROWS = 14;

export const HOME_BAYS = [
  { col: 1, x: 40, width: 40 },
  { col: 3, x: 120, width: 40 },
  { col: 5, x: 200, width: 40 },
  { col: 7, x: 280, width: 40 },
  { col: 9, x: 360, width: 40 }
];

export class FroggerEngine {
  constructor(options = {}) {
    this.options = options;
    this.onScore = options.onScore || (() => {});
    this.onLives = options.onLives || (() => {});
    this.onLevel = options.onLevel || (() => {});
    this.onTime = options.onTime || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onSound = options.onSound || (() => {});
    this.onAchievement = options.onAchievement || (() => {});

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = 'PLAYING'; // PLAYING, FROG_DYING, ROUND_CLEARED, GAME_OVER
    this.deathTimer = 0;
    this.deathType = null; // 'splat', 'splash', 'timeout'
    this.roundClearTimer = 0;

    this.initHomes();
    this.initLanes();
    this.spawnFrog();

    this.stats = {
      frogsSaved: 0,
      fliesEaten: 0,
      roundsCleared: 0,
      turtlesRidden: 0
    };
  }

  initHomes() {
    this.homes = HOME_BAYS.map((bay, idx) => ({
      id: idx,
      col: bay.col,
      x: bay.x,
      y: 0,
      width: bay.width,
      height: GRID_SIZE,
      filled: false,
      fly: false,
      flyTimer: 0
    }));
    this.flySpawnTimer = 300 + Math.floor(Math.random() * 300);
  }

  initLanes() {
    // 5 River rows (Rows 1 to 5) and 5 Highway rows (Rows 7 to 11)
    const speedMult = 1.0 + (this.level - 1) * 0.15;

    this.lanes = [
      // Row 0: Goal bays (handled separately)
      { row: 0, type: 'homes', objects: [] },

      // Row 1: Fast small logs
      {
        row: 1,
        type: 'log',
        speed: 2.2 * speedMult,
        spacing: 180,
        objects: [
          { x: 30, y: 1 * GRID_SIZE, width: 110, height: 32, type: 'log' },
          { x: 230, y: 1 * GRID_SIZE, width: 110, height: 32, type: 'log' },
          { x: 420, y: 1 * GRID_SIZE, width: 110, height: 32, type: 'log' }
        ]
      },

      // Row 2: Diving turtles (triplets)
      {
        row: 2,
        type: 'turtle',
        speed: -1.8 * speedMult,
        spacing: 170,
        objects: [
          { x: 50, y: 2 * GRID_SIZE, width: 96, height: 30, type: 'turtle', count: 3, diving: true, submergeState: 0, submergeTimer: 0 },
          { x: 220, y: 2 * GRID_SIZE, width: 96, height: 30, type: 'turtle', count: 3, diving: false, submergeState: 0, submergeTimer: 0 },
          { x: 380, y: 2 * GRID_SIZE, width: 96, height: 30, type: 'turtle', count: 3, diving: true, submergeState: 0, submergeTimer: 60 }
        ]
      },

      // Row 3: Giant logs
      {
        row: 3,
        type: 'log',
        speed: 1.4 * speedMult,
        spacing: 260,
        objects: [
          { x: 20, y: 3 * GRID_SIZE, width: 180, height: 32, type: 'log' },
          { x: 260, y: 3 * GRID_SIZE, width: 180, height: 32, type: 'log' }
        ]
      },

      // Row 4: Small logs
      {
        row: 4,
        type: 'log',
        speed: 2.0 * speedMult,
        spacing: 160,
        objects: [
          { x: 40, y: 4 * GRID_SIZE, width: 90, height: 32, type: 'log' },
          { x: 200, y: 4 * GRID_SIZE, width: 90, height: 32, type: 'log' },
          { x: 360, y: 4 * GRID_SIZE, width: 90, height: 32, type: 'log' }
        ]
      },

      // Row 5: Diving turtles (pairs)
      {
        row: 5,
        type: 'turtle',
        speed: -1.6 * speedMult,
        spacing: 140,
        objects: [
          { x: 60, y: 5 * GRID_SIZE, width: 68, height: 30, type: 'turtle', count: 2, diving: true, submergeState: 0, submergeTimer: 0 },
          { x: 200, y: 5 * GRID_SIZE, width: 68, height: 30, type: 'turtle', count: 2, diving: false, submergeState: 0, submergeTimer: 0 },
          { x: 340, y: 5 * GRID_SIZE, width: 68, height: 30, type: 'turtle', count: 2, diving: true, submergeState: 0, submergeTimer: 90 }
        ]
      },

      // Row 6: Median grass (safe)
      { row: 6, type: 'safe', objects: [] },

      // Row 7: Racecars (fast, left)
      {
        row: 7,
        type: 'vehicle',
        speed: -3.2 * speedMult,
        spacing: 190,
        objects: [
          { x: 80, y: 7 * GRID_SIZE, width: 38, height: 28, carType: 'racecar', color: '#ff3333' },
          { x: 260, y: 7 * GRID_SIZE, width: 38, height: 28, carType: 'racecar', color: '#ff3333' },
          { x: 420, y: 7 * GRID_SIZE, width: 38, height: 28, carType: 'racecar', color: '#ff3333' }
        ]
      },

      // Row 8: Tractors / bulldozers (slow, right)
      {
        row: 8,
        type: 'vehicle',
        speed: 1.3 * speedMult,
        spacing: 150,
        objects: [
          { x: 40, y: 8 * GRID_SIZE, width: 38, height: 30, carType: 'tractor', color: '#ffd700' },
          { x: 190, y: 8 * GRID_SIZE, width: 38, height: 30, carType: 'tractor', color: '#ffd700' },
          { x: 340, y: 8 * GRID_SIZE, width: 38, height: 30, carType: 'tractor', color: '#ffd700' }
        ]
      },

      // Row 9: Purple sedans (medium, left)
      {
        row: 9,
        type: 'vehicle',
        speed: -1.9 * speedMult,
        spacing: 160,
        objects: [
          { x: 50, y: 9 * GRID_SIZE, width: 36, height: 28, carType: 'sedan', color: '#cc44ff' },
          { x: 210, y: 9 * GRID_SIZE, width: 36, height: 28, carType: 'sedan', color: '#cc44ff' },
          { x: 370, y: 9 * GRID_SIZE, width: 36, height: 28, carType: 'sedan', color: '#cc44ff' }
        ]
      },

      // Row 10: White delivery vans (medium, right)
      {
        row: 10,
        type: 'vehicle',
        speed: 2.1 * speedMult,
        spacing: 180,
        objects: [
          { x: 70, y: 10 * GRID_SIZE, width: 44, height: 30, carType: 'van', color: '#00f0ff' },
          { x: 260, y: 10 * GRID_SIZE, width: 44, height: 30, carType: 'van', color: '#00f0ff' }
        ]
      },

      // Row 11: Semi-trailer trucks (long, left)
      {
        row: 11,
        type: 'vehicle',
        speed: -1.5 * speedMult,
        spacing: 230,
        objects: [
          { x: 60, y: 11 * GRID_SIZE, width: 76, height: 30, carType: 'truck', color: '#ffaa00' },
          { x: 290, y: 11 * GRID_SIZE, width: 76, height: 30, carType: 'truck', color: '#ffaa00' }
        ]
      },

      // Row 12: Starting sidewalk (safe)
      { row: 12, type: 'safe', objects: [] },

      // Row 13: HUD row
      { row: 13, type: 'hud', objects: [] }
    ];
  }

  spawnFrog() {
    this.frog = {
      gridX: 5,
      gridY: 12,
      x: 5 * GRID_SIZE,
      y: 12 * GRID_SIZE,
      width: 28,
      height: 28,
      direction: 'up', // 'up', 'down', 'left', 'right'
      hopping: false,
      hopProgress: 0,
      hopStartX: 5 * GRID_SIZE,
      hopStartY: 12 * GRID_SIZE,
      targetX: 5 * GRID_SIZE,
      targetY: 12 * GRID_SIZE,
      ridingObject: null
    };

    this.highestRowReached = 12;
    this.timeLeft = 30; // 30 seconds
    this.timeCounter = 0;
    this.onTime(this.timeLeft);
  }

  hop(direction) {
    if (this.state !== 'PLAYING' || this.frog.hopping) return;

    let targetGridX = this.frog.gridX;
    let targetGridY = this.frog.gridY;

    if (direction === 'up') targetGridY -= 1;
    else if (direction === 'down') targetGridY += 1;
    else if (direction === 'left') targetGridX -= 1;
    else if (direction === 'right') targetGridX += 1;

    // Boundary constraints
    if (targetGridX < 0 || targetGridX >= COLS) return;
    if (targetGridY < 0 || targetGridY > 12) return;

    this.frog.direction = direction;
    this.frog.hopping = true;
    this.frog.hopProgress = 0;
    this.frog.hopStartX = this.frog.x;
    this.frog.hopStartY = this.frog.y;
    this.frog.gridX = targetGridX;
    this.frog.gridY = targetGridY;
    this.frog.targetX = targetGridX * GRID_SIZE;
    this.frog.targetY = targetGridY * GRID_SIZE;
    this.frog.ridingObject = null;

    // Score forward progress (+10 pts per unique row advanced)
    if (targetGridY < this.highestRowReached && targetGridY >= 1) {
      this.highestRowReached = targetGridY;
      this.score += 10;
      this.onScore(this.score);
      if (this.score >= 2000) {
        this.onAchievement('frogger_score_2000');
      }
    }

    this.onSound('hop');
  }

  update() {
    if (this.state === 'GAME_OVER') return;

    if (this.state === 'FROG_DYING') {
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        if (this.lives <= 0) {
          this.state = 'GAME_OVER';
          this.onGameOver(this.score);
        } else {
          this.state = 'PLAYING';
          this.spawnFrog();
        }
      }
      return;
    }

    if (this.state === 'ROUND_CLEARED') {
      this.roundClearTimer--;
      if (this.roundClearTimer <= 0) {
        this.level++;
        this.onLevel(this.level);
        this.initHomes();
        this.initLanes();
        this.spawnFrog();
        this.state = 'PLAYING';
      }
      return;
    }

    // Normal game loop
    this.updateTimer();
    this.updateMovingLanes();
    this.updateFly();
    this.updateFrogHop();
    this.checkCollisions();
  }

  updateTimer() {
    this.timeCounter++;
    if (this.timeCounter >= 60) { // 1 second
      this.timeCounter = 0;
      this.timeLeft--;
      this.onTime(this.timeLeft);

      if (this.timeLeft <= 5 && this.timeLeft > 0) {
        this.onSound('timeout_tick');
      } else if (this.timeLeft <= 0) {
        this.killFrog('timeout');
      }
    }
  }

  updateMovingLanes() {
    for (const lane of this.lanes) {
      if (!lane.speed) continue;

      for (const obj of lane.objects) {
        obj.x += lane.speed;

        // Wrap around boundaries
        if (lane.speed > 0 && obj.x > WIDTH + 40) {
          obj.x = -obj.width - 20;
        } else if (lane.speed < 0 && obj.x + obj.width < -40) {
          obj.x = WIDTH + 20;
        }

        // Update turtle diving state
        if (obj.type === 'turtle' && obj.diving) {
          obj.submergeTimer++;
          // Cycle: 0..160 surfaced (0), 161..200 half submerged (1), 201..260 fully submerged (2), 261..290 half submerged (1)
          const cycle = obj.submergeTimer % 300;
          if (cycle < 160) {
            obj.submergeState = 0; // Surfaced
          } else if (cycle < 200) {
            obj.submergeState = 1; // Diving
          } else if (cycle < 260) {
            obj.submergeState = 2; // Submerged (DANGEROUS)
          } else {
            obj.submergeState = 1; // Resurfacing
          }
        }
      }
    }
  }

  updateFly() {
    // Check active fly expiration
    for (const home of this.homes) {
      if (home.fly) {
        home.flyTimer--;
        if (home.flyTimer <= 0) {
          home.fly = false;
        }
      }
    }

    // Spawn bonus fly in empty home
    this.flySpawnTimer--;
    if (this.flySpawnTimer <= 0) {
      this.flySpawnTimer = 400 + Math.floor(Math.random() * 400);
      const emptyHomes = this.homes.filter(h => !h.filled);
      if (emptyHomes.length > 0) {
        const picked = emptyHomes[Math.floor(Math.random() * emptyHomes.length)];
        picked.fly = true;
        picked.flyTimer = 240; // ~4 seconds
      }
    }
  }

  updateFrogHop() {
    if (!this.frog.hopping) {
      // If standing on moving river object, move with it
      if (this.frog.ridingObject) {
        this.frog.x += this.frog.ridingObject.speed;
        this.frog.gridX = Math.round(this.frog.x / GRID_SIZE);

        // Off-screen drowning check
        if (this.frog.x < 0 || this.frog.x + this.frog.width > WIDTH) {
          this.killFrog('splash');
        }
      }
      return;
    }

    // Animate hop progression (6 frames total)
    this.frog.hopProgress += 0.2;
    if (this.frog.hopProgress >= 1.0) {
      this.frog.hopProgress = 1.0;
      this.frog.hopping = false;
      this.frog.x = this.frog.targetX;
      this.frog.y = this.frog.targetY;
    } else {
      this.frog.x = this.frog.hopStartX + (this.frog.targetX - this.frog.hopStartX) * this.frog.hopProgress;
      this.frog.y = this.frog.hopStartY + (this.frog.targetY - this.frog.hopStartY) * this.frog.hopProgress;
    }
  }

  checkCollisions() {
    if (this.state !== 'PLAYING') return;

    const row = this.frog.gridY;
    const frogCenterX = this.frog.x + GRID_SIZE / 2;
    const frogCenterY = this.frog.y + GRID_SIZE / 2;

    // 1. Goal bays (Row 0)
    if (row === 0) {
      this.checkGoalDock(frogCenterX);
      return;
    }

    // 2. River section (Rows 1 to 5)
    if (row >= 1 && row <= 5) {
      const lane = this.lanes[row];
      let supported = false;
      let ridingObj = null;

      for (const obj of lane.objects) {
        // Check if frog overlaps object
        if (this.frog.x + this.frog.width - 6 >= obj.x &&
            this.frog.x + 6 <= obj.x + obj.width) {
          if (obj.type === 'turtle') {
            if (obj.submergeState === 2) {
              // Submerged underwater! Frog drowns
              this.killFrog('splash');
              return;
            }
            supported = true;
            ridingObj = { speed: lane.speed, obj };
            this.stats.turtlesRidden++;
            if (this.stats.turtlesRidden >= 3) {
              this.onAchievement('frogger_turtle_rider');
            }
          } else {
            // Log
            supported = true;
            ridingObj = { speed: lane.speed, obj };
          }
          break;
        }
      }

      if (supported) {
        this.frog.ridingObject = ridingObj;
      } else if (!this.frog.hopping) {
        // Stepped directly into water
        this.killFrog('splash');
      }
      return;
    }

    // 3. Median grass (Row 6) & Starting sidewalk (Row 12)
    if (row === 6 || row === 12) {
      this.frog.ridingObject = null;
      return;
    }

    // 4. Highway traffic (Rows 7 to 11)
    if (row >= 7 && row <= 11) {
      this.frog.ridingObject = null;
      const lane = this.lanes[row];
      for (const vehicle of lane.objects) {
        if (this.checkRectOverlap(
          this.frog.x + 4, this.frog.y + 4, this.frog.width - 8, this.frog.height - 8,
          vehicle.x + 2, vehicle.y + 2, vehicle.width - 4, vehicle.height - 4
        )) {
          this.killFrog('splat');
          return;
        }
      }
    }
  }

  checkGoalDock(frogCenterX) {
    // Find matching bay
    let matchedBay = null;
    for (const home of this.homes) {
      if (frogCenterX >= home.x && frogCenterX <= home.x + home.width) {
        matchedBay = home;
        break;
      }
    }

    if (!matchedBay || matchedBay.filled) {
      // Jumped into bush or already filled bay -> dead
      this.killFrog('splat');
      return;
    }

    // Successfully reached home bay!
    matchedBay.filled = true;
    let award = 50 + this.timeLeft * 10;

    if (matchedBay.fly) {
      award += 200;
      matchedBay.fly = false;
      this.stats.fliesEaten++;
      this.onAchievement('frogger_fly_catcher');
      this.onSound('fly_pickup');
    }

    this.score += award;
    this.onScore(this.score);
    this.stats.frogsSaved++;
    this.onAchievement('frogger_first_home');

    if (this.score >= 2000) {
      this.onAchievement('frogger_score_2000');
    }

    this.onSound('home_dock');

    // Check if all 5 bays filled
    const allFilled = this.homes.every(h => h.filled);
    if (allFilled) {
      this.handleRoundClear();
    } else {
      // Respawn frog for next home run
      this.spawnFrog();
    }
  }

  handleRoundClear() {
    this.score += 1000;
    this.onScore(this.score);
    this.stats.roundsCleared++;
    this.onAchievement('frogger_round_clear');
    this.state = 'ROUND_CLEARED';
    this.roundClearTimer = 120; // 2 seconds
    this.onSound('round_clear');
  }

  killFrog(type = 'splat') {
    this.state = 'FROG_DYING';
    this.deathType = type;
    this.deathTimer = 60; // 1 second
    this.lives--;
    this.onLives(this.lives);

    if (type === 'splash') {
      this.onSound('splash');
    } else if (type === 'splat') {
      this.onSound('splat');
    } else {
      this.onSound('timeout');
    }
  }

  checkRectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }
}
