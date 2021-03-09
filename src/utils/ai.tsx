import {
  AiResult,
  Board,
  EvaluationResult,
  Move,
  TurnState,
  VisitedStates,
  WIN_WHITE_VALUE,
} from "../constants";
import { getBoardAfterMove } from "./board-functions";
import { AI_INTELLIGENCE_FACTOR, MAX_SEARCH_DEPTH } from "./config";
import { consoleLog, encodeBoard, formatMove } from "./io";
import {
  addBoardToVisitedStates,
  boardStateIsIllegal,
  generatePossibleMoves,
} from "./move-calculator";
import { checkForGameOver, getStaticValueOfBoard } from "./static-eval";

/* Tiny weights for tiebreak factors, such that the tiebreak factors are never more
   significant than anything in the static eval, but if the static eval is tied, these
   factors break the ties in the specified order. */
const TIEBREAK_WEIGHT = 0.0001;

/**
 * Scale the value of mates based on their distance from the current position.
 * e.g. if it found mate on the first level, it returns 1.0 (mate in 1 is best). If it found a mate 3 levels down, it returns 0.8.
 */
function getEarlyMateMultiplier(searchDepthRemaining: number) {
  const extraMovesUsed = MAX_SEARCH_DEPTH - searchDepthRemaining;
  return Math.max(0.1, 1 - 0.1 * extraMovesUsed);
}

/**
 * Give a very small adjustment based on the heuristic score partway through each gameplay line.
 * This lets the AI have a tiebreaker between equivalent positions in the lategame,
 * opting to capitalize on advantages in fewer moves.
 *
 * e.g. prefer to do 1) promote pawn 2) king move, instead of 1) king move, 2) promote pawn
 */
function getIntermediateScoreAdjustment(board: Board, searchDepth: number) {
  return (
    TIEBREAK_WEIGHT *
    getStaticValueOfBoard(board) *
    (MAX_SEARCH_DEPTH - searchDepth)
  );
}

export function getAiMove(
  board: Board,
  isWhite: boolean,
  visitedStates: VisitedStates
): AiResult {
  // Log something nice for the start of the search
  consoleLog(
    1,
    `------------------\n${
      isWhite ? "White" : "Black"
    } to move, with board: ${encodeBoard(board)}`
  );

  // Run minimax
  const moveList = generatePossibleMoves(
    board,
    isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
  );
  // console.log("Initial move list:", moveList);
  const evalResult = evaluatePosition(
    board,
    moveList,
    isWhite,
    visitedStates,
    MAX_SEARCH_DEPTH,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER
  );
  const rankedMoveList = evalResult.rankedMoveList;

  // Choose the AI's move based on its intelligence factor
  let aiMoveRanking = 0;
  while (
    Math.random() > AI_INTELLIGENCE_FACTOR &&
    aiMoveRanking < rankedMoveList.length - 1
  ) {
    // Every time the AI rolls unluckily, move one spot down the move list
    aiMoveRanking++;
  }
  const aiMove = rankedMoveList[aiMoveRanking];

  consoleLog(
    1,
    `Selected AI move ${formatMove(
      aiMove
    )} with rank ${aiMoveRanking} and value ${aiMove.score}`
  );
  consoleLog(2, "----Ranked move list:----");
  rankedMoveList.forEach((evaluatedMove) =>
    consoleLog(
      2,
      `Move: ${formatMove(evaluatedMove)}, Score: ${
        evaluatedMove.score
      }, Line: ${evaluatedMove.anticipatedLine?.map(
        (x) => "\n" + encodeBoard(x)
      )}`
    )
  );

  return {
    aiMove: rankedMoveList[aiMoveRanking],
    trueBestMove: evalResult.rankedMoveList[0],
    aiMoveRanking,
  };
}

/**
 * Minimax algorithm with alpha-beta pruning.
 * @param board
 * @param isWhite
 * @param visitedStates
 * @param searchDepth
 * @param alpha - the highest score the maximizer has seen so far. If a subtree guaranteed has value less than this, don't bother exploring it.
 * @param beta - the lowest score the minimizer has seen so far. If a subtree guaranteed has value greater than this, don't bother exploring it.
 */
export function evaluatePosition(
  board: Board,
  moveList: Array<Move>,
  isWhite: boolean,
  visitedStates: VisitedStates,
  searchDepth: number,
  alpha: number,
  beta: number
): EvaluationResult {
  // console.log("Starting eval with movelist", moveList, isWhite, board);

  // Check for gameovers
  const [gameIsOver, gameOverVal] = checkForGameOver(
    board,
    isWhite,
    visitedStates,
    moveList
  );
  if (gameIsOver) {
    const scoreMultiplier =
      Math.abs(gameOverVal) >= WIN_WHITE_VALUE
        ? getEarlyMateMultiplier(searchDepth)
        : 1;
    return {
      score: gameOverVal * scoreMultiplier,
      rankedMoveList: [],
    };
  }

  // If no search depth remaining, evaluate with static eval
  if (searchDepth === 0) {
    return {
      score: getStaticValueOfBoard(board),
      rankedMoveList: [],
    };
  }

  // Maximize/Minimize
  const rankedMoveList = [];
  for (const move of moveList) {
    // console.log("Inspecting move:", move);
    const boardAfter = getBoardAfterMove(move, board);
    if (
      boardStateIsIllegal(
        boardAfter,
        isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
      )
    ) {
      console.log("ILLEGAL MOVELIST", encodeBoard(board), moveList, isWhite);
      throw Error("ILLEGAL STATE EVALUATED:" + encodeBoard(boardAfter));
    }

    const visitedAfter = addBoardToVisitedStates(boardAfter, visitedStates);
    const moveListAfter = generatePossibleMoves(
      boardAfter,
      isWhite ? TurnState.BlackTurn : TurnState.WhiteTurn
    );

    // Evaluate the value of the resulting board recursively
    const evalResult = evaluatePosition(
      boardAfter,
      moveListAfter,
      !isWhite,
      visitedAfter,
      searchDepth - 1,
      alpha,
      beta
    );

    // Add the current position to the current line, and adjust the eval score slightly for the current position
    const score =
      evalResult.score +
      getIntermediateScoreAdjustment(boardAfter, searchDepth);
    const bestResponseLine =
      evalResult.rankedMoveList.length > 0
        ? evalResult.rankedMoveList[0].anticipatedLine || []
        : [];
    const anticipatedLine = [board, ...bestResponseLine];

    // Add the evaluated move to the rated move list
    rankedMoveList.push({
      ...move,
      score,
      anticipatedLine,
    });

    // Update alpha and beta
    if (isWhite) {
      alpha = Math.max(alpha, score);
    } else {
      beta = Math.min(beta, score);
    }

    // If beta <= alpha (or alpha >= beta), it means no future subtrees from this node will be relevant.
    // This is because if the current player does any better from this point on, the opponent will never send them to this subtree.
    if (beta <= alpha) {
      break; // Break out of the for loop and don't evaluate any more positions
    }
  }

  // Sort the moves by their expected score (decreasing, if white's turn, increasing if black's turn)
  rankedMoveList.sort((a, b) =>
    isWhite ? b.score - a.score : a.score - b.score
  );

  return {
    score: rankedMoveList[0].score,
    rankedMoveList,
  };
}

// if (searchDepth === MAX_SEARCH_DEPTH) {
//   consoleLog(2, `Move ${formatMove(move)} has score ${moveScore}`);
//   consoleLog(
//     3,
//     `with anticipated line: ${bestMove.anticipatedLine
//       ?.map((x) => encodeBoard(x))
//       .join("\n")}`
//   );
// }

// if (
//   (isWhite && moveScore > bestScore) ||
//   (!isWhite && moveScore < bestScore)
// ) {
//   // At the top-most search level (picking the actual move to be played), we model imperfect intelligence by
//   // sometimes ignoring a new best move.
//   if (
//     searchDepth === MAX_SEARCH_DEPTH &&
//     bestMove !== undefined &&
//     Math.random() > AI_INTELLIGENCE_FACTOR
//   ) {
//     consoleLog(1, "(!!!!) Ignoring new best move, by random chance");
//     continue;
//   }

//   // Save new best move
//   bestScore = moveScore;
//   bestMove = move;
//   anticipatedLine = [board, ...(evalResult.anticipatedLine || [])];
