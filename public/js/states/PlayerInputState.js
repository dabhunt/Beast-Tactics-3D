
/**
 * PlayerInputState.js
 * Implementation of the player input state where players select actions
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class PlayerInputState {
  /**
   * Create a player input state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    // Log construction for diagnostics
    console.log('PlayerInputState: Initializing...');
    
    this._gameManager = gameManager;
    this._inputsReceived = 0;
    this._requiredInputs = 0;
    this._inputTimeout = null;
    this._inputTimeoutDuration = 60000; // 60 seconds default timeout
    this._allInputsReceived = false;
    this._onCompletedActionsListener = null;
    this._initialized = false;

    // Validate game manager
    if (!gameManager) {
      console.error('PlayerInputState: GameManager reference is null or undefined!');
      Logger.error('PlayerInputState', 'GameManager reference is null or undefined!');
      throw new Error('PlayerInputState requires a valid GameManager instance');
    }

    // Safety checks for required subsystems
    if (!gameManager.playerManager) {
      console.warn('PlayerInputState: PlayerManager not found on GameManager');
      Logger.warning('PlayerInputState', 'PlayerManager not found on GameManager');
    }

    if (!gameManager.eventSystem) {
      console.warn('PlayerInputState: EventSystem not found on GameManager');
      Logger.warning('PlayerInputState', 'EventSystem not found on GameManager');
    }

    if (!gameManager.stateManager) {
      console.warn('PlayerInputState: StateManager not found on GameManager');
      Logger.warning('PlayerInputState', 'StateManager not found on GameManager');
    }

    this._initialized = true;
    Logger.info('PlayerInputState', 'Instance created and initialized successfully');
    console.log('PlayerInputState: Instance created successfully');
  }

  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    console.log('PlayerInputState: enterState called with data:', data);
    Logger.info('PlayerInputState', 'Entering player input state', data);

    try {
      // Double-check initialization
      if (!this._initialized) {
        throw new Error('PlayerInputState not properly initialized');
      }

      // Safety check gameManager
      if (!this._gameManager) {
        throw new Error('GameManager reference lost');
      }

      // Safety check playerManager
      if (!this._gameManager.playerManager) {
        Logger.error('PlayerInputState', 'Cannot enter state: PlayerManager is undefined');
        throw new Error('PlayerManager is undefined');
      }

      // Get active players who need to provide input
      const activePlayers = this._gameManager.playerManager.getActivePlayers();
      
      // Validate returned players
      if (!activePlayers || !Array.isArray(activePlayers)) {
        Logger.error('PlayerInputState', 'getActivePlayers did not return an array', { 
          returned: activePlayers 
        });
        throw new Error('getActivePlayers did not return a valid array');
      }
      
      this._requiredInputs = activePlayers.length;
      this._allInputsReceived = false;

      Logger.debug('PlayerInputState', `Waiting for input from ${this._requiredInputs} players`);
      console.log(`PlayerInputState: Waiting for input from ${this._requiredInputs} players`);

      // Reset input tracking
      this._inputsReceived = 0;

      // Reset player actions completed
      const playerManager = this._gameManager.playerManager;

      // Safety check
      if (!playerManager.setFirstPlayerActive) {
        Logger.warning('PlayerInputState', 'playerManager.setFirstPlayerActive is not a function');
        console.warn('PlayerInputState: playerManager.setFirstPlayerActive is not a function');
      } else {
        // Make sure the first player is active
        playerManager.setFirstPlayerActive();
      }

      // Safety check eventSystem
      if (!this._gameManager.eventSystem) {
        Logger.error('PlayerInputState', 'Cannot enter state: EventSystem is undefined');
        throw new Error('EventSystem is undefined');
      }

      // Trigger event to notify UI that player input is needed
      this._gameManager.eventSystem.triggerEvent('onPlayerInputRequired', {
        players: activePlayers,
        turn: this._gameManager.currentTurn || 0,
        timeout: this._inputTimeoutDuration
      });

      // Set timeout for player input
      this._inputTimeout = setTimeout(() => {
        Logger.warning('PlayerInputState', 'Player input timeout reached');
        this._handleInputTimeout();
      }, this._inputTimeoutDuration);

      // Set up time limit if configured
      const config = this._gameManager._config;
      if (config && config.rules && config.rules.turnTimeLimit) {
        this._setInputTimeLimit(config.rules.turnTimeLimit);
      }

      // Trigger player input phase event
      this._gameManager.eventSystem.triggerEvent('onPlayerInputPhaseStart', {
        turn: this._gameManager.currentTurn || 0,
        activePlayer: playerManager.activePlayer
      });

      // Register event listener for completed actions
      this._onCompletedActionsListener = this._gameManager.eventSystem.registerListener(
        'onPlayerActionsCompleted',
        this._checkAllPlayerInputsReceived.bind(this)
      );

      // If in debug mode, automatically provide fake input
      if (this._gameManager.debugMode) {
        Logger.info('PlayerInputState', 'Debug mode: Automatically providing input');
        setTimeout(() => this._provideFakeInputForDebug(), 2000);
      }
      
      Logger.info('PlayerInputState', 'Successfully entered state');
      console.log('PlayerInputState: Successfully entered state');
      
    } catch (error) {
      Logger.error('PlayerInputState', `Error entering state: ${error.message}`, error);
      console.error('PlayerInputState: Error entering state:', error);
      
      // If we failed to enter this state, attempt to go back to a safe state
      try {
        if (this._gameManager && this._gameManager.stateManager) {
          this._gameManager.stateManager.changeState(GameStates.TURN_START);
        }
      } catch (fallbackError) {
        Logger.error('PlayerInputState', 'Failed to fallback to TURN_START state', fallbackError);
      }
    }
  }

  /**
   * Set a time limit for input phase
   * @param {Number} timeLimit - Time limit in seconds
   * @private
   */
  _setInputTimeLimit(timeLimit) {
    Logger.debug('PlayerInputState', `Setting input time limit: ${timeLimit} seconds`);
    console.log(`PlayerInputState: Setting input time limit: ${timeLimit} seconds`);
    
    // Convert from seconds to milliseconds
    this._inputTimeoutDuration = timeLimit * 1000;
    
    // Clear any existing timeout
    if (this._inputTimeout) {
      clearTimeout(this._inputTimeout);
    }
    
    // Set new timeout
    this._inputTimeout = setTimeout(() => {
      Logger.warning('PlayerInputState', `Input timeout reached after ${timeLimit} seconds`);
      this._handleInputTimeout();
    }, this._inputTimeoutDuration);
  }

  /**
   * Check if all player inputs have been received
   * @private
   */
  _checkAllPlayerInputsReceived() {
    Logger.debug('PlayerInputState', 'Checking if all player inputs received');
    console.log('PlayerInputState: Checking if all player inputs received');
    
    try {
      // Safety check
      if (!this._gameManager || !this._gameManager.playerManager) {
        Logger.error('PlayerInputState', 'Cannot check player inputs: PlayerManager is undefined');
        return;
      }
      
      const players = this._gameManager.playerManager.getActivePlayers();
      const pendingPlayers = players.filter(player => !player.hasProvidedInput);
      
      Logger.debug('PlayerInputState', `Inputs status: ${this._inputsReceived}/${this._requiredInputs} received, ${pendingPlayers.length} pending`);
      
      // If all inputs received, advance state
      if (this._inputsReceived >= this._requiredInputs) {
        Logger.info('PlayerInputState', 'All player inputs received, advancing state');
        this.advanceToNextState();
      }
    } catch (error) {
      Logger.error('PlayerInputState', `Error checking player inputs: ${error.message}`, error);
      console.error('PlayerInputState: Error checking player inputs:', error);
    }
  }

  /**
   * Handle player input timeout
   * @private
   */
  _handleInputTimeout() {
    Logger.warning('PlayerInputState', `Input timeout - received ${this._inputsReceived}/${this._requiredInputs} inputs`);
    console.log(`PlayerInputState: Input timeout - received ${this._inputsReceived}/${this._requiredInputs} inputs`);

    try {
      // Safety check
      if (!this._gameManager || !this._gameManager.playerManager) {
        Logger.error('PlayerInputState', 'Cannot handle timeout: PlayerManager is undefined');
        return;
      }
      
      // Auto-complete any missing inputs with default actions
      const pendingPlayers = this._gameManager.playerManager.getActivePlayers()
        .filter(player => !player.hasProvidedInput);

      Logger.debug('PlayerInputState', `Auto-completing input for ${pendingPlayers.length} players`);

      // Trigger event to notify that we're using default actions
      if (this._gameManager.eventSystem) {
        this._gameManager.eventSystem.triggerEvent('onPlayerInputDefaulted', {
          players: pendingPlayers,
          turn: this._gameManager.currentTurn || 0
        });
      }

      // Move to next state
      this.advanceToNextState();
    } catch (error) {
      Logger.error('PlayerInputState', `Error handling input timeout: ${error.message}`, error);
      console.error('PlayerInputState: Error handling input timeout:', error);
      
      // Attempt to advance state even if there was an error
      this.advanceToNextState();
    }
  }

  /**
   * For debug mode: provide fake input for all players
   * @private
   */
  _provideFakeInputForDebug() {
    Logger.debug('PlayerInputState', 'Providing fake debug input for all players');
    console.log('PlayerInputState: Providing fake debug input for all players');

    try {
      // Safety check
      if (!this._gameManager || !this._gameManager.playerManager) {
        Logger.error('PlayerInputState', 'Cannot provide debug input: PlayerManager is undefined');
        return;
      }
      
      const players = this._gameManager.playerManager.getActivePlayers();

      players.forEach(player => {
        // Simulate player providing input
        this.recordPlayerInput(player.id, {
          actions: ['move', 'attack'],
          targets: [{ x: 1, y: 2 }],
          isDebugGenerated: true
        });
      });
      
      Logger.debug('PlayerInputState', `Provided fake input for ${players.length} players`);
    } catch (error) {
      Logger.error('PlayerInputState', `Error providing fake input: ${error.message}`, error);
      console.error('PlayerInputState: Error providing fake input:', error);
    }
  }

  /**
   * Record input from a player
   * @param {String} playerId - ID of the player providing input
   * @param {Object} inputData - The input data from the player
   * @returns {Boolean} Whether the input was accepted
   */
  recordPlayerInput(playerId, inputData) {
    try {
      Logger.debug('PlayerInputState', `Received input from player ${playerId}`, inputData);
      console.log(`PlayerInputState: Received input from player ${playerId}`);

      // Safety check
      if (!this._gameManager || !this._gameManager.playerManager) {
        Logger.error('PlayerInputState', 'Cannot record input: PlayerManager is undefined');
        return false;
      }
      
      const player = this._gameManager.playerManager.getPlayerById(playerId);

      if (!player) {
        Logger.warning('PlayerInputState', `Cannot record input: player ${playerId} not found`);
        return false;
      }

      // Store input with the player
      player.currentInput = inputData;
      player.hasProvidedInput = true;

      // Increment counter
      this._inputsReceived++;

      Logger.debug('PlayerInputState', `Input recorded. Received ${this._inputsReceived}/${this._requiredInputs}`);

      // Trigger event for UI update
      if (this._gameManager.eventSystem) {
        this._gameManager.eventSystem.triggerEvent('onPlayerInputReceived', {
          playerId: playerId,
          inputReceived: this._inputsReceived,
          inputRequired: this._requiredInputs
        });
      }

      // Check if all inputs received
      if (this._inputsReceived >= this._requiredInputs) {
        Logger.info('PlayerInputState', 'All player inputs received, advancing state');
        this.advanceToNextState();
      }

      return true;
    } catch (error) {
      Logger.error('PlayerInputState', `Error recording player input: ${error.message}`, error);
      console.error('PlayerInputState: Error recording player input:', error);
      return false;
    }
  }

  /**
   * Advance to the next state in the game flow
   */
  advanceToNextState() {
    Logger.info('PlayerInputState', 'Advancing to next state');
    console.log('PlayerInputState: Advancing to next state');
    
    try {
      // Clear timeout if it exists
      if (this._inputTimeout) {
        clearTimeout(this._inputTimeout);
        this._inputTimeout = null;
      }

      // Safety check
      if (!this._gameManager || !this._gameManager.stateManager) {
        Logger.error('PlayerInputState', 'Cannot advance state: StateManager is undefined');
        return;
      }
      
      // Check if HAZARD_ROLLS is a valid transition
      let nextState = GameStates.HAZARD_ROLLS;
      
      // Check if that transition is valid
      if (!this._gameManager.stateManager.canTransitionTo(nextState)) {
        // Fall back to TURN_START if necessary
        Logger.warning('PlayerInputState', `Cannot transition to ${nextState}, falling back to TURN_START`);
        nextState = GameStates.TURN_START;
        
        // Check again
        if (!this._gameManager.stateManager.canTransitionTo(nextState)) {
          Logger.error('PlayerInputState', `Cannot transition to fallback state ${nextState}`);
          return;
        }
      }
      
      // Attempt state transition
      Logger.info('PlayerInputState', `Transitioning to ${nextState} state`);
      this._gameManager.stateManager.changeState(nextState);
      
    } catch (error) {
      Logger.error('PlayerInputState', `Error advancing to next state: ${error.message}`, error);
      console.error('PlayerInputState: Error advancing to next state:', error);

      // Try a more aggressive fallback approach
      try {
        Logger.warning('PlayerInputState', 'Attempting aggressive fallback to TURN_START state');
        this._gameManager.stateManager.changeState(GameStates.TURN_START);
      } catch (fallbackError) {
        Logger.error('PlayerInputState', 'Error in fallback state transition', fallbackError);
      }
    }
  }

  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Not much to do here, most logic is event-driven
    // But we can add some debug logging for tracing
    if (this._gameManager?.debugMode && Math.random() < 0.01) { // Only log occasionally
      Logger.debug('PlayerInputState', 'Update tick', {
        inputsReceived: this._inputsReceived,
        requiredInputs: this._requiredInputs
      });
    }
  }

  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('PlayerInputState', 'Exiting player input state');
    console.log('PlayerInputState: Exiting player input state');

    try {
      // Clean up timeout if it exists
      if (this._inputTimeout) {
        clearTimeout(this._inputTimeout);
        this._inputTimeout = null;
      }

      // Unregister event listener if not already done
      if (this._onCompletedActionsListener && this._gameManager?.eventSystem) {
        this._gameManager.eventSystem.unregisterListener(this._onCompletedActionsListener);
        this._onCompletedActionsListener = null;
      }
      
      Logger.debug('PlayerInputState', 'Successfully exited state and cleaned up resources');
    } catch (error) {
      Logger.error('PlayerInputState', `Error exiting state: ${error.message}`, error);
      console.error('PlayerInputState: Error exiting state:', error);
    }
  }

  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      inputsReceived: this._inputsReceived,
      requiredInputs: this._requiredInputs,
      allInputsReceived: this._allInputsReceived
    };
  }

  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;

    try {
      this._inputsReceived = saveData.inputsReceived || 0;
      this._requiredInputs = saveData.requiredInputs || 0;
      this._allInputsReceived = saveData.allInputsReceived || false;
      
      Logger.debug('PlayerInputState', 'Loaded save data', {
        inputsReceived: this._inputsReceived,
        requiredInputs: this._requiredInputs
      });
    } catch (error) {
      Logger.error('PlayerInputState', `Error loading save data: ${error.message}`, error);
    }
  }
}
