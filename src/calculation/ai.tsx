import {
  AiResult,
  Board,
  EvaluatedMove,
  EvaluationResult,
  Move,
  TurnState,
  VisitedStates,
  WIN_WHITE_VALUE,
} from "../constants";
import { getBoardAfterMove } from "./board-functions";
import {
  AI_INTELLIGENCE_FACTOR_BLACK,
  AI_INTELLIGENCE_FACTOR_WHITE,
  MAX_SEARCH_DEPTH,
  SHOULD_ITERATIVE_DEEPEN,
  THINK_TIME_MS,
} from "../config";
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

function moveListsEqual(
  listA: Array<EvaluatedMove>,
  listB: Array<EvaluatedMove>
) {
  if (listA.length !== listB.length) {
    return false;
  }
  for (let i = 0; i < listA.length; i++) {
    const a = listA[i];
    const b = listB[i];
    if (
      formatMove(a) !== formatMove(b) ||
      a.score !== b.score ||
      a.anticipatedLine?.length !== b.anticipatedLine?.length
    ) {
      return false;
    }
  }
  return true;
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

  // Get the list of legal moves
  let rankedMoveList: Array<EvaluatedMove> = generatePossibleMoves(
    board,
    isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
  ).map((move) => ({ score: 0, ...move })); // Add 0 scores so they have type 'EvaluatedMove'

  const computationStartTime = Date.now();

  // If we're iterative deepening, start at a small depth and increase over time,
  // otherwise, do one pass at the max depth.
  const initialDepth = SHOULD_ITERATIVE_DEEPEN ? 1 : MAX_SEARCH_DEPTH;
  for (
    let searchDepth = initialDepth;
    searchDepth <= 100 && Date.now() - computationStartTime < THINK_TIME_MS;
    searchDepth++
  ) {
    consoleLog(1, `Evaluating the position, with depth ${searchDepth}`);
    // Evaluate the position, checking moves in order of their ranking so far (if we've ranked them)
    const evalResult = evaluatePosition(
      board,
      rankedMoveList,
      isWhite,
      visitedStates,
      searchDepth,
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER
    );

    console.log(
      "After depth of",
      searchDepth,
      evalResult.rankedMoveList.map(
        (move) => `Move: ${formatMove(move)}, Score: ${move.score}`
      )
    );
    if (moveListsEqual(rankedMoveList, evalResult.rankedMoveList)) {
      consoleLog(1, "Reached steady state.");
      break;
    }
    rankedMoveList = evalResult.rankedMoveList;
  }

  // Choose the AI's move based on its intelligence factor
  let aiMoveRanking = 0;
  const intelligenceFactor = isWhite
    ? AI_INTELLIGENCE_FACTOR_WHITE
    : AI_INTELLIGENCE_FACTOR_BLACK;
  while (
    Math.random() > intelligenceFactor &&
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
    trueBestMove: rankedMoveList[0],
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
    // Assign the value of this position to all moves
    const staticEval = getStaticValueOfBoard(board);
    return {
      score: staticEval,
      rankedMoveList: moveList.map((move) => ({ ...move, score: staticEval })),
    };
  }

  // Maximize/Minimize
  const rankedMoveList = [];
  for (const move of moveList) {
    const boardAfter = getBoardAfterMove(move, board);
    if (
      boardStateIsIllegal(
        boardAfter,
        isWhite ? TurnState.WhiteTurn : TurnState.BlackTurn
      )
    ) {
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
