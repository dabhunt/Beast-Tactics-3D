
/**
 * PlayerManager.js
 * Manages players, player turns, and owned game entities
 */

import { Logger } from '../utils/Logger.js';
import { Player } from '../models/Player.js';

export class PlayerManager {
  /**
   * Creates the player management system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    console.log('PlayerManager: Initializing player manager...');
    
    this._gameManager = gameManager;
    this._players = [];
    this._activePlayerIndex = -1;
    this._playerColors = ['Red', 'Blue', 'Green', 'White'];
    this._maxPlayers = 4;
    
    // Track which players have completed their actions
    this._playerActionsCompleted = new Set();
    
    Logger.info('PlayerManager', 'Instance created');
  }
  
  /**
   * Initialize the player manager
   * @param {Array} initialPlayers - Optional array of initial player data
   * @returns {Promise} Resolves when initialization complete
   */
  async initialize(initialPlayers = []) {
    Logger.info('PlayerManager', 'Initializing player manager');
    
    // Clear any existing players
    this._players = [];
    this._activePlayerIndex = -1;
    this._playerActionsCompleted.clear();
    
    // Add any initial players
    if (initialPlayers && initialPlayers.length > 0) {
      initialPlayers.forEach(playerData => {
        this.addPlayer(playerData);
      });
      
      Logger.info('PlayerManager', `Added ${initialPlayers.length} initial players`);
    }
    
    // Register for events
    const eventSystem = this._gameManager.eventSystem;
    eventSystem.registerListener('onStateChange', this._handleStateChange.bind(this));
    
    Logger.info('PlayerManager', 'Player manager initialized');
    return true;
  }
  
  /**
   * Handle state changes relevant to player management
   * @param {Object} eventData - State change event data
   * @private
   */
  _handleStateChange(eventData) {
    const { previousState, newState } = eventData;
    
    // When transitioning to player input, reset the completed actions
    if (newState === 'PLAYER_INPUT') {
      this._playerActionsCompleted.clear();
      Logger.debug('PlayerManager', 'Reset player actions completed for new input phase');
    }
    
    // When transitioning to turn start, reset active player
    if (newState === 'TURN_START' && previousState === 'TURN_END') {
      this.setFirstPlayerActive();
      Logger.debug('PlayerManager', `Set first player active: ${this.activePlayer?.name}`);
    }
  }
  
  /**
   * Add a new player to the game
   * @param {Object} playerData - Player information
   * @returns {Player|null} The created player or null if failed
   */
  addPlayer(playerData) {
    // Check if we've reached max players
    if (this._players.length >= this._maxPlayers) {
      Logger.warning('PlayerManager', 'Cannot add player - maximum players reached');
      return null;
    }
    
    // Get next available color
    const colorIndex = this._players.length % this._playerColors.length;
    const color = playerData.color || this._playerColors[colorIndex];
    
    // Create new player object
    const player = new Player({
      id: playerData.id || `player_${Date.now()}_${this._players.length}`,
      name: playerData.name || `Player ${this._players.length + 1}`,
      color: color,
      isAI: !!playerData.isAI
    });
    
    this._players.push(player);
    
    // If this is the first player, make them active
    if (this._players.length === 1) {
      this._activePlayerIndex = 0;
    }
    
    Logger.info('PlayerManager', `Added player: ${player.name} (${player.color})`);
    
    // Trigger player added event
    this._gameManager.eventSystem.triggerEvent('onPlayerAdded', {
      player: player,
      playerCount: this._players.length
    });
    
    return player;
  }
  
  /**
   * Remove a player from the game
   * @param {String} playerId - ID of player to remove
   * @returns {Boolean} Success status
   */
  removePlayer(playerId) {
    const initialCount = this._players.length;
    const playerIndex = this._players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) {
      Logger.warning('PlayerManager', `Cannot remove player - player with ID ${playerId} not found`);
      return false;
    }
    
    // Get the player before removing
    const player = this._players[playerIndex];
    
    // Remove player
    this._players.splice(playerIndex, 1);
    
    // Update active player index if needed
    if (this._activePlayerIndex === playerIndex) {
      this._activePlayerIndex = this._players.length > 0 ? 0 : -1;
    } else if (this._activePlayerIndex > playerIndex) {
      this._activePlayerIndex--;
    }
    
    Logger.info('PlayerManager', `Removed player: ${player.name} (${player.color})`);
    
    // Trigger player removed event
    this._gameManager.eventSystem.triggerEvent('onPlayerRemoved', {
      player: player,
      playerCount: this._players.length
    });
    
    return true;
  }
  
  /**
   * Set the next player as active in turn order
   * @returns {Player|null} The new active player or null if no players
   */
  advanceToNextPlayer() {
    if (this._players.length === 0) {
      Logger.warning('PlayerManager', 'Cannot advance player - no players');
      return null;
    }
    
    // If no active player yet, set to first player
    if (this._activePlayerIndex === -1) {
      this._activePlayerIndex = 0;
    } else {
      // Move to next player, wrapping around to first player
      this._activePlayerIndex = (this._activePlayerIndex + 1) % this._players.length;
    }
    
    const newActivePlayer = this._players[this._activePlayerIndex];
    
    Logger.info('PlayerManager', `Advanced to next player: ${newActivePlayer.name}`);
    
    // Trigger player changed event
    this._gameManager.eventSystem.triggerEvent('onActivePlayerChanged', {
      player: newActivePlayer,
      playerIndex: this._activePlayerIndex
    });
    
    return newActivePlayer;
  }
  
  /**
   * Set the first player as active
   * @returns {Player|null} The first player or null if no players
   */
  setFirstPlayerActive() {
    if (this._players.length === 0) {
      Logger.warning('PlayerManager', 'Cannot set first player - no players');
      return null;
    }
    
    this._activePlayerIndex = 0;
    const firstPlayer = this._players[0];
    
    Logger.info('PlayerManager', `Set first player active: ${firstPlayer.name}`);
    
    // Trigger player changed event
    this._gameManager.eventSystem.triggerEvent('onActivePlayerChanged', {
      player: firstPlayer,
      playerIndex: this._activePlayerIndex
    });
    
    return firstPlayer;
  }
  
  /**
   * Mark the active player's actions as completed for the current phase
   * @returns {Boolean} Success status
   */
  markActivePlayerActionsCompleted() {
    if (this._activePlayerIndex === -1 || !this.activePlayer) {
      Logger.warning('PlayerManager', 'Cannot mark actions completed - no active player');
      return false;
    }
    
    const playerId = this.activePlayer.id;
    this._playerActionsCompleted.add(playerId);
    
    Logger.info('PlayerManager', `Marked actions completed for player: ${this.activePlayer.name}`);
    
    // Trigger player action completed event
    this._gameManager.eventSystem.triggerEvent('onPlayerActionsCompleted', {
      player: this.activePlayer,
      playersCompleted: this._playerActionsCompleted.size,
      totalPlayers: this._players.length
    });
    
    return true;
  }
  
  /**
   * Check if all players have completed their actions for the current phase
   * @returns {Boolean} Whether all players have completed their actions
   */
  areAllPlayerActionsCompleted() {
    return this._playerActionsCompleted.size === this._players.length;
  }
  
  /**
   * Check if a specific player has completed their actions
   * @param {String} playerId - Player ID to check
   * @returns {Boolean} Whether the player has completed their actions
   */
  hasPlayerCompletedActions(playerId) {
    return this._playerActionsCompleted.has(playerId);
  }
  
  /**
   * Get a player by their ID
   * @param {String} playerId - ID of the player to find
   * @returns {Player|null} The found player or null
   */
  getPlayerById(playerId) {
    return this._players.find(p => p.id === playerId) || null;
  }
  
  /**
   * Get a list of all players
   * @returns {Array<Player>} List of all players
   */
  getAllPlayers() {
    return [...this._players];
  }
  
  /**
   * Get serializable player manager state for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {
      players: this._players.map(player => player.getSaveData()),
      activePlayerIndex: this._activePlayerIndex,
      playerActionsCompleted: Array.from(this._playerActionsCompleted)
    };
  }
  
  /**
   * Load player manager state from save data
   * @param {Object} saveData - Previously saved player manager state
   * @returns {Boolean} Success status
   */
  loadSaveData(saveData) {
    if (!saveData || !Array.isArray(saveData.players)) {
      Logger.warning('PlayerManager', 'Invalid save data for player manager');
      return false;
    }
    
    // Clear current players
    this._players = [];
    this._playerActionsCompleted.clear();
    
    // Recreate players from save data
    saveData.players.forEach(playerData => {
      const player = new Player(playerData);
      this._players.push(player);
    });
    
    // Restore active player index
    this._activePlayerIndex = saveData.activePlayerIndex ?? -1;
    
    // Restore actions completed set
    if (Array.isArray(saveData.playerActionsCompleted)) {
      saveData.playerActionsCompleted.forEach(id => {
        this._playerActionsCompleted.add(id);
      });
    }
    
    Logger.info('PlayerManager', `Loaded ${this._players.length} players from save data`);
    return true;
  }
  
  /**
   * @returns {Player|null} The currently active player or null if none
   */
  get activePlayer() {
    if (this._activePlayerIndex === -1 || this._players.length === 0) {
      return null;
    }
    return this._players[this._activePlayerIndex];
  }
  
  /**
   * @returns {Number} The number of players in the game
   */
  get playerCount() {
    return this._players.length;
  }
  
  /**
   * @returns {Array<String>} Available player colors
   */
  get availableColors() {
    const usedColors = this._players.map(p => p.color);
    return this._playerColors.filter(color => !usedColors.includes(color));
  }
}
