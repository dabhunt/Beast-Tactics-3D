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
        crystalManager.particleEffect.particleSystems.length : 0,
      activeCrystals: crystalManager.activeCrystals ? 
        crystalManager.activeCrystals.length : 0,
      glowEnabled: crystalManager.config ? 
        crystalManager.config.enableGlowEffect : false
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
  
  // Create content container that can be hidden
  const contentDiv = document.createElement('div');
  contentDiv.id = 'crystal-debug-content';
  debugContainer.appendChild(contentDiv);
  
  // Add particle controls section
  addSectionHeader(contentDiv, 'Particle Controls');
  
  // Add controls for particles
  addSlider(contentDiv, 'particleSize', 'Particle Size', 0.1, 3.0, 0.1);
  addSlider(contentDiv, 'minLifetime', 'Min Lifetime', 0.5, 10.0, 0.5);
  addSlider(contentDiv, 'maxLifetime', 'Max Lifetime', 1.0, 15.0, 0.5);
  addSlider(contentDiv, 'emitterRadius', 'Emitter Radius', 0.1, 2.0, 0.1);
  addSlider(contentDiv, 'particleSpread', 'Particle Spread', 0.1, 2.0, 0.1);
  addSlider(contentDiv, 'minVelocity', 'Min Velocity', 0.01, 0.5, 0.01);
  addSlider(contentDiv, 'maxVelocity', 'Max Velocity', 0.05, 1.0, 0.01);
  
  // Add glow controls section
  addSectionHeader(contentDiv, 'Glow Effect Controls');
  
  // Add toggle for glow effect
  addToggle(contentDiv, 'enableGlowEffect', 'Enable Glow Effect');
  
  // Add controls for glow effect
  addSlider(contentDiv, 'glowIntensity', 'Glow Intensity', 0.1, 3.0, 0.1);
  addSlider(contentDiv, 'glowSize', 'Glow Size', 0.5, 5.0, 0.1);
  addSlider(contentDiv, 'glowColorR', 'Glow Red', 0, 1, 0.05);
  addSlider(contentDiv, 'glowColorG', 'Glow Green', 0, 1, 0.05);
  addSlider(contentDiv, 'glowColorB', 'Glow Blue', 0, 1, 0.05);
  
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
  
  // Force refresh button
  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'Refresh';
  refreshButton.style.cssText = 'flex: 1; padding: 5px; background: #333; color: white; border: none; border-radius: 3px;';
  refreshButton.onclick = () => {
    refreshGlowEffects();
  };
  buttonContainer.appendChild(refreshButton);
  
  debugContainer.appendChild(buttonContainer);
  
  // Add to document
  document.body.appendChild(debugContainer);
  
  // Start update loop
  updateDebugDisplay();
  
  console.log('[CRYSTAL-DEBUG] Debug UI created');
}

/**
 * Add a section header to the debug UI
 * @param {HTMLElement} parent - Parent element to append to
 * @param {string} title - Section title
 */
function addSectionHeader(parent, title) {
  const header = document.createElement('div');
  header.style.cssText = `
    margin: 15px 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255,255,255,0.3);
    font-weight: bold;
    color: #a280ff;
  `;
  header.textContent = title;
  parent.appendChild(header);
}

/**
 * Add a toggle control to the debug UI
 * @param {HTMLElement} parent - Parent element
 * @param {string} property - Property name in the config object
 * @param {string} label - Human-readable label
 */
function addToggle(parent, property, label) {
  try {
    if (!crystalManager || !crystalManager.config) {
      console.warn(`[CRYSTAL-DEBUG] Cannot add toggle for ${property} - config not available`);
      return;
    }
    
    // Create container
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;';
    
    // Create label
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!crystalManager.config[property];
    
    // Handle value changes
    checkbox.onchange = () => {
      crystalManager.config[property] = checkbox.checked;
      
      // Log change
      console.log(`[CRYSTAL-DEBUG] Updated ${property} to ${checkbox.checked}`);
      
      // Refresh effects if needed
      if (property === 'enableGlowEffect') {
        refreshGlowEffects();
      }
    };
    
    // Append elements
    container.appendChild(labelElement);
    container.appendChild(checkbox);
    parent.appendChild(container);
    
  } catch (error) {
    console.error(`[CRYSTAL-DEBUG] Error creating toggle for ${property}:`, error);
  }
}

/**
 * Add a slider control to the debug UI
 * @param {HTMLElement} parent - Parent element
 * @param {string} property - Property name in the config object
 * @param {string} label - Human-readable label
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} step - Step increment
 */
function addSlider(parent, property, label, min, max, step) {
  try {
    // Determine which config object to use based on property
    let config, configType;
    
    if (property.startsWith('glow')) {
      config = crystalManager.config;
      configType = 'crystal';
    } else {
      config = crystalManager.particleEffect?.config;
      configType = 'particle';
    }
    
    if (!config || config[property] === undefined) {
      // For glow color components, we need to handle specially
      if (property === 'glowColorR' || property === 'glowColorG' || property === 'glowColorB') {
        if (!crystalManager.config.glowColor) {
          crystalManager.config.glowColor = { r: 0.7, g: 0.3, b: 1.0 };
        }
        
        const colorComponent = property.charAt(property.length - 1).toLowerCase();
        config = crystalManager.config.glowColor;
        property = colorComponent;
      } else {
        console.warn(`[CRYSTAL-DEBUG] Property ${property} not found in ${configType} config`);
        return;
      }
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
      
      // For glow properties, refresh the glow effects
      if (property === 'r' || property === 'g' || property === 'b' || 
          property === 'glowIntensity' || property === 'glowSize') {
        refreshGlowEffects();
      }
    };
    
    // Append elements
    container.appendChild(labelElement);
    container.appendChild(slider);
    parent.appendChild(container);
    
  } catch (error) {
    console.error(`[CRYSTAL-DEBUG] Error creating slider for ${property}:`, error);
  }
}

/**
 * Refresh glow effects on all crystal shards
 */
function refreshGlowEffects() {
  try {
    if (!crystalManager || !crystalManager.activeCrystals) {
      console.warn('[CRYSTAL-DEBUG] Cannot refresh glow effects - no active crystals');
      return;
    }
    
    console.log('[CRYSTAL-DEBUG] Refreshing glow effects on all crystals...');
    
    // For each active crystal, update its glow effect
    crystalManager.activeCrystals.forEach(crystal => {
      if (crystal.userData.glowMesh) {
        try {
          const enabled = crystalManager.config.enableGlowEffect;
          
          // Update visibility
          crystal.userData.glowMesh.visible = enabled;
          
          if (enabled) {
            // Update material with current settings
            const material = crystal.userData.glowMesh.material;
            
            // Update color if available
            if (material.uniforms && material.uniforms.glowColor) {
              const color = crystalManager.config.glowColor || { r: 0.7, g: 0.3, b: 1.0 };
              material.uniforms.glowColor.value.set(color.r, color.g, color.b);
            }
            
            // Update intensity if available
            if (material.uniforms && material.uniforms.intensity) {
              material.uniforms.intensity.value = crystalManager.config.glowIntensity || 1.0;
            }
            
            // Update size if available
            if (crystal.userData.glowMesh.scale) {
              const size = crystalManager.config.glowSize || 1.2;
              crystal.userData.glowMesh.scale.set(size, size, size);
            }
          }
        } catch (err) {
          console.error('[CRYSTAL-DEBUG] Error updating crystal glow:', err);
        }
      }
    });
    
    console.log('[CRYSTAL-DEBUG] Glow effects refreshed');
    
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error refreshing glow effects:', error);
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
      Math.round(1000 / (Date.now() - particleEffect.lastUpdateTime + 1)) : '?';
    
    // Count visible glow effects
    let visibleGlowEffects = 0;
    if (crystalManager.activeCrystals) {
      crystalManager.activeCrystals.forEach(crystal => {
        if (crystal.userData.glowMesh && crystal.userData.glowMesh.visible) {
          visibleGlowEffects++;
        }
      });
    }
    
    // Create status HTML
    const statusHTML = `
      <div>Status: ${particleEffect ? 'Active' : 'Inactive'}</div>
      <div>Particle Systems: ${particleSystems.length}</div>
      <div>Particles: ${particleSystems.length * (particleEffect?.config?.particleCount || 0)}</div>
      <div>Active Crystals: ${crystalManager.activeCrystals?.length || 0}</div>
      <div>Visible Glow Effects: ${visibleGlowEffects}</div>
      <div>Glow Enabled: ${crystalManager.config?.enableGlowEffect ? 'Yes' : 'No'}</div>
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
    
    console.log('[CRYSTAL-DEBUG] Resetting to original config values...');
    
    const config = crystalManager.particleEffect.config;
    
    // Restore original particle values
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
    
    // Reset glow effect to defaults
    if (crystalManager.config) {
      crystalManager.config.enableGlowEffect = true;
      crystalManager.config.glowIntensity = 1.0;
      crystalManager.config.glowSize = 1.2;
      
      if (!crystalManager.config.glowColor) {
        crystalManager.config.glowColor = {};
      }
      crystalManager.config.glowColor.r = 0.7;
      crystalManager.config.glowColor.g = 0.3;
      crystalManager.config.glowColor.b = 1.0;
    }
    
    // Update all UI elements
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(toggle => {
      const property = toggle.dataset.property;
      if (property && crystalManager.config[property] !== undefined) {
        toggle.checked = crystalManager.config[property];
      }
    });
    
    // Update all sliders
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      const property = slider.dataset.property;
      if (!property) return;
      
      let value;
      if (property.startsWith('glow')) {
        if (property.startsWith('glowColor')) {
          const component = property.charAt(property.length - 1).toLowerCase();
          value = crystalManager.config.glowColor[component];
        } else {
          value = crystalManager.config[property];
        }
      } else {
        value = config[property];
      }
      
      if (value !== undefined) {
        slider.value = value;
        const valueElement = document.getElementById(`value-${property}`);
        if (valueElement) {
          valueElement.textContent = value.toFixed(2);
        }
      }
    });
    
    // Refresh glow effects
    refreshGlowEffects();
    
    console.log('[CRYSTAL-DEBUG] Reset to original config values:', {
      particle: config,
      glow: crystalManager.config
    });
    
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error resetting config:', error);
  }
}

export { initCrystalParticleDebugger };
