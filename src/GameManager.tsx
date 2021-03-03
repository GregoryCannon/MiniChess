import React from "react";
import {
  Board,
  Location,
  MoveMap,
  STARTING_BOARD,
  TurnState,
  VisitedStates,
  WIN_BLACK_VALUE,
  WIN_WHITE_VALUE,
} from "./constants";
import "./GameManager.css";
import GameBoard from "./ui_components/GameBoard";
import {
  convertToMoveMap,
  generatePossibleMoves,
  addBoardToVisitedStates,
  kingIsInCheck,
  noLegalMoves,
  isDrawByRepetition,
} from "./utils/move-utils";
import { getBoardAfterMove, isInsufficientMaterial } from "./utils/board-utils";
import { formatLocation, formatMove } from "./utils/io-utils";
import { getBestMove } from "./utils/ai";
import { AI_MOVE_DELAY, blackIsHuman, whiteIsHuman } from "./utils/config";

class GameManager extends React.Component<
  {},
  {
    board: Board;
    turnState: TurnState;
    moveMap?: MoveMap;
    visitedStates: VisitedStates;
    selectedCell?: Location;
    positionEval?: number;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      board: STARTING_BOARD,
      turnState: TurnState.NotStarted,
      moveMap: undefined,
      visitedStates: new Map(),
      selectedCell: undefined,
      positionEval: undefined,
    };

    this.onCellClicked = this.onCellClicked.bind(this);
    this.restart = this.restart.bind(this);
    this.stopGame = this.stopGame.bind(this);
  }

  // Called after the board has been updated
  endTurn() {
    // Get the new visitedStates and turnState
    const newVisitedStates = addBoardToVisitedStates(
      this.state.board,
      this.state.visitedStates
    );
    let newTurnState =
      this.state.turnState === TurnState.WhiteTurn
        ? TurnState.BlackTurn
        : TurnState.WhiteTurn;

    // Check for game-over conditions
    const isWhiteNextTurn = newTurnState === TurnState.WhiteTurn;
    if (noLegalMoves(this.state.board, isWhiteNextTurn)) {
      if (kingIsInCheck(this.state.board, isWhiteNextTurn)) {
        newTurnState = isWhiteNextTurn
          ? TurnState.WinBlack
          : TurnState.WinWhite;
      } else {
        newTurnState = TurnState.DrawStalemate;
      }
    }
    if (isDrawByRepetition(this.state.board, newVisitedStates)) {
      newTurnState = TurnState.DrawRepetition;
    }
    if (isInsufficientMaterial(this.state.board)) {
      newTurnState = TurnState.DrawMaterial;
    }

    const nextPlayerIsHuman =
      newTurnState === TurnState.WhiteTurn ? whiteIsHuman : blackIsHuman;
    if (nextPlayerIsHuman) {
      // Generate legal moves for next player
      const moveMap = convertToMoveMap(
        generatePossibleMoves(this.state.board, newTurnState)
      );

      this.setState({
        selectedCell: undefined,
        turnState: newTurnState,
        visitedStates: newVisitedStates,
        moveMap,
      });
    } else {
      // Advance the turn and let AI make the next move
      this.setState(
        {
          selectedCell: undefined,
          turnState: newTurnState,
          visitedStates: newVisitedStates,
          moveMap: undefined,
        },
        () => this.playAiMoveAfterDelay(AI_MOVE_DELAY)
      );
    }
  }

  movePiece(start: Location, end: Location) {
    const newBoard = getBoardAfterMove(start, end, this.state.board);
    this.setState({ board: newBoard }, () => {
      this.endTurn();
    });
  }

  onCellClicked(clickLocation: Location) {
    if (
      !(
        this.state.turnState === TurnState.WhiteTurn ||
        this.state.turnState === TurnState.BlackTurn
      )
    ) {
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
        this.movePiece(startSquare, clickLocation);
        return;
      }
    }

    // Otherwise, select the square that was clicked (if the piece is movable)
    if (this.getMovablePieces().has(formatLocation(clickLocation))) {
      this.setState({ selectedCell: clickLocation });
    }
  }

  getLegalDestinations(): Set<string> {
    if (!this.state.selectedCell || !this.state.moveMap) {
      return new Set();
    }
    return (
      this.state.moveMap.get(formatLocation(this.state.selectedCell)) ||
      new Set()
    );
  }

  getMovablePieces() {
    return new Set(this.state.moveMap?.keys());
  }

  getSemiHighlightedCells(): Set<string> {
    const cellSet: Set<string> = new Set();

    if (this.state.selectedCell) {
      if (!this.state.moveMap) {
        return cellSet;
      }
      // Return all the cells that the selected piece can move to
      return this.getLegalDestinations() || cellSet;
    } else {
      // Return all the pieces that have legal moves
      return this.getMovablePieces();
    }
  }

  getStatusMessage() {
    switch (this.state.turnState) {
      case TurnState.NotStarted:
        return "Click Start to start a new game!";
      case TurnState.WinWhite:
        return "White wins!";
      case TurnState.WinBlack:
        return "Black wins!";
      case TurnState.DrawRepetition:
        return "Draw by repetition.";
      case TurnState.DrawStalemate:
        return "Draw by stalemate.";
      case TurnState.DrawMaterial:
        return "Draw by material";
      case TurnState.WhiteTurn:
        return "White's turn.";
      case TurnState.BlackTurn:
        return "Black's turn.";
    }
  }

  playAiMoveAfterDelay(delayMs: number) {
    const self = this;
    setTimeout(function () {
      self.playAiMoveInternal();
    }, delayMs);
  }

  playAiMoveInternal() {
    if (
      this.state.turnState !== TurnState.WhiteTurn &&
      this.state.turnState !== TurnState.BlackTurn
    ) {
      return;
    }
    const aiResult = getBestMove(
      this.state.board,
      this.state.turnState === TurnState.WhiteTurn,
      this.state.visitedStates
    );
    const aiMove = aiResult.bestMove;
    if (!aiMove) {
      return;
    }
    console.log("Ai Move:", formatMove(aiMove), "Value:", aiResult.score);
    const newBoard = getBoardAfterMove(
      aiMove.startCell,
      aiMove.endCell,
      this.state.board
    );
    this.setState({ board: newBoard, positionEval: aiResult.score }, () => {
      this.endTurn();
    });
  }

  restart() {
    if (whiteIsHuman) {
      this.setState({
        board: STARTING_BOARD,
        turnState: TurnState.WhiteTurn,
        moveMap: convertToMoveMap(
          generatePossibleMoves(STARTING_BOARD, TurnState.WhiteTurn)
        ),
        visitedStates: new Map(),
        selectedCell: undefined,
        positionEval: undefined,
      });
    } else {
      this.setState(
        {
          board: STARTING_BOARD,
          turnState: TurnState.WhiteTurn,
          visitedStates: new Map(),
          positionEval: undefined,
        },
        () => {
          this.playAiMoveAfterDelay(AI_MOVE_DELAY);
        }
      );
    }
  }

  stopGame() {
    this.setState({
      turnState: TurnState.NotStarted,
    });
  }

  convertEvalToBarPercentage(positionEval?: number) {
    if (positionEval === undefined) {
      return 0;
    }
    // Use a logistic model, such that small advantages (e.g. +3, -2) are weighted heavily, then it tapers off towards 100% or 0%.
    const steepnessMultiplier = 0.3;
    return (
      100 / (1 + Math.pow(Math.E, -1 * positionEval * steepnessMultiplier))
    );
  }

  getEvalLabelText() {
    if (this.state.positionEval === undefined) {
      return "";
    }
    return this.state.positionEval >= WIN_WHITE_VALUE / 10 ||
      this.state.positionEval <= WIN_BLACK_VALUE / 10
      ? "Forced Mate"
      : this.state.positionEval?.toFixed(2);
  }

  render() {
    const secondaryHighlightedCells: Set<string> = this.getSemiHighlightedCells();
    const evalPercentage = this.convertEvalToBarPercentage(
      this.state.positionEval
    );
    const evalLabelText = this.getEvalLabelText();

    return (
      <div className="GameManager">
        <h3>{this.getStatusMessage()}</h3>
        <div
          className="eval-bar-container"
          style={{
            visibility:
              this.state.positionEval === undefined ? "hidden" : "visible",
          }}
        >
          <div className="eval-text-container">
            <div className="eval-text">{evalLabelText}</div>
          </div>
          <div
            className="eval-bar"
            style={{ width: evalPercentage + "%" }}
          ></div>
        </div>
        <div className="game-board-container">
          <GameBoard
            onCellClicked={this.onCellClicked}
            selectedCell={this.state.selectedCell}
            secondaryHighlightedCells={secondaryHighlightedCells}
            board={this.state.board}
          />
        </div>
        <button onClick={this.restart}>
          {this.state.turnState === TurnState.WhiteTurn ||
          this.state.turnState === TurnState.BlackTurn
            ? "Restart"
            : "Start!"}
        </button>
        <button onClick={this.stopGame}>Stop</button>
      </div>
    );
  }
}

export default GameManager;
