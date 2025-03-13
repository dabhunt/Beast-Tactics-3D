
/**
 * StateDebugger.js
 * Diagnostic tool to help debug state transitions and validation
 */

import { Logger } from '../../public/js/utils/Logger.js';

/**
 * Analyze state manager and game states for potential issues
 * @param {Object} stateManager - The state manager to analyze
 * @param {Object} gameManager - The game manager instance
 * @returns {Object} Analysis results
 */
export async function analyzeStates(stateManager, gameManager) {
  Logger.info('StateDebugger', 'Starting state transition analysis');
  
  const results = {
    registeredStates: [],
    validTransitions: {},
    invalidStates: [],
    missingDependencies: []
  };
  
  try {
    // Check which states are registered
    if (stateManager._states) {
      results.registeredStates = Object.keys(stateManager._states);
      Logger.debug('StateDebugger', `Found ${results.registeredStates.length} registered states`, results.registeredStates);
    } else {
      Logger.warning('StateDebugger', 'Could not access states in state manager');
      results.missingDependencies.push('stateManager._states');
    }
    
    // Check transition rules
    if (stateManager._validTransitions) {
      results.validTransitions = {...stateManager._validTransitions};
      Logger.debug('StateDebugger', 'Found transition rules', results.validTransitions);
      
      // Check for PLAYER_INPUT state specifically
      if (!results.registeredStates.includes('PLAYER_INPUT') && 
          Object.values(results.validTransitions).some(arr => arr.includes('PLAYER_INPUT'))) {
        results.invalidStates.push('PLAYER_INPUT');
        Logger.error('StateDebugger', 'PLAYER_INPUT state is referenced in transitions but not registered');
      }
    } else {
      Logger.warning('StateDebugger', 'Could not access transition rules');
      results.missingDependencies.push('stateManager._validTransitions');
    }
    
    // Check game states module
    try {
      const gameStates = await import('../../public/js/models/GameStates.js');
      const definedStates = Object.values(gameStates.GameStates || {});
      Logger.debug('StateDebugger', 'GameStates definition contains:', definedStates);
      
      // Find states that are defined but not registered
      const unregisteredStates = definedStates.filter(state => !results.registeredStates.includes(state));
      if (unregisteredStates.length > 0) {
        Logger.warning('StateDebugger', 'States defined but not registered:', unregisteredStates);
        results.invalidStates.push(...unregisteredStates);
      }
    } catch (err) {
      Logger.error('StateDebugger', 'Could not analyze GameStates module', err);
      results.missingDependencies.push('GameStates module');
    }
    
    Logger.info('StateDebugger', 'State analysis complete', {
      registeredStates: results.registeredStates.length,
      invalidStates: results.invalidStates.length,
      missingDependencies: results.missingDependencies.length
    });
    
    return results;
  } catch (err) {
    Logger.error('StateDebugger', 'Error during state analysis', err);
    console.error('Detailed error:', err);
    return {
      error: err.message,
      stack: err.stack,
      ...results
    };
  }
}

/**
 * Validate PlayerInputState setup
 * @param {Object} stateManager - The state manager to check
 * @returns {Object} Validation results
 */
export function validatePlayerInputState(stateManager) {
  Logger.info('StateDebugger', 'Validating PlayerInputState setup');
  
  const results = {
    stateExists: false,
    inTransitions: false,
    transitionSources: [],
    transitionTargets: [],
    issues: []
  };
  
  try {
    // Check if state exists
    results.stateExists = stateManager._states && 'PLAYER_INPUT' in stateManager._states;
    
    if (!results.stateExists) {
      results.issues.push('PLAYER_INPUT state is not registered in state manager');
      Logger.error('StateDebugger', 'PLAYER_INPUT state is not registered');
    }
    
    // Check transitions
    if (stateManager._validTransitions) {
      // Check if any states can transition to PLAYER_INPUT
      for (const [fromState, toStates] of Object.entries(stateManager._validTransitions)) {
        if (Array.isArray(toStates) && toStates.includes('PLAYER_INPUT')) {
          results.inTransitions = true;
          results.transitionSources.push(fromState);
        }
      }
      
      // Check if PLAYER_INPUT can transition to other states
      if (stateManager._validTransitions['PLAYER_INPUT']) {
        results.transitionTargets = [...stateManager._validTransitions['PLAYER_INPUT']];
      }
    }
    
    if (!results.inTransitions) {
      results.issues.push('No valid transitions to PLAYER_INPUT state are defined');
      Logger.warning('StateDebugger', 'No valid transitions to PLAYER_INPUT state');
    }
    
    if (results.transitionTargets.length === 0) {
      results.issues.push('No valid transitions from PLAYER_INPUT state are defined');
      Logger.warning('StateDebugger', 'PLAYER_INPUT has no outgoing transitions');
    }
    
    Logger.info('StateDebugger', 'PlayerInputState validation complete', {
      stateExists: results.stateExists,
      inTransitions: results.inTransitions,
      issues: results.issues.length
    });
    
    return results;
  } catch (err) {
    Logger.error('StateDebugger', 'Error validating PlayerInputState', err);
    console.error('Detailed validation error:', err);
    return {
      error: err.message,
      stack: err.stack,
      ...results
    };
  }
}
