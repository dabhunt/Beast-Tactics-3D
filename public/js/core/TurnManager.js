
/**
 * TurnManager.js
 * Manages the turn sequence, turn counter, and phase transitions
 */

import { Logger } from '../utils/Logger.js';
import { TurnPhase } from '../models/TurnPhase.js';

export class TurnManager {
  /**
   * Creates the turn management system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    console.log('TurnManager: Initializing turn management...');
    
    this._gameManager = gameManager;
    this._currentTurn = 0;
    this._currentPhase = null;
    this._turnHistory = [];
    this._phaseStartTime = 0;
    this._phaseTimeoutId = null;
    
    Logger.info('TurnManager', 'Instance created');
  }
  
  /**
   * Initialize the turn manager
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize() {
    Logger.info('TurnManager', 'Initializing turn manager');
    
    // Reset to initial state
    this._currentTurn = 0;
    this._currentPhase = null;
    this._turnHistory = [];
    
    // Register event listeners
    const eventSystem = this._gameManager.eventSystem;
    eventSystem.registerListener('onStateChange', this._handleStateChange.bind(this));
    
    Logger.info('TurnManager', 'Turn manager initialized');
    return true;
  }
  
  /**
   * Respond to state changes
   * @param {Object} eventData - State change event data
   * @private
   */
  _handleStateChange(eventData) {
    const { newState } = eventData;
    
    // Map game states to turn phases
    const stateToPhaseMap = {
      'GAME_SETUP': null,
      'TURN_START': TurnPhase.START,
      'PLAYER_INPUT': TurnPhase.PLAYER_INPUT,
      'HAZARD_ROLLS': TurnPhase.HAZARD_ROLLS,
      'TURN_ORDER': TurnPhase.TURN_ORDER,
      'TURN_EXECUTION': TurnPhase.EXECUTION,
      'TURN_END': TurnPhase.END,
      'GAME_OVER': null
    };
    
    // Update the current phase based on the state
    const newPhase = stateToPhaseMap[newState];
    if (newPhase !== undefined) {
      this._setPhase(newPhase);
    }
    
    // If we're entering turn start state and it's not the first turn
    if (newState === 'TURN_START' && this._currentTurn > 0) {
      // Record previous turn to history
      this._recordTurnToHistory();
    }
    
    // If we're entering turn start state
    if (newState === 'TURN_START') {
      // Increment turn counter (turn 0 is setup, first actual turn is 1)
      if (this._currentPhase !== TurnPhase.START) {
        this.advanceTurn();
      }
    }
  }
  
  /**
   * Set the current turn phase
   * @param {String} phase - The phase to transition to
   * @private
   */
  _setPhase(phase) {
    if (this._currentPhase === phase) return;
    
    const oldPhase = this._currentPhase;
    this._currentPhase = phase;
    this._phaseStartTime = Date.now();
    
    // Clear any existing phase timeout
    if (this._phaseTimeoutId) {
      clearTimeout(this._phaseTimeoutId);
      this._phaseTimeoutId = null;
    }
    
    // Trigger phase change event
    if (phase) {
      Logger.info('TurnManager', `Turn ${this._currentTurn} phase changed: ${oldPhase || 'none'} -> ${phase}`);
      
      this._gameManager.eventSystem.triggerEvent('onPhaseChange', {
        turn: this._currentTurn,
        previousPhase: oldPhase,
        newPhase: phase,
        timestamp: this._phaseStartTime
      });
    }
  }
  
  /**
   * Advances to the next turn
   * @returns {Number} The new turn number
   */
  advanceTurn() {
    // Record the current turn to history before advancing
    if (this._currentTurn > 0) {
      this._recordTurnToHistory();
    }
    
    // Increment turn counter
    this._currentTurn++;
    
    Logger.info('TurnManager', `Advanced to turn ${this._currentTurn}`);
    
    // Trigger turn begin event
    this._gameManager.eventSystem.triggerEvent('onTurnBegin', {
      turn: this._currentTurn,
      timestamp: Date.now()
    });
    
    return this._currentTurn;
  }
  
  /**
   * Records the current turn data to history
   * @private
   */
  _recordTurnToHistory() {
    // Don't record if there's no current turn
    if (this._currentTurn <= 0) return;
    
    const turnData = {
      turnNumber: this._currentTurn,
      endTime: Date.now(),
      // Additional data could be added here like:
      // - player actions
      // - combat results
      // - map changes
    };
    
    this._turnHistory.push(turnData);
    
    Logger.debug('TurnManager', `Recorded turn ${this._currentTurn} to history`);
    
    // Trigger turn end event
    this._gameManager.eventSystem.triggerEvent('onTurnEnd', {
      turn: this._currentTurn,
      timestamp: Date.now(),
      turnData: turnData
    });
  }
  
  /**
   * Get data about all completed turns
   * @returns {Array} List of turn history objects
   */
  getTurnHistory() {
    return [...this._turnHistory];
  }
  
  /**
   * Set a time limit for the current phase
   * @param {Number} timeMs - Time limit in milliseconds
   * @param {Function} callback - Function to call when time expires
   * @returns {Number} Timeout ID
   */
  setPhaseTimeLimit(timeMs, callback) {
    // Clear any existing timeout
    if (this._phaseTimeoutId) {
      clearTimeout(this._phaseTimeoutId);
    }
    
    Logger.debug('TurnManager', `Setting phase time limit: ${timeMs}ms for phase ${this._currentPhase}`);
    
    // Set new timeout
    this._phaseTimeoutId = setTimeout(() => {
      Logger.info('TurnManager', `Phase ${this._currentPhase} time limit reached`);
      
      // Trigger timeout event
      this._gameManager.eventSystem.triggerEvent('onPhaseTimeExpired', {
        turn: this._currentTurn,
        phase: this._currentPhase,
        timeLimit: timeMs
      });
      
      // Call the provided callback
      if (typeof callback === 'function') {
        callback();
      }
      
      this._phaseTimeoutId = null;
    }, timeMs);
    
    return this._phaseTimeoutId;
  }
  
  /**
   * Clear the current phase time limit
   */
  clearPhaseTimeLimit() {
    if (this._phaseTimeoutId) {
      clearTimeout(this._phaseTimeoutId);
      this._phaseTimeoutId = null;
      Logger.debug('TurnManager', 'Cleared phase time limit');
    }
  }
  
  /**
   * Get time elapsed in the current phase
   * @returns {Number} Time elapsed in milliseconds
   */
  getPhaseElapsedTime() {
    if (!this._phaseStartTime) return 0;
    return Date.now() - this._phaseStartTime;
  }
  
  /**
   * Prepare save data for the turn manager
   * @returns {Object} Serializable turn manager state
   */
  getSaveData() {
    return {
      currentTurn: this._currentTurn,
      currentPhase: this._currentPhase,
      phaseStartTime: this._phaseStartTime,
      turnHistory: this._turnHistory
    };
  }
  
  /**
   * Load turn manager state from save data
   * @param {Object} saveData - Previously saved turn manager state
   * @returns {Boolean} Success status
   */
  loadSaveData(saveData) {
    if (!saveData) return false;
    
    this._currentTurn = saveData.currentTurn || 0;
    this._currentPhase = saveData.currentPhase;
    this._phaseStartTime = saveData.phaseStartTime || Date.now();
    this._turnHistory = saveData.turnHistory || [];
    
    Logger.info('TurnManager', `Loaded turn data: turn ${this._currentTurn}, phase ${this._currentPhase}`);
    return true;
  }
  
  /**
   * @returns {Number} The current turn number
   */
  get currentTurn() {
    return this._currentTurn;
  }
  
  /**
   * @returns {String} The current turn phase
   */
  get currentPhase() {
    return this._currentPhase;
  }
  
  /**
   * @returns {Number} The timestamp when the current phase started
   */
  get phaseStartTime() {
    return this._phaseStartTime;
  }
}
