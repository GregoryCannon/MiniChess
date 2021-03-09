/* ----------- Custom Types ----------- */

export type Board = Array<Array<CellContents>>;

export type Location = Array<number>; // e.g. [1, 2] for row 1 column 2

export type CellContents = PieceType | typeof EMPTY;

export type MoveMap = Map<string, Map<string, Move>>;

export interface Move {
  startCell: Location;
  endCell: Location;
  pieceType: PieceType;
  isCapture: boolean;
}

export interface EvaluatedMove extends Move {
  score: number;
  anticipatedLine?: Array<Board>;
}

export interface EvaluationResult {
  score: number;
  rankedMoveList: Array<EvaluatedMove>;
}

export interface AiResult {
  aiMove: EvaluatedMove;
  trueBestMove: EvaluatedMove;
  aiMoveRanking: number; // Whether the AI chose the best move, 2nd best, etc.
}

export type VisitedStates = Map<string, number>;

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

function getLookup(): Map<string, PieceType> {
  const map = new Map();
  map.set("P", PieceType.PawnWhite);
  map.set("K", PieceType.KingWhite);
  map.set("Q", PieceType.QueenWhite);
  map.set("R", PieceType.RookWhite);
  map.set("B", PieceType.BishopWhite);
  map.set("p", PieceType.PawnBlack);
  map.set("k", PieceType.KingBlack);
  map.set("q", PieceType.QueenBlack);
  map.set("r", PieceType.RookBlack);
  map.set("n", PieceType.KnightBlack);
  map.set("b", PieceType.BishopBlack);
  return map;
}

export const PIECE_TYPE_LOOKUP: Map<string, PieceType> = getLookup();

export enum TurnState {
  NotStarted,
  WinWhite,
  WinBlack,
  DrawRepetition,
  DrawStalemate,
  DrawMaterial,
  WhiteTurn,
  BlackTurn,
}

export const WIN_WHITE_VALUE = 999999;
export const WIN_BLACK_VALUE = -999999;

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

export const STARTING_BOARD_5x5: Board = [
  [
    PieceType.RookBlack,
    PieceType.KnightBlack,
    PieceType.KingBlack,
    PieceType.QueenBlack,
    PieceType.BishopBlack,
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
    PieceType.KnightWhite,
    PieceType.KingWhite,
    PieceType.QueenWhite,
    PieceType.BishopWhite,
  ],
];
