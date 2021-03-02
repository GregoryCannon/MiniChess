import {
  Board,
  BOARD_SIZE,
  EvalResult,
  PieceType,
  TurnState,
} from "../constants";
import { getBoardAfterMove, getPieceAtCell } from "./board-utils";
import { formatMove } from "./io-utils";
import { generatePossibleMoves, isCheckmate } from "./move-utils";

const MAX_SEARCH_DEPTH = 4;

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

function getRawValueOfBoard(board: Board, isWhite: boolean) {
  // Check for checkmate
  if (isCheckmate(board, isWhite)) {
    return isWhite ? -999999 : 999999;
  }

  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = getPieceAtCell([r, c], board);
      if (piece) {
        score += getValueOfPiece(piece);
      }
    }
  }
  return score;
}

export function getBestMove(
  board: Board,
  isWhite: boolean,
  searchDepth = MAX_SEARCH_DEPTH
): EvalResult {
  // console.log("Evaluating board at depth " + searchDepth);

  // Check for game over
  const moveList = generatePossibleMoves(
    board,
    isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
  );
  if (moveList.length === 0) {
    return {
      score: isCheckmate(board, isWhite) ? (isWhite ? -999999 : 999999) : 0,
      bestMove: undefined,
    };
  }

  // Maximize/Minimize
  let bestMove = undefined;
  let bestScore = isWhite ? -999999 : 999999;
  for (const move of moveList) {
    let moveScore;
    const boardAfter = getBoardAfterMove(move.startCell, move.endCell, board);

    if (searchDepth === 0) {
      // If no search depth left, evaluate each board with static eval
      moveScore = getRawValueOfBoard(boardAfter, !isWhite);
    } else {
      // Evaluate the move score recursively
      const opponentResult = getBestMove(boardAfter, !isWhite, searchDepth - 1);
      moveScore = opponentResult.score;
    }

    if (searchDepth === MAX_SEARCH_DEPTH) {
      console.log(`Move ${formatMove(move)} has score ${moveScore}`);
    }
    if (
      (isWhite && moveScore > bestScore) ||
      (!isWhite && moveScore < bestScore)
    ) {
      // Found new best move
      bestScore = moveScore;
      bestMove = move;
    }
  }
  return { score: bestScore, bestMove };
}
