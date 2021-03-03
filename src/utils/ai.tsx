import {
  Board,
  BOARD_SIZE,
  EvalResult,
  PieceType,
  TurnState,
  VisitedStates,
} from "../constants";
import {
  getBoardAfterMove,
  getPieceAtCell,
  getStaticValueOfBoard,
  isInsufficientMaterial,
} from "./board-utils";
import { encodeBoard, formatMove } from "./io-utils";
import {
  addBoardToVisitedStates,
  generatePossibleMoves,
  isDrawByRepetition,
  kingIsInCheck,
} from "./move-utils";

const MAX_SEARCH_DEPTH = 4;

export function getBestMove(
  board: Board,
  isWhite: boolean,
  visitedStates: VisitedStates,
  searchDepth = MAX_SEARCH_DEPTH
): EvalResult {
  // if (searchDepth === MAX_SEARCH_DEPTH - 1) {
  //   const boardStr = encodeBoard(board);
  //   console.log(
  //     "Examining Board\n",
  //     encodeBoard(board),
  //     "TIMES VISITED",
  //     visitedStates.get(boardStr) || 0
  //   );
  // }
  if (searchDepth === MAX_SEARCH_DEPTH) {
    console.log(
      `------------------\n${
        isWhite ? "White" : "Black"
      } to move, with board: ${encodeBoard(board)}`
    );
  }

  const staticValue = getStaticValueOfBoard(board);

  // Check for game over by checkmate or stalemate
  const moveList = generatePossibleMoves(
    board,
    isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
  );
  if (moveList.length === 0) {
    return {
      score: kingIsInCheck(board, isWhite) ? (isWhite ? -999999 : 999999) : 0,
    };
  }

  // Check for draw by repetition
  if (isDrawByRepetition(board, visitedStates)) {
    return {
      score: 0,
    };
  }

  // Check for insufficient material
  if (Math.abs(staticValue) <= 3 && isInsufficientMaterial(board)) {
    return {
      score: 0,
    };
  }

  // Maximize/Minimize
  let bestMove = undefined;
  let bestScore = isWhite ? -999999999 : 99999999;
  for (const move of moveList) {
    let moveScore;
    const boardAfter = getBoardAfterMove(move.startCell, move.endCell, board);
    const visistedAfter = addBoardToVisitedStates(boardAfter, visitedStates);

    if (searchDepth === 0) {
      // If no search depth left, evaluate each board with static eval
      moveScore = getStaticValueOfBoard(boardAfter);
    } else {
      // Evaluate the move score recursively
      const opponentResult = getBestMove(
        boardAfter,
        !isWhite,
        visistedAfter,
        searchDepth - 1
      );
      // Give a very small adjustment based on the heuristic score partway through each gameplay line.
      // This lets the AI have a tiebreaker between equivalent positions in the lategame, opting to capitalize on advantages in fewer moves.
      const intermediateScoreAdjustment =
        0.01 *
        getStaticValueOfBoard(boardAfter) *
        (MAX_SEARCH_DEPTH - searchDepth);
      moveScore = opponentResult.score + intermediateScoreAdjustment;
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
