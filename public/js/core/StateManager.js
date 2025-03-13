
/**
 * StateManager.js
 * Implements the game state machine that controls game flow
 */

import { GameStates } from '../models/GameStates.js';
import { Logger } from '../utils/Logger.js';

// State implementation classes
import { GameSetupState } from '../states/GameSetupState.js';
import { TurnStartState } from '../states/TurnStartState.js';
import { PlayerInputState } from '../states/PlayerInputState.js';
import { HazardRollsState } from '../states/HazardRollsState.js';
import { TurnOrderState } from '../states/TurnOrderState.js';
import { TurnExecutionState } from '../states/TurnExecutionState.js';
import { TurnEndState } from '../states/TurnEndState.js';
import { GameOverState } from '../states/GameOverState.js';

export class StateManager {
  /**
   * Creates the state management system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    console.log('StateManager: Initializing state machine...');
    
    this._gameManager = gameManager;
    this._currentState = null;
    this._previousState = null;
    this._stateTransitionInProgress = false;
    
    // State registry for all possible game states
    this._states = {};
    
    // Transition validation matrix
    this._validTransitions = {};
    
    Logger.info('StateManager', 'Instance created');
  }
  
  /**
   * Initializes the state manager and registers all states
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize() {
    try {
      Logger.info('StateManager', 'Beginning initialization');
      
      // Create all state implementations
      this._states[GameStates.GAME_SETUP] = new GameSetupState(this._gameManager);
      this._states[GameStates.TURN_START] = new TurnStartState(this._gameManager);
      this._states[GameStates.PLAYER_INPUT] = new PlayerInputState(this._gameManager);
      this._states[GameStates.HAZARD_ROLLS] = new HazardRollsState(this._gameManager);
      this._states[GameStates.TURN_ORDER] = new TurnOrderState(this._gameManager);
      this._states[GameStates.TURN_EXECUTION] = new TurnExecutionState(this._gameManager);
      this._states[GameStates.TURN_END] = new TurnEndState(this._gameManager);
      this._states[GameStates.GAME_OVER] = new GameOverState(this._gameManager);
      
      // Initialize allowed state transitions
      this._setupTransitionRules();
      
      Logger.info('StateManager', 'State machine initialized successfully');
      return true;
    } catch (error) {
      Logger.error('StateManager', 'Initialization failed', error);
      console.error('StateManager initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Configure valid state transitions
   * @private
   */
  _setupTransitionRules() {
    Logger.debug('StateManager', 'Setting up state transition rules');
    
    // Define all valid transitions
    this._validTransitions = {
      [GameStates.GAME_SETUP]: [GameStates.TURN_START, GameStates.GAME_OVER],
      [GameStates.TURN_START]: [GameStates.PLAYER_INPUT, GameStates.GAME_OVER],
      [GameStates.PLAYER_INPUT]: [GameStates.HAZARD_ROLLS, GameStates.GAME_OVER],
      [GameStates.HAZARD_ROLLS]: [GameStates.TURN_ORDER, GameStates.GAME_OVER],
      [GameStates.TURN_ORDER]: [GameStates.TURN_EXECUTION, GameStates.GAME_OVER],
      [GameStates.TURN_EXECUTION]: [GameStates.TURN_END, GameStates.GAME_OVER],
      [GameStates.TURN_END]: [GameStates.TURN_START, GameStates.GAME_OVER],
      [GameStates.GAME_OVER]: [GameStates.GAME_SETUP]
    };
    
    Logger.debug('StateManager', 'Transition rules configured');
  }
  
  /**
   * Change to a new game state if the transition is valid
   * @param {String} newState - The state to transition to
   * @param {Object} stateData - Optional data to pass to the new state
   * @returns {Boolean} Whether the transition was successful
   */
  async changeState(newState, stateData = {}) {
    try {
      // Validate the requested state exists
      if (!this._states[newState]) {
        Logger.error('StateManager', `Cannot change to invalid state: ${newState}`);
        return false;
      }
      
      // Check if a transition is already in progress
      if (this._stateTransitionInProgress) {
        Logger.warning('StateManager', 'State transition already in progress, cannot change states');
        return false;
      }
      
      // If we have a current state, check if the transition is valid
      if (this._currentState && !this.canTransitionTo(newState)) {
        Logger.error('StateManager', `Invalid state transition from ${this._currentState} to ${newState}`);
        return false;
      }
      
      Logger.info('StateManager', `Changing state: ${this._currentState} -> ${newState}`);
      this._stateTransitionInProgress = true;
      
      // Exit current state if exists
      if (this._currentState) {
        Logger.debug('StateManager', `Exiting state: ${this._currentState}`);
        await this._states[this._currentState].exitState();
      }
      
      // Update state tracking
      this._previousState = this._currentState;
      this._currentState = newState;
      
      // Trigger state change event
      this._gameManager.eventSystem.triggerEvent('onStateChange', {
        previousState: this._previousState,
        newState: this._currentState,
        stateData: stateData
      });
      
      // Enter new state
      Logger.debug('StateManager', `Entering state: ${this._currentState}`);
      await this._states[this._currentState].enterState(stateData);
      
      this._stateTransitionInProgress = false;
      return true;
    } catch (error) {
      this._stateTransitionInProgress = false;
      Logger.error('StateManager', `Error during state transition to ${newState}`, error);
      console.error(`Error during state transition to ${newState}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a transition to the specified state is valid
   * @param {String} nextState - The state to check transition to
   * @returns {Boolean} Whether the transition is allowed
   */
  canTransitionTo(nextState) {
    // If no current state, can only transition to initial setup
    if (!this._currentState) {
      return nextState === GameStates.GAME_SETUP;
    }
    
    // Check if the transition is in the allowed transitions list
    const allowedNextStates = this._validTransitions[this._currentState] || [];
    return allowedNextStates.includes(nextState);
  }
  
  /**
   * Update the current state (called from game loop)
   * @param {Number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Don't update if transitioning or no current state
    if (this._stateTransitionInProgress || !this._currentState) {
      return;
    }
    
    // Update the current state
    try {
      this._states[this._currentState].updateState(deltaTime);
    } catch (error) {
      Logger.error('StateManager', `Error updating state ${this._currentState}`, error);
      console.error(`Error updating state ${this._currentState}:`, error);
    }
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      currentState: this._currentState,
      previousState: this._previousState,
      stateSpecificData: this._currentState ? 
        this._states[this._currentState].getSaveData() : null
    };
  }
  
  /**
   * Restore state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData || !saveData.currentState) {
      Logger.warning('StateManager', 'Invalid save data for state manager');
      return false;
    }
    
    this._previousState = saveData.previousState;
    this._currentState = saveData.currentState;
    
    // Load state-specific data if available
    if (saveData.stateSpecificData && this._states[this._currentState]) {
      this._states[this._currentState].loadSaveData(saveData.stateSpecificData);
    }
    
    Logger.info('StateManager', `Restored state to ${this._currentState}`);
    return true;
  }
  
  /**
   * @returns {String} The current game state
   */
  get currentState() {
    return this._currentState;
  }
  
  /**
   * @returns {String} The previous game state
   */
  get previousState() {
    return this._previousState;
  }
}
