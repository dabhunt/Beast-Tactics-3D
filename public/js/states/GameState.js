
/**
 * GameState.js
 * Interface for game states
 */

export class GameState {
  /**
   * Create a game state
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
  }
  
  /**
   * Called when entering this state
   * @param {Object} data - Optional data passed to the state
   */
  async enterState(data = {}) {
    // To be implemented by subclasses
  }
  
  /**
   * Update state logic
   * @param {Number} deltaTime - Time since last update
   */
  updateState(deltaTime) {
    // To be implemented by subclasses
  }
  
  /**
   * Called when exiting this state
   */
  exitState() {
    // To be implemented by subclasses
  }
  
  /**
   * Get serializable state data for saving
   * @returns {Object} Save data
   */
  getSaveData() {
    return {};
  }
  
  /**
   * Load state from saved data
   * @param {Object} saveData - Previously saved state data
   */
  loadSaveData(saveData) {
    // To be implemented by subclasses
  }
}
