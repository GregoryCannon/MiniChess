import React from "react";
import {
  Board,
  Location,
  TurnState,
  VisitedStates,
  WIN_BLACK_VALUE,
  WIN_WHITE_VALUE,
} from "../constants";
import GameBoard from "../ui_components/GameBoard";
import { gameIsInProgress } from "../calculation/utils";

function convertEvalToBarPercentage(positionEval?: number) {
  if (positionEval === undefined) {
    return 0;
  }
  // Use a logistic model, such that small advantages (e.g. +3, -2) are weighted heavily, then it tapers off towards 100% or 0%.
  const steepnessMultiplier = 0.3;
  return 100 / (1 + Math.pow(Math.E, -1 * positionEval * steepnessMultiplier));
}

function getEvalLabelText(positionEval?: number) {
  if (positionEval === undefined) {
    return "";
  }
  return positionEval >= WIN_WHITE_VALUE / 10 ||
    positionEval <= WIN_BLACK_VALUE / 10
    ? "Forced Mate"
    : positionEval?.toFixed(2);
}

function getSemiHighlightedCells(
  legalDestinations: Set<string>,
  movablePieces: Set<string>,
  selectedCell?: Location
): Set<string> {
  if (selectedCell) {
    // Return all the cells that the selected piece can move to
    return legalDestinations || new Set();
  } else {
    // Return all the pieces that have legal moves
    return movablePieces;
  }
}

function getStatusMessage(turnState: TurnState) {
  switch (turnState) {
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

export function GameRenderer(props: {
  board: Board;
  turnState: TurnState;
  turnCount: number;
  visitedStates: VisitedStates;
  movablePieces: Set<string>;
  legalDestinations: Set<string>;
  stopGameFunction: Function;
  restartFunction: Function;
  onCellClickedFunction: Function;
  selectedCell?: Location;
  positionEval?: number;
}) {
  const secondaryHighlightedCells: Set<string> = getSemiHighlightedCells(
    props.legalDestinations,
    props.movablePieces,
    props.selectedCell
  );
  const evalPercentage = convertEvalToBarPercentage(props.positionEval);
  const evalLabelText = getEvalLabelText(props.positionEval);

  return (
    <div className="GameManager">
      <h3>{getStatusMessage(props.turnState)}</h3>
      <div
        className="eval-bar-container"
        style={{
          visibility: props.positionEval === undefined ? "hidden" : "visible",
        }}
      >
        <div className="eval-text-container">
          <div className="eval-text">{evalLabelText}</div>
        </div>
        <div className="eval-bar" style={{ width: evalPercentage + "%" }}></div>
      </div>
      <div className="game-board-container">
        <GameBoard
          onCellClicked={props.onCellClickedFunction}
          selectedCell={props.selectedCell}
          secondaryHighlightedCells={secondaryHighlightedCells}
          board={props.board}
        />
      </div>
      <button onClick={() => props.restartFunction()}>
        {gameIsInProgress(props.turnState) ? "Restart" : "Start!"}
      </button>
      <button onClick={() => props.stopGameFunction()}>Stop</button>
    </div>
  );
}
