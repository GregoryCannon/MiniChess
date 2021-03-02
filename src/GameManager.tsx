import React from "react";
import {
  Board,
  EMPTY,
  Location,
  MoveMap,
  STARTING_BOARD,
  TurnState,
} from "./constants";
import "./GameManager.css";
import GameBoard from "./ui_components/GameBoard";
import {
  canMovePiece,
  convertToMoveMap,
  formatMove,
  generatePossibleMoves,
  getPieceAtCell,
  isColorOfCurrentPlayer,
} from "./utils";

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
      turnState: TurnState.WhiteTurn,
      moveMap: convertToMoveMap(
        generatePossibleMoves(STARTING_BOARD, TurnState.WhiteTurn)
      ),
      selectedCell: undefined,
    };

    this.onCellClicked = this.onCellClicked.bind(this);
    this.restart = this.restart.bind(this);
  }

  canSelectCell(location: Location) {
    const selectedPiece = getPieceAtCell(location, this.state.board);
    if (!selectedPiece) {
      return false;
    }
    return isColorOfCurrentPlayer(selectedPiece, this.state.turnState);
  }

  endTurn() {
    const nextTurnState =
      this.state.turnState === TurnState.WhiteTurn
        ? TurnState.BlackTurn
        : TurnState.WhiteTurn;

    // Generate legal moves for next player
    const moveMap = convertToMoveMap(
      generatePossibleMoves(this.state.board, nextTurnState)
    );

    this.setState({
      selectedCell: undefined,
      turnState: nextTurnState,
      moveMap,
    });
  }

  movePiece(start: Location, end: Location) {
    const initialPiece = getPieceAtCell(start, this.state.board);
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;

    const newBoard = JSON.parse(JSON.stringify(this.state.board));
    newBoard[startRow][startCol] = EMPTY;
    newBoard[endRow][endCol] = initialPiece;

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
      const startSquare = this.state.selectedCell;
      const currentPieceType = getPieceAtCell(startSquare, this.state.board);
      if (
        currentPieceType &&
        canMovePiece(
          currentPieceType,
          startSquare,
          clickLocation,
          this.state.board
        )
      ) {
        // Move the selected piece there
        this.movePiece(startSquare, clickLocation);
        return;
      }
    }

    // Otherwise, select the square that was clicked
    if (this.canSelectCell(clickLocation)) {
      this.setState({ selectedCell: clickLocation });
    }

    // FOR TESTING ONLY
    const moveList = generatePossibleMoves(
      this.state.board,
      this.state.turnState
    );
    console.log(moveList.map((move) => formatMove(move)));
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

  restart() {
    this.setState({
      board: STARTING_BOARD,
      turnState: TurnState.WhiteTurn,
      selectedCell: undefined,
    });
  }

  render() {
    return (
      <div className="GameManager">
        <h2>Main Game</h2>
        <h4>{this.getStatusMessage()}</h4>

        <div className="game-board-container">
          <GameBoard
            onCellClicked={this.onCellClicked}
            selectedCell={this.state.selectedCell}
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
