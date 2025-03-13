
/**
 * DiagnosticsUI.js
 * Creates a UI for runtime diagnostics and error analysis
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { analyzeGameStates } from "./StateAnalyzer.js";
import { collectDiagnostics, createDiagnosticReport } from "./ErrorTrace.js";

/**
 * Create a diagnostics control panel
 * @param {GameManager} gameManager - The game manager instance
 */
export function createDiagnosticsPanel(gameManager) {
  Logger.info("DiagnosticsUI", "Creating diagnostics panel");
  
  // Remove existing panel if present
  const existingPanel = document.getElementById('beast-tactics-diagnostics');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'beast-tactics-diagnostics';
  panel.className = 'diagnostics-panel';
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #666;
    border-radius: 5px;
    padding: 15px;
    color: white;
    font-family: monospace;
    z-index: 10000;
    max-width: 300px;
  `;
  
  // Create header
  const header = document.createElement('h3');
  header.textContent = 'Beast Tactics Diagnostics';
  header.style.margin = '0 0 10px 0';
  panel.appendChild(header);
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = '10px';
  panel.appendChild(buttonsContainer);
  
  // Add various diagnostic tools
  
  // 1. Check State Registration
  const checkStatesButton = createButton('Check Game States', () => {
    const results = analyzeGameStates(gameManager);
    showResultsModal('Game State Analysis', results);
  });
  buttonsContainer.appendChild(checkStatesButton);
  
  // 2. System Diagnostics
  const systemDiagButton = createButton('System Diagnostics', () => {
    const results = collectDiagnostics(gameManager);
    const report = createDiagnosticReport(results);
    showHtmlModal('System Diagnostics', report);
  });
  buttonsContainer.appendChild(systemDiagButton);
  
  // 3. Event Listeners
  const eventListenersButton = createButton('View Event Listeners', () => {
    if (!gameManager.eventSystem) {
      showResultsModal('Error', { error: 'Event system not available' });
      return;
    }
    
    const listeners = gameManager.eventSystem._listeners;
    const eventStats = gameManager.eventSystem.getEventStats();
    
    // Convert Map to plain object for display
    const listenersObj = {};
    listeners.forEach((value, key) => {
      listenersObj[key] = value.length;
    });
    
    showResultsModal('Event Listeners', {
      registeredEvents: listenersObj,
      stats: eventStats
    });
  });
  buttonsContainer.appendChild(eventListenersButton);
  
  // 4. Show Current State
  const currentStateButton = createButton('Current Game State', () => {
    if (!gameManager.stateManager) {
      showResultsModal('Error', { error: 'State manager not available' });
      return;
    }
    
    showResultsModal('Current Game State', {
      currentState: gameManager.stateManager.currentState,
      previousState: gameManager.stateManager.previousState,
      transitionInProgress: gameManager.stateManager._stateTransitionInProgress
    });
  });
  buttonsContainer.appendChild(currentStateButton);
  
  // 5. Force Player Input State
  const forcePlayerInputButton = createButton('Force Player Input State', () => {
    if (!gameManager.stateManager) {
      showResultsModal('Error', { error: 'State manager not available' });
      return;
    }
    
    try {
      gameManager.stateManager.changeState('PLAYER_INPUT')
        .then(success => {
          showResultsModal('State Change', {
            success: success,
            message: success ? 'Successfully changed to PLAYER_INPUT state' : 'Failed to change state'
          });
        })
        .catch(err => {
          showResultsModal('Error', {
            error: err.message,
            stack: err.stack
          });
        });
    } catch (error) {
      showResultsModal('Error', {
        error: error.message,
        stack: error.stack
      });
    }
  });
  buttonsContainer.appendChild(forcePlayerInputButton);
  
  // 6. Implement Missing States
  const fixMissingStatesButton = createButton('Fix Missing States', () => {
    // This is a placeholder - the actual implementation
    // is done through the file changes proposed separately
    
    showResultsModal('Fix Missing States', {
      message: 'Adding PlayerInputState, HazardRollsState, etc. requires code changes.',
      implementedStates: ['PlayerInputState'],
      pendingStates: ['HazardRollsState', 'TurnOrderState', 'TurnExecutionState', 'TurnEndState', 'GameOverState']
    });
  });
  buttonsContainer.appendChild(fixMissingStatesButton);
  
  // Close button
  const closeButton = createButton('Close', () => {
    panel.remove();
  });
  buttonsContainer.appendChild(closeButton);
  
  // Add to document
  document.body.appendChild(panel);
  
  Logger.info("DiagnosticsUI", "Diagnostics panel created");
  return panel;
}

/**
 * Create a styled button
 * @param {String} text - Button text
 * @param {Function} onClick - Click handler
 * @returns {HTMLButtonElement} Button element
 */
function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    padding: 8px 12px;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 3px;
    font-family: sans-serif;
    cursor: pointer;
    transition: background 0.2s;
  `;
  
  button.onmouseover = () => {
    button.style.background = '#444';
  };
  
  button.onmouseout = () => {
    button.style.background = '#333';
  };
  
  button.onclick = onClick;
  
  return button;
}

/**
 * Show a modal with results
 * @param {String} title - Modal title
 * @param {Object} data - Data to display
 */
function showResultsModal(title, data) {
  // Create modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
  `;
  
  // Create modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: #222;
    color: white;
    border-radius: 5px;
    padding: 20px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    font-family: monospace;
  `;
  
  // Add title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.style.borderBottom = '1px solid #444';
  titleElement.style.paddingBottom = '10px';
  content.appendChild(titleElement);
  
  // Add data
  const dataElement = document.createElement('pre');
  dataElement.textContent = JSON.stringify(data, null, 2);
  dataElement.style.whiteSpace = 'pre-wrap';
  content.appendChild(dataElement);
  
  // Add close button
  const closeButton = createButton('Close', () => {
    modal.remove();
  });
  closeButton.style.marginTop = '15px';
  content.appendChild(closeButton);
  
  // Add to modal
  modal.appendChild(content);
  
  // Add to document
  document.body.appendChild(modal);
  
  return modal;
}

/**
 * Show a modal with HTML content
 * @param {String} title - Modal title
 * @param {String} htmlContent - HTML content
 */
function showHtmlModal(title, htmlContent) {
  // Create modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
  `;
  
  // Create modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: #222;
    color: white;
    border-radius: 5px;
    padding: 20px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    font-family: monospace;
  `;
  
  // Add title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.style.borderBottom = '1px solid #444';
  titleElement.style.paddingBottom = '10px';
  content.appendChild(titleElement);
  
  // Add HTML content
  const dataElement = document.createElement('div');
  dataElement.innerHTML = htmlContent;
  content.appendChild(dataElement);
  
  // Add close button
  const closeButton = createButton('Close', () => {
    modal.remove();
  });
  closeButton.style.marginTop = '15px';
  content.appendChild(closeButton);
  
  // Add to modal
  modal.appendChild(content);
  
  // Add to document
  document.body.appendChild(modal);
  
  return modal;
}

/**
 * Add diagnostics keyboard shortcut (Ctrl+D)
 * @param {GameManager} gameManager - The game manager instance
 */
export function setupDiagnosticsShortcut(gameManager) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+D to show diagnostics panel
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault(); // Prevent default browser behavior
      createDiagnosticsPanel(gameManager);
    }
  });
  
  Logger.info("DiagnosticsUI", "Diagnostics keyboard shortcut (Ctrl+D) registered");
}
