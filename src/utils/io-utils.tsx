import { Location, Move } from "../constants";

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
