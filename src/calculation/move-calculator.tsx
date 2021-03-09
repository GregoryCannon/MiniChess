import { BOARD_SIZE } from "../config";
import {
  PieceType,
  Location,
  Board,
  TurnState,
  Move,
  MoveMap,
  VisitedStates,
} from "../constants";
import {
  getPieceAtCell,
  isColorOfCurrentPlayer,
  cellIsEmpty,
  cellHasEnemyPiece,
  isWhitePiece,
  isBlackPiece,
  getBoardAfterMove,
} from "./board-functions";
import { encodeBoard, formatLocation } from "./io";

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

export function getMoveMap(board: Board, turnState: TurnState): MoveMap {
  return convertMoveListToMoveMap(generatePossibleMoves(board, turnState));
}

/**
 * Convert a list of moves to a movement map, which maps the starting locations to the list of possible end locations.
 * NB: The keys and values are --formatted-- locations, to avoid the problem of array equality.
 */
export function convertMoveListToMoveMap(moveList: Array<Move>): MoveMap {
  const map = new Map();
  for (const move of moveList) {
    const startStr = formatLocation(move.startCell);
    const endStr = formatLocation(move.endCell);
    if (!map.has(startStr)) {
      map.set(startStr, new Map());
    }
    map.get(startStr).set(endStr, move);
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
      legalMoves = legalMoves.concat(
        getMovesForPiece(piece, startCell, board, turnState)
      );
    }
  }

  return legalMoves;
}

function getMovesForPiece(
  pieceType: PieceType,
  startCell: Location,
  board: Board,
  turnState: TurnState
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
      tryMoveOrCaptureAtLocation(row - 1, col + 2);
      tryMoveOrCaptureAtLocation(row - 1, col - 2);
      tryMoveOrCaptureAtLocation(row + 1, col + 2);
      tryMoveOrCaptureAtLocation(row + 1, col - 2);
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

  // Filter out moves that leave the king in check
  movesForPiece = movesForPiece.filter((move) => {
    const boardAfter = getBoardAfterMove(move, board);
    return !boardStateIsIllegal(boardAfter, turnState);
  });

  return movesForPiece;
}

function kingHasRooklikeAttackers(
  kingRow: number,
  kingCol: number,
  board: Board,
  isWhite: boolean
) {
  const isEnemyRookLike = (type?: PieceType) =>
    isWhite
      ? type === PieceType.RookBlack || type === PieceType.QueenBlack
      : type === PieceType.RookWhite || type === PieceType.QueenWhite;

  // Scan right
  let [r, c] = [kingRow + 1, kingCol];
  while (cellIsEmpty([r, c], board)) {
    r += 1;
  }
  if (isEnemyRookLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan left
  [r, c] = [kingRow - 1, kingCol];
  while (cellIsEmpty([r, c], board)) {
    r -= 1;
  }
  if (isEnemyRookLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan up
  [r, c] = [kingRow, kingCol - 1];
  while (cellIsEmpty([r, c], board)) {
    c -= 1;
  }
  if (isEnemyRookLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan down
  [r, c] = [kingRow, kingCol + 1];
  while (cellIsEmpty([r, c], board)) {
    c += 1;
  }
  if (isEnemyRookLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  return false;
}

function kingHasBishoplikeAttackers(
  kingRow: number,
  kingCol: number,
  board: Board,
  isWhite: boolean
) {
  const isEnemyBishopLike = (type?: PieceType) =>
    isWhite
      ? type === PieceType.BishopBlack || type === PieceType.QueenBlack
      : type === PieceType.BishopWhite || type === PieceType.QueenWhite;

  // Scan up-right
  let [r, c] = [kingRow - 1, kingCol + 1];
  while (cellIsEmpty([r, c], board)) {
    r -= 1;
    c += 1;
  }
  if (isEnemyBishopLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan up-left
  [r, c] = [kingRow - 1, kingCol - 1];
  while (cellIsEmpty([r, c], board)) {
    r -= 1;
    c -= 1;
  }
  if (isEnemyBishopLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan down-right
  [r, c] = [kingRow + 1, kingCol + 1];
  while (cellIsEmpty([r, c], board)) {
    r += 1;
    c += 1;
  }
  if (isEnemyBishopLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  // Scan down-left
  [r, c] = [kingRow + 1, kingCol - 1];
  while (cellIsEmpty([r, c], board)) {
    r += 1;
    c -= 1;
  }
  if (isEnemyBishopLike(getPieceAtCell([r, c], board))) {
    return true;
  }

  return false;
}

function findKings(board: Board, isWhite: boolean) {
  // Find the kings
  let kingRow = undefined,
    kingCol = undefined;
  let enemyKingRow = undefined,
    enemyKingCol = undefined;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (
        (isWhite && board[r][c] === PieceType.KingWhite) ||
        (!isWhite && board[r][c] === PieceType.KingBlack)
      ) {
        kingRow = r;
        kingCol = c;
      } else if (
        (!isWhite && board[r][c] === PieceType.KingWhite) ||
        (isWhite && board[r][c] === PieceType.KingBlack)
      ) {
        enemyKingRow = r;
        enemyKingCol = c;
      }
    }
  }
  if (
    kingRow === undefined ||
    kingCol === undefined ||
    enemyKingRow === undefined ||
    enemyKingCol === undefined
  ) {
    return undefined;
  }
  return [kingRow, kingCol, enemyKingRow, enemyKingCol];
}

export function kingIsInCheck(
  board: Board,
  isWhite: boolean,
  kingRow?: number,
  kingCol?: number
) {
  // Find kings if location not provided
  const kingLocations = findKings(board, isWhite);
  if (kingLocations === undefined) {
    throw new Error("Cannot evaluate board, missing king" + encodeBoard(board));
  }
  kingRow = kingLocations[0];
  kingCol = kingLocations[1];

  // Check for pawn attackers
  if (isWhite) {
    if (
      getPieceAtCell([kingRow - 1, kingCol - 1], board) ===
        PieceType.PawnBlack ||
      getPieceAtCell([kingRow - 1, kingCol + 1], board) === PieceType.PawnBlack
    ) {
      return true;
    }
  } else {
    if (
      getPieceAtCell([kingRow + 1, kingCol - 1], board) ===
        PieceType.PawnWhite ||
      getPieceAtCell([kingRow + 1, kingCol + 1], board) === PieceType.PawnWhite
    ) {
      return true;
    }
  }

  // Check for knight attackers
  const enemyKnightType = isWhite
    ? PieceType.KnightBlack
    : PieceType.KnightWhite;
  if (
    getPieceAtCell([kingRow + 2, kingCol - 1], board) === enemyKnightType ||
    getPieceAtCell([kingRow + 2, kingCol + 1], board) === enemyKnightType ||
    getPieceAtCell([kingRow - 2, kingCol - 1], board) === enemyKnightType ||
    getPieceAtCell([kingRow - 2, kingCol + 1], board) === enemyKnightType ||
    getPieceAtCell([kingRow + 1, kingCol - 2], board) === enemyKnightType ||
    getPieceAtCell([kingRow + 1, kingCol + 2], board) === enemyKnightType ||
    getPieceAtCell([kingRow - 1, kingCol - 2], board) === enemyKnightType ||
    getPieceAtCell([kingRow - 1, kingCol + 2], board) === enemyKnightType
  ) {
    return true;
  }

  // Check for rook-like attackers
  if (kingHasRooklikeAttackers(kingRow, kingCol, board, isWhite)) {
    return true;
  }

  // Check for bishop-like attackers
  if (kingHasBishoplikeAttackers(kingRow, kingCol, board, isWhite)) {
    return true;
  }
}

/**
 * Checks if a board state either leaves the friendly king in check, or has touching kings.
 * @param board
 * @param turnState
 */
export function boardStateIsIllegal(board: Board, turnState: TurnState) {
  // Check for bad turn state
  if (
    !(turnState === TurnState.WhiteTurn || turnState === TurnState.BlackTurn)
  ) {
    throw new Error(
      "Requested king check status for invalid turn state: " + turnState
    );
  }
  const isWhite = turnState === TurnState.WhiteTurn;

  // Find the kings
  const kingLocations = findKings(board, isWhite);
  if (kingLocations === undefined) {
    return true;
  }
  let [kingRow, kingCol, enemyKingRow, enemyKingCol] = kingLocations;

  // Check for kissing kings
  if (
    Math.abs(kingRow - enemyKingRow) <= 1 &&
    Math.abs(kingCol - enemyKingCol) <= 1
  ) {
    return true;
  }

  // The board state is illegal if the move puts the king in check
  return kingIsInCheck(board, isWhite, kingRow, kingCol);
}

export function noLegalMoves(board: Board, isWhite: boolean) {
  const moveList = generatePossibleMoves(
    board,
    isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
  );
  return moveList.length === 0;
}

export function addBoardToVisitedStates(
  board: Board,
  visitedStates: VisitedStates
) {
  const boardStr = encodeBoard(board);
  const newVisitedStates = new Map(visitedStates);
  if (newVisitedStates.has(boardStr)) {
    const existingVal = newVisitedStates.get(boardStr);
    if (existingVal !== undefined) {
      newVisitedStates.set(boardStr, existingVal + 1);
    }
  } else {
    newVisitedStates.set(boardStr, 1);
  }
  return newVisitedStates;
}

export function isDrawByRepetition(board: Board, visitedStates: VisitedStates) {
  const boardStr = encodeBoard(board);
  return visitedStates.has(boardStr) && (visitedStates.get(boardStr) || 0) > 2;
}
