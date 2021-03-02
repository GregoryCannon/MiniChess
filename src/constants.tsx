/* ----------- Custom Types ----------- */

export type Board = Array<Array<CellContents>>;

export type Location = Array<number>; // e.g. [1, 2] for row 1 column 2

export type CellContents = PieceType | typeof EMPTY;

export type MoveMap = Map<string, Array<string>>;

export interface Move {
  startCell: Location;
  endCell: Location;
  pieceType: PieceType;
  isCapture: boolean;
}

/* ----------- Constants and Enums ----------- */

export const BOARD_SIZE = 5;

export const EMPTY = ".";

export enum PieceType {
  PawnWhite = "P",
  KingWhite = "K",
  QueenWhite = "Q",
  RookWhite = "R",
  KnightWhite = "N",
  BishopWhite = "B",
  PawnBlack = "p",
  KingBlack = "k",
  QueenBlack = "q",
  RookBlack = "r",
  KnightBlack = "n",
  BishopBlack = "b",
}

export enum TurnState {
  NotStarted,
  GameOver,
  WhiteTurn,
  BlackTurn,
}

// export const STARTING_BOARD: Board = [
//   [
//     PieceType.RookBlack,
//     PieceType.BishopBlack,
//     PieceType.QueenBlack,
//     PieceType.KingBlack,
//     PieceType.KnightBlack,
//     PieceType.RookBlack,
//   ],
//   [
//     PieceType.PawnBlack,
//     PieceType.PawnBlack,
//     PieceType.PawnBlack,
//     PieceType.PawnBlack,
//     PieceType.PawnBlack,
//     PieceType.PawnBlack,
//   ],
//   [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
//   [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
//   [
//     PieceType.PawnWhite,
//     PieceType.PawnWhite,
//     PieceType.PawnWhite,
//     PieceType.PawnWhite,
//     PieceType.PawnWhite,
//     PieceType.PawnWhite,
//   ],
//   [
//     PieceType.RookWhite,
//     PieceType.BishopWhite,
//     PieceType.QueenWhite,
//     PieceType.KingWhite,
//     PieceType.KnightWhite,
//     PieceType.RookWhite,
//   ],
// ];

export const STARTING_BOARD: Board = [
  [
    PieceType.RookBlack,
    PieceType.BishopBlack,
    PieceType.KingBlack,
    PieceType.QueenBlack,
    PieceType.KnightBlack,
  ],
  [
    PieceType.PawnBlack,
    PieceType.PawnBlack,
    PieceType.PawnBlack,
    PieceType.PawnBlack,
    PieceType.PawnBlack,
  ],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [
    PieceType.PawnWhite,
    PieceType.PawnWhite,
    PieceType.PawnWhite,
    PieceType.PawnWhite,
    PieceType.PawnWhite,
  ],
  [
    PieceType.RookWhite,
    PieceType.BishopWhite,
    PieceType.KingWhite,
    PieceType.QueenWhite,
    PieceType.KnightWhite,
  ],
];