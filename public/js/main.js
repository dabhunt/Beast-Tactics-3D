
/**
 * main.js
 * Main entry point for the Beast Tactics game
 */

import { GameManager } from './core/GameManager.js';
import { Logger } from './utils/Logger.js';

// Global game instance
let game = null;

/**
 * Initialize the game
 * @returns {Promise<GameManager>} The game manager instance
 */
async function initializeGame() {
  console.log('Beast Tactics: Initializing game...');
  
  try {
    // Set up logging
    Logger.setLogLevel('debug');
    Logger.enableTimestamps(true);
    
    // Create game manager
    game = new GameManager({
      version: '1.0.0',
      debugMode: true
    });
    
    // Initialize the game
    await game.initialize({
      players: [
        { name: 'Player 1', color: 'Red' }
      ]
    });
    
    // Start the game
    game.startGame();
    
    // Set up game loop
    startGameLoop();
    
    Logger.info('Main', 'Game initialized successfully');
    return game;
  } catch (error) {
    Logger.error('Main', 'Failed to initialize game', error);
    console.error('Failed to initialize game:', error);
    console.debug('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Last time for game loop
let lastTime = 0;

/**
 * Game loop for updates
 * @param {Number} timestamp - Current timestamp
 */
function gameLoop(timestamp) {
  try {
    // Skip if game not initialized
    if (!game) return;
    
    // Calculate delta time
    const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;
    
    // Update state manager
    game.stateManager.update(deltaTime);
    
    // Continue loop
    requestAnimationFrame(gameLoop);
  } catch (error) {
    Logger.error('Main', 'Error in game loop', error);
    console.error('Error in game loop:', error);
  }
}

/**
 * Start the game loop
 */
function startGameLoop() {
  Logger.info('Main', 'Starting game loop');
  lastTime = 0;
  requestAnimationFrame(gameLoop);
}

/**
 * Clean up resources when game ends
 */
function cleanupGame() {
  if (!game) return;
  
  Logger.info('Main', 'Cleaning up game resources');
  
  // Clean up any resources
  
  game = null;
}

// Expose API
window.BeastTactics = {
  initialize: initializeGame,
  cleanup: cleanupGame,
  
  // Debug access to game instance
  getGameManager: () => game
};

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  Logger.info('Main', 'DOM loaded, initializing game');
  initializeGame().catch(error => {
    console.error('Failed to initialize game on DOMContentLoaded:', error);
  });
});

// Clean up on unload
window.addEventListener('beforeunload', () => {
  cleanupGame();
});
