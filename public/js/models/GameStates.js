
/**
 * GameStates.js
 * Constants for game state values
 */

export const GameStates = {
  GAME_SETUP: 'GAME_SETUP',         // Initial game setup, team selection, map generation
  TURN_START: 'TURN_START',         // Beginning of a new turn (weather events, start-of-turn effects)
  PLAYER_INPUT: 'PLAYER_INPUT',     // Players select movement for their Beasts
  HAZARD_ROLLS: 'HAZARD_ROLLS',     // Roll for Beasts in hazardous biomes
  TURN_ORDER: 'TURN_ORDER',         // Roll for Beast movement order
  TURN_EXECUTION: 'TURN_EXECUTION', // Execute Beast movements in order
  TURN_END: 'TURN_END',             // Process end-of-turn effects
  GAME_OVER: 'GAME_OVER'            // Handle victory conditions and end game
};
