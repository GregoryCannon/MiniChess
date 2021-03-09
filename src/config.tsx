/**
 * Constants for configuring the behavior of the program.
 */

import { STARTING_BOARD_5x5 } from "./constants";
import { decodeBoard } from "./calculation/io";

export const MAX_SEARCH_DEPTH = 6; // Limiting factor for non-deepening searches
export const THINK_TIME_MS = 2000; // Limiting factor for deepening searches
export const SHOULD_ITERATIVE_DEEPEN = true;

// Values from 0-1 that represents the odds the AI will play the best move
export const AI_INTELLIGENCE_FACTOR_WHITE = 1;
export const AI_INTELLIGENCE_FACTOR_BLACK = 1;

export const BLACK_IS_HUMAN = false;
export const WHITE_IS_HUMAN = true;
export const AI_MOVE_DELAY = 100;

export const LOG_LEVEL = 2; // The level of logging to which to actually log. 0 is most important, higher is less important.

export const BOARD_SIZE = 5;

// This is implemented as a function in case we want to pass in an encoded board and decode it at runtime
export const getStartingBoard = () => STARTING_BOARD_5x5;
