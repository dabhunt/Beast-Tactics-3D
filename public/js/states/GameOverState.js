
/**
 * GameOverState.js
 * Implementation of the game over state
 */

import { Logger } from '../utils/Logger.js';
import { GameStates } from '../models/GameStates.js';

export class GameOverState {
  /**
   * Create a game over state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._gameResults = null;
    
    Logger.debug('GameOverState', 'State created');
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    Logger.info('GameOverState', 'Entering game over state', data);
    
    // Store game results
    this._gameResults = data.results || this._calculateResults();
    
    // Trigger game over event
    this._gameManager.eventSystem.triggerEvent('onGameOver', {
      timestamp: Date.now(),
      results: this._gameResults
    });
  }
  
  /**
   * Calculate final game results
   * @returns {Object} Game results data
   * @private
   */
  _calculateResults() {
    Logger.debug('GameOverState', 'Calculating game results');
    
    const playerManager = this._gameManager.playerManager;
    const players = playerManager.getAllPlayers();
    
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    // Create results object
    const results = {
      winner: sortedPlayers[0],
      players: sortedPlayers.map((player, index) => ({
        player: player,
        rank: index + 1,
        score: player.score
      })),
      totalTurns: this._gameManager.currentTurn,
      timestamp: Date.now()
    };
    
    Logger.info('GameOverState', `Game over! Winner: ${results.winner.name}`);
    return results;
  }
  
  /**
   * Start a new game
   */
  startNewGame() {
    Logger.info('GameOverState', 'Starting new game');
    
    // Reset to setup state
    this._gameManager.stateManager.changeState(GameStates.GAME_SETUP);
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // Game over state is mostly passive, waiting for user input
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    Logger.info('GameOverState', 'Exiting game over state');
    this._gameResults = null;
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      gameResults: this._gameResults
    };
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    if (!saveData) return;
    
    this._gameResults = saveData.gameResults || null;
  }
  
  /**
   * @returns {Object} The game results
   */
  get gameResults() {
    return this._gameResults;
  }
}
