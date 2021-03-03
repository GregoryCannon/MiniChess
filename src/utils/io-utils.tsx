import { Board, BOARD_SIZE, Location, Move, VisitedStates } from "../constants";

/* ----------------------
    Formatting Output
   ---------------------- */

export function formatLocation(location: Location) {
  const [row, col] = location;
  const formattedRow = ["e", "d", "c", "b", "a"][row];
  const formattedCol = col + 1;
  return formattedRow + formattedCol;
}

export function formatMove(move: Move) {
  return `${move.pieceType} ${formatLocation(move.startCell)}${
    move.isCapture ? "x" : "->"
  }${formatLocation(move.endCell)}`;
}

export function encodeBoard(board: Board) {
  let boardStr = "";
  for (let row = 0; row < BOARD_SIZE; row++) {
    boardStr += "\n";
    for (let col = 0; col < BOARD_SIZE; col++) {
      boardStr += board[row][col];
    }
  }
  return boardStr;
}
