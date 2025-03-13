
/**
 * WeatherSystem.js
 * System that manages weather conditions and their effects on gameplay
 */

import { Logger } from '../utils/Logger.js';

export class WeatherSystem {
  /**
   * Creates the weather management system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    
    // Current active weather
    this._currentWeather = {
      type: 'clear',
      name: 'Clear',
      turnDuration: 0,
      modifiers: {}
    };
    
    // Weather patterns that can occur during gameplay
    this._weatherTypes = {
      clear: {
        name: 'Clear',
        probability: 0.3,
        maxDuration: 3,
        modifiers: {}
      },
      rain: {
        name: 'Rain',
        probability: 0.2,
        maxDuration: 2,
        modifiers: {
          water: 1.2,
          fire: 0.8
        }
      },
      strongWinds: {
        name: 'Strong Winds',
        probability: 0.15,
        maxDuration: 2,
        modifiers: {
          wind: 1.2,
          flying: 1.2
        }
      },
      heatwave: {
        name: 'Heatwave',
        probability: 0.1,
        maxDuration: 2,
        modifiers: {
          fire: 1.3,
          ice: 0.7,
          water: 0.8
        }
      },
      fog: {
        name: 'Fog',
        probability: 0.1,
        maxDuration: 1,
        modifiers: {
          visionRange: -1
        }
      },
      snow: {
        name: 'Snow',
        probability: 0.15,
        maxDuration: 2,
        modifiers: {
          ice: 1.3,
          fire: 0.7,
          movementSpeed: 0.8
        }
      }
    };
    
    Logger.info('WeatherSystem', 'Weather system initialized with clear weather');
  }
  
  /**
   * Initialize the weather system
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize() {
    try {
      Logger.info('WeatherSystem', 'Initializing weather system');
      
      // Register event listeners
      this._gameManager.eventSystem.registerListener('onTurnStart', this._handleTurnStart.bind(this));
      
      // Start with random weather
      this._changeToRandomWeather();
      
      Logger.info('WeatherSystem', 'Weather system initialized successfully');
      return true;
    } catch (error) {
      Logger.error('WeatherSystem', 'Initialization failed', error);
      return false;
    }
  }
  
  /**
   * Handle the start of turn event (process weather changes)
   * @param {Object} eventData - Event data from the turn start event
   * @private
   */
  _handleTurnStart(eventData) {
    try {
      Logger.debug('WeatherSystem', 'Processing weather for new turn', eventData);
      
      // Decrease current weather duration
      this._currentWeather.turnDuration--;
      
      // Determine if weather should change
      if (this._currentWeather.turnDuration <= 0) {
        this._changeToRandomWeather();
      }
      
      // Apply weather effects to the game state
      this._applyWeatherEffects();
    } catch (error) {
      Logger.error('WeatherSystem', 'Error processing turn start weather effects', error);
    }
  }
  
  /**
   * Change to a random weather type based on probabilities
   * @private
   */
  _changeToRandomWeather() {
    try {
      // Create probability distribution
      const weatherOptions = Object.keys(this._weatherTypes);
      const probabilities = weatherOptions.map(type => this._weatherTypes[type].probability);
      
      // Select weather based on probability
      const newWeatherType = this._weightedRandom(weatherOptions, probabilities);
      
      // Generate duration
      const weatherConfig = this._weatherTypes[newWeatherType];
      const duration = Math.floor(Math.random() * weatherConfig.maxDuration) + 1;
      
      // Set new weather
      this._currentWeather = {
        type: newWeatherType,
        name: weatherConfig.name,
        turnDuration: duration,
        modifiers: { ...weatherConfig.modifiers }
      };
      
      // Trigger weather change event
      this._gameManager.eventSystem.triggerEvent('onWeatherChange', {
        previous: this._currentWeather.type,
        new: this._currentWeather.type,
        name: this._currentWeather.name,
        duration: this._currentWeather.turnDuration,
        modifiers: this._currentWeather.modifiers
      });
      
      Logger.info('WeatherSystem', `Weather changed to: ${this._currentWeather.name}`);
    } catch (error) {
      Logger.error('WeatherSystem', 'Error changing weather', error);
      
      // Fallback to clear weather
      this._currentWeather = {
        type: 'clear',
        name: 'Clear',
        turnDuration: 1,
        modifiers: {}
      };
    }
  }
  
  /**
   * Apply current weather effects to the game
   * @private
   */
  _applyWeatherEffects() {
    try {
      Logger.debug('WeatherSystem', 'Applying weather effects', this._currentWeather);
      
      // Get active beasts from the battle system
      const battleSystem = this._gameManager.getSubsystem('battleSystem');
      
      // If battle system doesn't exist yet, just return
      if (!battleSystem) {
        Logger.debug('WeatherSystem', 'Battle system not available, skipping weather effects');
        return;
      }
      
      // Apply modifiers to beasts based on their elements
      const activeBattlers = battleSystem.getActiveBattlers();
      if (!activeBattlers || activeBattlers.length === 0) {
        Logger.debug('WeatherSystem', 'No active battlers, skipping weather effects');
        return;
      }
      
      // Apply specific modifiers to each battler
      // TODO: Implement when battle system is available
    } catch (error) {
      Logger.error('WeatherSystem', 'Error applying weather effects', error);
    }
  }
  
  /**
   * Utility function to select random item based on weights
   * @param {Array} items - Array of items to choose from
   * @param {Array} weights - Array of weights corresponding to items
   * @returns {*} Selected item
   * @private
   */
  _weightedRandom(items, weights) {
    try {
      if (items.length !== weights.length || items.length === 0) {
        throw new Error('Invalid input for weighted random selection');
      }
      
      // Calculate sum of weights
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
      }
      
      // Normalize weights
      const normalizedWeights = weights.map(w => w / sum);
      
      // Generate random value
      const random = Math.random();
      
      // Find the item corresponding to the random value
      let cumulativeProb = 0;
      for (let i = 0; i < items.length; i++) {
        cumulativeProb += normalizedWeights[i];
        if (random <= cumulativeProb) {
          return items[i];
        }
      }
      
      // Fallback to last item (should rarely happen due to floating point precision)
      return items[items.length - 1];
    } catch (error) {
      Logger.error('WeatherSystem', 'Error in weighted random selection', error);
      // Return first item as fallback
      return items[0];
    }
  }
  
  /**
   * Get the current weather details
   * @returns {Object} Current weather data
   */
  getCurrentWeather() {
    return { ...this._currentWeather };
  }
  
  /**
   * Get all possible weather types
   * @returns {Object} All weather types
   */
  getAllWeatherTypes() {
    return { ...this._weatherTypes };
  }
  
  /**
   * Manually set a specific weather
   * @param {String} weatherType - Type of weather to set
   * @param {Number} duration - How many turns the weather should last
   * @returns {Boolean} Whether the weather was set successfully
   */
  setWeather(weatherType, duration = 1) {
    try {
      if (!this._weatherTypes[weatherType]) {
        Logger.warning('WeatherSystem', `Invalid weather type: ${weatherType}`);
        return false;
      }
      
      const weatherConfig = this._weatherTypes[weatherType];
      
      // Set new weather
      this._currentWeather = {
        type: weatherType,
        name: weatherConfig.name,
        turnDuration: duration,
        modifiers: { ...weatherConfig.modifiers }
      };
      
      // Trigger weather change event
      this._gameManager.eventSystem.triggerEvent('onWeatherChange', {
        previous: this._currentWeather.type,
        new: this._currentWeather.type,
        name: this._currentWeather.name,
        duration: this._currentWeather.turnDuration,
        modifiers: this._currentWeather.modifiers
      });
      
      Logger.info('WeatherSystem', `Weather manually set to: ${this._currentWeather.name} for ${duration} turns`);
      return true;
    } catch (error) {
      Logger.error('WeatherSystem', 'Error setting weather', error);
      return false;
    }
  }
}
