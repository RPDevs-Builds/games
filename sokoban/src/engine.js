/**
 * Sokoban Engine - Discrete Warehouse State Machine & Deadlock Detector
 */

export const TILE = {
  WALL: '#',
  FLOOR: ' ',
  GOAL: '.',
  BOX: '$',
  BOX_ON_GOAL: '*',
  PLAYER: '@',
  PLAYER_ON_GOAL: '+'
};

export const SOKOBAN_LEVELS = [
  // Level 1: Introduction
  [
    "  #####",
    "###   #",
    "# $ # ##",
    "# #  . #",
    "#    # #",
    "## #   #",
    " #@ .# #",
    " #  $  #",
    " #######"
  ].join("\n"),

  // Level 2: Two Boxes
  [
    "#####",
    "#@  #",
    "# $$#",
    "##  #",
    "##..#",
    "#####"
  ].join("\n"),

  // Level 3: Corridor Maneuver
  [
    "######",
    "#    #",
    "# #$ #",
    "# .@ #",
    "# $. #",
    "######"
  ].join("\n"),

  // Level 4: Classic Thinking Rabbit Micro
  [
    "  ####",
    "###  #",
    "#    #",
    "# $$ #",
    "# .. #",
    "#  @ #",
    "######"
  ].join("\n"),

  // Level 5: Storage Room
  [
    "#######",
    "#  .  #",
    "# $#$ #",
    "# .@. #",
    "# $#$ #",
    "#  .  #",
    "#######"
  ].join("\n"),

  // Level 6: Warehouse Crossroads
  [
    "  ##### ",
    "###   # ",
    "# $ # ##",
    "# #  . #",
    "#    # #",
    "##$#.  #",
    " #@    #",
    " #######"
  ].join("\n"),

  // Level 7: Triple Vault
  [
    "########",
    "#  ... #",
    "#  $$$ #",
    "#   @  #",
    "#      #",
    "########"
  ].join("\n"),

  // Level 8: Four Corners
  [
    "#########",
    "# .   . #",
    "#  $ $  #",
    "#   @   #",
    "#  $ $  #",
    "# .   . #",
    "#########"
  ].join("\n"),

  // Level 9: Loop Alley
  [
    "  ######",
    "  #    #",
    "### ## #",
    "#   $$ #",
    "# #..# #",
    "#  @   #",
    "########"
  ].join("\n"),

  // Level 10: Master Warehouse Small
  [
    "#######",
    "#     #",
    "# $.$ #",
    "# .@. #",
    "# $.$ #",
    "#     #",
    "#######"
  ].join("\n")
];

export class SokobanEngine {
  constructor(levelXSB = SOKOBAN_LEVELS[0]) {
    this.loadLevel(levelXSB);
  }

  loadLevel(levelXSB) {
    const lines = levelXSB.split('\n');
    this.height = lines.length;
    this.width = Math.max(...lines.map(l => l.length));

    // Internal grid representation:
    // walls: boolean[][]
    // goals: boolean[][]
    // boxes: boolean[][]
    // player: { r, c }
    this.walls = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    this.goals = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    this.boxes = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    this.player = { r: 0, c: 0 };

    for (let r = 0; r < this.height; r++) {
      const line = lines[r];
      for (let c = 0; c < this.width; c++) {
        const char = c < line.length ? line[c] : ' ';
        if (char === '#') this.walls[r][c] = true;
        else if (char === '.') this.goals[r][c] = true;
        else if (char === '$') this.boxes[r][c] = true;
        else if (char === '*') {
          this.boxes[r][c] = true;
          this.goals[r][c] = true;
        } else if (char === '@') {
          this.player = { r, c };
        } else if (char === '+') {
          this.player = { r, c };
          this.goals[r][c] = true;
        }
      }
    }

    this.history = [];
    this.movesCount = 0;
    this.pushesCount = 0;
  }

  isWall(r, c) {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return true;
    return this.walls[r][c];
  }

  isGoal(r, c) {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
    return this.goals[r][c];
  }

  hasBox(r, c) {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
    return this.boxes[r][c];
  }

  move(dr, dc) {
    const nr = this.player.r + dr;
    const nc = this.player.c + dc;

    if (this.isWall(nr, nc)) return { moved: false, pushed: false };

    if (this.hasBox(nr, nc)) {
      const bnr = nr + dr;
      const bnc = nc + dc;

      // Cannot push into wall or another box
      if (this.isWall(bnr, bnc) || this.hasBox(bnr, bnc)) {
        return { moved: false, pushed: false };
      }

      // Record state for undo
      this.history.push({
        playerFrom: { ...this.player },
        boxFrom: { r: nr, c: nc },
        boxTo: { r: bnr, c: bnc }
      });

      this.boxes[nr][nc] = false;
      this.boxes[bnr][bnc] = true;
      this.player = { r: nr, c: nc };
      this.movesCount++;
      this.pushesCount++;

      const isWon = this.checkWin();
      const deadlocks = this.detectDeadlocks();

      return {
        moved: true,
        pushed: true,
        isWon,
        placedOnGoal: this.isGoal(bnr, bnc),
        deadlocks
      };
    } else {
      // Normal walk
      this.history.push({
        playerFrom: { ...this.player },
        boxFrom: null,
        boxTo: null
      });

      this.player = { r: nr, c: nc };
      this.movesCount++;

      return {
        moved: true,
        pushed: false,
        isWon: this.checkWin(),
        placedOnGoal: false,
        deadlocks: this.detectDeadlocks()
      };
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    const last = this.history.pop();

    this.player = { ...last.playerFrom };
    this.movesCount = Math.max(0, this.movesCount - 1);

    if (last.boxFrom && last.boxTo) {
      this.boxes[last.boxTo.r][last.boxTo.c] = false;
      this.boxes[last.boxFrom.r][last.boxFrom.c] = true;
      this.pushesCount = Math.max(0, this.pushesCount - 1);
    }

    return true;
  }

  checkWin() {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.boxes[r][c] && !this.goals[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Deadlock Detection Engine:
   * Identifies unrecoverable box positions:
   * 1. Corner Deadlock: box not on goal with adjacent perpendicular walls.
   * 2. 2x2 Square Deadlock: 4 boxes/walls in 2x2 cluster where at least one is a box not on goal.
   */
  detectDeadlocks() {
    const trappedBoxes = [];

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (!this.boxes[r][c]) continue;
        if (this.goals[r][c]) continue; // Boxes on goals are not static corner deadlocks

        // 1. Corner Check
        const wallUp = this.isWall(r - 1, c);
        const wallDown = this.isWall(r + 1, c);
        const wallLeft = this.isWall(r, c - 1);
        const wallRight = this.isWall(r, c + 1);

        if ((wallUp && wallLeft) || (wallUp && wallRight) || (wallDown && wallLeft) || (wallDown && wallRight)) {
          trappedBoxes.push({ r, c, type: 'corner' });
          continue;
        }

        // 2. 2x2 Block Check (check all 4 squares containing (r,c))
        const offsets = [
          [0, 0],   // top-left is (r, c)
          [0, -1],  // top-right is (r, c)
          [-1, 0],  // bottom-left is (r, c)
          [-1, -1]  // bottom-right is (r, c)
        ];

        for (const [dr, dc] of offsets) {
          const r0 = r + dr;
          const c0 = c + dc;
          if (r0 < 0 || r0 + 1 >= this.height || c0 < 0 || c0 + 1 >= this.width) continue;

          const isSolid = (tr, tc) => this.isWall(tr, tc) || this.hasBox(tr, tc);
          if (isSolid(r0, c0) && isSolid(r0, c0 + 1) && isSolid(r0 + 1, c0) && isSolid(r0 + 1, c0 + 1)) {
            // Check if at least one box in the 2x2 is not on a goal
            const hasCrateOffGoal = 
              (this.hasBox(r0, c0) && !this.isGoal(r0, c0)) ||
              (this.hasBox(r0, c0 + 1) && !this.isGoal(r0, c0 + 1)) ||
              (this.hasBox(r0 + 1, c0) && !this.isGoal(r0 + 1, c0)) ||
              (this.hasBox(r0 + 1, c0 + 1) && !this.isGoal(r0 + 1, c0 + 1));

            if (hasCrateOffGoal) {
              trappedBoxes.push({ r, c, type: '2x2' });
              break;
            }
          }
        }
      }
    }

    return trappedBoxes;
  }

  /**
   * Breadth-First Search (BFS) pathfinder for tap-to-move worker navigation
   */
  findPath(targetR, targetC) {
    if (this.isWall(targetR, targetC) || this.hasBox(targetR, targetC)) return null;
    if (this.player.r === targetR && this.player.c === targetC) return [];

    const queue = [[this.player.r, this.player.c, []]];
    const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    visited[this.player.r][this.player.c] = true;

    const dirs = [
      [-1, 0, 'ArrowUp'],
      [1, 0, 'ArrowDown'],
      [0, -1, 'ArrowLeft'],
      [0, 1, 'ArrowRight']
    ];

    while (queue.length > 0) {
      const [cr, cc, path] = queue.shift();

      if (cr === targetR && cc === targetC) {
        return path;
      }

      for (const [dr, dc, key] of dirs) {
        const nr = cr + dr;
        const nc = cc + dc;

        if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
          if (!visited[nr][nc] && !this.isWall(nr, nc) && !this.hasBox(nr, nc)) {
            visited[nr][nc] = true;
            queue.push([nr, nc, [...path, { dr, dc, key }]]);
          }
        }
      }
    }

    return null;
  }
}
