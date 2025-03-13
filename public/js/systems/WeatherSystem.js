
/**
 * WeatherSystem.js
 * Manages weather conditions and effects in the game world
 */

import { Logger } from '../utils/Logger.js';

export class WeatherSystem {
  /**
   * Create the weather system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._currentWeather = 'clear';
    this._weatherEffects = [];
    this._weatherHistory = [];
    
    // Weather type definitions and their effects
    this._weatherTypes = {
      'clear': { name: 'Clear Skies', effects: [] },
      'rain': { name: 'Rain', effects: ['wetGround', 'reducedVisibility'] },
      'storm': { name: 'Storm', effects: ['wetGround', 'reducedVisibility', 'lightning'] },
      'fog': { name: 'Fog', effects: ['heavyReducedVisibility'] },
      'snow': { name: 'Snow', effects: ['slowMovement', 'reducedVisibility'] },
      'heat': { name: 'Heat Wave', effects: ['dehydration'] },
      'wind': { name: 'Strong Winds', effects: ['displacementRisk'] }
    };
    
    Logger.info('WeatherSystem', 'Weather system initialized with clear weather');
  }
  
  /**
   * Initialize the weather system
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize() {
    Logger.info('WeatherSystem', 'Initializing weather system');
    
    // Register event listeners
    const eventSystem = this._gameManager.eventSystem;
    if (eventSystem) {
      eventSystem.registerListener('onTurnStart', this._handleTurnStart.bind(this));
    }
    
    // Generate initial weather
    await this._generateRandomWeather();
    
    Logger.info('WeatherSystem', 'Weather system initialized successfully');
    return true;
  }
  
  /**
   * Handle turn start event
   * @param {Object} eventData - Event data
   * @private
   */
  _handleTurnStart(eventData) {
    Logger.debug('WeatherSystem', 'Turn start detected, weather may change soon', eventData);
  }
  
  /**
   * Generate random weather based on current conditions
   * @private
   */
  async _generateRandomWeather() {
    // List of possible weather types
    const possibleTypes = Object.keys(this._weatherTypes);
    
    // For now, just pick a random type
    const randomIndex = Math.floor(Math.random() * possibleTypes.length);
    const newWeather = possibleTypes[randomIndex];
    
    // Update current weather
    this._currentWeather = newWeather;
    this._weatherEffects = this._weatherTypes[newWeather].effects;
    
    Logger.info('WeatherSystem', `Weather changed to: ${this._weatherTypes[newWeather].name}`);
    
    // Trigger weather change event
    if (this._gameManager.eventSystem) {
      this._gameManager.eventSystem.triggerEvent('onWeatherChange', {
        weather: newWeather,
        effects: this._weatherEffects,
        turn: this._gameManager.currentTurn
      });
    }
    
    return {
      type: newWeather,
      effects: [...this._weatherEffects]
    };
  }
  
  /**
   * Update weather for the current turn
   * @param {Number} turn - Current turn number
   * @returns {Object} New weather state
   */
  async updateWeather(turn) {
    Logger.info('WeatherSystem', `Updating weather for turn ${turn}`);
    
    try {
      // Track current weather in history
      this._weatherHistory.push({
        turn: turn - 1, // The weather that was active in the previous turn
        weather: this._currentWeather,
        effects: [...this._weatherEffects]
      });
      
      // Weather changes based on probability
      // Higher turn numbers might have more extreme weather
      const changeChance = Math.min(0.3 + (turn * 0.02), 0.7);
      
      // Should weather change this turn?
      if (Math.random() < changeChance) {
        Logger.debug('WeatherSystem', `Weather will change (${changeChance.toFixed(2)} probability)`);
        return await this._generateRandomWeather();
      } else {
        Logger.debug('WeatherSystem', `Weather remains ${this._weatherTypes[this._currentWeather].name}`);
        return {
          type: this._currentWeather,
          effects: [...this._weatherEffects]
        };
      }
    } catch (error) {
      Logger.error('WeatherSystem', 'Error updating weather', error);
      console.error('Weather update error:', {
        turn,
        error: error.message,
        stack: error.stack
      });
      
      // Return default weather in case of error
      return { 
        type: 'clear',
        effects: [] 
      };
    }
  }
  
  /**
   * Get the current weather
   * @returns {Object} Current weather
   */
  getCurrentWeather() {
    return {
      type: this._currentWeather,
      name: this._weatherTypes[this._currentWeather].name,
      effects: [...this._weatherEffects]
    };
  }
  
  /**
   * Get weather history
   * @param {Number} limit - Maximum number of entries to return
   * @returns {Array} Weather history
   */
  getWeatherHistory(limit = 10) {
    return this._weatherHistory.slice(-limit);
  }
  
  /**
   * Check if a specific weather effect is active
   * @param {String} effect - Effect to check for
   * @returns {Boolean} Whether the effect is active
   */
  hasWeatherEffect(effect) {
    return this._weatherEffects.includes(effect);
  }
}
