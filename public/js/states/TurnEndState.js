
/**
 * TurnEndState.js
 * Implementation of the turn end state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class TurnEndState {
  /**
   * Create a turn end state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    Logger.debug('TurnEndState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('TurnEndState', 'Entering turn end state');
    
    // Process end-of-turn effects
    await this._processEndOfTurnEffects();
    
    // Check victory conditions
    if (this._checkVictoryConditions()) {
      // Game is over, transition to game over state
      this._gameManager.stateManager.changeState(GameStates.GAME_OVER);
    } else {
      // Continue to next turn
      this._gameManager.stateManager.changeState(GameStates.TURN_START);
    }
  }
  
  /**
   * Process all end-of-turn effects
   * @private
   */
  async _processEndOfTurnEffects() {
    Logger.info('TurnEndState', 'Processing end-of-turn effects');
    
    try {
      // Trigger async event for all systems to process end effects
      const results = await this._gameManager.eventSystem.triggerEventAsync('onProcessEndOfTurn', {
        turn: this._gameManager.currentTurn
      });
      
      Logger.debug('TurnEndState', `Processed ${results.length} end-of-turn effects`);
    } catch (error) {
      Logger.error('TurnEndState', 'Error processing end-of-turn effects', error);
    }
  }
  
  /**
   * Check if any victory conditions have been met
   * @returns {Boolean} Whether the game should end
   * @private
   */
  _checkVictoryConditions() {
    Logger.info('TurnEndState', 'Checking victory conditions');
    
    // TODO: Implement victory condition checks
    
    // For now, return false to continue game
    return false;
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Most of the end state logic is handled in enterState
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('TurnEndState', 'Exiting turn end state');
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {};
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    // Implementation will come later
  }
}
