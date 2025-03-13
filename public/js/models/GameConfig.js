
/**
 * GameConfig.js
 * Configuration settings for game parameters
 */

import { Logger } from '../utils/Logger.js';

export class GameConfig {
  /**
   * Create game configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Game version
    this._version = config.version || '1.0.0';
    
    // Game rules
    this._rules = {
      maxPlayers: config.rules?.maxPlayers || 4,
      startingBeasts: config.rules?.startingBeasts || 3,
      maxBeasts: config.rules?.maxBeasts || 6,
      victoryPoints: config.rules?.victoryPoints || 100,
      turnTimeLimit: config.rules?.turnTimeLimit || 60000, // 60 seconds
    };
    
    // Map configuration
    this._map = {
      gridRadius: config.map?.gridRadius || 7,
      fogOfWar: config.map?.fogOfWar !== undefined ? config.map.fogOfWar : true,
      biomeDistribution: config.map?.biomeDistribution || {
        plains: 0.3,
        forest: 0.25,
        mountains: 0.2,
        desert: 0.15,
        water: 0.1
      }
    };
    
    // Gameplay settings
    this._gameplay = {
      weatherFrequency: config.gameplay?.weatherFrequency || 0.3, // 30% chance each turn
      shardSpawnRate: config.gameplay?.shardSpawnRate || 0.15,    // 15% chance per hex per turn
      hazardDamage: config.gameplay?.hazardDamage || 10,
      movementRange: config.gameplay?.movementRange || 2,
      combatRollSides: config.gameplay?.combatRollSides || 6,
      evolutionThreshold: config.gameplay?.evolutionThreshold || 20 // Shards needed to evolve
    };
    
    // Debug options
    this._debug = {
      enabled: config.debug?.enabled !== undefined ? config.debug.enabled : false,
      skipSetup: config.debug?.skipSetup || false,
      revealMap: config.debug?.revealMap || false,
      invincibleBeasts: config.debug?.invincibleBeasts || false,
      infiniteShards: config.debug?.infiniteShards || false,
      logLevel: config.debug?.logLevel || 'info'
    };
    
    Logger.info('GameConfig', 'Configuration initialized with settings', {
      version: this._version,
      players: this._rules.maxPlayers,
      mapSize: this._map.gridRadius
    });
  }
  
  /**
   * Update configuration settings
   * @param {Object} newConfig - New configuration values to apply
   * @returns {Object} Updated configuration
   */
  updateConfig(newConfig) {
    // Helper function to recursively update config
    const updateSection = (target, source) => {
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && 
            target[key] !== null && typeof target[key] === 'object') {
          // Recursively update nested objects
          updateSection(target[key], source[key]);
        } else {
          // Update value
          target[key] = source[key];
        }
      }
    };
    
    // Update each section with new values
    if (newConfig.rules) updateSection(this._rules, newConfig.rules);
    if (newConfig.map) updateSection(this._map, newConfig.map);
    if (newConfig.gameplay) updateSection(this._gameplay, newConfig.gameplay);
    if (newConfig.debug) updateSection(this._debug, newConfig.debug);
    if (newConfig.version) this._version = newConfig.version;
    
    Logger.info('GameConfig', 'Configuration updated');
    
    return this.getConfig();
  }
  
  /**
   * Get the complete configuration
   * @returns {Object} Full configuration object
   */
  getConfig() {
    return {
      version: this._version,
      rules: { ...this._rules },
      map: { ...this._map },
      gameplay: { ...this._gameplay },
      debug: { ...this._debug }
    };
  }
  
  /**
   * Get serializable configuration for saving
   * @returns {Object} Serializable configuration
   */
  getSaveData() {
    return this.getConfig();
  }
  
  /**
   * Load configuration from saved data
   * @param {Object} saveData - Saved configuration data
   */
  loadSaveData(saveData) {
    if (!saveData) return false;
    return this.updateConfig(saveData);
  }
  
  // Getters for specific configuration sections
  
  get version() {
    return this._version;
  }
  
  get rules() {
    return { ...this._rules };
  }
  
  get map() {
    return { ...this._map };
  }
  
  get gameplay() {
    return { ...this._gameplay };
  }
  
  get debug() {
    return { ...this._debug };
  }
}
