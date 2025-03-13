
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
    this._allInputsReceived = false;
    this._timeoutId = null;
    
    Logger.debug('PlayerInputState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('PlayerInputState', 'Entering player input state');
    
    this._allInputsReceived = false;
    
    // Reset player actions completed
    const playerManager = this._gameManager.playerManager;
    
    // Make sure the first player is active
    playerManager.setFirstPlayerActive();
    
    // Set up time limit if configured
    const config = this._gameManager._config;
    if (config.rules?.turnTimeLimit) {
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
  }
  
  /**
   * Set a time limit for input phase
   * @param {Number} timeLimit - Time limit in milliseconds
   * @private
   */
  _setInputTimeLimit(timeLimit) {
    Logger.debug('PlayerInputState', `Setting input time limit: ${timeLimit}ms`);
    
    // Clear any existing timeout
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    // Set new timeout
    this._timeoutId = setTimeout(() => {
      Logger.info('PlayerInputState', 'Input time limit reached');
      
      // Auto-complete for any players who haven't finished
      this._autoCompleteRemainingInputs();
      
      // Move to next state
      this._completeInputPhase();
    }, timeLimit);
  }
  
  /**
   * Auto-complete inputs for any players who haven't submitted
   * @private
   */
  _autoCompleteRemainingInputs() {
    const playerManager = this._gameManager.playerManager;
    const players = playerManager.getAllPlayers();
    
    players.forEach(player => {
      if (!playerManager.hasPlayerCompletedActions(player.id)) {
        Logger.warning('PlayerInputState', `Auto-completing input for player: ${player.name}`);
        
        // TODO: Generate default actions for player
        
        // Mark as completed
        if (player.id === playerManager.activePlayer?.id) {
          playerManager.markActivePlayerActionsCompleted();
          playerManager.advanceToNextPlayer();
        }
      }
    });
  }
  
  /**
   * Check if all players have completed their inputs
   * @param {Object} eventData - Event data from completion
   * @private
   */
  _checkAllPlayerInputsReceived(eventData) {
    const playerManager = this._gameManager.playerManager;
    
    if (playerManager.areAllPlayerActionsCompleted()) {
      Logger.info('PlayerInputState', 'All player inputs received');
      this._completeInputPhase();
    } else if (eventData.player.id === playerManager.activePlayer?.id) {
      // Advance to next player if the active player completed actions
      playerManager.advanceToNextPlayer();
      
      // Trigger active player changed event
      this._gameManager.eventSystem.triggerEvent('onActivePlayerInputTurn', {
        turn: this._gameManager.currentTurn,
        activePlayer: playerManager.activePlayer
      });
    }
  }
  
  /**
   * Complete the input phase and transition to next state
   * @private
   */
  _completeInputPhase() {
    if (this._allInputsReceived) return;
    
    // Mark as complete to prevent duplicate transitions
    this._allInputsReceived = true;
    
    // Clear timeout if set
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    
    // Unregister event listener
    if (this._onCompletedActionsListener) {
      this._gameManager.eventSystem.unregisterListener(this._onCompletedActionsListener);
    }
    
    // Trigger input phase complete event
    this._gameManager.eventSystem.triggerEvent('onPlayerInputPhaseComplete', {
      turn: this._gameManager.currentTurn
    });
    
    // Transition to hazard rolls state
    this._gameManager.stateManager.changeState(GameStates.HAZARD_ROLLS);
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Most of the input state is event-driven
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('PlayerInputState', 'Exiting player input state');
    
    // Clear timeout if set
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
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
      allInputsReceived: this._allInputsReceived
    };
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;
    
    this._allInputsReceived = saveData.allInputsReceived || false;
  }
}
