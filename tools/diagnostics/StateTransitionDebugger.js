
/**
 * StateTransitionDebugger.js
 * Tools for debugging state transitions and fixing common issues
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Diagnose state transition issues in state manager
 * @param {StateManager} stateManager - The state manager to diagnose
 * @param {GameManager} gameManager - Game manager instance
 * @returns {Object} Diagnostic results
 */
export function diagnoseStateTransitions(stateManager, gameManager) {
  Logger.info("StateTransitionDebugger", "Diagnosing state transitions");
  console.log("Running state transition diagnostics...");
  
  const results = {
    issues: [],
    availableStates: [],
    currentState: null,
    previousState: null,
    transitionGraph: {}
  };
  
  try {
    // Validate state manager
    if (!stateManager) {
      results.issues.push("State manager is null or undefined");
      return results;
    }
    
    // Get available states
    results.availableStates = stateManager._states ? Object.keys(stateManager._states) : [];
    results.currentState = stateManager.currentState;
    results.previousState = stateManager.previousState;
    
    Logger.debug("StateTransitionDebugger", "Available states:", results.availableStates);
    
    // Check for required states
    const requiredStates = ['GAME_SETUP', 'TURN_START', 'PLAYER_INPUT', 'TURN_END', 'GAME_OVER'];
    
    requiredStates.forEach(state => {
      if (!results.availableStates.includes(state)) {
        results.issues.push(`Required state missing: ${state}`);
      }
    });
    
    // Check transition table
    const transitions = stateManager._validTransitions || {};
    results.transitionGraph = transitions;
    
    // Check for states with no outgoing transitions
    results.availableStates.forEach(state => {
      if (!transitions[state] || transitions[state].length === 0) {
        results.issues.push(`State '${state}' has no outgoing transitions`);
      }
    });
    
    // Check for states that can't be reached
    const reachableStates = findReachableStates(transitions, 'GAME_SETUP');
    
    results.availableStates.forEach(state => {
      if (!reachableStates.has(state) && state !== 'GAME_SETUP') {
        results.issues.push(`State '${state}' cannot be reached from GAME_SETUP`);
      }
    });
    
    // Check for circular references that might cause infinite loops
    const circularPaths = findCircularPaths(transitions);
    if (circularPaths.length > 0) {
      // It's normal to have some circular paths, but log them for reference
      Logger.debug("StateTransitionDebugger", "Found circular paths:", circularPaths);
    }
    
    // Check state implementation
    results.availableStates.forEach(stateName => {
      const state = stateManager._states[stateName];
      
      if (!state) {
        results.issues.push(`State '${stateName}' is registered but implementation is missing`);
        return;
      }
      
      if (!state.onEnter || typeof state.onEnter !== 'function') {
        results.issues.push(`State '${stateName}' missing onEnter method`);
      }
      
      if (!state.onExit || typeof state.onExit !== 'function') {
        results.issues.push(`State '${stateName}' missing onExit method`);
      }
      
      if (!state.update || typeof state.update !== 'function') {
        results.issues.push(`State '${stateName}' missing update method`);
      }
    });
    
    Logger.info("StateTransitionDebugger", "State transition diagnosis complete", {
      issues: results.issues.length,
      states: results.availableStates.length
    });
    
    return results;
  } catch (error) {
    Logger.error("StateTransitionDebugger", "Error diagnosing state transitions", error);
    console.error("Error diagnosing state transitions:", error);
    
    results.issues.push(`Diagnosis error: ${error.message}`);
    return results;
  }
}

/**
 * Fix common state issues
 * @param {StateManager} stateManager - The state manager to fix
 * @param {GameManager} gameManager - Game manager instance
 * @returns {Object} Fix results
 */
export function fixCommonStateIssues(stateManager, gameManager) {
  Logger.info("StateTransitionDebugger", "Attempting to fix common state issues");
  console.log("Attempting to fix state issues...");
  
  const results = {
    fixesSucceeded: [],
    fixesAttempted: [],
    remainingIssues: []
  };
  
  try {
    // Run diagnostics first
    const diagnostics = diagnoseStateTransitions(stateManager, gameManager);
    
    // Track failed fixes
    const fixFailures = [];
    
    // Try to fix each issue
    for (const issue of diagnostics.issues) {
      results.fixesAttempted.push(issue);
      
      // Missing state: GAME_SETUP
      if (issue.includes("Required state missing: GAME_SETUP")) {
        try {
          const { GameSetupState } = createPlaceholderState('GameSetupState', 'GAME_SETUP');
          stateManager.registerState('GAME_SETUP', new GameSetupState(gameManager));
          results.fixesSucceeded.push(issue);
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // Missing state: TURN_START
      else if (issue.includes("Required state missing: TURN_START")) {
        try {
          const { TurnStartState } = createPlaceholderState('TurnStartState', 'TURN_START');
          stateManager.registerState('TURN_START', new TurnStartState(gameManager));
          results.fixesSucceeded.push(issue);
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // Missing state: PLAYER_INPUT
      else if (issue.includes("Required state missing: PLAYER_INPUT")) {
        try {
          const { PlayerInputState } = createPlaceholderState('PlayerInputState', 'PLAYER_INPUT');
          stateManager.registerState('PLAYER_INPUT', new PlayerInputState(gameManager));
          results.fixesSucceeded.push(issue);
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // Missing state: TURN_END
      else if (issue.includes("Required state missing: TURN_END")) {
        try {
          const { TurnEndState } = createPlaceholderState('TurnEndState', 'TURN_END');
          stateManager.registerState('TURN_END', new TurnEndState(gameManager));
          results.fixesSucceeded.push(issue);
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // Missing state: GAME_OVER
      else if (issue.includes("Required state missing: GAME_OVER")) {
        try {
          const { GameOverState } = createPlaceholderState('GameOverState', 'GAME_OVER');
          stateManager.registerState('GAME_OVER', new GameOverState(gameManager));
          results.fixesSucceeded.push(issue);
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // State with no outgoing transitions
      else if (issue.includes("has no outgoing transitions")) {
        try {
          const stateName = issue.match(/State '(.+)' has no outgoing transitions/)[1];
          
          // Add sensible default transitions
          if (stateName === 'GAME_SETUP') {
            stateManager.addTransition('GAME_SETUP', 'TURN_START');
            results.fixesSucceeded.push(issue);
          }
          else if (stateName === 'TURN_START') {
            stateManager.addTransition('TURN_START', 'PLAYER_INPUT');
            results.fixesSucceeded.push(issue);
          }
          else if (stateName === 'PLAYER_INPUT') {
            stateManager.addTransition('PLAYER_INPUT', 'TURN_END');
            results.fixesSucceeded.push(issue);
          }
          else if (stateName === 'TURN_END') {
            stateManager.addTransition('TURN_END', 'TURN_START');
            stateManager.addTransition('TURN_END', 'GAME_OVER');
            results.fixesSucceeded.push(issue);
          }
          else {
            // For other states, add a default transition to TURN_START
            stateManager.addTransition(stateName, 'TURN_START');
            results.fixesSucceeded.push(issue);
          }
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // State cannot be reached
      else if (issue.includes("cannot be reached from GAME_SETUP")) {
        try {
          const stateName = issue.match(/State '(.+)' cannot be reached/)[1];
          
          // Add sensible incoming transitions
          if (stateName === 'PLAYER_INPUT') {
            stateManager.addTransition('TURN_START', 'PLAYER_INPUT');
            results.fixesSucceeded.push(issue);
          }
          else if (stateName === 'TURN_END') {
            stateManager.addTransition('PLAYER_INPUT', 'TURN_END');
            results.fixesSucceeded.push(issue);
          }
          else if (stateName === 'GAME_OVER') {
            stateManager.addTransition('TURN_END', 'GAME_OVER');
            results.fixesSucceeded.push(issue);
          }
          else {
            // For other states, add a default transition from GAME_SETUP
            stateManager.addTransition('GAME_SETUP', stateName);
            results.fixesSucceeded.push(issue);
          }
        } catch (error) {
          fixFailures.push({ issue, error });
        }
      }
      
      // Missing method
      else if (issue.includes("missing") && issue.includes("method")) {
        // These usually need custom implementation, so just log them
        fixFailures.push({ issue, error: new Error("Custom method implementation required") });
      }
      
      // Other issues
      else {
        fixFailures.push({ issue, error: new Error("Unknown issue type") });
      }
    }
    
    // Collect remaining issues
    results.remainingIssues = fixFailures.map(failure => {
      Logger.warning("StateTransitionDebugger", `Failed to fix issue: ${failure.issue}`, failure.error);
      return `${failure.issue} (Fix failed: ${failure.error.message})`;
    });
    
    Logger.info("StateTransitionDebugger", "Fix attempts complete", {
      succeeded: results.fixesSucceeded.length,
      attempted: results.fixesAttempted.length,
      remaining: results.remainingIssues.length
    });
    
    return results;
  } catch (error) {
    Logger.error("StateTransitionDebugger", "Error fixing state issues", error);
    console.error("Error fixing state issues:", error);
    
    results.remainingIssues.push(`Fix error: ${error.message}`);
    return results;
  }
}

/**
 * Find all states reachable from a given starting state
 * @param {Object} transitions - Transition graph
 * @param {String} startState - Starting state
 * @returns {Set} Set of reachable states
 * @private
 */
function findReachableStates(transitions, startState) {
  const reachable = new Set();
  const queue = [startState];
  
  while (queue.length > 0) {
    const current = queue.shift();
    reachable.add(current);
    
    if (transitions[current]) {
      transitions[current].forEach(target => {
        if (!reachable.has(target)) {
          queue.push(target);
        }
      });
    }
  }
  
  return reachable;
}

/**
 * Find potential circular paths in transition graph
 * @param {Object} transitions - Transition graph
 * @returns {Array} Array of circular paths
 * @private
 */
function findCircularPaths(transitions) {
  const circularPaths = [];
  const visited = new Set();
  const path = [];
  
  function dfs(state) {
    if (path.includes(state)) {
      // Found a cycle
      const cycleStart = path.indexOf(state);
      const cycle = path.slice(cycleStart).concat(state);
      circularPaths.push(cycle);
      return;
    }
    
    if (visited.has(state) || !transitions[state]) {
      return;
    }
    
    visited.add(state);
    path.push(state);
    
    transitions[state].forEach(target => {
      dfs(target);
    });
    
    path.pop();
  }
  
  // Check from each state
  Object.keys(transitions).forEach(state => {
    path.length = 0;
    dfs(state);
  });
  
  return circularPaths;
}

/**
 * Create a basic placeholder state for testing/fixing
 * @param {String} className - Name of the state class
 * @param {String} stateName - State identifier
 * @returns {Object} Object with the created state class
 * @private
 */
function createPlaceholderState(className, stateName) {
  Logger.debug("StateTransitionDebugger", `Creating placeholder state: ${className}`);
  
  // Create a dynamic class
  const StateClass = class {
    constructor(gameManager) {
      this.gameManager = gameManager;
      this.name = stateName;
      
      Logger.debug(className, "Instance created");
    }
    
    async onEnter() {
      Logger.info(className, `Entering ${this.name} state (placeholder)`);
      return true;
    }
    
    async onExit() {
      Logger.info(className, `Exiting ${this.name} state (placeholder)`);
      return true;
    }
    
    update(deltaTime) {
      // Placeholder update method
      return true;
    }
    
    handleInput(input) {
      Logger.debug(className, `Handling input in ${this.name} state (placeholder)`, input);
      return true;
    }
  };
  
  // Set the name of the class (for better debugging)
  Object.defineProperty(StateClass, 'name', {value: className});
  
  // Return an object with the created class
  return {
    [className]: StateClass
  };
}
