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
    this._gameManager = gameManager;
    this._inputsReceived = 0;
    this._requiredInputs = 0;
    this._inputTimeout = null;
    this._inputTimeoutDuration = 60000; // 60 seconds default timeout
    this._allInputsReceived = false;
    this._onCompletedActionsListener = null;

    Logger.debug('PlayerInputState', 'Instance created');
  }

  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('PlayerInputState', 'Entering player input state', data);

    // Get active players who need to provide input
    const activePlayers = this._gameManager.playerManager.getActivePlayers();
    this._requiredInputs = activePlayers.length;
    this._allInputsReceived = false;

    Logger.debug('PlayerInputState', `Waiting for input from ${this._requiredInputs} players`);

    // Reset player actions completed
    const playerManager = this._gameManager.playerManager;

    // Make sure the first player is active
    playerManager.setFirstPlayerActive();

    // Trigger event to notify UI that player input is needed
    this._gameManager.eventSystem.triggerEvent('onPlayerInputRequired', {
      players: activePlayers,
      turn: this._gameManager.currentTurn,
      timeout: this._inputTimeoutDuration
    });

    // Set timeout for player input
    this._inputTimeout = setTimeout(() => {
      Logger.warning('PlayerInputState', 'Player input timeout reached');
      this._handleInputTimeout();
    }, this._inputTimeoutDuration);

    // Set up time limit if configured
    const config = this._gameManager._config;
    if (config?.rules?.turnTimeLimit) {
      this._setInputTimeLimit(config.rules.turnTimeLimit);
    }

    // Trigger player input phase event
    this._gameManager.eventSystem.triggerEvent('onPlayerInputPhaseStart', {
      turn: this._gameManager.currentTurn,
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
  }

  /**
   * Set a time limit for input phase
   * @param {Number} timeLimit - Time limit in seconds
   * @private
   */
  _setInputTimeLimit(timeLimit) {
    Logger.debug('PlayerInputState', `Setting input time limit: ${timeLimit} seconds`);
    // Implementation here
  }

  /**
   * Check if all player inputs have been received
   * @private
   */
  _checkAllPlayerInputsReceived() {
    // Implementation here
    Logger.debug('PlayerInputState', 'Checking if all player inputs received');
  }

  /**
   * Handle player input timeout
   * @private
   */
  _handleInputTimeout() {
    Logger.warning('PlayerInputState', `Input timeout - received ${this._inputsReceived}/${this._requiredInputs} inputs`);

    // Auto-complete any missing inputs with default actions
    const pendingPlayers = this._gameManager.playerManager.getActivePlayers()
      .filter(player => !player.hasProvidedInput);

    Logger.debug('PlayerInputState', `Auto-completing input for ${pendingPlayers.length} players`);

    // Trigger event to notify that we're using default actions
    this._gameManager.eventSystem.triggerEvent('onPlayerInputDefaulted', {
      players: pendingPlayers,
      turn: this._gameManager.currentTurn
    });

    // Move to next state
    this.advanceToNextState();
  }

  /**
   * For debug mode: provide fake input for all players
   * @private
   */
  _provideFakeInputForDebug() {
    Logger.debug('PlayerInputState', 'Providing fake debug input for all players');

    const players = this._gameManager.playerManager.getActivePlayers();

    players.forEach(player => {
      // Simulate player providing input
      this.recordPlayerInput(player.id, {
        actions: ['move', 'attack'],
        targets: [{ x: 1, y: 2 }],
        isDebugGenerated: true
      });
    });
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
      this._gameManager.eventSystem.triggerEvent('onPlayerInputReceived', {
        playerId: playerId,
        inputReceived: this._inputsReceived,
        inputRequired: this._requiredInputs
      });

      // Check if all inputs received
      if (this._inputsReceived >= this._requiredInputs) {
        Logger.info('PlayerInputState', 'All player inputs received, advancing state');
        this.advanceToNextState();
      }

      return true;
    } catch (error) {
      Logger.error('PlayerInputState', `Error recording player input: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Advance to the next state in the game flow
   */
  advanceToNextState() {
    // Clear timeout if it exists
    if (this._inputTimeout) {
      clearTimeout(this._inputTimeout);
      this._inputTimeout = null;
    }

    // For now, we'll advance to the HAZARD_ROLLS state
    // This will need to be a safer implementation checking valid transitions
    try {
      this._gameManager.stateManager.changeState(GameStates.HAZARD_ROLLS);
    } catch (error) {
      Logger.error('PlayerInputState', `Error advancing to next state: ${error.message}`, error);

      // Fallback to using TURN_START (going back to a known working state)
      Logger.warning('PlayerInputState', 'Attempting fallback to TURN_START state');
      this._gameManager.stateManager.changeState(GameStates.TURN_START);
    }
  }

  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Not much to do here, most logic is event-driven
  }

  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('PlayerInputState', 'Exiting player input state');

    // Clean up timeout if it exists
    if (this._inputTimeout) {
      clearTimeout(this._inputTimeout);
      this._inputTimeout = null;
    }

    // Unregister event listener if not already done
    if (this._onCompletedActionsListener) {
      this._gameManager.eventSystem.unregisterListener(this._onCompletedActionsListener);
      this._onCompletedActionsListener = null;
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

    this._inputsReceived = saveData.inputsReceived || 0;
    this._requiredInputs = saveData.requiredInputs || 0;
    this._allInputsReceived = saveData.allInputsReceived || false;
  }
}