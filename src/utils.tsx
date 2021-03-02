import {
  PieceType,
  Location,
  Board,
  EMPTY,
  TurnState,
  Move,
  BOARD_SIZE,
  MoveMap,
} from "./constants";

/* ----------------------
    Generating moves
   ---------------------- */

export function canMovePiece(
  pieceType: PieceType,
  start: Location,
  end: Location,
  board: Board
): boolean {
  // Can't take piece of same color
  const destinationPiece = getPieceAtCell(end, board);
  if (
    destinationPiece &&
    ((isWhitePiece(pieceType) && isWhitePiece(destinationPiece)) ||
      (isBlackPiece(pieceType) && isBlackPiece(destinationPiece)))
  ) {
    return false;
  }

  // Coordinates, where 0,0 is top left
  const [startY, startX] = start;
  const [endY, endX] = end;

  switch (pieceType) {
    case PieceType.PawnWhite:
      return destinationPiece
        ? endY === startY - 1 && Math.abs(endX - startX) === 1 // Diagonal capture
        : endY === startY - 1 && endX - startX === 0; // Forward move
    case PieceType.PawnBlack:
      return destinationPiece
        ? endY === startY + 1 && Math.abs(endX - startX) === 1 // Diagonal capture
        : endY === startY + 1 && endX - startX === 0; // Forward move
  }

  return true;
}

/**
 * Convert a list of moves to a movement map, which maps the starting locations to the list of possible end locations.
 * NB: The keys and values are --formatted-- locations, to avoid the problem of array equality.
 */
export function convertToMoveMap(moveList: Array<Move>): MoveMap {
  const map = new Map();
  for (const move of moveList) {
    const startStr = formatLocation(move.startCell);
    const endStr = formatLocation(move.endCell);
    if (!map.has(startStr)) {
      map.set(startStr, []);
    }
    map.get(startStr).push(endStr);
  }
  return map;
}

export function generatePossibleMoves(
  board: Board,
  turnState: TurnState
): Array<Move> {
  let legalMoves: Array<Move> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Generate moves from every cell that has a piece of the current player
      const startCell = [row, col];
      const piece = getPieceAtCell(startCell, board);
      if (!piece || !isColorOfCurrentPlayer(piece, turnState)) {
        continue;
      }
      legalMoves = legalMoves.concat(getMovesForPiece(piece, startCell, board));
    }
  }

  return legalMoves;
}

function getMovesForPiece(
  pieceType: PieceType,
  startCell: Location,
  board: Board
): Array<Move> {
  let movesForPiece: Array<Move> = [];

  // Helper functions
  /** Tries to move to a location. If it can, it adds that move to the move list and returns true. Otherwise, it returns false. */
  function tryMoveToLocation(r: number, c: number) {
    if (cellIsEmpty([r, c], board)) {
      movesForPiece.push({
        startCell,
        endCell: [r, c],
        pieceType,
        isCapture: false,
      });
      return true;
    }
    return false;
  }
  /** Tries to capture at a location. If it can, it adds that move to the move list. */
  function tryCaptureAtLocation(r: number, c: number) {
    if (cellHasEnemyPiece([r, c], pieceType, board)) {
      movesForPiece.push({
        startCell,
        endCell: [r, c],
        pieceType,
        isCapture: true,
      });
    }
  }
  /** Tries to move or capture at a location. If it can, it adds that move to the move list.
   * If it can --move-- to that cell, it returns true (to indicate that pieces with infinite range should keep searching beyond that square). Not elegant, but it is what it is. */
  function tryMoveOrCaptureAtLocation(r: number, c: number) {
    tryCaptureAtLocation(r, c);
    return tryMoveToLocation(r, c);
  }

  function addRookMoves() {
    // Move right
    let c = col;
    while (tryMoveOrCaptureAtLocation(row, c + 1)) {
      c += 1;
    }

    // Move left
    c = col;
    while (tryMoveOrCaptureAtLocation(row, c - 1)) {
      c -= 1;
    }

    // Move up
    let r = row;
    while (tryMoveOrCaptureAtLocation(r - 1, col)) {
      r -= 1;
    }

    // Move down
    r = row;
    while (tryMoveOrCaptureAtLocation(r + 1, col)) {
      r += 1;
    }
  }

  function addBishopMoves() {
    // Move down-right
    let [r, c] = startCell;
    while (tryMoveOrCaptureAtLocation(r + 1, c + 1)) {
      r += 1;
      c += 1;
    }

    // Move down-left
    [r, c] = startCell;
    while (tryMoveOrCaptureAtLocation(r + 1, c - 1)) {
      r += 1;
      c -= 1;
    }
    // Move up-right
    [r, c] = startCell;
    while (tryMoveOrCaptureAtLocation(r - 1, c + 1)) {
      r -= 1;
      c += 1;
    }

    // Move up-left
    [r, c] = startCell;
    while (tryMoveOrCaptureAtLocation(r - 1, c - 1)) {
      r -= 1;
      c -= 1;
    }
  }

  const [row, col] = startCell;
  switch (pieceType) {
    case PieceType.PawnWhite:
      tryMoveToLocation(row - 1, col);
      tryCaptureAtLocation(row - 1, col - 1);
      tryCaptureAtLocation(row - 1, col + 1);
      break;

    case PieceType.PawnBlack:
      tryMoveToLocation(row + 1, col);
      tryCaptureAtLocation(row + 1, col - 1);
      tryCaptureAtLocation(row + 1, col + 1);
      break;

    case PieceType.KingWhite:
    case PieceType.KingBlack:
      tryMoveOrCaptureAtLocation(row - 1, col - 1);
      tryMoveOrCaptureAtLocation(row - 1, col);
      tryMoveOrCaptureAtLocation(row - 1, col + 1);
      tryMoveOrCaptureAtLocation(row, col - 1);
      tryMoveOrCaptureAtLocation(row, col + 1);
      tryMoveOrCaptureAtLocation(row + 1, col - 1);
      tryMoveOrCaptureAtLocation(row + 1, col);
      tryMoveOrCaptureAtLocation(row + 1, col + 1);
      break;

    case PieceType.KnightBlack:
    case PieceType.KnightWhite:
      tryMoveOrCaptureAtLocation(row - 2, col + 1);
      tryMoveOrCaptureAtLocation(row - 2, col - 1);
      tryMoveOrCaptureAtLocation(row + 2, col + 1);
      tryMoveOrCaptureAtLocation(row + 2, col - 1);
      break;

    case PieceType.RookBlack:
    case PieceType.RookWhite:
      addRookMoves();
      break;

    case PieceType.BishopBlack:
    case PieceType.BishopWhite:
      addBishopMoves();
      break;

    case PieceType.QueenBlack:
    case PieceType.QueenWhite:
      addRookMoves();
      addBishopMoves();
      break;
  }

  return movesForPiece;
}

/* ----------------------
    Querying the board
   ---------------------- */

function coordinatesOutOfBounds(row: number, col: number): boolean {
  return row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE;
}

/** Returns whether a cell is empty, if it exists. */
function cellIsEmpty(location: Location, board: Board) {
  const [row, col] = location;
  if (coordinatesOutOfBounds(row, col)) {
    return false;
  }
  return board[row][col] === EMPTY;
}

function cellHasEnemyPiece(
  location: Location,
  currentPiece: PieceType,
  board: Board
) {
  const capturedPiece = getPieceAtCell(location, board);
  if (!capturedPiece) {
    return false;
  }
  return (
    (isWhitePiece(currentPiece) && isBlackPiece(capturedPiece)) ||
    (isBlackPiece(currentPiece) && isWhitePiece(capturedPiece))
  );
}

/**
 * Gets the piece in a cell.
 * @returns undefined if there's no piece there, or the coordinates were out of bounds.
 */
export function getPieceAtCell(location: Location, board: Board) {
  const [row, col] = location;
  if (coordinatesOutOfBounds(row, col)) {
    return undefined;
  }
  const cellContents = board[row][col];
  return cellContents === EMPTY ? undefined : cellContents;
}

export function isColorOfCurrentPlayer(
  pieceType: PieceType,
  turnState: TurnState
) {
  return (
    (turnState === TurnState.WhiteTurn && isWhitePiece(pieceType)) ||
    (turnState === TurnState.BlackTurn && isBlackPiece(pieceType))
  );
}

function isWhitePiece(pieceType: PieceType) {
  return (
    pieceType === PieceType.BishopWhite ||
    pieceType === PieceType.RookWhite ||
    pieceType === PieceType.KnightWhite ||
    pieceType === PieceType.PawnWhite ||
    pieceType === PieceType.QueenWhite ||
    pieceType === PieceType.KingWhite
  );
}

function isBlackPiece(pieceType: PieceType) {
  return (
    pieceType === PieceType.BishopBlack ||
    pieceType === PieceType.RookBlack ||
    pieceType === PieceType.KnightBlack ||
    pieceType === PieceType.PawnBlack ||
    pieceType === PieceType.QueenBlack ||
    pieceType === PieceType.KingBlack
  );
}

/* ----------------------
    Formatting Output
   ---------------------- */

export function formatLocation(location: Location) {
  const [row, col] = location;
  const formattedRow = ["e", "d", "c", "b", "a"][row];
  const formattedCol = col + 1;
  return formattedRow + formattedCol;
}

export function formatMove(move: Move) {
  return `${move.pieceType} ${formatLocation(move.startCell)}${
    move.isCapture ? "x" : "->"
  }${formatLocation(move.endCell)}`;
}
