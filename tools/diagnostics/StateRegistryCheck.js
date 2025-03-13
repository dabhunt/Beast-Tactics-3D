
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
/**
 * StateRegistryCheck.js
 * Diagnostic tool to verify state registration and transitions
 */

import { Logger } from '../../public/js/utils/Logger.js';
import { GameStates } from '../../public/js/models/GameStates.js';

/**
 * Analyze the state manager and check for properly registered states
 * @param {StateManager} stateManager - The state manager to check
 * @returns {Object} Analysis results
 */
export function analyzeStateManager(stateManager) {
  Logger.info('StateRegistryCheck', 'Starting state manager analysis');
  
  // Check if stateManager is valid
  if (!stateManager) {
    Logger.error('StateRegistryCheck', 'State manager is null or undefined');
    return {
      success: false,
      error: 'State manager is null or undefined',
      registeredStates: [],
      missingStates: Object.values(GameStates)
    };
  }
  
  try {
    // Access private fields for diagnostic purposes
    const states = stateManager._states || {};
    const validTransitions = stateManager._validTransitions || {};
    
    // Get list of registered states
    const registeredStates = Object.keys(states);
    Logger.debug('StateRegistryCheck', 'Found registered states', registeredStates);
    
    // Check which states from GameStates are missing
    const allDefinedStates = Object.values(GameStates);
    const missingStates = allDefinedStates.filter(state => !registeredStates.includes(state));
    
    // Validate transition rules
    const transitionProblems = [];
    Object.entries(validTransitions).forEach(([fromState, toStates]) => {
      // Check if source state exists
      if (!states[fromState]) {
        transitionProblems.push(`Transition from non-existent state: ${fromState}`);
      }
      
      // Check if destination states exist
      toStates.forEach(toState => {
        if (!states[toState]) {
          transitionProblems.push(`Transition to non-existent state: ${fromState} -> ${toState}`);
        }
      });
    });
    
    // Check for unreachable states
    const reachableStates = new Set();
    const queue = ['GAME_SETUP']; // Start from initial state
    
    while (queue.length > 0) {
      const state = queue.shift();
      reachableStates.add(state);
      
      // Add all valid transitions to queue if not already processed
      (validTransitions[state] || []).forEach(nextState => {
        if (!reachableStates.has(nextState)) {
          queue.push(nextState);
        }
      });
    }
    
    const unreachableStates = registeredStates.filter(state => !reachableStates.has(state));
    
    // Prepare result
    const results = {
      success: missingStates.length === 0 && transitionProblems.length === 0,
      registeredStates,
      missingStates,
      transitionProblems,
      unreachableStates,
      currentState: stateManager.currentState,
      validStateCount: registeredStates.length,
      totalStateCount: allDefinedStates.length
    };
    
    Logger.info('StateRegistryCheck', 'State manager analysis complete', {
      registeredCount: registeredStates.length,
      missingCount: missingStates.length,
      problemCount: transitionProblems.length
    });
    
    return results;
  } catch (error) {
    Logger.error('StateRegistryCheck', 'Failed to analyze state manager', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Create a UI to display state registry diagnostic information
 * @param {GameManager} gameManager - Game manager instance to analyze
 */
export function createStateRegistryUI(gameManager) {
  console.log('Creating state registry diagnostic UI');
  
  try {
    // Create diagnostic panel container
    const panel = document.createElement('div');
    panel.id = 'state-registry-panel';
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.left = '10px';
    panel.style.width = '400px';
    panel.style.maxHeight = '80vh';
    panel.style.overflowY = 'auto';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.color = '#fff';
    panel.style.padding = '15px';
    panel.style.borderRadius = '5px';
    panel.style.zIndex = '9999';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    
    // Add header
    const header = document.createElement('h2');
    header.textContent = 'State Registry Diagnostics';
    header.style.color = '#4CAF50';
    header.style.marginTop = '0';
    panel.appendChild(header);
    
    // Get state manager from game manager
    const stateManager = gameManager ? gameManager.stateManager : null;
    
    // Run analysis
    const analysis = analyzeStateManager(stateManager);
    
    // Create content based on analysis
    const content = document.createElement('div');
    
    // Status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.style.padding = '8px';
    statusIndicator.style.marginBottom = '10px';
    statusIndicator.style.borderRadius = '3px';
    statusIndicator.style.backgroundColor = analysis.success ? '#4CAF50' : '#F44336';
    statusIndicator.textContent = analysis.success ? 'All states registered correctly' : 'Issues detected';
    content.appendChild(statusIndicator);
    
    // Current state
    const currentState = document.createElement('div');
    currentState.innerHTML = `<strong>Current State:</strong> ${analysis.currentState || 'None'}`;
    currentState.style.marginBottom = '10px';
    content.appendChild(currentState);
    
    // State counts
    const stateCounts = document.createElement('div');
    stateCounts.innerHTML = `<strong>Registered States:</strong> ${analysis.validStateCount}/${analysis.totalStateCount}`;
    stateCounts.style.marginBottom = '10px';
    content.appendChild(stateCounts);
    
    // Missing states
    if (analysis.missingStates && analysis.missingStates.length > 0) {
      const missingStatesEl = document.createElement('div');
      missingStatesEl.innerHTML = `<strong>Missing States:</strong>`;
      missingStatesEl.style.marginBottom = '5px';
      missingStatesEl.style.color = '#F44336';
      
      const missingList = document.createElement('ul');
      missingList.style.margin = '5px 0 10px 20px';
      
      analysis.missingStates.forEach(state => {
        const item = document.createElement('li');
        item.textContent = state;
        missingList.appendChild(item);
      });
      
      missingStatesEl.appendChild(missingList);
      content.appendChild(missingStatesEl);
    }
    
    // Transition problems
    if (analysis.transitionProblems && analysis.transitionProblems.length > 0) {
      const problemsEl = document.createElement('div');
      problemsEl.innerHTML = `<strong>Transition Problems:</strong>`;
      problemsEl.style.marginBottom = '5px';
      problemsEl.style.color = '#F44336';
      
      const problemList = document.createElement('ul');
      problemList.style.margin = '5px 0 10px 20px';
      
      analysis.transitionProblems.forEach(problem => {
        const item = document.createElement('li');
        item.textContent = problem;
        problemList.appendChild(item);
      });
      
      problemsEl.appendChild(problemList);
      content.appendChild(problemsEl);
    }
    
    // Registered states list
    const registeredTitle = document.createElement('div');
    registeredTitle.innerHTML = `<strong>Registered States:</strong>`;
    registeredTitle.style.marginBottom = '5px';
    content.appendChild(registeredTitle);
    
    const registeredList = document.createElement('ul');
    registeredList.style.margin = '5px 0 10px 20px';
    
    if (analysis.registeredStates && analysis.registeredStates.length > 0) {
      analysis.registeredStates.forEach(state => {
        const item = document.createElement('li');
        item.textContent = state;
        registeredList.appendChild(item);
      });
    } else {
      const item = document.createElement('li');
      item.textContent = 'No states registered';
      item.style.color = '#F44336';
      registeredList.appendChild(item);
    }
    
    content.appendChild(registeredList);
    
    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '15px';
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.style.padding = '5px 10px';
    refreshButton.style.backgroundColor = '#4CAF50';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '3px';
    refreshButton.style.color = 'white';
    refreshButton.style.cursor = 'pointer';
    refreshButton.onclick = () => {
      panel.remove();
      createStateRegistryUI(gameManager);
    };
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#F44336';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => panel.remove();
    
    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(closeButton);
    
    // Add content and buttons to panel
    panel.appendChild(content);
    panel.appendChild(buttonContainer);
    
    // Add panel to document
    document.body.appendChild(panel);
    
    return panel;
  } catch (error) {
    console.error('Failed to create state registry UI:', error);
    Logger.error('StateRegistryCheck', 'Failed to create UI', error);
  }
}
