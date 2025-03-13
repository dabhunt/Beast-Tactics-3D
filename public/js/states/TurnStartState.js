
/**
 * TurnStartState.js
 * Implementation of the turn start state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class TurnStartState {
  /**
   * Create a turn start state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._startProcessComplete = false;
    
    Logger.debug('TurnStartState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    const turnNumber = this._gameManager.currentTurn;
    Logger.info('TurnStartState', `Starting turn ${turnNumber}`);
    
    this._startProcessComplete = false;
    
    // Trigger turn start event
    this._gameManager.eventSystem.triggerEvent('onTurnStart', {
      turn: turnNumber,
      timestamp: Date.now()
    });
    
    // Process start-of-turn effects
    await this._processStartOfTurnEffects();
    
    // Check weather changes
    await this._processWeatherChanges();
    
    // Process passive abilities
    await this._processPassiveAbilities();
    
    // Mark start process as complete
    this._startProcessComplete = true;
    
    // Transition to player input state
    this._gameManager.stateManager.changeState(GameStates.PLAYER_INPUT);
  }
  
  /**
   * Process all start-of-turn effects
   * @private
   */
  async _processStartOfTurnEffects() {
    Logger.info('TurnStartState', 'Processing start-of-turn effects');
    
    try {
      // Trigger async event for all systems to process start effects
      const results = await this._gameManager.eventSystem.triggerEventAsync('onProcessStartOfTurn', {
        turn: this._gameManager.currentTurn
      });
      
      Logger.debug('TurnStartState', `Processed ${results.length} start-of-turn effects`);
    } catch (error) {
      Logger.error('TurnStartState', 'Error processing start-of-turn effects', error);
    }
  }
  
  /**
   * Process weather changes
   * @private
   */
  async _processWeatherChanges() {
    Logger.info('TurnStartState', 'Processing weather changes');
    
    try {
      // Get weather system if available - with detailed logging
      Logger.debug('TurnStartState', 'Attempting to access weather system');
      const weatherSystem = this._gameManager.getSubsystem ? 
        this._gameManager.getSubsystem('weatherSystem') : null;
      
      // Log details about the game manager
      Logger.debug('TurnStartState', 'GameManager state:', {
        hasGetSubsystem: typeof this._gameManager.getSubsystem === 'function',
        currentTurn: this._gameManager.currentTurn,
        managerInitialized: this._gameManager.initialized
      });
      
      if (!weatherSystem) {
        Logger.warning('TurnStartState', 'Weather system not available, skipping weather changes');
        return;
      }
      
      // Validate that the weatherSystem has the expected method
      if (typeof weatherSystem.updateWeather !== 'function') {
        Logger.warning('TurnStartState', 'Weather system exists but updateWeather method is missing, skipping');
        return;
      }
      
      // Update weather
      Logger.debug('TurnStartState', 'Calling weatherSystem.updateWeather()');
      await weatherSystem.updateWeather(this._gameManager.currentTurn);
      
      Logger.debug('TurnStartState', 'Weather processing complete');
    } catch (error) {
      Logger.error('TurnStartState', 'Error processing weather changes', error);
      // Log detailed error info
      console.error('Weather system error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      // Prevent this error from halting the turn process
      Logger.info('TurnStartState', 'Continuing despite weather processing error');
    }
  }
  
  /**
   * Process passive abilities that trigger at turn start
   * @private
   */
  async _processPassiveAbilities() {
    Logger.info('TurnStartState', 'Processing passive abilities');
    
    try {
      // Trigger event for passive ability processing
      await this._gameManager.eventSystem.triggerEventAsync('onProcessPassiveAbilities', {
        turn: this._gameManager.currentTurn,
        phase: 'start'
      });
      
      Logger.debug('TurnStartState', 'Passive abilities processing complete');
    } catch (error) {
      Logger.error('TurnStartState', 'Error processing passive abilities', error);
    }
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Most of the turn start logic is handled during enter,
    // but we could add animations or time-based transitions here
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('TurnStartState', 'Exiting turn start state');
    
    // Clean up any turn start specific resources
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      startProcessComplete: this._startProcessComplete
    };
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;
    
    this._startProcessComplete = saveData.startProcessComplete || false;
  }
}
