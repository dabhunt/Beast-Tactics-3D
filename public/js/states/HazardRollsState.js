
/**
 * HazardRollsState.js
 * Implementation of the hazard rolls state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class HazardRollsState {
  /**
   * Create a hazard rolls state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    Logger.debug('HazardRollsState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('HazardRollsState', 'Entering hazard rolls state');
    
    // Process hazard rolls
    await this._processHazardRolls();
    
    // Move to next state
    this._gameManager.stateManager.changeState(GameStates.TURN_ORDER);
  }
  
  /**
   * Process hazard rolls for all beasts in hazardous biomes
   * @private
   */
  async _processHazardRolls() {
    Logger.info('HazardRollsState', 'Processing hazard rolls');
    
    // TODO: Implement hazard roll processing
    
    // For now, wait a brief moment to simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger hazard processing complete event
    this._gameManager.eventSystem.triggerEvent('onHazardRollsComplete', {
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
    Logger.info('HazardRollsState', 'Exiting hazard rolls state');
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
