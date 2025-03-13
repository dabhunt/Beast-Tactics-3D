
/**
 * SystemCheck.js
 * Diagnostic tool to verify game subsystems are working correctly
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Verify the GameManager and its subsystems
 * @param {GameManager} gameManager - The game manager to check
 * @returns {Object} Results of the check
 */
export function checkGameSystems(gameManager) {
  Logger.info("SystemCheck", "Starting game system diagnostics");

  const results = {
    managerState: {},
    systemsAvailable: {},
    methodsAvailable: {},
    errors: []
  };

  try {
    // Check if gameManager exists
    if (!gameManager) {
      results.errors.push("GameManager is null or undefined");
      return results;
    }

    // Basic gameManager properties
    results.managerState = {
      initialized: !!gameManager.initialized,
      currentTurn: gameManager.currentTurn,
      hasStateManager: !!gameManager.stateManager,
      hasTurnManager: !!gameManager.turnManager,
      hasEventSystem: !!gameManager.eventSystem,
      hasGetSubsystem: typeof gameManager.getSubsystem === 'function'
    };

    // Check for getSubsystem method
    if (typeof gameManager.getSubsystem !== 'function') {
      results.errors.push("GameManager missing getSubsystem method");
    } else {
      // Check available subsystems
      const expectedSystems = [
        'weatherSystem',
        'combatSystem',
        'inventorySystem',
        'terrainSystem'
      ];

      for (const systemName of expectedSystems) {
        try {
          const system = gameManager.getSubsystem(systemName);
          results.systemsAvailable[systemName] = !!system;
          
          if (system) {
            // Check for expected methods on each system
            const methodChecks = {
              'weatherSystem': ['updateWeather', 'getCurrentWeather'],
              'combatSystem': ['calculateDamage', 'resolveAttack'],
              'inventorySystem': ['addItem', 'removeItem', 'getItems'],
              'terrainSystem': ['getTileAt', 'getTerrainEffect']
            };
            
            results.methodsAvailable[systemName] = {};
            
            if (methodChecks[systemName]) {
              for (const methodName of methodChecks[systemName]) {
                results.methodsAvailable[systemName][methodName] = 
                  typeof system[methodName] === 'function';
              }
            }
          }
        } catch (err) {
          results.errors.push(`Error checking ${systemName}: ${err.message}`);
        }
      }
    }

    Logger.info("SystemCheck", "Game system diagnostics complete", results);

  } catch (err) {
    results.errors.push(`Critical error during system check: ${err.message}`);
    Logger.error("SystemCheck", "Critical error during diagnostics", err);
  }

  return results;
}

/**
 * Create a UI to display system check results
 * @param {GameManager} gameManager - The game manager to check
 */
export function createSystemCheckUI(gameManager) {
  const results = checkGameSystems(gameManager);
  
  // Create panel
  const panel = document.createElement('div');
  panel.id = 'system-check-panel';
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  panel.style.zIndex = '1000';
  panel.style.maxHeight = '80vh';
  panel.style.overflowY = 'auto';
  panel.style.fontFamily = 'monospace';
  panel.style.fontSize = '12px';
  
  // Create content
  let content = `<h2>System Check Results</h2>`;
  
  // Manager state
  content += `<h3>Game Manager</h3>`;
  content += `<ul>`;
  for (const [key, value] of Object.entries(results.managerState)) {
    const color = value ? 'lightgreen' : 'pink';
    content += `<li style="color:${color}">${key}: ${value}</li>`;
  }
  content += `</ul>`;
  
  // Systems available
  content += `<h3>Systems Available</h3>`;
  content += `<ul>`;
  for (const [key, value] of Object.entries(results.systemsAvailable)) {
    const color = value ? 'lightgreen' : 'pink';
    content += `<li style="color:${color}">${key}: ${value}</li>`;
  }
  content += `</ul>`;
  
  // Methods available
  content += `<h3>System Methods</h3>`;
  for (const system in results.methodsAvailable) {
    content += `<h4>${system}</h4>`;
    content += `<ul>`;
    for (const [method, available] of Object.entries(results.methodsAvailable[system])) {
      const color = available ? 'lightgreen' : 'pink';
      content += `<li style="color:${color}">${method}: ${available}</li>`;
    }
    content += `</ul>`;
  }
  
  // Errors
  if (results.errors.length > 0) {
    content += `<h3 style="color:red">Errors</h3>`;
    content += `<ul>`;
    for (const error of results.errors) {
      content += `<li style="color:pink">${error}</li>`;
    }
    content += `</ul>`;
  }
  
  // Create a dummy weather system button
  content += `<h3>Actions</h3>`;
  content += `<button id="create-weather-system">Create Weather System</button>`;
  content += `<button id="close-panel">Close</button>`;
  
  panel.innerHTML = content;
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('create-weather-system').addEventListener('click', () => {
    try {
      // Create a simple weather system if it's missing
      if (!gameManager.getSubsystem('weatherSystem')) {
        const dummyWeatherSystem = {
          updateWeather: async (turn) => {
            console.log(`Weather updated for turn ${turn}`);
            return { type: 'sunny', effects: [] };
          },
          getCurrentWeather: () => {
            return { type: 'sunny', effects: [] };
          }
        };
        
        // If ServiceLocator exists, try to register the system
        if (gameManager.serviceLocator && 
            typeof gameManager.serviceLocator.registerService === 'function') {
          gameManager.serviceLocator.registerService('weatherSystem', dummyWeatherSystem);
          alert('Dummy weather system created and registered with ServiceLocator');
        } else {
          // Otherwise try to add it directly
          gameManager._subsystems = gameManager._subsystems || {};
          gameManager._subsystems.weatherSystem = dummyWeatherSystem;
          
          // Add a getSubsystem method if missing
          if (typeof gameManager.getSubsystem !== 'function') {
            gameManager.getSubsystem = function(name) {
              return this._subsystems[name];
            };
          }
          
          alert('Dummy weather system created directly on GameManager');
        }
        
        // Refresh the panel
        document.body.removeChild(panel);
        createSystemCheckUI(gameManager);
      } else {
        alert('Weather system already exists');
      }
    } catch (err) {
      alert(`Error creating weather system: ${err.message}`);
    }
  });
  
  document.getElementById('close-panel').addEventListener('click', () => {
    document.body.removeChild(panel);
  });
}
