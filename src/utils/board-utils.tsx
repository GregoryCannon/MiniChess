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
  const initialPiece = getPieceAtCell(startCell, board);
  const [startRow, startCol] = startCell;
  const [endRow, endCol] = endCell;

  const newBoard = JSON.parse(JSON.stringify(board));
  newBoard[startRow][startCol] = EMPTY;
  newBoard[endRow][endCol] = initialPiece;
  return newBoard;
}
