/**
 * TurnStartState.js
 * Implements turn start processing
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class TurnStartState {
  /**
   * Create a new turn start state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
  }

  /**
   * Enter the turn start state
   * @param {Object} stateData - Optional data passed from previous state
   */
  async enterState(stateData = {}) {
    try {
      const currentTurn = this._gameManager.currentTurn || 0;
      Logger.info('TurnStartState', `Starting turn ${currentTurn}`);

      // Process start-of-turn effects
      Logger.info('TurnStartState', 'Processing start-of-turn effects');
      await this._processStartOfTurnEffects();

      // Process weather changes
      Logger.info('TurnStartState', 'Processing weather changes');
      await this._processWeatherChanges();

      // Move to player input state after processing
      await this._gameManager.stateManager.changeState(GameStates.PLAYER_INPUT);
    } catch (error) {
      Logger.error('TurnStartState', 'Error during turn start processing', error);
      console.error('Error during turn start processing:', error);
    }
  }

  /**
   * Process any effects that occur at the start of a turn
   * @private
   */
  async _processStartOfTurnEffects() {
    try {
      // Get any active status effects from game state
      // For now this is a placeholder until proper effects system is implemented

      // Fire event to allow systems to process their start-of-turn logic
      const results = await this._gameManager.eventSystem.triggerEventAsync('onProcessStartOfTurn', {
        turn: this._gameManager.currentTurn
      });

      Logger.debug('TurnStartState', `Processed ${results.length} start-of-turn effects`);
    } catch (error) {
      Logger.error('TurnStartState', 'Error processing start-of-turn effects', error);
    }
  }

  /**
   * Process weather changes or effects
   * @private
   */
  async _processWeatherChanges() {
    try {
      // Get weather system from game manager
      const weatherSystem = this._gameManager.getSubsystem('weatherSystem');

      // If weather system exists, it will automatically process changes through the onTurnStart event
      if (weatherSystem) {
        const currentWeather = weatherSystem.getCurrentWeather();

        if (currentWeather) {
          Logger.debug('TurnStartState', 'Current weather status:', {
            type: currentWeather.type,
            name: currentWeather.name,
            turnsRemaining: currentWeather.turnDuration
          });
        } else {
          Logger.warning('TurnStartState', 'Weather system exists but returned no current weather');
        }
      } else {
        Logger.warning('TurnStartState', 'Weather system not available');
      }
    } catch (error) {
      Logger.error('TurnStartState', 'Error processing weather changes', error);
    }
  }

  /**
   * Exit the state
   */
  exitState() {
    Logger.debug('TurnStartState', 'Exiting turn start state');
  }

  /**
   * Update state (called from game loop)
   * @param {Number} deltaTime - Time elapsed since last update
   */
  updateState(deltaTime) {
    // No continuous processing needed in this state
  }

  /**
   * Get serializable state data for saving
   * @returns {Object} State-specific save data
   */
  getSaveData() {
    return {};
  }

  /**
   * Restore state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    // No persistent data for this state currently
  }
}