
/**
 * GameStates.js
 * Defines all possible game states used by the state machine
 */

// Define all valid game states
export const GameStates = {
  // Initialization phase
  GAME_SETUP: 'GAME_SETUP',
  
  // Turn cycle phases
  TURN_START: 'TURN_START',
  PLAYER_INPUT: 'PLAYER_INPUT',
  HAZARD_ROLLS: 'HAZARD_ROLLS',
  TURN_ORDER: 'TURN_ORDER',
  TURN_EXECUTION: 'TURN_EXECUTION',
  TURN_END: 'TURN_END',
  
  // End game phase
  GAME_OVER: 'GAME_OVER'
};

// Define the valid transitions between states for reference
export const ValidStateTransitions = {
  [GameStates.GAME_SETUP]: [GameStates.TURN_START, GameStates.GAME_OVER],
  [GameStates.TURN_START]: [GameStates.PLAYER_INPUT, GameStates.GAME_OVER],
  [GameStates.PLAYER_INPUT]: [GameStates.HAZARD_ROLLS, GameStates.TURN_START, GameStates.GAME_OVER],
  [GameStates.HAZARD_ROLLS]: [GameStates.TURN_ORDER, GameStates.GAME_OVER],
  [GameStates.TURN_ORDER]: [GameStates.TURN_EXECUTION, GameStates.GAME_OVER],
  [GameStates.TURN_EXECUTION]: [GameStates.TURN_END, GameStates.GAME_OVER],
  [GameStates.TURN_END]: [GameStates.TURN_START, GameStates.GAME_OVER],
  [GameStates.GAME_OVER]: [GameStates.GAME_SETUP]
};

/**
 * Get the next state in the normal game flow
 * @param {String} currentState - The current game state
 * @returns {String|null} The next state or null if not found
 */
export function getNextStateInFlow(currentState) {
  switch (currentState) {
    case GameStates.GAME_SETUP:
      return GameStates.TURN_START;
    case GameStates.TURN_START:
      return GameStates.PLAYER_INPUT;
    case GameStates.PLAYER_INPUT:
      return GameStates.HAZARD_ROLLS;
    case GameStates.HAZARD_ROLLS:
      return GameStates.TURN_ORDER;
    case GameStates.TURN_ORDER:
      return GameStates.TURN_EXECUTION;
    case GameStates.TURN_EXECUTION:
      return GameStates.TURN_END;
    case GameStates.TURN_END:
      return GameStates.TURN_START;
    case GameStates.GAME_OVER:
      return GameStates.GAME_SETUP;
    default:
      return null;
  }
}

/**
 * Check if a state transition is valid
 * @param {String} fromState - Current state
 * @param {String} toState - Target state
 * @returns {Boolean} Whether the transition is valid
 */
export function isValidTransition(fromState, toState) {
  return ValidStateTransitions[fromState]?.includes(toState) || false;
}
