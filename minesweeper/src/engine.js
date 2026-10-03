/**
 * Minesweeper Core Engine
 * Manages grid layout, first-click safety guarantee, neighbor counting, and flood fill.
 */

export class MinesweeperEngine {
  constructor(rows = 9, cols = 9, totalMines = 10) {
    this.rows = rows;
    this.cols = cols;
    this.totalMines = totalMines;
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
    this.firstClick = true;
    this.gameOver = false;
    this.gameWon = false;
    this.revealedCount = 0;
    this.flagsCount = 0;
  }

  isValid(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  getNeighbors(r, c) {
    const list = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (this.isValid(nr, nc)) {
          list.push({ r: nr, c: nc });
        }
      }
    }
    return list;
  }

  populateMines(excludeR, excludeC) {
    // Generate mines ensuring clicked cell and immediate neighbors are mine-free
    const excluded = new Set();
    excluded.add(`${excludeR},${excludeC}`);
    for (const nb of this.getNeighbors(excludeR, excludeC)) {
      excluded.add(`${nb.r},${nb.c}`);
    }

    const available = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!excluded.has(`${r},${c}`)) {
          available.push({ r, c });
        }
      }
    }

    // Place mines randomly
    let placed = 0;
    const target = Math.min(this.totalMines, available.length);
    while (placed < target && available.length > 0) {
      const idx = Math.floor(Math.random() * available.length);
      const { r, c } = available.splice(idx, 1)[0];
      this.grid[r][c].isMine = true;
      placed++;
    }

    // Calculate neighbor counts
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].isMine) continue;
        let count = 0;
        for (const nb of this.getNeighbors(r, c)) {
          if (this.grid[nb.r][nb.c].isMine) count++;
        }
        this.grid[r][c].neighborMines = count;
      }
    }
  }

  reveal(r, c) {
    if (!this.isValid(r, c) || this.gameOver || this.gameWon) return null;
    const cell = this.grid[r][c];
    if (cell.isRevealed || cell.isFlagged) return null;

    if (this.firstClick) {
      this.populateMines(r, c);
      this.firstClick = false;
    }

    if (cell.isMine) {
      this.gameOver = true;
      cell.isRevealed = true;
      return { status: 'exploded', r, c };
    }

    // Cascade flood-fill
    const revealedCells = [];
    const queue = [{ r, c }];
    cell.isRevealed = true;
    this.revealedCount++;
    revealedCells.push({ r, c, val: cell.neighborMines });

    while (queue.length > 0) {
      const curr = queue.shift();
      const currCell = this.grid[curr.r][curr.c];

      if (currCell.neighborMines === 0) {
        for (const nb of this.getNeighbors(curr.r, curr.c)) {
          const nbCell = this.grid[nb.r][nb.c];
          if (!nbCell.isRevealed && !nbCell.isFlagged && !nbCell.isMine) {
            nbCell.isRevealed = true;
            this.revealedCount++;
            revealedCells.push({ r: nb.r, c: nb.c, val: nbCell.neighborMines });
            if (nbCell.neighborMines === 0) {
              queue.push(nb);
            }
          }
        }
      }
    }

    // Check win condition
    const safeCells = this.rows * this.cols - this.totalMines;
    if (this.revealedCount >= safeCells) {
      this.gameWon = true;
      return { status: 'won', revealed: revealedCells };
    }

    return { status: 'ok', revealed: revealedCells };
  }

  toggleFlag(r, c) {
    if (!this.isValid(r, c) || this.gameOver || this.gameWon) return false;
    const cell = this.grid[r][c];
    if (cell.isRevealed) return false;

    cell.isFlagged = !cell.isFlagged;
    this.flagsCount += cell.isFlagged ? 1 : -1;
    return cell.isFlagged;
  }
}
