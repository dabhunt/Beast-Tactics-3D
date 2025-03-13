
/**
 * ErrorTrace.js
 * Diagnostic tool to trace errors and provide detailed debug information
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Create a wrapped method that logs all information about errors
 * @param {Object} object - The object containing the method
 * @param {String} methodName - The name of the method to wrap
 * @param {String} context - Context label for logs
 */
export function traceMethod(object, methodName, context) {
  const originalMethod = object[methodName];
  
  if (typeof originalMethod !== 'function') {
    Logger.error("ErrorTrace", `Cannot trace ${methodName}: not a function`);
    return;
  }
  
  // Replace the original method with our instrumented version
  object[methodName] = function(...args) {
    Logger.debug("ErrorTrace", `[TRACE] ${context}.${methodName} called with args:`, args);
    
    try {
      const result = originalMethod.apply(this, args);
      
      // Handle promises specially
      if (result && typeof result.then === 'function') {
        return result.then(
          (value) => {
            Logger.debug("ErrorTrace", `[TRACE] ${context}.${methodName} resolved with:`, value);
            return value;
          },
          (error) => {
            Logger.error("ErrorTrace", `[TRACE] ${context}.${methodName} rejected with:`, error);
            console.error(`Detailed error in ${context}.${methodName}:`, {
              error: error,
              message: error.message,
              stack: error.stack,
              args: args
            });
            throw error;
          }
        );
      }
      
      Logger.debug("ErrorTrace", `[TRACE] ${context}.${methodName} returned:`, result);
      return result;
    } catch (error) {
      Logger.error("ErrorTrace", `[TRACE] ${context}.${methodName} threw:`, error);
      console.error(`Detailed error in ${context}.${methodName}:`, {
        error: error,
        message: error.message,
        stack: error.stack,
        args: args
      });
      throw error;
    }
  };
  
  Logger.info("ErrorTrace", `Instrumented ${context}.${methodName} for tracing`);
}

/**
 * Collect diagnostic information about the GameManager state
 * @param {GameManager} gameManager - The game manager to diagnose
 * @returns {Object} Diagnostic information
 */
export function collectDiagnostics(gameManager) {
  if (!gameManager) {
    return { error: "GameManager not available" };
  }
  
  Logger.info("ErrorTrace", "Collecting diagnostic information");
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    gameManager: {
      initialized: !!gameManager._isInitialized,
      gameInProgress: !!gameManager._isGameInProgress,
      debugMode: !!gameManager._debugMode,
      configStatus: !!gameManager._config
    },
    stateManager: {
      available: !!gameManager._stateManager,
      currentState: gameManager._stateManager?.currentState || null,
      previousState: gameManager._stateManager?.previousState || null,
      transitionInProgress: !!gameManager._stateManager?._stateTransitionInProgress,
      registeredStates: gameManager._stateManager?._states ? Object.keys(gameManager._stateManager._states) : [],
      validTransitions: gameManager._stateManager?._validTransitions || {}
    },
    subsystems: {
      available: gameManager._subsystems ? Object.keys(gameManager._subsystems) : [],
      weatherSystem: !!gameManager.getSubsystem('weatherSystem'),
      mapSystem: !!gameManager.getSubsystem('mapSystem')
    },
    eventSystem: {
      available: !!gameManager._eventSystem,
      events: gameManager._eventSystem?._listeners ? Array.from(gameManager._eventSystem._listeners.keys()) : [],
      stats: gameManager._eventSystem?.getEventStats() || {}
    }
  };
  
  Logger.info("ErrorTrace", "Diagnostic information collected");
  return diagnostics;
}

/**
 * Create a human-readable report from diagnostics
 * @param {Object} diagnostics - Collected diagnostic information
 * @returns {String} HTML report
 */
export function createDiagnosticReport(diagnostics) {
  let report = `<div class="diagnostic-report">
    <h2>Diagnostic Report - ${diagnostics.timestamp}</h2>
    
    <h3>Game Manager Status</h3>
    <ul>
      <li>Initialized: ${diagnostics.gameManager.initialized}</li>
      <li>Game In Progress: ${diagnostics.gameManager.gameInProgress}</li>
      <li>Debug Mode: ${diagnostics.gameManager.debugMode}</li>
      <li>Configuration: ${diagnostics.gameManager.configStatus ? "Loaded" : "Missing"}</li>
    </ul>
    
    <h3>State Manager Status</h3>
    <ul>
      <li>Available: ${diagnostics.stateManager.available}</li>
      <li>Current State: ${diagnostics.stateManager.currentState || "None"}</li>
      <li>Previous State: ${diagnostics.stateManager.previousState || "None"}</li>
      <li>Transition In Progress: ${diagnostics.stateManager.transitionInProgress}</li>
    </ul>
    
    <h4>Registered States</h4>
    <ul>
      ${diagnostics.stateManager.registeredStates.map(state => `<li>${state}</li>`).join("")}
    </ul>
    
    <h4>Valid Transitions</h4>
    <ul>
      ${Object.entries(diagnostics.stateManager.validTransitions).map(([from, to]) => 
        `<li>${from} → ${to.join(", ")}</li>`).join("")}
    </ul>
    
    <h3>Subsystems</h3>
    <ul>
      <li>Available Subsystems: ${diagnostics.subsystems.available.join(", ") || "None"}</li>
      <li>Weather System: ${diagnostics.subsystems.weatherSystem ? "Available" : "Missing"}</li>
      <li>Map System: ${diagnostics.subsystems.mapSystem ? "Available" : "Missing"}</li>
    </ul>
    
    <h3>Event System</h3>
    <ul>
      <li>Available: ${diagnostics.eventSystem.available}</li>
      <li>Registered Events: ${diagnostics.eventSystem.events.length}</li>
    </ul>
    
    <h4>Event Details</h4>
    <ul>
      ${diagnostics.eventSystem.events.map(event => `<li>${event}</li>`).join("")}
    </ul>
  </div>`;
  
  return report;
}
