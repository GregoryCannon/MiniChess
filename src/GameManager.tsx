import React from "react";
import {
  Board,
  Location,
  MoveMap,
  STARTING_BOARD,
  TurnState,
} from "./constants";
import "./GameManager.css";
import GameBoard from "./ui_components/GameBoard";
import { convertToMoveMap, generatePossibleMoves } from "./utils/move-utils";
import { getBoardAfterMove } from "./utils/board-utils";
import { formatLocation, formatMove } from "./utils/io-utils";
import { getBestMove } from "./utils/ai";

const blackIsHuman = false;
const whiteIsHuman = false;

class GameManager extends React.Component<
  {},
  {
    board: Board;
    turnState: TurnState;
    moveMap?: MoveMap;
    selectedCell?: Location;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      board: STARTING_BOARD,
      turnState: TurnState.NotStarted,
      moveMap: undefined,
      selectedCell: undefined,
    };

    this.onCellClicked = this.onCellClicked.bind(this);
    this.restart = this.restart.bind(this);
  }

  endTurn() {
    const nextTurnState =
      this.state.turnState === TurnState.WhiteTurn
        ? TurnState.BlackTurn
        : TurnState.WhiteTurn;
    const nextPlayerIsHuman =
      nextTurnState === TurnState.WhiteTurn ? whiteIsHuman : blackIsHuman;

    if (nextPlayerIsHuman) {
      // Generate legal moves for next player
      const moveMap = convertToMoveMap(
        generatePossibleMoves(this.state.board, nextTurnState)
      );

      this.setState({
        selectedCell: undefined,
        turnState: nextTurnState,
        moveMap,
      });
    } else {
      // Advance the turn and let AI make the next move
      this.setState(
        {
          selectedCell: undefined,
          turnState: nextTurnState,
          moveMap: undefined,
        },
        () => this.playAiMoveAfterDelay(1000)
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
      this.state.turnState === TurnState.NotStarted ||
      this.state.turnState === TurnState.GameOver
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
      case TurnState.GameOver:
        return "Game Over!";
      case TurnState.WhiteTurn:
        return "White's Turn.";
      case TurnState.BlackTurn:
        return "Black's Turn.";
    }
  }

  playAiMoveAfterDelay(delayMs: number) {
    const self = this;
    setTimeout(
      function () {
        console.log("Callback called");
        self.playAiMoveInternal();
      }.bind(this),
      delayMs
    );
  }

  playAiMoveInternal() {
    const aiResult = getBestMove(
      this.state.board,
      this.state.turnState === TurnState.WhiteTurn
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
    this.setState({ board: newBoard }, () => {
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
        selectedCell: undefined,
      });
    } else {
      this.setState(
        {
          board: STARTING_BOARD,
          turnState: TurnState.WhiteTurn,
        },
        () => {
          this.playAiMoveAfterDelay(1000);
        }
      );
    }
  }

  render() {
    const secondaryHighlightedCells: Set<string> = this.getSemiHighlightedCells();

    return (
      <div className="GameManager">
        <h2>Main Game</h2>
        <h4>{this.getStatusMessage()}</h4>

        <div className="game-board-container">
          <GameBoard
            onCellClicked={this.onCellClicked}
            selectedCell={this.state.selectedCell}
            secondaryHighlightedCells={secondaryHighlightedCells}
            board={this.state.board}
          />
        </div>

        <button onClick={this.restart}>
          {this.state.turnState === TurnState.GameOver ||
          this.state.turnState === TurnState.NotStarted
            ? "Start!"
            : "Restart"}
        </button>
      </div>
    );
  }
}

export default GameManager;
