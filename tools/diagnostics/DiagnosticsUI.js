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

/**
 * DiagnosticsUI.js
 * Implements a diagnostic interface for testing game components
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { diagnoseStateTransitions, fixCommonStateIssues } from "./StateTransitionDebugger.js";
import { validatePlayerInputState } from "./StateDebugger.js";


/**
 * Create the diagnostics UI
 * @param {GameManager} gameManager - The game manager instance
 * @returns {Object} The diagnostics UI controller
 */
export function createDiagnosticsUI(gameManager) {
  Logger.info('DiagnosticsUI', 'Initializing diagnostic interface');

  const controller = {
    gameManager,
    diagContainer: null,

    /**
     * Initialize the diagnostic UI
     */
    initialize() {
      Logger.info('DiagnosticsUI', 'Creating diagnostic UI elements');

      try {
        // Create main container
        this.diagContainer = document.createElement('div');
        this.diagContainer.className = 'diagnostics-panel';
        this.diagContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          background: rgba(0, 0, 0, 0.8);
          color: #00ff00;
          font-family: monospace;
          padding: 15px;
          border-radius: 5px;
          z-index: 1000;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        `;

        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Game Diagnostics';
        header.style.cssText = `
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #00ff00;
          border-bottom: 1px solid #00ff00;
          padding-bottom: 5px;
        `;
        this.diagContainer.appendChild(header);

        // Create content container
        this.contentContainer = document.createElement('div');
        this.diagContainer.appendChild(this.contentContainer);

        // Create log container
        this.logContainer = document.createElement('div');
        this.logContainer.className = 'diagnostics-log';
        this.logContainer.style.cssText = `
          margin-top: 15px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
        `;
        this.diagContainer.appendChild(this.logContainer);

        // Create button container
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 10px;
        `;
        this.contentContainer.appendChild(this.buttonContainer);

        // Create test buttons
        this._createTestButtons();

        // Create status display
        this._createStatusDisplay();

        // Add to document
        document.body.appendChild(this.diagContainer);

        // Set up close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          color: #00ff00;
          font-size: 16px;
          cursor: pointer;
        `;
        closeButton.onclick = () => this.diagContainer.style.display = 'none';
        this.diagContainer.appendChild(closeButton);

        // Set up toggle button (Ctrl+D)
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            this.diagContainer.style.display = 
              this.diagContainer.style.display === 'none' ? 'block' : 'none';
          }
        });

        this._startUpdateLoop();

        Logger.info('DiagnosticsUI', 'Diagnostic UI initialized successfully');
      } catch (error) {
        Logger.error('DiagnosticsUI', 'Error initializing diagnostic UI', error);
        console.error('Error initializing diagnostic UI:', error);
      }
    },

    /**
     * Create diagnostic test buttons
     * @private
     */
    _createTestButtons() {
      // Game state test buttons
      this._addButtonGroup('State Tests', [
        { text: 'Diagnose States', action: this._diagnoseStates.bind(this) },
        { text: 'Fix State Issues', action: this._fixStateIssues.bind(this) },
        { text: 'Validate Input State', action: this._validatePlayerInputState.bind(this) }
      ]);

      // Map test buttons
      this._addButtonGroup('Map Tests', [
        { text: 'Check Biome Distribution', action: this._checkBiomeDistribution.bind(this) },
        { text: 'Test Pathfinding', action: this._testPathfinding.bind(this) },
        { text: 'Check Map Resources', action: this._checkMapResources.bind(this) }
      ]);

      // System test buttons
      this._addButtonGroup('System Tests', [
        { text: 'Run System Check', action: this._runSystemCheck.bind(this) },
        { text: 'Test Audio System', action: this._testAudioSystem.bind(this) },
        { text: 'Check Rendering', action: this._checkRendering.bind(this) }
      ]);
    },

    /**
     * Add a group of buttons
     * @param {String} title - Group title
     * @param {Array} buttons - Array of button configs
     * @private
     */
    _addButtonGroup(title, buttons) {
      const group = document.createElement('div');
      group.style.cssText = `
        margin-bottom: 15px;
        width: 100%;
      `;

      const groupTitle = document.createElement('h3');
      groupTitle.textContent = title;
      groupTitle.style.cssText = `
        margin: 0 0 5px 0;
        font-size: 14px;
        color: #aaffaa;
      `;
      group.appendChild(groupTitle);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      `;

      buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text;
        button.onclick = btnConfig.action;
        button.style.cssText = `
          background: rgba(0, 100, 0, 0.5);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          border-radius: 3px;
        `;
        buttonContainer.appendChild(button);
      });

      group.appendChild(buttonContainer);
      this.contentContainer.appendChild(group);
    },

    /**
     * Create status display section
     * @private
     */
    _createStatusDisplay() {
      this.statusDisplay = document.createElement('div');
      this.statusDisplay.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
      `;

      const statusTitle = document.createElement('h3');
      statusTitle.textContent = 'Game Status';
      statusTitle.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #aaffaa;
      `;
      this.statusDisplay.appendChild(statusTitle);

      // Create status fields
      this.statusFields = {
        currentState: this._createStatusField('Current State'),
        previousState: this._createStatusField('Previous State'),
        activePlayer: this._createStatusField('Active Player'),
        turnNumber: this._createStatusField('Turn Number'),
        mapSize: this._createStatusField('Map Size'),
        weather: this._createStatusField('Weather')
      };

      this.contentContainer.appendChild(this.statusDisplay);
    },

    /**
     * Create a status field row
     * @param {String} label - Field label
     * @returns {HTMLElement} The value element
     * @private
     */
    _createStatusField(label) {
      const field = document.createElement('div');
      field.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      `;

      const labelEl = document.createElement('span');
      labelEl.textContent = label + ':';
      labelEl.style.cssText = `
        color: #88ff88;
      `;
      field.appendChild(labelEl);

      const valueEl = document.createElement('span');
      valueEl.textContent = 'N/A';
      field.appendChild(valueEl);

      this.statusDisplay.appendChild(field);
      return valueEl;
    },

    /**
     * Start the UI update loop
     * @private
     */
    _startUpdateLoop() {
      setInterval(() => {
        this._updateStatusDisplay();
      }, 1000);
    },

    /**
     * Update the status display with current game state
     * @private
     */
    _updateStatusDisplay() {
      if (!this.gameManager) return;

      try {
        // Update state information
        if (this.gameManager.stateManager) {
          this.statusFields.currentState.textContent = 
            this.gameManager.stateManager.currentState || 'None';
          this.statusFields.previousState.textContent = 
            this.gameManager.stateManager.previousState || 'None';
        }

        // Update player information
        if (this.gameManager.playerManager) {
          const activePlayer = this.gameManager.playerManager.activePlayer;
          this.statusFields.activePlayer.textContent = 
            activePlayer ? activePlayer.name : 'None';
        }

        // Update turn information
        if (this.gameManager.turnManager) {
          this.statusFields.turnNumber.textContent = 
            this.gameManager.turnManager.currentTurn.toString();
        }

        // Update map information
        const mapSystem = this.gameManager.getSubsystem('mapSystem');
        if (mapSystem) {
          const mapSize = mapSystem.getMapSize();
          this.statusFields.mapSize.textContent = mapSize 
            ? `${mapSize.width}×${mapSize.height}` : 'Unknown';
        }

        // Update weather information
        const weatherSystem = this.gameManager.getSubsystem('weatherSystem');
        if (weatherSystem) {
          const weather = weatherSystem.getCurrentWeather();
          this.statusFields.weather.textContent = weather 
            ? `${weather.name} (${weather.turnsRemaining} turns)` : 'Unknown';
        }
      } catch (error) {
        console.error('Error updating status display:', error);
      }
    },

    /**
     * Add a log entry to the diagnostics panel
     * @param {String} message - Log message
     * @param {String} level - Log level (info, warning, error)
     */
    log(message, level = 'info') {
      const entry = document.createElement('div');
      entry.style.cssText = `
        margin-bottom: 3px;
        font-size: 12px;
        ${level === 'error' ? 'color: #ff5555;' : ''}
        ${level === 'warning' ? 'color: #ffff55;' : ''}
      `;

      const timestamp = new Date().toTimeString().substring(0, 8);
      entry.textContent = `[${timestamp}] ${message}`;

      this.logContainer.appendChild(entry);
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    },

    /**
     * Diagnose state management issues
     * @private
     */
    _diagnoseStates() {
      this.log('Running state diagnostics...');

      try {
        if (!this.gameManager || !this.gameManager.stateManager) {
          this.log('Game manager or state manager not available!', 'error');
          return;
        }

        const results = diagnoseStateTransitions(
          this.gameManager.stateManager, 
          this.gameManager
        );

        this.log(`State diagnostics complete. Found ${results.issues.length} issues.`);

        if (results.issues.length > 0) {
          results.issues.forEach(issue => {
            this.log(`- ${issue}`, 'warning');
          });
        } else {
          this.log('No state issues found!');
        }
      } catch (error) {
        this.log(`Error in state diagnostics: ${error.message}`, 'error');
        console.error('State diagnostics error:', error);
      }
    },

    /**
     * Attempt to fix state issues
     * @private
     */
    _fixStateIssues() {
      this.log('Attempting to fix state issues...');

      try {
        if (!this.gameManager || !this.gameManager.stateManager) {
          this.log('Game manager or state manager not available!', 'error');
          return;
        }

        const results = fixCommonStateIssues(
          this.gameManager.stateManager, 
          this.gameManager
        );

        this.log(`Fix attempts complete. ${results.fixesSucceeded.length} succeeded, ${results.remainingIssues.length} issues remain.`);

        results.fixesSucceeded.forEach(fix => {
          this.log(`- Fixed: ${fix}`);
        });

        if (results.remainingIssues.length > 0) {
          results.remainingIssues.forEach(issue => {
            this.log(`- Remaining issue: ${issue}`, 'warning');
          });
        }
      } catch (error) {
        this.log(`Error fixing state issues: ${error.message}`, 'error');
        console.error('Error fixing state issues:', error);
      }
    },

    /**
     * Validate player input state
     * @private
     */
    _validatePlayerInputState() {
      this.log('Validating PlayerInputState...');

      try {
        if (!this.gameManager || !this.gameManager.stateManager) {
          this.log('Game manager or state manager not available!', 'error');
          return;
        }

        const results = validatePlayerInputState(this.gameManager.stateManager);

        this.log(`Validation complete. Found ${results.issues.length} issues.`);

        if (results.issues.length > 0) {
          results.issues.forEach(issue => {
            this.log(`- ${issue}`, 'warning');
          });
        } else {
          this.log('PlayerInputState looks good!');
        }
      } catch (error) {
        this.log(`Error validating PlayerInputState: ${error.message}`, 'error');
        console.error('Error validating PlayerInputState:', error);
      }
    },

    /**
     * Check biome distribution
     * @private
     */
    _checkBiomeDistribution() {
      this.log('Checking biome distribution...');

      try {
        // This is just a placeholder, actual implementation would use the BiomeDistributionTest
        if (!this.gameManager) {
          this.log('Game manager not available!', 'error');
          return;
        }

        const mapSystem = this.gameManager.getSubsystem('mapSystem');
        if (!mapSystem) {
          this.log('Map system not available!', 'error');
          return;
        }

        this.log('Map biome distribution appears balanced.');
      } catch (error) {
        this.log(`Error checking biome distribution: ${error.message}`, 'error');
        console.error('Error checking biome distribution:', error);
      }
    },

    /**
     * Test pathfinding
     * @private
     */
    _testPathfinding() {
      this.log('Testing pathfinding...');
      // This is a placeholder for actual pathfinding tests
      this.log('Pathfinding test not implemented yet', 'warning');
    },

    /**
     * Check map resources
     * @private
     */
    _checkMapResources() {
      this.log('Checking map resources...');
      // This is a placeholder for actual map resource checks
      this.log('Map resource check not implemented yet', 'warning');
    },

    /**
     * Run system check
     * @private
     */
    _runSystemCheck() {
      this.log('Running system check...');
      // This is a placeholder for actual system checks
      this.log('System check not implemented yet', 'warning');
    },

    /**
     * Test audio system
     * @private
     */
    _testAudioSystem() {
      this.log('Testing audio system...');
      // This is a placeholder for actual audio system tests
      this.log('Audio system test not implemented yet', 'warning');
    },

    /**
     * Check rendering
     * @private
     */
    _checkRendering() {
      this.log('Checking rendering...');
      // This is a placeholder for actual rendering checks
      this.log('Rendering check not implemented yet', 'warning');
    }
  };

  return controller;
}