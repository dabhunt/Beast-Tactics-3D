
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
import { GameStates } from "../../public/js/models/GameStates.js";

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
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'diagnostics-content';
        this.diagContainer.appendChild(this.contentArea);
        
        // Create state info panel
        this.stateInfo = document.createElement('div');
        this.stateInfo.className = 'state-info';
        this.stateInfo.innerHTML = '<b>Current State:</b> Loading...';
        this.contentArea.appendChild(this.stateInfo);
        
        // Create buttons container
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.className = 'action-buttons';
        this.buttonsContainer.style.cssText = `
          margin-top: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        `;
        this.contentArea.appendChild(this.buttonsContainer);
        
        // Create testing buttons
        this._createTestButtons();
        
        // Create log container
        this.logContainer = document.createElement('div');
        this.logContainer.className = 'log-container';
        this.logContainer.style.cssText = `
          margin-top: 15px;
          background: rgba(0, 0, 0, 0.5);
          padding: 10px;
          border-radius: 3px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
        `;
        this.contentArea.appendChild(this.logContainer);
        
        // Add to DOM
        document.body.appendChild(this.diagContainer);
        
        // Start update loop
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
      // Create game state buttons
      const stateTestingButtons = [
        { text: 'Diagnose States', action: this._diagnoseStates.bind(this) },
        { text: 'Fix State Issues', action: this._fixStateIssues.bind(this) },
        { text: 'Validate PlayerInput', action: this._validatePlayerInputState.bind(this) }
      ];
      
      // Create state transition buttons
      const stateTransitionButtons = Object.values(GameStates).map(state => ({
        text: `Go to ${state}`,
        action: () => this._transitionToState(state)
      }));
      
      // Create player test buttons
      const playerTestButtons = [
        { text: 'Add Test Player', action: this._addTestPlayer.bind(this) },
        { text: 'Simulate Input', action: this._simulatePlayerInput.bind(this) }
      ];
      
      // Create debug buttons
      const debugButtons = [
        { text: 'Toggle Debug Mode', action: this._toggleDebugMode.bind(this) },
        { text: 'Reset Game', action: this._resetGame.bind(this) },
        { text: 'Clear Logs', action: () => this.logContainer.innerHTML = '' }
      ];
      
      // Add section headers and buttons
      this._addSectionHeader('State Testing');
      stateTestingButtons.forEach(btn => this._addButton(btn.text, btn.action));
      
      this._addSectionHeader('State Transitions');
      stateTransitionButtons.forEach(btn => this._addButton(btn.text, btn.action));
      
      this._addSectionHeader('Player Testing');
      playerTestButtons.forEach(btn => this._addButton(btn.text, btn.action));
      
      this._addSectionHeader('Debug Tools');
      debugButtons.forEach(btn => this._addButton(btn.text, btn.action));
    },
    
    /**
     * Add a section header to the UI
     * @param {String} text - Header text
     * @private
     */
    _addSectionHeader(text) {
      const header = document.createElement('h3');
      header.textContent = text;
      header.style.cssText = `
        width: 100%;
        margin: 10px 0 5px 0;
        font-size: 14px;
        color: #fff;
        border-bottom: 1px dashed #555;
        padding-bottom: 3px;
      `;
      this.buttonsContainer.appendChild(header);
    },
    
    /**
     * Add a button to the UI
     * @param {String} text - Button text
     * @param {Function} action - Button click handler
     * @private
     */
    _addButton(text, action) {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: #222;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 5px 10px;
        font-family: monospace;
        cursor: pointer;
        border-radius: 3px;
      `;
      button.addEventListener('click', action);
      this.buttonsContainer.appendChild(button);
    },
    
    /**
     * Start the UI update loop
     * @private
     */
    _startUpdateLoop() {
      setInterval(() => {
        this._updateStateInfo();
      }, 1000);
    },
    
    /**
     * Update the state info display
     * @private
     */
    _updateStateInfo() {
      if (!this.gameManager || !this.gameManager.stateManager) {
        this.stateInfo.innerHTML = '<b>Current State:</b> StateManager not available';
        return;
      }
      
      const currentState = this.gameManager.stateManager.currentState || 'None';
      const previousState = this.gameManager.stateManager.previousState || 'None';
      const currentTurn = this.gameManager.currentTurn || 0;
      const debugMode = this.gameManager.debugMode ? 'Enabled' : 'Disabled';
      
      this.stateInfo.innerHTML = `
        <div><b>Current State:</b> ${currentState}</div>
        <div><b>Previous State:</b> ${previousState}</div>
        <div><b>Current Turn:</b> ${currentTurn}</div>
        <div><b>Debug Mode:</b> ${debugMode}</div>
      `;
    },
    
    /**
     * Log a message to the UI
     * @param {String} message - Message to log
     * @param {String} type - Log type (info, warning, error)
     */
    log(message, type = 'info') {
      const logEntry = document.createElement('div');
      
      // Determine color based on type
      let color = '#0f0';
      if (type === 'warning') color = '#ff0';
      if (type === 'error') color = '#f00';
      
      logEntry.style.cssText = `
        color: ${color};
        margin-bottom: 2px;
        word-break: break-word;
      `;
      
      const timestamp = new Date().toISOString().substr(11, 8);
      logEntry.textContent = `[${timestamp}] ${message}`;
      
      this.logContainer.appendChild(logEntry);
      
      // Auto-scroll to bottom
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    },
    
    /**
     * Diagnose state issues
     * @private
     */
    _diagnoseStates() {
      this.log('Running state diagnostics...');
      
      try {
        const results = diagnoseStateTransitions(
          this.gameManager.stateManager,
          this.gameManager
        );
        
        this.log(`Diagnostics complete. Found ${results.issues.length} issues.`);
        
        if (results.issues.length > 0) {
          results.issues.forEach(issue => {
            this.log(`Issue: ${issue}`, 'warning');
          });
        } else {
          this.log('No issues found in state system.');
        }
      } catch (error) {
        this.log(`Error running diagnostics: ${error.message}`, 'error');
        console.error('Diagnostics error:', error);
      }
    },
    
    /**
     * Attempt to fix state issues
     * @private
     */
    _fixStateIssues() {
      this.log('Attempting to fix state issues...');
      
      try {
        const results = fixCommonStateIssues(
          this.gameManager.stateManager,
          this.gameManager
        );
        
        this.log(`Fix attempts complete. ${results.fixesSucceeded.length} succeeded, ${results.remainingIssues.length} issues remain.`);
        
        results.fixesSucceeded.forEach(fix => {
          this.log(`Fixed: ${fix}`, 'info');
        });
        
        results.remainingIssues.forEach(issue => {
          this.log(`Remaining issue: ${issue}`, 'warning');
        });
      } catch (error) {
        this.log(`Error fixing issues: ${error.message}`, 'error');
        console.error('Fix error:', error);
      }
    },
    
    /**
     * Validate PlayerInputState
     * @private
     */
    _validatePlayerInputState() {
      this.log('Validating PlayerInputState...');
      
      try {
        const results = validatePlayerInputState(this.gameManager.stateManager);
        
        this.log(`Validation complete. Found ${results.issues.length} issues.`);
        
        if (results.stateExists) {
          this.log('PlayerInputState exists in state manager.');
        } else {
          this.log('PlayerInputState does not exist in state manager!', 'error');
        }
        
        if (results.inTransitions) {
          this.log(`${results.transitionSources.length} states can transition to PlayerInputState.`);
        } else {
          this.log('No states can transition to PlayerInputState!', 'warning');
        }
        
        if (results.issues.length > 0) {
          results.issues.forEach(issue => {
            this.log(`Issue: ${issue}`, 'warning');
          });
        }
      } catch (error) {
        this.log(`Error validating PlayerInputState: ${error.message}`, 'error');
        console.error('Validation error:', error);
      }
    },
    
    /**
     * Transition to a specific state
     * @param {String} state - Target state
     * @private
     */
    _transitionToState(state) {
      this.log(`Attempting to transition to ${state} state...`);
      
      try {
        if (!this.gameManager.stateManager) {
          this.log('StateManager not available!', 'error');
          return;
        }
        
        const currentState = this.gameManager.stateManager.currentState;
        
        if (!this.gameManager.stateManager.canTransitionTo(state)) {
          this.log(`Cannot transition from ${currentState} to ${state}!`, 'warning');
          
          // Try to force the transition anyway in debug mode
          if (this.gameManager.debugMode) {
            this.log('Debug mode: Forcing transition...', 'warning');
            
            // Hacky way to allow the transition temporarily
            const validTransitions = this.gameManager.stateManager._validTransitions;
            if (!validTransitions[currentState]) {
              validTransitions[currentState] = [];
            }
            
            if (!validTransitions[currentState].includes(state)) {
              validTransitions[currentState].push(state);
              
              // Try transition now that it's "valid"
              const success = this.gameManager.stateManager.changeState(state);
              
              // Remove the temporary transition
              const index = validTransitions[currentState].indexOf(state);
              if (index >= 0) {
                validTransitions[currentState].splice(index, 1);
              }
              
              if (success) {
                this.log(`Forced transition to ${state} successful.`);
              } else {
                this.log(`Forced transition to ${state} failed!`, 'error');
              }
            }
          }
          
          return;
        }
        
        const success = this.gameManager.stateManager.changeState(state);
        
        if (success) {
          this.log(`Transition to ${state} successful.`);
        } else {
          this.log(`Transition to ${state} failed!`, 'error');
        }
      } catch (error) {
        this.log(`Error transitioning to ${state}: ${error.message}`, 'error');
        console.error(`Error transitioning to ${state}:`, error);
      }
    },
    
    /**
     * Add a test player
     * @private
     */
    _addTestPlayer() {
      this.log('Adding test player...');
      
      try {
        if (!this.gameManager.playerManager) {
          this.log('PlayerManager not available!', 'error');
          return;
        }
        
        const playerCount = this.gameManager.playerManager.getPlayers().length;
        const player = this.gameManager.playerManager.addPlayer({
          name: `Test Player ${playerCount + 1}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        });
        
        if (player) {
          this.log(`Added player: ${player.name} (${player.id})`);
        } else {
          this.log('Failed to add player!', 'error');
        }
      } catch (error) {
        this.log(`Error adding player: ${error.message}`, 'error');
        console.error('Error adding player:', error);
      }
    },
    
    /**
     * Simulate player input
     * @private
     */
    _simulatePlayerInput() {
      this.log('Simulating player input...');
      
      try {
        if (!this.gameManager.stateManager) {
          this.log('StateManager not available!', 'error');
          return;
        }
        
        // Only works in player input state
        if (this.gameManager.stateManager.currentState !== GameStates.PLAYER_INPUT) {
          this.log('Must be in PLAYER_INPUT state to simulate input!', 'warning');
          return;
        }
        
        // Get list of players
        const players = this.gameManager.playerManager.getActivePlayers();
        
        if (!players || players.length === 0) {
          this.log('No active players to simulate input for!', 'warning');
          return;
        }
        
        // Get reference to player input state instance
        const playerInputState = this.gameManager.stateManager._states[GameStates.PLAYER_INPUT];
        
        if (!playerInputState) {
          this.log('PlayerInputState instance not found!', 'error');
          return;
        }
        
        // Provide input for each player
        let inputCount = 0;
        players.forEach(player => {
          if (!player.hasProvidedInput) {
            const inputData = {
              actions: ['move', 'attack'],
              targets: [{ x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) }],
              isSimulated: true
            };
            
            const success = playerInputState.recordPlayerInput(player.id, inputData);
            
            if (success) {
              inputCount++;
            }
          }
        });
        
        this.log(`Simulated input for ${inputCount} players.`);
      } catch (error) {
        this.log(`Error simulating input: ${error.message}`, 'error');
        console.error('Error simulating input:', error);
      }
    },
    
    /**
     * Toggle debug mode
     * @private
     */
    _toggleDebugMode() {
      try {
        this.gameManager.debugMode = !this.gameManager.debugMode;
        this.log(`Debug mode ${this.gameManager.debugMode ? 'enabled' : 'disabled'}.`);
      } catch (error) {
        this.log(`Error toggling debug mode: ${error.message}`, 'error');
      }
    },
    
    /**
     * Reset the game
     * @private
     */
    _resetGame() {
      this.log('Resetting game...');
      
      try {
        // First transition to GAME_SETUP
        if (this.gameManager.stateManager) {
          // Force transition if needed
          const currentState = this.gameManager.stateManager.currentState;
          
          if (currentState !== GameStates.GAME_SETUP) {
            if (this.gameManager.stateManager.canTransitionTo(GameStates.GAME_SETUP)) {
              this.gameManager.stateManager.changeState(GameStates.GAME_SETUP);
            } else {
              // Hacky way to force transition
              this.log('Forcing transition to GAME_SETUP...', 'warning');
              
              const validTransitions = this.gameManager.stateManager._validTransitions;
              if (!validTransitions[currentState]) {
                validTransitions[currentState] = [];
              }
              
              validTransitions[currentState].push(GameStates.GAME_SETUP);
              this.gameManager.stateManager.changeState(GameStates.GAME_SETUP);
              
              // Clean up
              const index = validTransitions[currentState].indexOf(GameStates.GAME_SETUP);
              if (index >= 0) {
                validTransitions[currentState].splice(index, 1);
              }
            }
          }
        }
        
        // Reset turns
        this.gameManager.currentTurn = 0;
        
        // Reset players
        if (this.gameManager.playerManager) {
          const players = this.gameManager.playerManager.getPlayers();
          players.forEach(player => {
            player.hasProvidedInput = false;
            player.currentInput = null;
          });
        }
        
        this.log('Game reset complete.');
      } catch (error) {
        this.log(`Error resetting game: ${error.message}`, 'error');
        console.error('Error resetting game:', error);
      }
    }
  };
  
  return controller;
}
