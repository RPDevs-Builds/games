/**
 * Othello / Reversi Game Engine
 * 8x8 Board, Directional Flips, Valid Moves Generation, Heuristic Minimax AI
 */

export const EMPTY = 0;
export const BLACK = 1; // Player 1 (standard plays first)
export const WHITE = 2; // Player 2 / CPU

export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1]
];

// Classic positional weight matrix prioritizing corners and penalizing X-squares
export const POSITIONAL_WEIGHTS = [
  [ 100, -20,  10,   5,   5,  10, -20,  100],
  [ -20, -50,  -2,  -2,  -2,  -2, -50,  -20],
  [  10,  -2,   1,   1,   1,   1,  -2,   10],
  [   5,  -2,   1,   0,   0,   1,  -2,    5],
  [   5,  -2,   1,   0,   0,   1,  -2,    5],
  [  10,  -2,   1,   1,   1,   1,  -2,   10],
  [ -20, -50,  -2,  -2,  -2,  -2, -50,  -20],
  [ 100, -20,  10,   5,   5,  10, -20,  100]
];

export class OthelloEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
    // Standard starting position: 4 center squares
    this.board[3][3] = WHITE;
    this.board[3][4] = BLACK;
    this.board[4][3] = BLACK;
    this.board[4][4] = WHITE;

    this.turn = BLACK; // Black goes first
    this.gameOver = false;
    this.winner = null; // null, BLACK, WHITE, or 'draw'
    this.moveHistory = [];
  }

  getOpponent(player) {
    return player === BLACK ? WHITE : BLACK;
  }

  isValidPos(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  /**
   * Returns list of opposing coordinates flipped if player moves at (r, c).
   */
  getFlipsForMove(r, c, player, board = this.board) {
    if (board[r][c] !== EMPTY) return [];

    const opponent = this.getOpponent(player);
    const allFlips = [];

    for (const [dr, dc] of DIRECTIONS) {
      let cr = r + dr;
      let cc = c + dc;
      const ray = [];

      while (this.isValidPos(cr, cc) && board[cr][cc] === opponent) {
        ray.push([cr, cc]);
        cr += dr;
        cc += dc;
      }

      if (ray.length > 0 && this.isValidPos(cr, cc) && board[cr][cc] === player) {
        allFlips.push(...ray);
      }
    }

    return allFlips;
  }

  /**
   * Returns array of valid moves for a player: [{ r, c, flips }]
   */
  getValidMoves(player = this.turn, board = this.board) {
    const valid = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === EMPTY) {
          const flips = this.getFlipsForMove(r, c, player, board);
          if (flips.length > 0) {
            valid.push({ r, c, flips });
          }
        }
      }
    }
    return valid;
  }

  /**
   * Executes a move for the current player.
   * Returns { success, flips, pass, gameOver }
   */
  playMove(r, c) {
    if (this.gameOver) return { success: false, reason: 'Game is over' };

    const flips = this.getFlipsForMove(r, c, this.turn);
    if (flips.length === 0) return { success: false, reason: 'Invalid move' };

    // Apply move
    this.board[r][c] = this.turn;
    for (const [fr, fc] of flips) {
      this.board[fr][fc] = this.turn;
    }

    this.moveHistory.push({ r, c, player: this.turn, flipsCount: flips.length });

    // Switch turn
    const opponent = this.getOpponent(this.turn);
    const opponentMoves = this.getValidMoves(opponent);

    let pass = false;
    if (opponentMoves.length > 0) {
      this.turn = opponent;
    } else {
      // Opponent must pass
      const currentMoves = this.getValidMoves(this.turn);
      if (currentMoves.length > 0) {
        pass = true; // Opponent passed, same player goes again
      } else {
        // Neither player can move -> Game over
        this.finishGame();
      }
    }

    return {
      success: true,
      flips,
      pass,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }

  finishGame() {
    this.gameOver = true;
    const { black, white } = this.getScores();
    if (black > white) this.winner = BLACK;
    else if (white > black) this.winner = WHITE;
    else this.winner = 'draw';
  }

  getScores(board = this.board) {
    let black = 0;
    let white = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === BLACK) black++;
        else if (board[r][c] === WHITE) white++;
      }
    }
    return { black, white };
  }

  /**
   * Evaluates board utility for a given player using weighted matrix + mobility
   */
  evaluateBoard(player, board) {
    const opponent = this.getOpponent(player);
    let positionalScore = 0;
    let myDiscs = 0;
    let oppDiscs = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const val = board[r][c];
        if (val === player) {
          myDiscs++;
          positionalScore += POSITIONAL_WEIGHTS[r][c];
        } else if (val === opponent) {
          oppDiscs++;
          positionalScore -= POSITIONAL_WEIGHTS[r][c];
        }
      }
    }

    // Dynamic endgame transition: disc count matters more in late game
    const totalDiscs = myDiscs + oppDiscs;
    if (totalDiscs >= 55) {
      return (myDiscs - oppDiscs) * 10;
    }

    const myMoves = this.getValidMoves(player, board).length;
    const oppMoves = this.getValidMoves(opponent, board).length;
    const mobilityScore = (myMoves - oppMoves) * 5;

    return positionalScore + mobilityScore;
  }

  /**
   * Clone current board array
   */
  cloneBoard(board = this.board) {
    return board.map(row => [...row]);
  }

  /**
   * Minimax search with Alpha-Beta pruning
   */
  minimax(board, depth, alpha, beta, isMaximizing, player) {
    const opponent = this.getOpponent(player);
    const activePlayer = isMaximizing ? player : opponent;
    const validMoves = this.getValidMoves(activePlayer, board);

    if (depth === 0 || validMoves.length === 0) {
      return { score: this.evaluateBoard(player, board), move: null };
    }

    let bestMove = validMoves[0];

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of validMoves) {
        const nextBoard = this.cloneBoard(board);
        nextBoard[m.r][m.c] = player;
        for (const [fr, fc] of m.flips) {
          nextBoard[fr][fc] = player;
        }

        const ev = this.minimax(nextBoard, depth - 1, alpha, beta, false, player);
        if (ev.score > maxEval) {
          maxEval = ev.score;
          bestMove = m;
        }
        alpha = Math.max(alpha, ev.score);
        if (beta <= alpha) break; // Beta cut-off
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const m of validMoves) {
        const nextBoard = this.cloneBoard(board);
        nextBoard[m.r][m.c] = opponent;
        for (const [fr, fc] of m.flips) {
          nextBoard[fr][fc] = opponent;
        }

        const ev = this.minimax(nextBoard, depth - 1, alpha, beta, true, player);
        if (ev.score < minEval) {
          minEval = ev.score;
          bestMove = m;
        }
        beta = Math.min(beta, ev.score);
        if (beta <= alpha) break; // Alpha cut-off
      }
      return { score: minEval, move: bestMove };
    }
  }

  /**
   * Compute AI Move based on chosen difficulty: 'easy', 'medium', 'hard'
   */
  getAIMove(difficulty = 'medium', player = this.turn) {
    const validMoves = this.getValidMoves(player);
    if (validMoves.length === 0) return null;

    if (difficulty === 'easy') {
      // Pick random valid move or move that captures the least
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    if (difficulty === 'medium') {
      // Depth 2 minimax with positional weights
      const result = this.minimax(this.board, 2, -Infinity, Infinity, true, player);
      return result.move || validMoves[0];
    }

    if (difficulty === 'hard') {
      // Depth 4 minimax with full mobility analysis
      const result = this.minimax(this.board, 4, -Infinity, Infinity, true, player);
      return result.move || validMoves[0];
    }

    return validMoves[0];
  }
}
