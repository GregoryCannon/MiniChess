/**
 * Constants for configuring the behavior of the program.
 */

import { STARTING_BOARD_5x5 } from "./constants";
import { decodeBoard } from "./calculation/io";

export const MAX_SEARCH_DEPTH = 14;
export const AI_INTELLIGENCE_FACTOR = 1; // Value from 0-1 that represents the odds the AI will use each newly discovered better move (as opposed to ignoring it);

export const BLACK_IS_HUMAN = false;
export const WHITE_IS_HUMAN = false;
export const AI_MOVE_DELAY = 600;

export const LOG_LEVEL = 2; // The level of logging to which to actually log. 0 is most important, higher is less important.

export const BOARD_SIZE = 3;

// This is implemented as a function in case we want to pass in an encoded board and decode it at runtime
export const getStartingBoard = () => decodeBoard("kpp|...|PPK", "|");
