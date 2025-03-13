
/**
 * StateTransitionDebugger.js
 * A diagnostic tool to help track and debug state transitions
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { GameStates } from "../../public/js/models/GameStates.js";

/**
 * Diagnose state transition problems
 * @param {Object} stateManager - The StateManager instance
 * @param {Object} gameManager - The GameManager instance
 * @returns {Object} Diagnostic results
 */
export function diagnoseStateTransitions(stateManager, gameManager) {
  Logger.info('StateTransitionDebugger', 'Running state transition diagnostics');
  
  const results = {
    currentState: stateManager.currentState,
    previousState: stateManager.previousState,
    validTransitions: {},
    availableStates: [],
    stateInstances: {},
    issues: []
  };
  
  try {
    // Check which states are registered
    if (stateManager._states) {
      results.availableStates = Object.keys(stateManager._states);
      
      // Check each state instance
      for (const [stateName, stateInstance] of Object.entries(stateManager._states)) {
        results.stateInstances[stateName] = {
          exists: !!stateInstance,
          hasEnterState: typeof stateInstance?.enterState === 'function',
          hasExitState: typeof stateInstance?.exitState === 'function',
          hasUpdateState: typeof stateInstance?.updateState === 'function'
        };
        
        if (!stateInstance) {
          results.issues.push(`State ${stateName} is registered but instance is null or undefined`);
        } else if (typeof stateInstance.enterState !== 'function') {
          results.issues.push(`State ${stateName} is missing enterState method`);
        } else if (typeof stateInstance.exitState !== 'function') {
          results.issues.push(`State ${stateName} is missing exitState method`);
        }
      }
    } else {
      results.issues.push('State manager has no _states property');
    }
    
    // Check valid transitions
    if (stateManager._validTransitions) {
      results.validTransitions = { ...stateManager._validTransitions };
      
      // Check if PLAYER_INPUT state exists in transitions
      if (!results.validTransitions[GameStates.PLAYER_INPUT]) {
        results.issues.push('PLAYER_INPUT state has no outgoing transitions defined');
      }
      
      // Check which states can transition to PLAYER_INPUT
      const statesTransitioningToPlayerInput = [];
      for (const [fromState, toStates] of Object.entries(results.validTransitions)) {
        if (toStates.includes(GameStates.PLAYER_INPUT)) {
          statesTransitioningToPlayerInput.push(fromState);
        }
      }
      
      if (statesTransitioningToPlayerInput.length === 0) {
        results.issues.push('No states can transition to PLAYER_INPUT');
      }
      
      results.statesTransitioningToPlayerInput = statesTransitioningToPlayerInput;
    } else {
      results.issues.push('State manager has no _validTransitions property');
    }
    
    // Check for TurnStartState to PLAYER_INPUT transition
    if (stateManager._validTransitions && 
        stateManager._validTransitions[GameStates.TURN_START] && 
        stateManager._validTransitions[GameStates.TURN_START].includes(GameStates.PLAYER_INPUT)) {
      
      Logger.debug('StateTransitionDebugger', 'Transition from TURN_START to PLAYER_INPUT is defined');
      
      // Try to simulate the transition with error trapping
      try {
        Logger.debug('StateTransitionDebugger', 'Simulating TurnStartState code that transitions to PLAYER_INPUT');
        
        // Check if the code in TurnStartState that transitions to PLAYER_INPUT has issues
        const turnStartState = stateManager._states[GameStates.TURN_START];
        const playerInputState = stateManager._states[GameStates.PLAYER_INPUT];
        
        if (!playerInputState) {
          results.issues.push('PLAYER_INPUT state instance is missing');
        } else {
          Logger.debug('StateTransitionDebugger', 'PLAYER_INPUT state instance exists');
        }
        
      } catch (error) {
        Logger.error('StateTransitionDebugger', 'Error simulating transition', error);
        results.issues.push(`Error simulating transition: ${error.message}`);
      }
    } else {
      results.issues.push('Transition from TURN_START to PLAYER_INPUT is not defined');
    }
    
    Logger.info('StateTransitionDebugger', 'Diagnostics complete', {
      issues: results.issues.length,
      availableStates: results.availableStates.length
    });
    
    return results;
  } catch (error) {
    Logger.error('StateTransitionDebugger', 'Error during diagnostics', error);
    return {
      error: error.message,
      stack: error.stack,
      ...results
    };
  }
}

/**
 * Attempt to fix common state transition issues
 * @param {Object} stateManager - The StateManager instance
 * @param {Object} gameManager - The GameManager instance
 * @returns {Object} Results of fix attempts
 */
export function fixCommonStateIssues(stateManager, gameManager) {
  Logger.info('StateTransitionDebugger', 'Attempting to fix common state transition issues');
  
  const results = {
    fixesAttempted: [],
    fixesSucceeded: [],
    remainingIssues: []
  };
  
  try {
    // Check if PLAYER_INPUT state exists but might not be properly imported
    if (!stateManager._states[GameStates.PLAYER_INPUT]) {
      Logger.warning('StateTransitionDebugger', 'PLAYER_INPUT state missing, attempting to recreate it');
      
      try {
        // Import PlayerInputState on-demand
        import('../../public/js/states/PlayerInputState.js').then(module => {
          const PlayerInputState = module.PlayerInputState;
          stateManager._states[GameStates.PLAYER_INPUT] = new PlayerInputState(gameManager);
          results.fixesAttempted.push('Recreated PLAYER_INPUT state');
          results.fixesSucceeded.push('Recreated PLAYER_INPUT state');
          Logger.info('StateTransitionDebugger', 'Successfully recreated PLAYER_INPUT state');
        }).catch(err => {
          Logger.error('StateTransitionDebugger', 'Failed to import PlayerInputState', err);
          results.remainingIssues.push(`Failed to recreate PLAYER_INPUT state: ${err.message}`);
        });
      } catch (error) {
        Logger.error('StateTransitionDebugger', 'Error recreating PLAYER_INPUT state', error);
        results.remainingIssues.push(`Error recreating PLAYER_INPUT state: ${error.message}`);
      }
    }
    
    // Ensure valid transitions are properly defined
    if (stateManager._validTransitions) {
      // Make sure TURN_START can transition to PLAYER_INPUT
      if (!stateManager._validTransitions[GameStates.TURN_START]?.includes(GameStates.PLAYER_INPUT)) {
        Logger.warning('StateTransitionDebugger', 'Adding PLAYER_INPUT as valid transition from TURN_START');
        
        if (!stateManager._validTransitions[GameStates.TURN_START]) {
          stateManager._validTransitions[GameStates.TURN_START] = [];
        }
        
        stateManager._validTransitions[GameStates.TURN_START].push(GameStates.PLAYER_INPUT);
        results.fixesAttempted.push('Added PLAYER_INPUT as valid transition from TURN_START');
        results.fixesSucceeded.push('Added PLAYER_INPUT as valid transition from TURN_START');
      }
      
      // Make sure PLAYER_INPUT can transition to some state
      if (!stateManager._validTransitions[GameStates.PLAYER_INPUT]) {
        Logger.warning('StateTransitionDebugger', 'PLAYER_INPUT has no outgoing transitions, adding defaults');
        stateManager._validTransitions[GameStates.PLAYER_INPUT] = [GameStates.TURN_START, GameStates.GAME_OVER];
        results.fixesAttempted.push('Added default outgoing transitions for PLAYER_INPUT');
        results.fixesSucceeded.push('Added default outgoing transitions for PLAYER_INPUT');
      }
    } else {
      results.remainingIssues.push('State manager has no _validTransitions property');
    }
    
    Logger.info('StateTransitionDebugger', 'Fix attempts complete', {
      attempted: results.fixesAttempted.length,
      succeeded: results.fixesSucceeded.length,
      remaining: results.remainingIssues.length
    });
    
    return results;
  } catch (error) {
    Logger.error('StateTransitionDebugger', 'Error fixing state issues', error);
    return {
      error: error.message,
      stack: error.stack,
      ...results
    };
  }
}
