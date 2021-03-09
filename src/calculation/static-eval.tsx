import {
  Board,
  BOARD_SIZE,
  Move,
  PieceType,
  TurnState,
  VisitedStates,
  WIN_BLACK_VALUE,
  WIN_WHITE_VALUE,
} from "../constants";
import { getPieceAtCell, isInsufficientMaterial } from "./board-functions";
import {
  generatePossibleMoves,
  isDrawByRepetition,
  kingIsInCheck,
} from "./move-calculator";

/** Checks if the game is over, and if so, returns the base eval score. */
export function checkForGameOver(
  board: Board,
  isWhite: boolean,
  visitedStates: VisitedStates,
  moveList?: Array<Move>
): [boolean, number, TurnState] {
  // Get move list if not provided
  if (moveList === undefined) {
    moveList = generatePossibleMoves(
      board,
      isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
    );
  }

  // Check for game over by checkmate or stalemate
  if (moveList.length === 0) {
    return kingIsInCheck(board, isWhite)
      ? isWhite
        ? [true, WIN_BLACK_VALUE, TurnState.WinBlack]
        : [true, WIN_WHITE_VALUE, TurnState.WinWhite]
      : [true, 0, TurnState.DrawStalemate];
  }

  // Check for draw by repetition
  if (isDrawByRepetition(board, visitedStates)) {
    return [true, 0, TurnState.DrawRepetition];
  }

  // Check for insufficient material
  if (isInsufficientMaterial(board)) {
    return [true, 0, TurnState.DrawMaterial];
  }

  // Otherwise, not game over
  return [false, 0, isWhite ? TurnState.BlackTurn : TurnState.WhiteTurn];
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
      throw Error("Requested value of unknown piece" + piece);
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
