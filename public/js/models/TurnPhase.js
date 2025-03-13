
/**
 * TurnPhase.js
 * Constants for turn phases
 */

export const TurnPhase = {
  START: 'START',               // Start of turn (start-of-turn effects)
  PLAYER_INPUT: 'PLAYER_INPUT', // Players select actions
  HAZARD_ROLLS: 'HAZARD_ROLLS', // Roll for hazard effects
  TURN_ORDER: 'TURN_ORDER',     // Determine order of movement
  EXECUTION: 'EXECUTION',       // Execute actions in order
  END: 'END'                    // End of turn (end-of-turn effects)
};
