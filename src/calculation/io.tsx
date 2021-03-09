import {
  Board,
  BOARD_SIZE,
  CellContents,
  EMPTY,
  Location,
  Move,
  PIECE_TYPE_LOOKUP,
} from "../constants";
import { LOG_LEVEL } from "../config";

const BOARD_ROW_SEPARATOR = "\n";

/* ----------------------
    Formatting Output
   ---------------------- */

export function formatLocation(location: Location) {
  const [row, col] = location;
  const formattedCol = ["a", "b", "c", "d", "e"][col];
  const formattedRow = BOARD_SIZE - row;
  return formattedCol + formattedRow;
}

export function formatMove(move: Move) {
  return `${move.pieceType} ${formatLocation(move.startCell)}${
    move.isCapture ? "x" : "->"
  }${formatLocation(move.endCell)}`;
}

export function encodeBoard(board: Board) {
  let boardStr = "";
  for (let row = 0; row < BOARD_SIZE; row++) {
    boardStr += BOARD_ROW_SEPARATOR;
    for (let col = 0; col < BOARD_SIZE; col++) {
      boardStr += board[row][col];
    }
  }
  return boardStr;
}

export function encodeBoardTransposed(board: Board) {
  let boardStr = "";
  function swapcase(str: string) {
    return str.replace(/([a-z]+)|([A-Z]+)/g, function (match, chr) {
      return chr ? match.toUpperCase() : match.toLowerCase();
    });
  }

  for (let row = BOARD_SIZE - 1; row >= 0; row--) {
    boardStr += BOARD_ROW_SEPARATOR;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const temp = board[row][col];
      boardStr += swapcase(temp);
    }
  }
  return boardStr;
}

export function decodeBoard(boardStr: string, separator: string): Board {
  const rows = boardStr.split(separator);
  const board: Array<Array<CellContents>> = [];
  for (const row of rows) {
    const outputRow: Array<CellContents> = [];
    for (const str of row.split("")) {
      outputRow.push(PIECE_TYPE_LOOKUP.get(str) || EMPTY);
    }
    board.push(outputRow);
  }
  return board;
}

/** Logs specified message to the console, if it's high enough priority. */
export function consoleLog(priority: number, message: string) {
  if (priority <= LOG_LEVEL) {
    console.log(message);
  }
}
