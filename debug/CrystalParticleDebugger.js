/**
 * CrystalParticleDebugger.js
 * A debugging utility for testing and tuning crystal particle effects
 * 
 * This tool provides UI controls for adjusting particle behavior in real-time
 * and displays diagnostic information about the current particle systems.
 */

// Track original config values to allow resetting
const originalConfig = {
  particleSize: null,
  particleCount: null,
  minLifetime: null,
  maxLifetime: null,
  emitterRadius: null,
  particleSpread: null,
  minVelocity: null,
  maxVelocity: null
};

// Debug state tracking
let isDebuggerInitialized = false;
let debugContainer = null;
let crystalManager = null;
let debugValues = {};

/**
 * Initialize the crystal particle debugger
 * @param {Object} mapGenerator - The game's map generator instance
 */
function initCrystalParticleDebugger(mapGenerator) {
  console.log('[CRYSTAL-DEBUG] Initializing Crystal Particle Debugger...');
  
  try {
    if (!mapGenerator) {
      console.error('[CRYSTAL-DEBUG] Map generator reference is required');
      return;
    }
    
    // Get crystal shard manager
    crystalManager = mapGenerator.crystalShardManager;
    
    if (!crystalManager) {
      console.error('[CRYSTAL-DEBUG] Crystal Shard Manager not found in mapGenerator');
      return;
    }
    
    console.log('[CRYSTAL-DEBUG] Found Crystal Shard Manager:', {
      hasCrystalManager: !!crystalManager,
      hasParticleEffect: !!crystalManager.particleEffect,
      particleSystems: crystalManager.particleEffect ? 
        crystalManager.particleEffect.particleSystems.length : 0
    });
    
    // Save original config values for reset functionality
    if (crystalManager.particleEffect && crystalManager.particleEffect.config) {
      const config = crystalManager.particleEffect.config;
      Object.keys(originalConfig).forEach(key => {
        if (config[key] !== undefined) {
          originalConfig[key] = config[key];
        }
      });
      
      console.log('[CRYSTAL-DEBUG] Saved original config values:', originalConfig);
    }
    
    // Create UI if it doesn't exist yet
    if (!isDebuggerInitialized) {
      createDebugUI();
    }
    
    isDebuggerInitialized = true;
    
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error initializing debugger:', error);
    console.debug('[CRYSTAL-DEBUG] Stack trace:', error.stack);
  }
}

/**
 * Create debug UI elements
 */
function createDebugUI() {
  console.log('[CRYSTAL-DEBUG] Creating debug UI...');
  
  // Create container
  debugContainer = document.createElement('div');
  debugContainer.id = 'crystal-debug-container';
  debugContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 1000;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  // Add header
  const header = document.createElement('div');
  header.innerHTML = '<h3 style="margin: 0 0 10px 0; color: #9966ff;">Crystal Particle Debugger</h3>';
  debugContainer.appendChild(header);
  
  // Add controls
  addSlider('particleSize', 'Particle Size', 0.1, 3.0, 0.1);
  addSlider('minLifetime', 'Min Lifetime', 0.5, 10.0, 0.5);
  addSlider('maxLifetime', 'Max Lifetime', 1.0, 15.0, 0.5);
  addSlider('emitterRadius', 'Emitter Radius', 0.1, 2.0, 0.1);
  addSlider('particleSpread', 'Particle Spread', 0.1, 2.0, 0.1);
  addSlider('minVelocity', 'Min Velocity', 0.01, 0.5, 0.01);
  addSlider('maxVelocity', 'Max Velocity', 0.05, 1.0, 0.01);
  
  // Add status display
  const statusDiv = document.createElement('div');
  statusDiv.id = 'crystal-debug-status';
  statusDiv.style.cssText = `
    margin-top: 15px;
    padding: 5px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  `;
  statusDiv.innerHTML = '<div>Status: Monitoring...</div>';
  debugContainer.appendChild(statusDiv);
  
  // Add buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; margin-top: 10px; gap: 5px;';
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Config';
  resetButton.style.cssText = 'flex: 1; padding: 5px; background: #333; color: white; border: none; border-radius: 3px;';
  resetButton.onclick = resetToOriginalConfig;
  buttonContainer.appendChild(resetButton);
  
  // Toggle visibility button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Hide/Show';
  toggleButton.style.cssText = 'flex: 1; padding: 5px; background: #333; color: white; border: none; border-radius: 3px;';
  toggleButton.onclick = () => {
    const content = document.getElementById('crystal-debug-content');
    if (content) {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
  };
  buttonContainer.appendChild(toggleButton);
  
  debugContainer.appendChild(buttonContainer);
  
  // Create content container that can be hidden
  const contentDiv = document.createElement('div');
  contentDiv.id = 'crystal-debug-content';
  debugContainer.appendChild(contentDiv);
  
  // Add to document
  document.body.appendChild(debugContainer);
  
  // Start update loop
  updateDebugDisplay();
  
  console.log('[CRYSTAL-DEBUG] Debug UI created');
}

/**
 * Add a slider control to the debug UI
 * @param {string} property - Property name in the config object
 * @param {string} label - Human-readable label
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} step - Step increment
 */
function addSlider(property, label, min, max, step) {
  try {
    if (!crystalManager || !crystalManager.particleEffect) {
      console.warn('[CRYSTAL-DEBUG] Cannot add slider - particle effect not available');
      return;
    }
    
    const config = crystalManager.particleEffect.config;
    if (!config || config[property] === undefined) {
      console.warn(`[CRYSTAL-DEBUG] Property ${property} not found in config`);
      return;
    }
    
    // Create container
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 8px;';
    
    // Create label
    const labelElement = document.createElement('div');
    labelElement.style.cssText = 'display: flex; justify-content: space-between;';
    labelElement.innerHTML = `
      <span>${label}</span>
      <span id="value-${property}">${config[property].toFixed(2)}</span>
    `;
    
    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = config[property];
    slider.style.cssText = 'width: 100%; margin-top: 3px;';
    
    // Handle value changes
    slider.oninput = () => {
      const value = parseFloat(slider.value);
      config[property] = value;
      document.getElementById(`value-${property}`).textContent = value.toFixed(2);
      
      // Log change
      console.log(`[CRYSTAL-DEBUG] Updated ${property} to ${value}`);
    };
    
    // Append elements
    container.appendChild(labelElement);
    container.appendChild(slider);
    debugContainer.appendChild(container);
    
  } catch (error) {
    console.error(`[CRYSTAL-DEBUG] Error creating slider for ${property}:`, error);
  }
}

/**
 * Update debug display with current status
 */
function updateDebugDisplay() {
  try {
    if (!isDebuggerInitialized || !crystalManager) return;
    
    const statusElement = document.getElementById('crystal-debug-status');
    if (!statusElement) return;
    
    // Get current state
    const particleEffect = crystalManager.particleEffect;
    const particleSystems = particleEffect ? particleEffect.particleSystems : [];
    const fps = particleEffect && particleEffect.lastUpdateTime ? 
      Math.round(1000 / (Date.now() - particleEffect.lastUpdateTime)) : '?';
    
    // Create status HTML
    const statusHTML = `
      <div>Status: ${particleEffect ? 'Active' : 'Inactive'}</div>
      <div>Particle Systems: ${particleSystems.length}</div>
      <div>Particle Count: ${particleSystems.length * (particleEffect?.config?.particleCount || 0)}</div>
      <div>Estimated FPS: ${fps}</div>
      <div>Last Update: ${new Date().toISOString().substr(11, 8)}</div>
    `;
    
    statusElement.innerHTML = statusHTML;
    
    // Schedule next update
    setTimeout(updateDebugDisplay, 1000);
    
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error updating debug display:', error);
  }
}

/**
 * Reset configuration to original values
 */
function resetToOriginalConfig() {
  try {
    if (!crystalManager || !crystalManager.particleEffect) {
      console.warn('[CRYSTAL-DEBUG] Cannot reset - particle effect not available');
      return;
    }
    
    const config = crystalManager.particleEffect.config;
    
    // Restore original values
    Object.keys(originalConfig).forEach(key => {
      if (originalConfig[key] !== null) {
        config[key] = originalConfig[key];
        
        // Update UI slider if it exists
        const valueElement = document.getElementById(`value-${key}`);
        if (valueElement) {
          valueElement.textContent = originalConfig[key].toFixed(2);
        }
        
        const slider = document.querySelector(`input[type="range"][value="${key}"]`);
        if (slider) {
          slider.value = originalConfig[key];
        }
      }
    });
    
    console.log('[CRYSTAL-DEBUG] Reset to original config values:', config);
    
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error resetting config:', error);
  }
}

export { initCrystalParticleDebugger };
