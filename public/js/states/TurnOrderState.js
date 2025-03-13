
/**
 * TurnOrderState.js
 * Implementation of the turn order determination state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class TurnOrderState {
  /**
   * Create a turn order state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    Logger.debug('TurnOrderState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('TurnOrderState', 'Entering turn order state');
    
    // Determine movement order
    await this._determineTurnOrder();
    
    // Move to next state
    this._gameManager.stateManager.changeState(GameStates.TURN_EXECUTION);
  }
  
  /**
   * Determine the order of beast movements
   * @private
   */
  async _determineTurnOrder() {
    Logger.info('TurnOrderState', 'Determining turn order');
    
    // TODO: Implement turn order determination
    
    // For now, wait a brief moment to simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger turn order determined event
    this._gameManager.eventSystem.triggerEvent('onTurnOrderDetermined', {
      turn: this._gameManager.currentTurn
    });
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Implementation will come later
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('TurnOrderState', 'Exiting turn order state');
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
