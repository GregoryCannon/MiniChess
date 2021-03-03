import React from "react";
import {
  Board,
  Location,
  MoveMap,
  STARTING_BOARD,
  TurnState,
  VisitedStates,
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
import { encodeBoard, formatLocation, formatMove } from "./utils/io-utils";
import { getBestMove } from "./utils/ai";

const blackIsHuman = false;
const whiteIsHuman = false;
const AI_MOVE_DELAY = 100;

class GameManager extends React.Component<
  {},
  {
    board: Board;
    turnState: TurnState;
    moveMap?: MoveMap;
    visitedStates: VisitedStates;
    selectedCell?: Location;
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
    };

    this.onCellClicked = this.onCellClicked.bind(this);
    this.restart = this.restart.bind(this);
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
        visitedStates: new Map(),
        selectedCell: undefined,
      });
    } else {
      this.setState(
        {
          board: STARTING_BOARD,
          turnState: TurnState.WhiteTurn,
          visitedStates: new Map(),
        },
        () => {
          this.playAiMoveAfterDelay(AI_MOVE_DELAY);
        }
      );
    }
  }

  render() {
    const secondaryHighlightedCells: Set<string> = this.getSemiHighlightedCells();

    return (
      <div className="GameManager">
        <h3>{this.getStatusMessage()}</h3>

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
      </div>
    );
  }
}

export default GameManager;
