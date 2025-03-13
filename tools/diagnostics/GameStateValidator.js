
/**
 * GameStateValidator.js
 * Diagnostic tool to validate all game states and their transitions
 */

import { Logger } from '../../public/js/utils/Logger.js';

/**
 * Run a comprehensive validation of game states and transitions
 * @param {Object} gameManager - Reference to the game manager
 * @returns {Object} Validation results and issues found
 */
export function validateGameStates(gameManager) {
  Logger.info('GameStateValidator', 'Starting game state validation');
  
  const results = {
    stateManagerExists: false,
    registeredStates: [],
    validTransitions: {},
    currentState: null,
    issues: []
  };
  
  try {
    // Basic validation of state manager
    const stateManager = gameManager.stateManager;
    results.stateManagerExists = !!stateManager;
    
    if (!results.stateManagerExists) {
      results.issues.push('State manager not found in game manager');
      Logger.error('GameStateValidator', 'State manager not found');
      return results;
    }
    
    // Log state manager details for diagnosis
    Logger.debug('GameStateValidator', 'State manager found, examining properties', {
      hasStates: !!stateManager._states,
      hasCurrentState: !!stateManager._currentState,
      hasTransitions: !!stateManager._validTransitions
    });
    
    // Extract registered states
    if (stateManager._states) {
      results.registeredStates = Object.keys(stateManager._states);
      
      // Check each state object for required methods
      for (const [stateName, stateObj] of Object.entries(stateManager._states)) {
        const requiredMethods = ['enterState', 'updateState', 'exitState'];
        const missingMethods = requiredMethods.filter(method => typeof stateObj[method] !== 'function');
        
        if (missingMethods.length > 0) {
          results.issues.push(`State ${stateName} missing required methods: ${missingMethods.join(', ')}`);
          Logger.warning('GameStateValidator', `State ${stateName} missing methods`, missingMethods);
        }
      }
    } else {
      results.issues.push('State manager has no states registered');
      Logger.error('GameStateValidator', 'No states registered in state manager');
    }
    
    // Extract transition rules
    if (stateManager._validTransitions) {
      results.validTransitions = {...stateManager._validTransitions};
      
      // Validate that all transitions reference registered states
      for (const [fromState, toStates] of Object.entries(results.validTransitions)) {
        // Check if from state exists
        if (!results.registeredStates.includes(fromState)) {
          results.issues.push(`Transition from non-existent state: ${fromState}`);
          Logger.warning('GameStateValidator', `Transition rule references non-existent state: ${fromState}`);
        }
        
        // Check if to states exist
        for (const toState of toStates) {
          if (!results.registeredStates.includes(toState)) {
            results.issues.push(`Transition to non-existent state: ${fromState} -> ${toState}`);
            Logger.warning('GameStateValidator', `Transition rule targets non-existent state: ${toState}`);
          }
        }
      }
    } else {
      results.issues.push('State manager has no transition rules defined');
      Logger.error('GameStateValidator', 'No transition rules in state manager');
    }
    
    // Check current state
    if (stateManager._currentState) {
      results.currentState = stateManager._currentState;
      
      // Verify current state is valid
      if (!results.registeredStates.includes(results.currentState)) {
        results.issues.push(`Current state "${results.currentState}" is not a registered state`);
        Logger.error('GameStateValidator', `Current state is invalid: ${results.currentState}`);
      }
    } else {
      results.issues.push('No current state set in state manager');
      Logger.warning('GameStateValidator', 'No current state');
    }
    
    // Verify PLAYER_INPUT state is properly registered
    const hasPlayerInputState = results.registeredStates.includes('PLAYER_INPUT');
    if (!hasPlayerInputState) {
      results.issues.push('PLAYER_INPUT state is not registered but is referenced in transitions');
      Logger.error('GameStateValidator', 'PLAYER_INPUT state missing but referenced');
    }
    
    // Log validation summary
    Logger.info('GameStateValidator', 'Game state validation complete', {
      validStates: results.registeredStates.length,
      currentState: results.currentState,
      issues: results.issues.length
    });
    
    return results;
  } catch (err) {
    Logger.error('GameStateValidator', 'Error validating game states', err);
    console.error('Detailed validation error:', err);
    return {
      error: err.message,
      stack: err.stack,
      ...results
    };
  }
}

/**
 * Create a visualization of state transitions
 * @param {Object} stateManager - Reference to the state manager
 * @returns {String} HTML representation of state transitions
 */
export function generateStateTransitionDiagram(stateManager) {
  if (!stateManager || !stateManager._validTransitions) {
    return '<div class="error">Cannot generate diagram: State manager or transitions not available</div>';
  }
  
  try {
    const transitions = stateManager._validTransitions;
    let html = '<div class="state-diagram">';
    html += '<h3>State Transition Diagram</h3>';
    html += '<table class="transition-table">';
    html += '<tr><th>From State</th><th>To States</th></tr>';
    
    for (const [fromState, toStates] of Object.entries(transitions)) {
      html += `<tr>
        <td>${fromState}</td>
        <td>${toStates.join(', ') || '(none)'}</td>
      </tr>`;
    }
    
    html += '</table></div>';
    return html;
  } catch (err) {
    Logger.error('GameStateValidator', 'Error generating state diagram', err);
    return `<div class="error">Error generating diagram: ${err.message}</div>`;
  }
}
