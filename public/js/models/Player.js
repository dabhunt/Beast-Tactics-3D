
/**
 * Player.js
 * Represents a player in the game
 */

import { Logger } from '../utils/Logger.js';

export class Player {
  /**
   * Create a new player
   * @param {Object} data - Player data
   */
  constructor(data = {}) {
    this._id = data.id || `player_${Date.now()}`;
    this._name = data.name || 'Unknown Player';
    this._color = data.color || 'Red';
    this._isAI = !!data.isAI;
    this._score = data.score || 0;
    this._beasts = data.beasts || [];
    this._inventory = data.inventory || {
      shards: 0,
      items: []
    };
    
    // Additional player stats and properties
    this._stats = data.stats || {
      beastsLost: 0,
      beastsEvolved: 0,
      shardsCollected: 0,
      combatsWon: 0,
      combatsLost: 0,
    };
    
    Logger.debug('Player', `Created player: ${this._name} (${this._color})`);
  }
  
  /**
   * Update player score
   * @param {Number} points - Points to add (negative to subtract)
   * @returns {Number} New score
   */
  updateScore(points) {
    this._score += points;
    Logger.debug('Player', `Updated score for ${this._name}: ${this._score} (${points > 0 ? '+' : ''}${points})`);
    return this._score;
  }
  
  /**
   * Add a beast to the player's team
   * @param {Object} beast - Beast to add
   * @returns {Boolean} Success status
   */
  addBeast(beast) {
    if (!beast || !beast.id) {
      Logger.warning('Player', `Cannot add invalid beast to ${this._name}`);
      return false;
    }
    
    // Ensure beast isn't already owned
    if (this._beasts.some(b => b.id === beast.id)) {
      Logger.warning('Player', `Beast ${beast.id} already owned by ${this._name}`);
      return false;
    }
    
    // Add the beast and mark ownership
    beast.owner = this._id;
    this._beasts.push(beast);
    
    Logger.debug('Player', `Added beast ${beast.id} to ${this._name}`);
    return true;
  }
  
  /**
   * Remove a beast from the player's team
   * @param {String} beastId - ID of beast to remove
   * @returns {Object|null} The removed beast or null
   */
  removeBeast(beastId) {
    const index = this._beasts.findIndex(b => b.id === beastId);
    
    if (index === -1) {
      Logger.warning('Player', `Cannot remove beast ${beastId}: not found for ${this._name}`);
      return null;
    }
    
    // Remove and return the beast
    const beast = this._beasts[index];
    this._beasts.splice(index, 1);
    
    // Clear ownership
    beast.owner = null;
    
    Logger.debug('Player', `Removed beast ${beastId} from ${this._name}`);
    return beast;
  }
  
  /**
   * Collect shards
   * @param {Number} amount - Number of shards to add
   * @returns {Number} New shard total
   */
  collectShards(amount) {
    if (isNaN(amount) || amount <= 0) {
      Logger.warning('Player', `Invalid shard amount: ${amount}`);
      return this._inventory.shards;
    }
    
    this._inventory.shards += amount;
    this._stats.shardsCollected += amount;
    
    Logger.debug('Player', `${this._name} collected ${amount} shards, total: ${this._inventory.shards}`);
    return this._inventory.shards;
  }
  
  /**
   * Get save data representation of player
   * @returns {Object} Serializable player data
   */
  getSaveData() {
    return {
      id: this._id,
      name: this._name,
      color: this._color,
      isAI: this._isAI,
      score: this._score,
      beasts: this._beasts.map(beast => typeof beast.getSaveData === 'function' ? 
        beast.getSaveData() : beast),
      inventory: { ...this._inventory },
      stats: { ...this._stats }
    };
  }
  
  // Getters
  
  get id() {
    return this._id;
  }
  
  get name() {
    return this._name;
  }
  
  get color() {
    return this._color;
  }
  
  get isAI() {
    return this._isAI;
  }
  
  get score() {
    return this._score;
  }
  
  get beasts() {
    return [...this._beasts];
  }
  
  get inventory() {
    return { ...this._inventory };
  }
  
  get stats() {
    return { ...this._stats };
  }
  
  // Setters
  
  set name(value) {
    this._name = value;
  }
  
  set color(value) {
    this._color = value;
  }
}
