
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

      // Check available subsystems
      const expectedSystems = [
        'weatherSystem',
        'combatSystem',
        'inventorySystem',
        'terrainSystem'
      ];
      
      for (const system of expectedSystems) {
        try {
          results.systemsAvailable[system] = !!gameManager.getSubsystem(system);
          
          if (results.systemsAvailable[system]) {
            Logger.debug("SystemCheck", `Found subsystem: ${system}`);
          } else {
            Logger.debug("SystemCheck", `Subsystem not available: ${system}`);
          }
        } catch (err) {
          results.errors.push(`Error checking ${system}: ${err.message}`);
        }
      }
    }

    // Check method availability
    const requiredMethods = [
      'initialize',
      'startGame',
      'endGame',
      'saveGame',
      'loadGame'
    ];
    
    for (const method of requiredMethods) {
      results.methodsAvailable[method] = typeof gameManager[method] === 'function';
    }
    
    Logger.info("SystemCheck", "System check complete with results:", results);
    return results;
  } catch (err) {
    Logger.error("SystemCheck", "Error during system check:", err);
    results.errors.push(err.message);
    return results;
  }
}

/**
 * Create a UI panel for system diagnostics
 * @param {GameManager} gameManager - Game manager to test
 */
export function createSystemCheckUI(gameManager) {
  Logger.info("SystemCheck", "Creating system check UI panel");
  
  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'system-check-panel';
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
  panel.style.color = '#ffffff';
  panel.style.padding = '15px';
  panel.style.borderRadius = '5px';
  panel.style.maxWidth = '500px';
  panel.style.maxHeight = '80vh';
  panel.style.overflowY = 'auto';
  panel.style.zIndex = '1000';
  panel.style.fontFamily = 'monospace';
  panel.style.fontSize = '14px';
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'System Diagnostics';
  title.style.margin = '0 0 10px 0';
  title.style.textAlign = 'center';
  panel.appendChild(title);
  
  // Run diagnostics
  const results = checkGameSystems(gameManager);
  
  // Create content
  const content = document.createElement('div');
  
  // Add manager state section
  const managerSection = document.createElement('div');
  managerSection.innerHTML = `
    <h3>GameManager State</h3>
    <ul>
      ${Object.entries(results.managerState).map(([key, value]) => 
        `<li>${key}: <span style="color:${value ? '#4CAF50' : '#F44336'}">${value}</span></li>`
      ).join('')}
    </ul>
  `;
  content.appendChild(managerSection);
  
  // Add systems section
  const systemsSection = document.createElement('div');
  systemsSection.innerHTML = `
    <h3>Available Systems</h3>
    <ul>
      ${Object.entries(results.systemsAvailable).map(([key, value]) => 
        `<li>${key}: <span style="color:${value ? '#4CAF50' : '#F44336'}">${value}</span></li>`
      ).join('')}
    </ul>
  `;
  content.appendChild(systemsSection);
  
  // Add errors section if any
  if (results.errors.length > 0) {
    const errorsSection = document.createElement('div');
    errorsSection.innerHTML = `
      <h3>Errors</h3>
      <ul style="color:#F44336">
        ${results.errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    `;
    content.appendChild(errorsSection);
  }
  
  // Add refresh button
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Refresh';
  refreshBtn.style.padding = '8px 15px';
  refreshBtn.style.margin = '10px 0';
  refreshBtn.style.backgroundColor = '#4CAF50';
  refreshBtn.style.border = 'none';
  refreshBtn.style.borderRadius = '3px';
  refreshBtn.style.color = 'white';
  refreshBtn.style.cursor = 'pointer';
  refreshBtn.onclick = () => {
    panel.removeChild(content);
    const newResults = checkGameSystems(gameManager);
    // Recreate content (simplified - would duplicate code above)
    Logger.info("SystemCheck", "Refreshed system diagnostics");
  };
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '8px 15px';
  closeBtn.style.margin = '10px 0 10px 10px';
  closeBtn.style.backgroundColor = '#F44336';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '3px';
  closeBtn.style.color = 'white';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => {
    document.body.removeChild(panel);
    Logger.info("SystemCheck", "Closed system diagnostics panel");
  };
  
  // Add buttons
  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.justifyContent = 'center';
  buttonRow.appendChild(refreshBtn);
  buttonRow.appendChild(closeBtn);
  
  panel.appendChild(content);
  panel.appendChild(buttonRow);
  document.body.appendChild(panel);
  
  Logger.info("SystemCheck", "System check UI panel created");
  return panel;
}

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
