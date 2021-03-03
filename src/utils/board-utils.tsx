import {
  PieceType,
  Location,
  Board,
  EMPTY,
  TurnState,
  BOARD_SIZE,
} from "../constants";

function coordinatesOutOfBounds(row: number, col: number): boolean {
  return row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE;
}

/** Returns whether a cell is empty, if it exists. */
export function cellIsEmpty(location: Location, board: Board) {
  const [row, col] = location;
  if (coordinatesOutOfBounds(row, col)) {
    return false;
  }
  return board[row][col] === EMPTY;
}

export function cellHasEnemyPiece(
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

export function isWhitePiece(pieceType: PieceType) {
  return (
    pieceType === PieceType.BishopWhite ||
    pieceType === PieceType.RookWhite ||
    pieceType === PieceType.KnightWhite ||
    pieceType === PieceType.PawnWhite ||
    pieceType === PieceType.QueenWhite ||
    pieceType === PieceType.KingWhite
  );
}

export function isBlackPiece(pieceType: PieceType) {
  return (
    pieceType === PieceType.BishopBlack ||
    pieceType === PieceType.RookBlack ||
    pieceType === PieceType.KnightBlack ||
    pieceType === PieceType.PawnBlack ||
    pieceType === PieceType.QueenBlack ||
    pieceType === PieceType.KingBlack
  );
}

export function getBoardAfterMove(
  startCell: Location,
  endCell: Location,
  board: Board
): Board {
  let piece = getPieceAtCell(startCell, board);
  const [startRow, startCol] = startCell;
  const [endRow, endCol] = endCell;

  // Promote pawns to queens if needed
  if (piece === PieceType.PawnWhite && endRow === 0) {
    piece = PieceType.QueenWhite;
  } else if (piece === PieceType.PawnBlack && endRow === BOARD_SIZE - 1) {
    piece = PieceType.QueenBlack;
  }

  const newBoard = JSON.parse(JSON.stringify(board));
  newBoard[startRow][startCol] = EMPTY;
  newBoard[endRow][endCol] = piece;

  return newBoard;
}

function getValueOfPiece(piece: PieceType) {
  switch (piece) {
    case PieceType.PawnWhite:
      return 1;
    case PieceType.PawnBlack:
      return -1;
    case PieceType.BishopWhite:
    case PieceType.KnightWhite:
      return 3;
    case PieceType.BishopBlack:
    case PieceType.KnightBlack:
      return -3;
    case PieceType.RookWhite:
      return 5;
    case PieceType.RookBlack:
      return -5;
    case PieceType.QueenWhite:
      return 8;
    case PieceType.QueenBlack:
      return -8;
    case PieceType.KingBlack:
    case PieceType.KingWhite:
      return 0;
    default:
      console.log("Requested value of unknown piece" + piece);
      return 0;
  }
}

export function getStaticValueOfBoard(board: Board) {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = getPieceAtCell([r, c], board);
      if (piece) {
        score += getValueOfPiece(piece);
      }

      /* ----- Other custom factors ----- */

      // Reward pushed pawns
      if (piece === PieceType.PawnWhite) {
        score += 0.05 * (BOARD_SIZE - 2 - r);
      } else if (piece === PieceType.PawnBlack) {
        score -= 0.05 * (r - 1);
      }
    }
  }
  return score;
}

export function isInsufficientMaterial(board: Board) {
  let numBishops = 0,
    numKnights = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = getPieceAtCell([r, c], board);
      if (!piece) {
        continue;
      }
      switch (piece) {
        case PieceType.KnightBlack:
        case PieceType.KnightWhite:
          numKnights += 1;
          break;
        case PieceType.BishopBlack:
        case PieceType.BishopWhite:
          numBishops += 1;
          break;
        case PieceType.KingBlack:
        case PieceType.KingWhite:
          continue;
        default:
          // Any other piece is sufficient material
          return false;
      }
    }
  }
  return (
    (numBishops === 1 && numKnights === 0) ||
    (numKnights === 1 && numBishops === 0)
  );
}
