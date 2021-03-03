import {
  Board,
  EvalResult,
  TurnState,
  VisitedStates,
  WIN_BLACK_VALUE,
  WIN_WHITE_VALUE,
} from "../constants";
import {
  getBoardAfterMove,
  getStaticValueOfBoard,
  isInsufficientMaterial,
} from "./board-utils";
import { AI_INTELLIGENCE_FACTOR, MAX_SEARCH_DEPTH } from "./config";
import { encodeBoard, formatMove } from "./io-utils";
import {
  addBoardToVisitedStates,
  generatePossibleMoves,
  isDrawByRepetition,
  kingIsInCheck,
} from "./move-utils";

/* Tiny weights for tiebreak factors, such that the tiebreak factors are never more
   significant than anything in the static eval, but if the static eval is tied, these
   factors break the ties in the specified order. */
const TIEBREAK_TIER_1_WEIGHT = 0.0001;
const TIEBREAK_TIER_2_WEIGHT = 0.000001;

export function getBestMove(
  board: Board,
  isWhite: boolean,
  visitedStates: VisitedStates,
  searchDepth = MAX_SEARCH_DEPTH
): EvalResult {
  // Log something nice for the start of the minimax search
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
    // To prevent the AI from not acting on gameover scenarios, provide a very small tiebreak bonus for early gameovers.
    const earlyGameEndReward =
      ((MAX_SEARCH_DEPTH - searchDepth) / MAX_SEARCH_DEPTH) *
      TIEBREAK_TIER_1_WEIGHT *
      (isWhite ? 1 : -1);
    return {
      score:
        (kingIsInCheck(board, isWhite)
          ? isWhite
            ? WIN_BLACK_VALUE
            : WIN_WHITE_VALUE
          : 0) + earlyGameEndReward,
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
  let bestScore = isWhite
    ? -1 * Number.MAX_SAFE_INTEGER
    : Number.MAX_SAFE_INTEGER;
  for (const move of moveList) {
    let moveScore;
    const boardAfter = getBoardAfterMove(move.startCell, move.endCell, board);
    const visitedAfter = addBoardToVisitedStates(boardAfter, visitedStates);

    if (searchDepth === 0) {
      // If no search depth left, evaluate each board with static eval
      moveScore = getStaticValueOfBoard(boardAfter);
    } else {
      // Evaluate the move score recursively
      const opponentResult = getBestMove(
        boardAfter,
        !isWhite,
        visitedAfter,
        searchDepth - 1
      );
      // Give a very small adjustment based on the heuristic score partway through each gameplay line.
      // This lets the AI have a tiebreaker between equivalent positions in the lategame, opting to capitalize on advantages in fewer moves.
      const intermediateScoreAdjustment =
        TIEBREAK_TIER_2_WEIGHT *
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
      // At the top-most search level (picking the actual move to be played), we model imperfect intelligence by
      // sometimes ignoring a new best move.
      if (
        searchDepth === MAX_SEARCH_DEPTH &&
        bestMove !== undefined &&
        Math.random() > AI_INTELLIGENCE_FACTOR
      ) {
        console.log("Ignoring new best move, by random chance");
        continue;
      }

      // Save new best move
      bestScore = moveScore;
      bestMove = move;
    }
  }
  return { score: bestScore, bestMove };
}
