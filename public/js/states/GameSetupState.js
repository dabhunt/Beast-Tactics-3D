
/**
 * GameSetupState.js
 * Implementation of the game setup state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class GameSetupState {
  /**
   * Create a game setup state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._setupSteps = [
      'initializeMap',
      'selectPlayers',
      'assignTeams',
      'placeBeasts',
      'finalizeSetup'
    ];
    this._currentStep = 0;
    this._setupComplete = false;
    
    Logger.debug('GameSetupState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('GameSetupState', 'Entering game setup state', data);
    
    this._currentStep = 0;
    this._setupComplete = false;
    
    // Trigger setup start event
    this._gameManager.eventSystem.triggerEvent('onSetupStart', {
      timestamp: Date.now(),
      config: this._gameManager._config
    });
    
    // If debug mode and skipSetup is enabled, skip to the end
    if (this._gameManager._config.debug?.skipSetup) {
      Logger.info('GameSetupState', 'Debug mode: Skipping setup process');
      await this._performDebugSetup();
      return;
    }
    
    // Begin first setup step
    this._processCurrentStep();
  }
  
  /**
   * Process the current setup step
   * @private
   */
  async _processCurrentStep() {
    if (this._currentStep >= this._setupSteps.length) {
      this._completeSetup();
      return;
    }
    
    const stepName = this._setupSteps[this._currentStep];
    Logger.info('GameSetupState', `Processing setup step: ${stepName} (${this._currentStep + 1}/${this._setupSteps.length})`);
    
    // Trigger step start event
    this._gameManager.eventSystem.triggerEvent('onSetupStepStart', {
      step: stepName,
      stepIndex: this._currentStep
    });
    
    // Call step method if it exists
    if (typeof this[`_${stepName}`] === 'function') {
      try {
        await this[`_${stepName}`]();
      } catch (error) {
        Logger.error('GameSetupState', `Error in setup step ${stepName}`, error);
      }
    } else {
      Logger.warning('GameSetupState', `No implementation found for setup step: ${stepName}`);
      this.advanceSetup();
    }
  }
  
  /**
   * Advance to the next setup step
   */
  advanceSetup() {
    const completedStep = this._setupSteps[this._currentStep];
    
    // Trigger step complete event
    this._gameManager.eventSystem.triggerEvent('onSetupStepComplete', {
      step: completedStep,
      stepIndex: this._currentStep
    });
    
    // Move to next step
    this._currentStep++;
    
    // Process next step or complete setup
    if (this._currentStep >= this._setupSteps.length) {
      this._completeSetup();
    } else {
      this._processCurrentStep();
    }
  }
  
  /**
   * Mark setup as complete and transition to turn start
   * @private
   */
  _completeSetup() {
    if (this._setupComplete) return;
    
    this._setupComplete = true;
    Logger.info('GameSetupState', 'Setup complete, preparing to start game');
    
    // Trigger setup complete event
    this._gameManager.eventSystem.triggerEvent('onSetupComplete', {
      timestamp: Date.now()
    });
    
    // Start the game (will transition to turn start)
    this._gameManager.startGame();
  }
  
  /**
   * Perform quick setup for debugging
   * @private
   */
  async _performDebugSetup() {
    Logger.debug('GameSetupState', 'Performing debug setup');
    
    // Create test players
    const playerManager = this._gameManager.playerManager;
    playerManager.addPlayer({ name: 'Player 1', color: 'Red' });
    playerManager.addPlayer({ name: 'Player 2', color: 'Blue' });
    
    // TODO: Setup map, beasts, etc.
    
    // Mark setup as complete
    this._completeSetup();
  }
  
  /**
   * Initialize the game map
   * @private
   */
  async _initializeMap() {
    Logger.info('GameSetupState', 'Initializing game map');
    
    // Get the map system if available
    const mapSystem = this._gameManager.getSubsystem('mapSystem');
    
    if (!mapSystem) {
      Logger.warning('GameSetupState', 'Map system not available, skipping map initialization');
      this.advanceSetup();
      return;
    }
    
    try {
      // Generate the map
      const config = this._gameManager._config.map;
      await mapSystem.generateMap(config);
      
      Logger.info('GameSetupState', 'Map initialized successfully');
      this.advanceSetup();
    } catch (error) {
      Logger.error('GameSetupState', 'Failed to initialize map', error);
      
      // Try to continue anyway
      this.advanceSetup();
    }
  }
  
  /**
   * Select players and teams
   * @private
   */
  async _selectPlayers() {
    // This would typically be handled by UI
    // For now, we'll just signal it's ready to move on
    Logger.info('GameSetupState', 'Player selection step');
    
    // If we have no players yet, create defaults
    const playerManager = this._gameManager.playerManager;
    if (playerManager.playerCount === 0) {
      playerManager.addPlayer({ name: 'Player 1', color: 'Red' });
      Logger.debug('GameSetupState', 'Added default player');
    }
    
    // Continue setup
    this.advanceSetup();
  }
  
  /**
   * Assign teams (beasts to players)
   * @private
   */
  _assignTeams() {
    Logger.info('GameSetupState', 'Team assignment step');
    
    // Will be handled by UI/player input
    // For now, advance to next step
    this.advanceSetup();
  }
  
  /**
   * Place beasts on the map
   * @private
   */
  _placeBeasts() {
    Logger.info('GameSetupState', 'Beast placement step');
    
    // Will be handled by UI/player input
    // For now, advance to next step
    this.advanceSetup();
  }
  
  /**
   * Finalize setup before game start
   * @private
   */
  _finalizeSetup() {
    Logger.info('GameSetupState', 'Finalizing game setup');
    
    // Any final setup tasks
    
    // Advance to complete setup
    this.advanceSetup();
  }
  
  /**
   * Update state logic
   * Called every frame when this state is active
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Most of the setup is event-driven, not much to do in update
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('GameSetupState', 'Exiting game setup state');
    
    // Clean up any setup-specific resources
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      currentStep: this._currentStep,
      setupComplete: this._setupComplete
    };
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;
    
    this._currentStep = saveData.currentStep || 0;
    this._setupComplete = saveData.setupComplete || false;
  }
}
