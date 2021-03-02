import React from "react";
import "./GameBoard.css";
import { Board, CellContents, EMPTY, Location, PieceType } from "../constants";
import { formatLocation } from "../utils/io-utils";

function cellIsSelected(
  rowIndex: number,
  colIndex: number,
  selectedCell?: Location
) {
  if (!selectedCell) {
    return false;
  }
  const [row, col] = selectedCell;
  return row === rowIndex && col === colIndex;
}

function getImageForPiece(piece: PieceType): string {
  switch (piece) {
    case PieceType.KingBlack:
      return "/piece-assets/BlackKing.png";
    case PieceType.QueenBlack:
      return "/piece-assets/BlackQueen.png";
    case PieceType.RookBlack:
      return "/piece-assets/BlackRook.png";
    case PieceType.BishopBlack:
      return "/piece-assets/BlackBishop.png";
    case PieceType.KnightBlack:
      return "/piece-assets/BlackKnight.png";
    case PieceType.PawnBlack:
      return "/piece-assets/BlackPawn.png";
    case PieceType.KingWhite:
      return "/piece-assets/WhiteKing.png";
    case PieceType.QueenWhite:
      return "/piece-assets/WhiteQueen.png";
    case PieceType.RookWhite:
      return "/piece-assets/WhiteRook.png";
    case PieceType.BishopWhite:
      return "/piece-assets/WhiteBishop.png";
    case PieceType.KnightWhite:
      return "/piece-assets/WhiteKnight.png";
    case PieceType.PawnWhite:
      return "/piece-assets/WhitePawn.png";
  }
}

function getAltTextForPiece(piece: PieceType): string {
  switch (piece) {
    case PieceType.KingBlack:
      return "BlackKing.png";
    case PieceType.QueenBlack:
      return "BlackQueen.png";
    case PieceType.RookBlack:
      return "BlackRook.png";
    case PieceType.BishopBlack:
      return "BlackBishop.png";
    case PieceType.KnightBlack:
      return "BlackKnight.png";
    case PieceType.PawnBlack:
      return "BlackPawn.png";
    case PieceType.KingWhite:
      return "WhiteKing.png";
    case PieceType.QueenWhite:
      return "WhiteQueen.png";
    case PieceType.RookWhite:
      return "WhiteRook.png";
    case PieceType.BishopWhite:
      return "WhiteBishop.png";
    case PieceType.KnightWhite:
      return "WhiteKnight.png";
    case PieceType.PawnWhite:
      return "WhitePawn.png";
  }
}

function GameBoard(props: {
  board: Board;
  onCellClicked: Function;
  selectedCell?: Location;
  secondaryHighlightedCells: Set<string>;
}) {
  return (
    <div className="game-board">
      {props.board.map((row, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          <div className="label-vertical">
            {["e", "d", "c", "b", "a"][rowIndex]}
          </div>
          {row.map((cellContents: CellContents, colIndex) => (
            <div
              className={
                (rowIndex + colIndex) % 2 === 0
                  ? "board-square white"
                  : "board-square black"
              }
              key={rowIndex + "," + colIndex}
              onClick={() => {
                props.onCellClicked([rowIndex, colIndex]);
              }}
            >
              <div
                className={
                  cellIsSelected(rowIndex, colIndex, props.selectedCell)
                    ? "highlight-layer primary-highlighted"
                    : props.secondaryHighlightedCells.has(
                        formatLocation([rowIndex, colIndex])
                      )
                    ? "highlight-layer secondary-highlighted"
                    : "highlight-layer"
                }
              >
                {cellContents && cellContents !== EMPTY && (
                  <img
                    src={getImageForPiece(cellContents)}
                    alt={getAltTextForPiece(cellContents)}
                  ></img>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="label-row">
        <div className="label-vertical"></div>
        {["1", "2", "3", "4", "5"].map((num) => (
          <div className="label-horizontal" key={num}>
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameBoard;
