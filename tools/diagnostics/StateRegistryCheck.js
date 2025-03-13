
/**
 * StateRegistryCheck.js
 * Diagnostic tool to verify state registration and transitions
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { GameStates } from "../../public/js/models/GameStates.js";

/**
 * Check if all game states are properly registered and can transition
 * @param {GameManager} gameManager - The game manager instance to test
 */
export async function checkStateRegistry(gameManager) {
  Logger.info("StateRegistryCheck", "Starting state registry check");

  // Get state manager from the game manager
  const stateManager = gameManager.stateManager;
  
  if (!stateManager) {
    Logger.error("StateRegistryCheck", "State manager not available");
    return {
      success: false,
      error: "State manager not available"
    };
  }

  try {
    // Check which states are registered
    const registeredStates = [];
    const missingStates = [];
    
    // Check each game state in the enum
    Object.values(GameStates).forEach(stateName => {
      // Try to access the state through reflection
      const isStateRegistered = stateManager._states && 
                               stateManager._states[stateName] !== undefined;
      
      if (isStateRegistered) {
        registeredStates.push(stateName);
      } else {
        missingStates.push(stateName);
      }
    });

    // Log detailed state registration info
    Logger.info("StateRegistryCheck", "State registration check complete", {
      registered: registeredStates,
      missing: missingStates,
      totalStates: Object.values(GameStates).length,
      registeredCount: registeredStates.length
    });

    // Check transition rules
    const transitionRules = stateManager._validTransitions || {};
    const transitionStats = {
      statesWithTransitions: Object.keys(transitionRules).length,
      totalTransitions: 0,
      transitionsPerState: {}
    };

    // Count transitions for each state
    Object.entries(transitionRules).forEach(([fromState, toStates]) => {
      transitionStats.transitionsPerState[fromState] = toStates.length;
      transitionStats.totalTransitions += toStates.length;
    });

    Logger.info("StateRegistryCheck", "Transition rules check complete", transitionStats);

    return {
      success: true,
      registeredStates,
      missingStates,
      transitionStats
    };
  } catch (error) {
    Logger.error("StateRegistryCheck", "Error during state registry check", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test state transitions by attempting to change to each state
 * @param {GameManager} gameManager - The game manager instance to test
 */
export async function testStateTransitions(gameManager) {
  Logger.info("StateRegistryCheck", "Starting state transition tests");

  const stateManager = gameManager.stateManager;
  const results = {
    transitions: {},
    successCount: 0,
    failCount: 0
  };

  // Get all registered states
  const registeredStates = [];
  Object.values(GameStates).forEach(stateName => {
    if (stateManager._states && stateManager._states[stateName]) {
      registeredStates.push(stateName);
    }
  });

  // Try to transition to each registered state
  for (const stateName of registeredStates) {
    try {
      Logger.debug("StateRegistryCheck", `Testing transition to ${stateName}`);
      
      const canTransition = stateManager.canTransitionTo(stateName);
      const success = canTransition ? 
        await stateManager.changeState(stateName) : false;
      
      results.transitions[stateName] = {
        attempted: true,
        canTransition,
        success
      };
      
      if (success) {
        results.successCount++;
        Logger.info("StateRegistryCheck", `Successfully transitioned to ${stateName}`);
      } else {
        results.failCount++;
        Logger.warning("StateRegistryCheck", `Failed to transition to ${stateName}`);
      }
    } catch (error) {
      results.transitions[stateName] = {
        attempted: true,
        error: error.message
      };
      results.failCount++;
      
      Logger.error("StateRegistryCheck", `Error transitioning to ${stateName}`, error);
    }
  }

  Logger.info("StateRegistryCheck", "State transition tests complete", {
    totalAttempted: registeredStates.length,
    succeeded: results.successCount,
    failed: results.failCount
  });

  return results;
}
