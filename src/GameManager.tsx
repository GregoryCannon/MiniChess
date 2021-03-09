import React from "react";
import {
  Board,
  Location,
  Move,
  MoveMap,
  TurnState,
  VisitedStates,
} from "./constants";
import "./GameManager.css";
import {
  getMoveMap,
  addBoardToVisitedStates,
  generatePossibleMoves,
  convertMoveListToMoveMap,
} from "./utils/move-calculator";
import { getBoardAfterMove } from "./utils/board-functions";
import { consoleLog, formatLocation, formatMove } from "./utils/io";
import { getAiMove } from "./utils/ai";
import {
  AI_MOVE_DELAY,
  BLACK_IS_HUMAN,
  WHITE_IS_HUMAN,
  getStartingBoard,
} from "./utils/config";
import { GameRenderer } from "./GameRenderer";
import { gameIsInProgress } from "./utils/utils";
import { checkForGameOver } from "./utils/static-eval";

class GameManager extends React.Component<
  {},
  {
    board: Board;
    turnState: TurnState;
    turnCount: number;
    visitedStates: VisitedStates;
    moveMap?: MoveMap;
    selectedCell?: Location;
    positionEval?: number;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      board: getStartingBoard(),
      turnState: TurnState.NotStarted,
      turnCount: 1,
      moveMap: undefined,
      visitedStates: new Map(),
      selectedCell: undefined,
      positionEval: undefined,
    };

    this.onCellClicked = this.onCellClicked.bind(this);
    this.restart = this.restart.bind(this);
    this.stopGame = this.stopGame.bind(this);
  }

  restart() {
    this.setState(
      {
        board: getStartingBoard(),
        turnState: TurnState.WhiteTurn,
        turnCount: 1,
        moveMap: WHITE_IS_HUMAN
          ? getMoveMap(getStartingBoard(), TurnState.WhiteTurn)
          : undefined,
        visitedStates: new Map(),
        selectedCell: undefined,
        positionEval: undefined,
      },
      () => {
        if (!WHITE_IS_HUMAN) {
          this.playAiMoveAfterDelay();
        }
      }
    );
  }

  makeMove(move: Move, evalAfterMove?: number) {
    // Get the new board, visitedStates and turnState
    const nextBoard = getBoardAfterMove(move, this.state.board);
    const nextVisitedStates = addBoardToVisitedStates(
      nextBoard,
      this.state.visitedStates
    );
    let nextTurnState =
      this.state.turnState === TurnState.WhiteTurn
        ? TurnState.BlackTurn
        : TurnState.WhiteTurn;
    const nextMoveList = generatePossibleMoves(nextBoard, nextTurnState);

    // Check for game-over conditions
    const [gameIsOver, score, gameOverTurnState] = checkForGameOver(
      nextBoard,
      nextTurnState === TurnState.WhiteTurn,
      nextVisitedStates,
      nextMoveList
    );
    if (gameIsOver) {
      nextTurnState = gameOverTurnState;
    }

    // Compile the new state object
    const nextPlayerIsHuman =
      nextTurnState === TurnState.WhiteTurn ? WHITE_IS_HUMAN : BLACK_IS_HUMAN;
    const nextState = {
      selectedCell: undefined,
      turnState: nextTurnState,
      turnCount: this.state.turnCount + 0.5,
      moveMap: nextPlayerIsHuman
        ? convertMoveListToMoveMap(nextMoveList)
        : undefined,
      visitedStates: nextVisitedStates,
      board: nextBoard,
      positionEval: evalAfterMove,
    };

    // Advance the turn and let AI make the next move
    this.setState(nextState, () => {
      if (!nextPlayerIsHuman) {
        this.playAiMoveAfterDelay();
      }
    });
  }

  /* ------------------------
        USER INTERACTION
     ----------------------- */

  onCellClicked(clickLocation: Location) {
    if (!gameIsInProgress(this.state.turnState)) {
      return;
    }

    if (this.state.selectedCell) {
      // If clicked on selected piece, de-select it
      if (clickLocation.toString() === this.state.selectedCell.toString()) {
        this.setState({ selectedCell: undefined });
        return;
      }

      // Otherwise, attempt to move the piece there
      const startSquare = this.state.selectedCell;
      if (
        this.getMovablePieces().has(formatLocation(this.state.selectedCell)) &&
        this.getLegalDestinations().has(formatLocation(clickLocation))
      ) {
        const move = this.state.moveMap
          ?.get(formatLocation(startSquare))
          ?.get(formatLocation(clickLocation));
        if (!move) {
          throw Error("Couldn't find move in move map");
        }
        this.makeMove(move);
        return;
      }
    }

    // Otherwise, select the square that was clicked (if the piece is movable)
    if (this.getMovablePieces().has(formatLocation(clickLocation))) {
      this.setState({ selectedCell: clickLocation });
    }
  }

  /** Find all locations where a legal move can end. */
  getLegalDestinations(): Set<string> {
    if (!this.state.selectedCell || !this.state.moveMap) {
      return new Set();
    }
    const startCellStr = formatLocation(this.state.selectedCell);
    return new Set(this.state.moveMap.get(startCellStr)?.keys());
  }

  /** Find all locations where a legal move can start. */
  getMovablePieces() {
    return new Set(this.state.moveMap?.keys());
  }

  /** Halt the current game. At the moment, the game cannot be resumed, only restarted. */
  stopGame() {
    this.setState({
      turnState: TurnState.NotStarted,
    });
  }

  /* ----------------------------
        AI PLAYER INTEGRATION
     ---------------------------- */

  playAiMoveAfterDelay() {
    const self = this;
    setTimeout(function () {
      self.playAiMoveInternal();
    }, AI_MOVE_DELAY);
  }

  playAiMoveInternal() {
    if (
      this.state.turnState !== TurnState.WhiteTurn &&
      this.state.turnState !== TurnState.BlackTurn
    ) {
      return;
    }
    const aiResult = getAiMove(
      this.state.board,
      this.state.turnState === TurnState.WhiteTurn,
      this.state.visitedStates
    );
    const aiMove = aiResult.aiMove || undefined;

    this.makeMove(aiMove, aiMove.score);
  }

  render() {
    return (
      <GameRenderer
        board={this.state.board}
        turnState={this.state.turnState}
        turnCount={this.state.turnCount}
        visitedStates={this.state.visitedStates}
        movablePieces={this.getMovablePieces()}
        legalDestinations={this.getLegalDestinations()}
        stopGameFunction={this.stopGame}
        restartFunction={this.restart}
        onCellClickedFunction={this.onCellClicked}
        selectedCell={this.state.selectedCell}
        positionEval={this.state.positionEval}
      />
    );
  }
}

export default GameManager;
