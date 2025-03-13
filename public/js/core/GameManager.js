
/**
 * GameManager.js
 * Central game controller that manages all subsystems and game flow
 */

import { StateManager } from './StateManager.js';
import { TurnManager } from './TurnManager.js';
import { PlayerManager } from './PlayerManager.js';
import { EventSystem } from './EventSystem.js';
import { ServiceLocator } from './ServiceLocator.js';
import { GameConfig } from '../models/GameConfig.js';
import { GameStates } from '../models/GameStates.js';
import { Logger } from '../utils/Logger.js';

/**
 * Central game controller that manages the entire game state
 * and coordinates between different subsystems
 */
export class GameManager {
  /**
   * Creates the main game controller instance
   * @param {Object} config - Initial configuration options
   */
  constructor(config = {}) {
    console.log('GameManager: Initializing game core architecture...');

    // Create core subsystems
    this._stateManager = new StateManager(this);
    this._turnManager = new TurnManager(this);
    this._playerManager = new PlayerManager(this);
    this._eventSystem = new EventSystem();
    this._serviceLocator = new ServiceLocator();

    // Game configuration
    this._config = new GameConfig(config);

    // Game status flags
    this._isInitialized = false;
    this._isGameInProgress = false;

    // Debug data
    this._debugMode = config.debugMode || false;

    Logger.info('GameManager', 'Instance created');
  }

  /**
   * Initializes all game systems and prepares the game to start
   * @param {Object} options - Initialization options
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize(options = {}) {
    try {
      Logger.info('GameManager', 'Beginning initialization', options);

      // Set initialization flag early to prevent race conditions
      this._isInitialized = true;

      // Initialize all subsystems
      await this._initializeSubsystems();

      // Initialize the state manager (must happen after subsystems so states can access them)
      await this._stateManager.initialize();

      // Register all subsystems with the service locator (after initialization)
      this._serviceLocator.registerService('stateManager', this._stateManager);
      this._serviceLocator.registerService('turnManager', this._turnManager);
      this._serviceLocator.registerService('playerManager', this._playerManager);
      this._serviceLocator.registerService('eventSystem', this._eventSystem);
      
      // Register the weather system if it exists
      const weatherSystem = this.getSubsystem('weatherSystem');
      if (weatherSystem) {
        this._serviceLocator.registerService('weatherSystem', weatherSystem);
      } else {
        Logger.warning('GameManager', 'Weather system not available for registration');
      }

      // Set initial game state
      await this._stateManager.changeState(GameStates.GAME_SETUP);

      // Trigger initialization complete event
      this._eventSystem.triggerEvent('onGameInitialized', { 
        timestamp: Date.now(),
        config: this._config
      });

      Logger.info('GameManager', 'Initialization complete');
      return true;
    } catch (error) {
      Logger.error('GameManager', 'Initialization failed', error);
      console.error('GameManager initialization failed:', error);
      console.debug('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Starts the game, moving from setup to first turn
   * @returns {Boolean} Success status
   */
  async startGame() {
    if (!this._isInitialized) {
      Logger.error('GameManager', 'Cannot start game - not initialized');
      return false;
    }

    Logger.info('GameManager', 'Starting game');
    
    try {
      this._isGameInProgress = true;

      // Trigger game start event
      this._eventSystem.triggerEvent('onGameStart', {
        timestamp: Date.now(),
        players: this._playerManager.getAllPlayers()
      });

      // Move to first turn state
      const success = await this._stateManager.changeState(GameStates.TURN_START);
      
      if (!success) {
        Logger.error('GameManager', 'Failed to transition to TURN_START state');
        return false;
      }

      Logger.info('GameManager', 'Game started successfully');
      return true;
    } catch (error) {
      Logger.error('GameManager', 'Error during game start', error);
      console.error('Error starting game:', error);
      return false;
    }
  }

  /**
   * Ends the current game session and transitions to game over
   * @param {Object} results - Game outcome data
   * @returns {Boolean} Success status
   */
  async endGame(results) {
    if (!this._isGameInProgress) {
      Logger.warning('GameManager', 'Cannot end game - no game in progress');
      return false;
    }

    Logger.info('GameManager', 'Ending game', results);

    try {
      // Trigger game end event
      this._eventSystem.triggerEvent('onGameEnd', {
        timestamp: Date.now(),
        results: results
      });

      // Move to game over state
      const success = await this._stateManager.changeState(GameStates.GAME_OVER);
      
      if (!success) {
        Logger.error('GameManager', 'Failed to transition to GAME_OVER state');
        return false;
      }

      this._isGameInProgress = false;
      Logger.info('GameManager', 'Game ended successfully');
      return true;
    } catch (error) {
      Logger.error('GameManager', 'Error during game end', error);
      return false;
    }
  }

  /**
   * Save current game state to storage
   * @returns {Object} Serialized game state
   */
  saveGame() {
    try {
      Logger.info('GameManager', 'Saving game state');

      const saveData = {
        version: this._config.version,
        timestamp: Date.now(),
        turnData: this._turnManager.getSaveData(),
        playerData: this._playerManager.getSaveData(),
        stateData: this._stateManager.getSaveData(),
        configData: this._config.getSaveData()
      };

      // Store in local storage
      localStorage.setItem('beastTactics_saveGame', JSON.stringify(saveData));

      Logger.info('GameManager', 'Game saved successfully');
      return saveData;
    } catch (error) {
      Logger.error('GameManager', 'Failed to save game', error);
      console.error('Failed to save game:', error);
      return null;
    }
  }

  /**
   * Load game state from storage
   * @param {Object|null} saveData - Saved game data or null to load from storage
   * @returns {Boolean} Success status
   */
  loadGame(saveData = null) {
    try {
      Logger.info('GameManager', 'Loading game state');

      // If no data provided, try to load from storage
      if (!saveData) {
        const savedString = localStorage.getItem('beastTactics_saveGame');
        if (!savedString) {
          Logger.warning('GameManager', 'No saved game found');
          return false;
        }
        saveData = JSON.parse(savedString);
      }

      // Validate save data
      if (!saveData.version || !saveData.turnData || !saveData.playerData) {
        Logger.error('GameManager', 'Invalid save data format');
        return false;
      }

      // Load data into subsystems
      this._turnManager.loadSaveData(saveData.turnData);
      this._playerManager.loadSaveData(saveData.playerData);
      this._stateManager.loadSaveData(saveData.stateData);
      this._config.loadSaveData(saveData.configData);

      this._isInitialized = true;
      this._isGameInProgress = true;

      // Trigger game loaded event
      this._eventSystem.triggerEvent('onGameLoaded', {
        timestamp: Date.now(),
        saveData: saveData
      });

      Logger.info('GameManager', 'Game loaded successfully');
      return true;
    } catch (error) {
      Logger.error('GameManager', 'Failed to load game', error);
      console.error('Failed to load game:', error);
      return false;
    }
  }


  /**
   * Initialize all required subsystems
   * @private
   */
  async _initializeSubsystems() {
    Logger.debug('GameManager', 'Initializing subsystems');

    try {
      // Initialize and track all subsystems
      this._subsystems = {};

      // Import WeatherSystem
      const { WeatherSystem } = await import('../systems/WeatherSystem.js');

      // Create and initialize weather system
      this._subsystems.weatherSystem = new WeatherSystem(this);
      await this._subsystems.weatherSystem.initialize();
      Logger.info('GameManager', 'Weather system initialized');

      // TODO: Initialize additional subsystems as they are implemented

      Logger.debug('GameManager', 'Subsystem initialization complete');
      return true;
    } catch (error) {
      Logger.error('GameManager', 'Error initializing subsystems', error);
      console.error('Subsystem initialization error:', {
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Get access to a subsystem by name
   * @param {String} name - Name of the subsystem to retrieve
   * @returns {Object|null} The requested subsystem or null if not found
   */
  getSubsystem(name) {
    if (!this._subsystems || !this._subsystems[name]) {
      Logger.warning('GameManager', `Requested subsystem '${name}' not found`);
      return null;
    }
    return this._subsystems[name];
  }

  /**
   * Registers an external system with the service locator
   * @param {String} systemName - Name to register the system under
   * @param {Object} system - The system to register
   * @returns {Boolean} Success status
   */
  registerSubsystem(systemName, system) {
    Logger.info('GameManager', `Registering subsystem: ${systemName}`);
    return this._serviceLocator.registerService(systemName, system);
  }

  // Getters

  /**
   * @returns {TurnManager} The turn management system
   */
  get turnManager() {
    return this._turnManager;
  }

  /**
   * @returns {StateManager} The state management system
   */
  get stateManager() {
    return this._stateManager;
  }

  /**
   * @returns {PlayerManager} The player management system
   */
  get playerManager() {
    return this._playerManager;
  }

  /**
   * @returns {EventSystem} The event system
   */
  get eventSystem() {
    return this._eventSystem;
  }

  /**
   * @returns {Number} The current turn number
   */
  get currentTurn() {
    return this._turnManager.currentTurn;
  }

  /**
   * @returns {Object} The currently active player
   */
  get currentPlayer() {
    return this._playerManager.activePlayer;
  }

  /**
   * @returns {Boolean} Whether a game is in progress
   */
  get isGameInProgress() {
    return this._isGameInProgress;
  }

  /**
   * @returns {Boolean} Whether the game is in debug mode
   */
  get debugMode() {
    return this._debugMode;
  }
}
