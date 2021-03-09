import { TurnState } from "../constants";

export function gameIsInProgress(turnState: TurnState) {
  return turnState === TurnState.WhiteTurn || turnState === TurnState.BlackTurn;
}
