
/**
 * TurnExecutionState.js
 * Implementation of the turn execution state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class TurnExecutionState {
  /**
   * Create a turn execution state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._executionQueue = [];
    this._executionComplete = false;
    
    Logger.debug('TurnExecutionState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('TurnExecutionState', 'Entering turn execution state');
    
    this._executionComplete = false;
    
    // Build execution queue
    this._buildExecutionQueue();
    
    // Process execution queue
    await this._processExecutionQueue();
    
    // Mark execution as complete
    this._executionComplete = true;
    
    // Move to next state
    this._gameManager.stateManager.changeState(GameStates.TURN_END);
  }
  
  /**
   * Build the queue of actions to execute
   * @private
   */
  _buildExecutionQueue() {
    Logger.info('TurnExecutionState', 'Building execution queue');
    
    // TODO: Build queue from player actions and turn order
    this._executionQueue = [];
    
    // For testing, add some dummy actions
    this._executionQueue.push({ type: 'move', delay: 500 });
    this._executionQueue.push({ type: 'combat', delay: 800 });
    this._executionQueue.push({ type: 'collect', delay: 300 });
    
    Logger.debug('TurnExecutionState', `Built execution queue with ${this._executionQueue.length} actions`);
  }
  
  /**
   * Process all actions in the execution queue
   * @private
   */
  async _processExecutionQueue() {
    Logger.info('TurnExecutionState', 'Processing execution queue');
    
    // Trigger execution start event
    this._gameManager.eventSystem.triggerEvent('onTurnExecutionStart', {
      turn: this._gameManager.currentTurn,
      actionCount: this._executionQueue.length
    });
    
    // Process each action in order
    for (let i = 0; i < this._executionQueue.length; i++) {
      const action = this._executionQueue[i];
      
      Logger.debug('TurnExecutionState', `Executing action ${i+1}/${this._executionQueue.length}: ${action.type}`);
      
      // Trigger action execution event
      this._gameManager.eventSystem.triggerEvent('onActionExecution', {
        turn: this._gameManager.currentTurn,
        actionIndex: i,
        actionType: action.type,
        action: action
      });
      
      // Simulate action execution time
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }
    
    // Trigger execution complete event
    this._gameManager.eventSystem.triggerEvent('onTurnExecutionComplete', {
      turn: this._gameManager.currentTurn
    });
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Most execution is handled in enterState
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('TurnExecutionState', 'Exiting turn execution state');
    
    // Clean up execution resources
    this._executionQueue = [];
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      executionComplete: this._executionComplete,
      queueRemaining: this._executionQueue.length
    };
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;
    
    this._executionComplete = saveData.executionComplete || false;
  }
}
