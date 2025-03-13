
/**
 * StateAnalyzer.js
 * Diagnostic tool to analyze state transitions and verify proper configuration
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { GameStates } from "../../public/js/models/GameStates.js";

/**
 * Analyze the state manager configuration
 * @param {GameManager} gameManager - The game manager to analyze
 * @returns {Object} Analysis results
 */
export function analyzeGameStates(gameManager) {
  Logger.info("StateAnalyzer", "Analyzing game state configuration");
  
  if (!gameManager || !gameManager.stateManager) {
    return {
      success: false,
      error: "GameManager or StateManager not available",
      validStateCount: 0,
      totalStateCount: 0,
      registeredStates: [],
      missingStates: [],
      reachableStates: [],
      unreachableStates: [],
      transitionProblems: []
    };
  }
  
  const stateManager = gameManager.stateManager;
  
  // Get all expected states from the GameStates enum
  const allExpectedStates = Object.values(GameStates);
  
  // Get all registered states
  const registeredStates = stateManager._states ? Object.keys(stateManager._states) : [];
  
  // Find missing states
  const missingStates = allExpectedStates.filter(state => !registeredStates.includes(state));
  
  // Check transition definitions
  const validTransitions = stateManager._validTransitions || {};
  const transitionProblems = [];
  const reachableStates = new Set();
  
  // Add initial state as reachable (typically GAME_SETUP)
  if (registeredStates.includes(GameStates.GAME_SETUP)) {
    reachableStates.add(GameStates.GAME_SETUP);
  }
  
  // Check each state's outbound transitions
  Object.entries(validTransitions).forEach(([fromState, toStates]) => {
    // Check if source state exists
    if (!registeredStates.includes(fromState)) {
      transitionProblems.push(`Transition defined from non-existent state: ${fromState}`);
    }
    
    // Check each target state
    toStates.forEach(toState => {
      if (!registeredStates.includes(toState)) {
        transitionProblems.push(`Transition to non-existent state: ${fromState} -> ${toState}`);
      } else {
        // Mark target as reachable
        reachableStates.add(toState);
      }
    });
    
    // Check if this state has any outbound transitions
    if (!toStates || toStates.length === 0) {
      transitionProblems.push(`State has no outbound transitions: ${fromState}`);
    }
  });
  
  // Check for states with no inbound transitions
  registeredStates.forEach(state => {
    if (state !== GameStates.GAME_SETUP && !reachableStates.has(state)) {
      transitionProblems.push(`State has no inbound transitions: ${state}`);
    }
  });
  
  // Get unreachable states
  const unreachableStates = registeredStates.filter(state => 
    state !== GameStates.GAME_SETUP && !reachableStates.has(state));
  
  // Compile results
  const results = {
    success: missingStates.length === 0 && transitionProblems.length === 0,
    validStateCount: registeredStates.length,
    totalStateCount: allExpectedStates.length,
    registeredStates: registeredStates,
    missingStates: missingStates,
    reachableStates: Array.from(reachableStates),
    unreachableStates: unreachableStates,
    transitionProblems: transitionProblems
  };
  
  Logger.info("StateAnalyzer", "State analysis complete", results);
  return results;
}

/**
 * Create UI to display state analysis results
 * @param {Object} results - Analysis results
 * @returns {HTMLElement} UI element
 */
export function createStateAnalysisUI(results) {
  // Create container
  const container = document.createElement('div');
  container.id = 'state-analysis-panel';
  container.className = 'diagnostic-panel';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #444;
    border-radius: 5px;
    padding: 15px;
    color: white;
    font-family: monospace;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 10000;
  `;
  
  // Create header
  const header = document.createElement('h2');
  header.textContent = 'State Analysis';
  header.style.cssText = `
    margin-top: 0;
    color: ${results.success ? '#4CAF50' : '#F44336'};
    border-bottom: 1px solid #444;
    padding-bottom: 10px;
  `;
  container.appendChild(header);
  
  // Create status section
  const status = document.createElement('div');
  status.innerHTML = `
    <h3>Status: ${results.success ? 'OK' : 'Issues Detected'}</h3>
    <p>Registered States: ${results.validStateCount}/${results.totalStateCount}</p>
  `;
  container.appendChild(status);
  
  // List registered states
  const registeredStatesList = document.createElement('div');
  registeredStatesList.innerHTML = `
    <h3>Registered States</h3>
    <ul>${results.registeredStates.map(state => `<li>${state}</li>`).join('')}</ul>
  `;
  container.appendChild(registeredStatesList);
  
  // List missing states if any
  if (results.missingStates.length > 0) {
    const missingStatesList = document.createElement('div');
    missingStatesList.innerHTML = `
      <h3 style="color: #F44336;">Missing States</h3>
      <ul>${results.missingStates.map(state => `<li>${state}</li>`).join('')}</ul>
    `;
    container.appendChild(missingStatesList);
  }
  
  // List transition problems if any
  if (results.transitionProblems.length > 0) {
    const problemsList = document.createElement('div');
    problemsList.innerHTML = `
      <h3 style="color: #F44336;">Transition Problems</h3>
      <ul>${results.transitionProblems.map(problem => `<li>${problem}</li>`).join('')}</ul>
    `;
    container.appendChild(problemsList);
  }
  
  // List unreachable states if any
  if (results.unreachableStates.length > 0) {
    const unreachableList = document.createElement('div');
    unreachableList.innerHTML = `
      <h3 style="color: #F44336;">Unreachable States</h3>
      <ul>${results.unreachableStates.map(state => `<li>${state}</li>`).join('')}</ul>
    `;
    container.appendChild(unreachableList);
  }
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    margin-top: 15px;
    padding: 5px 15px;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 3px;
    cursor: pointer;
  `;
  closeButton.onclick = () => {
    container.remove();
  };
  container.appendChild(closeButton);
  
  return container;
}

/**
 * Add a UI button to the page to run state analysis
 * @param {GameManager} gameManager - The game manager to analyze
 */
export function addStateAnalysisButton(gameManager) {
  // Create button
  const button = document.createElement('button');
  button.textContent = 'Analyze Game States';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 3px;
    font-family: sans-serif;
    font-size: 14px;
    cursor: pointer;
    z-index: 10000;
  `;
  
  // Add click handler
  button.onclick = () => {
    // Remove existing analysis if present
    const existing = document.getElementById('state-analysis-panel');
    if (existing) {
      existing.remove();
    }
    
    // Run analysis
    const results = analyzeGameStates(gameManager);
    
    // Create and show UI
    const ui = createStateAnalysisUI(results);
    document.body.appendChild(ui);
  };
  
  // Add to document
  document.body.appendChild(button);
  
  return button;
}
