
/**
 * StateDebugger.js
 * Debugging tools for game state validation and testing
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Validate the PlayerInputState and its transitions
 * @param {StateManager} stateManager - The state manager to validate
 * @returns {Object} Validation results
 */
export function validatePlayerInputState(stateManager) {
  Logger.info("StateDebugger", "Validating PlayerInputState");
  console.log("Validating PlayerInputState...");
  
  const results = {
    stateExists: false,
    inTransitions: false,
    outTransitions: false,
    transitionSources: [],
    transitionTargets: [],
    issues: []
  };
  
  try {
    // Check if state manager is available
    if (!stateManager) {
      results.issues.push("State manager is null or undefined");
      return results;
    }
    
    // Check if PlayerInputState exists
    const playerInputState = stateManager._states ? stateManager._states['PLAYER_INPUT'] : null;
    results.stateExists = !!playerInputState;
    
    if (!playerInputState) {
      results.issues.push("PlayerInputState not found in state registry");
      return results;
    }
    
    Logger.debug("StateDebugger", "PlayerInputState exists in registry");
    
    // Check incoming transitions (Can we reach this state?)
    const transitions = stateManager._validTransitions || {};
    let hasIncomingTransitions = false;
    
    Object.entries(transitions).forEach(([sourceState, targetStates]) => {
      if (targetStates.includes('PLAYER_INPUT')) {
        hasIncomingTransitions = true;
        results.transitionSources.push(sourceState);
      }
    });
    
    results.inTransitions = hasIncomingTransitions;
    
    if (!hasIncomingTransitions) {
      results.issues.push("PlayerInputState has no incoming transitions");
    }
    
    // Check outgoing transitions (Can we exit this state?)
    const outgoingTransitions = transitions['PLAYER_INPUT'] || [];
    results.outTransitions = outgoingTransitions.length > 0;
    results.transitionTargets = outgoingTransitions;
    
    if (!results.outTransitions) {
      results.issues.push("PlayerInputState has no outgoing transitions");
    }
    
    // Validate methods implementation
    if (playerInputState) {
      if (!playerInputState.onEnter || typeof playerInputState.onEnter !== 'function') {
        results.issues.push("PlayerInputState is missing onEnter method");
      }
      
      if (!playerInputState.onExit || typeof playerInputState.onExit !== 'function') {
        results.issues.push("PlayerInputState is missing onExit method");
      }
      
      if (!playerInputState.update || typeof playerInputState.update !== 'function') {
        results.issues.push("PlayerInputState is missing update method");
      }
      
      if (!playerInputState.handleInput || typeof playerInputState.handleInput !== 'function') {
        results.issues.push("PlayerInputState is missing handleInput method");
      }
    }
    
    // Log results
    Logger.info("StateDebugger", "PlayerInputState validation complete", {
      exists: results.stateExists,
      hasIncomingTransitions: results.inTransitions,
      hasOutgoingTransitions: results.outTransitions,
      issueCount: results.issues.length
    });
    
    if (results.issues.length > 0) {
      Logger.warning("StateDebugger", "Found issues with PlayerInputState", 
        results.issues);
    }
    
    return results;
  } catch (error) {
    Logger.error("StateDebugger", "Error validating PlayerInputState", error);
    
    results.issues.push(`Validation error: ${error.message}`);
    return results;
  }
}

/**
 * Test the response of a specific game state
 * @param {String} stateName - Name of state to test
 * @param {StateManager} stateManager - State manager instance
 * @returns {Object} Test results
 */
export async function testStateResponse(stateName, stateManager) {
  Logger.info("StateDebugger", `Testing state response for: ${stateName}`);
  
  const results = {
    success: false,
    state: stateName,
    entrySuccess: false,
    exitSuccess: false,
    updateSuccess: false,
    issues: []
  };
  
  try {
    // Check if state manager is available
    if (!stateManager) {
      results.issues.push("State manager is null or undefined");
      return results;
    }
    
    // Check if state exists
    const state = stateManager._states ? stateManager._states[stateName] : null;
    
    if (!state) {
      results.issues.push(`State '${stateName}' not found in state registry`);
      return results;
    }
    
    // Remember previous state
    const previousState = stateManager.currentState;
    
    // Test onEnter function
    try {
      await state.onEnter();
      results.entrySuccess = true;
    } catch (error) {
      results.issues.push(`Error in ${stateName}.onEnter(): ${error.message}`);
    }
    
    // Test update function
    try {
      await state.update(0.016); // Simulate one frame at 60fps
      results.updateSuccess = true;
    } catch (error) {
      results.issues.push(`Error in ${stateName}.update(): ${error.message}`);
    }
    
    // Test onExit function
    try {
      await state.onExit();
      results.exitSuccess = true;
    } catch (error) {
      results.issues.push(`Error in ${stateName}.onExit(): ${error.message}`);
    }
    
    // Overall success
    results.success = results.entrySuccess && results.updateSuccess && results.exitSuccess;
    
    // Restore previous state if needed
    if (stateManager.currentState !== previousState) {
      stateManager.changeState(previousState);
    }
    
    Logger.info("StateDebugger", `State test complete for ${stateName}`, {
      success: results.success,
      issues: results.issues.length
    });
    
    return results;
  } catch (error) {
    Logger.error("StateDebugger", `Error testing state ${stateName}`, error);
    
    results.issues.push(`Test error: ${error.message}`);
    return results;
  }
}
