
/**
 * GifDebugger.js - Advanced diagnostics for GIF animation issues
 * 
 * This utility helps diagnose and fix common GIF animation problems in THREE.js
 * by providing enhanced logging, direct inspection of texture updates, and
 * console commands for debugging.
 */

// Helper for console logging
function log(message, data = null) {
  const prefix = "[GIF-DEBUG]";
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * GifDebugger class for diagnosing animation issues
 */
export class GifDebugger {
  constructor() {
    log("Initializing GIF Debugger tool");
    
    // Track active textures
    this.textures = [];
    
    // Create UI
    this._createDebugUI();
    
    // Expose debug methods to console
    this._exposeConsoleMethods();
    
    log("GIF Debugger initialized and ready");
  }
  
  /**
   * Create minimal debug UI overlay
   */
  _createDebugUI() {
    const container = document.createElement('div');
    container.id = 'gif-debug-container';
    container.style.position = 'fixed';
    container.style.right = '10px';
    container.style.bottom = '10px';
    container.style.backgroundColor = 'rgba(0,0,0,0.8)';
    container.style.color = '#00ff00';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.fontFamily = 'monospace';
    container.style.zIndex = '10000';
    container.style.fontSize = '12px';
    container.style.maxWidth = '300px';
    
    // Add content
    container.innerHTML = `
      <h3 style="margin-top:0;color:#ff5500">GIF Debug Tools</h3>
      <div id="gif-debug-status">Monitoring: 0 textures</div>
      <div id="gif-debug-actions">
        <button id="gif-debug-inspect">Inspect GIFs</button>
        <button id="gif-debug-force">Force Update</button>
      </div>
      <div id="gif-debug-log" style="max-height:100px;overflow-y:auto;margin-top:10px;font-size:10px"></div>
    `;
    
    // Add to document
    document.body.appendChild(container);
    
    // Set up button handlers
    document.getElementById('gif-debug-inspect').addEventListener('click', () => {
      this.inspectGifs();
    });
    
    document.getElementById('gif-debug-force').addEventListener('click', () => {
      this.forceUpdate();
    });
    
    log("Debug UI created");
  }
  
  /**
   * Expose debugging methods to the browser console
   */
  _exposeConsoleMethods() {
    // Make methods available globally for console debugging
    window.gifDebug = {
      inspect: this.inspectGifs.bind(this),
      forceUpdate: this.forceUpdate.bind(this),
      registerTexture: this.registerTexture.bind(this)
    };
    
    log("Debug methods exposed to console as window.gifDebug");
  }
  
  /**
   * Register a texture for monitoring
   * @param {THREE.Texture} texture - The texture to monitor
   * @param {string} name - Name identifier
   */
  registerTexture(texture, name) {
    log(`Registering texture for monitoring: ${name}`);
    
    // Add to tracking list
    this.textures.push({
      texture,
      name,
      registered: Date.now(),
      lastUpdated: Date.now(),
      updateCount: 0
    });
    
    // Update status display
    this._updateStatus();
    
    // Add to log
    this._addToLog(`Registered: ${name}`);
    
    return this.textures.length - 1;
  }
  
  /**
   * Force update of all registered textures
   */
  forceUpdate() {
    log(`Forcing update of ${this.textures.length} textures`);
    
    this.textures.forEach(item => {
      if (item.texture && typeof item.texture.update === 'function') {
        try {
          // Call update method
          item.texture.update();
          
          // Update tracking
          item.lastUpdated = Date.now();
          item.updateCount++;
          
          // Force texture needs update flag
          item.texture.needsUpdate = true;
          
          log(`Forced update on ${item.name}, update #${item.updateCount}`);
          this._addToLog(`Updated: ${item.name}`);
        } catch (err) {
          console.error(`Error updating ${item.name}:`, err);
          this._addToLog(`Error: ${item.name} - ${err.message}`);
        }
      } else {
        log(`Texture ${item.name} has no update method`);
        this._addToLog(`No update method: ${item.name}`);
      }
    });
    
    // Update status display
    this._updateStatus();
  }
  
  /**
   * Inspect registered GIFs and display details
   */
  inspectGifs() {
    log("Inspecting registered GIFs");
    
    // Clear log
    document.getElementById('gif-debug-log').innerHTML = '';
    
    // Check if any GIFs are registered
    if (this.textures.length === 0) {
      log("No GIFs registered for inspection");
      this._addToLog("No GIFs registered yet");
      return;
    }
    
    // Display details for each texture
    this.textures.forEach(item => {
      const details = {
        name: item.name,
        updateCount: item.updateCount,
        lastUpdated: new Date(item.lastUpdated).toISOString(),
        timeSinceUpdate: Date.now() - item.lastUpdated + 'ms',
        hasUpdateMethod: !!(item.texture && typeof item.texture.update === 'function'),
        textureValid: !!item.texture,
        needsUpdate: item.texture ? item.texture.needsUpdate : false
      };
      
      log(`Texture details for ${item.name}:`, details);
      this._addToLog(`${item.name}: ${item.updateCount} updates`);
      
      // Try to force an update
      if (item.texture && typeof item.texture.update === 'function') {
        item.texture.update();
        item.texture.needsUpdate = true;
        this._addToLog(`Forced update: ${item.name}`);
      }
    });
    
    // Also look for any AnimatedGIFLoader or AnimationDebugger
    if (window.animationDebugger) {
      log("Found AnimationDebugger in global scope", {
        active: window.animationDebugger.active,
        textureCount: window.animationDebugger.animatedTextures.length
      });
      this._addToLog(`AnimationDebugger: ${window.animationDebugger.active ? 'active' : 'inactive'}`);
    } else {
      log("No AnimationDebugger found in global scope");
      this._addToLog("No AnimationDebugger found");
    }
  }
  
  /**
   * Update the status display
   * @private
   */
  _updateStatus() {
    const statusElement = document.getElementById('gif-debug-status');
    if (statusElement) {
      statusElement.textContent = `Monitoring: ${this.textures.length} textures`;
    }
  }
  
  /**
   * Add entry to debug log
   * @private
   */
  _addToLog(message) {
    const logElement = document.getElementById('gif-debug-log');
    if (logElement) {
      const entry = document.createElement('div');
      entry.textContent = `${new Date().toISOString().substr(11, 8)}: ${message}`;
      logElement.appendChild(entry);
      
      // Auto-scroll to bottom
      logElement.scrollTop = logElement.scrollHeight;
    }
  }
}

// Create instance and expose globally when imported
const gifDebugger = new GifDebugger();
window.gifDebugger = gifDebugger;

export default gifDebugger;
/**
 * GifDebugger.js - Advanced diagnostics for GIF animation issues
 * 
 * This utility helps diagnose and fix common GIF animation problems in THREE.js
 * by providing enhanced logging, direct inspection of texture updates, and
 * console commands for debugging.
 */

// Helper for console logging
function log(message, data = null) {
  const prefix = "[GIF-DEBUG]";
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * GifDebugger class - Provides tools to diagnose GIF animation issues
 */
class GifDebugger {
  constructor() {
    log("Initializing GIF animation debugger");
    
    this.activeTextures = [];
    this.debugPanel = null;
    this.isMonitoring = false;
    this.monitorInterval = null;
    
    // Create debugger UI
    this._createDebugUI();
    
    // Expose commands to the console
    this._exposeConsoleCommands();
    
    // Start monitoring animations
    this.startMonitoring();
    
    log("GIF debugger initialized and ready");
  }
  
  /**
   * Create debug UI panel
   * @private
   */
  _createDebugUI() {
    // Create debug panel
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'gif-debug-panel';
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.8);
      color: #00ff00;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      display: none;
    `;
    
    // Add header
    const header = document.createElement('div');
    header.innerHTML = '<h3>GIF Animation Debugger</h3>';
    header.style.cssText = 'margin-bottom: 10px; text-align: center;';
    this.debugPanel.appendChild(header);
    
    // Add control buttons
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; justify-content: space-around; margin-bottom: 10px;';
    
    // Toggle monitor button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Toggle Monitor';
    toggleBtn.onclick = () => this.toggleMonitoring();
    controls.appendChild(toggleBtn);
    
    // Force update button
    const updateBtn = document.createElement('button');
    updateBtn.textContent = 'Force Update';
    updateBtn.onclick = () => this.forceUpdate();
    controls.appendChild(updateBtn);
    
    // Toggle visibility button
    const showHideBtn = document.createElement('button');
    showHideBtn.textContent = 'Show/Hide';
    showHideBtn.onclick = () => this.toggleVisibility();
    controls.appendChild(showHideBtn);
    
    this.debugPanel.appendChild(controls);
    
    // Add status display
    this.statusDisplay = document.createElement('div');
    this.statusDisplay.id = 'gif-debug-status';
    this.statusDisplay.style.cssText = 'margin-top: 10px; border-top: 1px solid #333; padding-top: 10px;';
    this.debugPanel.appendChild(this.statusDisplay);
    
    // Add to document
    document.body.appendChild(this.debugPanel);
    
    log("Debug UI created");
  }
  
  /**
   * Toggle debug panel visibility
   */
  toggleVisibility() {
    if (this.debugPanel.style.display === 'none') {
      this.debugPanel.style.display = 'block';
      log("Debug panel shown");
    } else {
      this.debugPanel.style.display = 'none';
      log("Debug panel hidden");
    }
  }
  
  /**
   * Start monitoring GIF animations
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    log("Starting animation monitoring");
    this.isMonitoring = true;
    
    // Update status every second
    this.monitorInterval = setInterval(() => {
      this._updateStatus();
    }, 1000);
    
    // Initial update
    this._updateStatus();
  }
  
  /**
   * Stop monitoring GIF animations
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    log("Stopping animation monitoring");
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
  
  /**
   * Toggle monitoring state
   */
  toggleMonitoring() {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }
  
  /**
   * Force update all GIF animations
   */
  forceUpdate() {
    log("Forcing update of all animations");
    
    // Check if AnimatedGIFLoader is available globally
    if (window.animationDebugger) {
      window.animationDebugger.update();
      log("Animation update triggered through animationDebugger");
    }
    
    // Try to find all GIF animations in the scene
    let allTextures = [];
    
    // Look for THREE.js scene
    if (window.scene) {
      log("Found THREE.js scene, scanning for animated textures");
      
      window.scene.traverse((object) => {
        if (object.material) {
          if (object.material.map) {
            allTextures.push(object.material.map);
          } else if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              if (mat && mat.map) allTextures.push(mat.map);
            });
          }
        }
      });
      
      log(`Found ${allTextures.length} textures in scene`);
      
      // Force update of all textures
      allTextures.forEach(texture => {
        if (texture.update && typeof texture.update === 'function') {
          texture.update();
        }
        texture.needsUpdate = true;
      });
    } else {
      log("No THREE.js scene found, can't scan for textures");
    }
    
    // Check for FireBeast
    if (window.fireBeast && window.fireBeast.beastTexture) {
      log("Found Fire Beast texture, forcing update");
      window.fireBeast.beastTexture.needsUpdate = true;
      
      if (window.fireBeast.beastTexture.update && 
          typeof window.fireBeast.beastTexture.update === 'function') {
        window.fireBeast.beastTexture.update();
      }
    }
  }
  
  /**
   * Register a texture for monitoring
   * @param {THREE.Texture} texture - The texture to monitor
   * @param {string} name - Name for the texture
   */
  registerTexture(texture, name) {
    this.activeTextures.push({
      texture: texture,
      name: name || `Texture_${this.activeTextures.length}`,
      registeredAt: Date.now(),
      updateCount: 0,
      lastUpdated: 0
    });
    
    log(`Registered texture: ${name}`, texture);
    return this.activeTextures.length - 1;
  }
  
  /**
   * Update the status display with current animation info
   * @private
   */
  _updateStatus() {
    // Get animation stats
    let activeCount = 0;
    
    // Check animationDebugger first
    if (window.animationDebugger) {
      const debugger = window.animationDebugger;
      activeCount = debugger.activeTextures ? debugger.activeTextures.length : 0;
    }
    
    // Check gifLoader if available
    let gifLoaderStats = {};
    try {
      // Try to import and check AnimatedGIFLoader
      import("../AnimatedGIFLoader.js")
        .then(module => {
          if (module.gifLoader) {
            const animations = module.gifLoader.activeAnimations || [];
            gifLoaderStats = {
              loadedGifs: animations.length,
              activeFrames: animations.reduce((sum, anim) => sum + (anim.frames ? anim.frames.length : 0), 0)
            };
            this._updateStatusDisplay(activeCount, gifLoaderStats);
          }
        })
        .catch(err => {
          console.error("[GIF-DEBUG] Error checking gifLoader:", err);
        });
    } catch (err) {
      // Fallback if import fails
      this._updateStatusDisplay(activeCount, {});
    }
    
    // Log animation cycle check
    console.log("[ANIM-DEBUG] Animation cycle check - active:", 
      this.isMonitoring, 
      "textures:", activeCount
    );
  }
  
  /**
   * Update the status display with current stats
   * @private
   */
  _updateStatusDisplay(activeCount, gifLoaderStats) {
    if (!this.statusDisplay) return;
    
    let html = `<div>Monitoring: ${this.isMonitoring ? 'Active' : 'Paused'}</div>`;
    html += `<div>Active Textures: ${activeCount}</div>`;
    
    if (gifLoaderStats.loadedGifs !== undefined) {
      html += `<div>Loaded GIFs: ${gifLoaderStats.loadedGifs}</div>`;
      html += `<div>Active Frames: ${gifLoaderStats.activeFrames}</div>`;
    }
    
    // Check if sprite exists in the scene
    let beastInfo = "Not Found";
    if (window.fireBeast) {
      beastInfo = window.fireBeast.isLoaded ? "Loaded" : "Loading";
      beastInfo += window.fireBeast.sprite ? " (Sprite Created)" : " (No Sprite)";
    }
    html += `<div>Beast Status: ${beastInfo}</div>`;
    
    this.statusDisplay.innerHTML = html;
  }
  
  /**
   * Expose console commands for easy debugging
   * @private
   */
  _exposeConsoleCommands() {
    // Make methods available in console
    window.gifDebugCommands = {
      showPanel: () => this.toggleVisibility(),
      startMonitor: () => this.startMonitoring(),
      stopMonitor: () => this.stopMonitoring(),
      forceUpdate: () => this.forceUpdate(),
      checkBeast: () => {
        if (window.fireBeast) {
          console.table({
            type: window.fireBeast.type,
            loaded: window.fireBeast.isLoaded,
            position: [
              window.fireBeast.group.position.x, 
              window.fireBeast.group.position.y, 
              window.fireBeast.group.position.z
            ],
            hasTexture: !!window.fireBeast.beastTexture,
            hasSprite: !!window.fireBeast.sprite
          });
        } else {
          console.log("No Beast found in scene");
        }
      }
    };
    
    log("Console commands exposed under window.gifDebugCommands");
  }
}

// Create instance and expose globally
const gifDebugger = new GifDebugger();
window.gifDebugger = gifDebugger;

export default gifDebugger;
/**
 * GifDebugger.js - Diagnostic tool for GIF animations
 * 
 * This script helps diagnose and resolve issues with GIF animations
 * by providing visualization and logging tools.
 */

// Log initialization
console.log("[GIF-DEBUGGER] Initializing GIF diagnostic tool");

/**
 * Checks if GIF animation related tools are working correctly
 */
function checkGIFAnimation() {
  console.log("[GIF-DEBUGGER] Testing GIF animation capabilities");
  
  // Check if omggif is available
  if (typeof window.omggif === 'undefined') {
    console.warn("[GIF-DEBUGGER] omggif library not found in global scope. GIF parsing may fail.");
    
    // Try to check if it's available as a module
    try {
      const testRequire = require('omggif');
      console.log("[GIF-DEBUGGER] omggif is available via require()");
    } catch (err) {
      console.warn("[GIF-DEBUGGER] omggif also not available via require(). Needs to be installed.");
      console.log("[GIF-DEBUGGER] Run 'npm install omggif' or add via CDN.");
    }
  } else {
    console.log("[GIF-DEBUGGER] omggif library found and available.");
  }
  
  // Check for AnimatedGIFLoader
  if (typeof window.AnimatedGIFLoader === 'undefined') {
    console.warn("[GIF-DEBUGGER] AnimatedGIFLoader not found in global scope.");
  } else {
    console.log("[GIF-DEBUGGER] AnimatedGIFLoader available in global scope.");
  }
  
  try {
    // Try importing the module (this works in modern browsers with ES modules)
    import('/public/tools/AnimatedGIFLoader.js')
      .then(module => {
        console.log("[GIF-DEBUGGER] AnimatedGIFLoader module successfully imported");
      })
      .catch(err => {
        console.error("[GIF-DEBUGGER] Failed to import AnimatedGIFLoader:", err);
      });
  } catch (err) {
    console.warn("[GIF-DEBUGGER] ES module import not supported in this context");
  }
  
  console.log("[GIF-DEBUGGER] GIF animation check complete");
}

/**
 * GifDebugger class for creating a visual debugging interface
 */
class GifDebugger {
  constructor() {
    this.debugContainer = null;
    this.previewCanvas = null;
    this.debugLog = [];
    
    console.log("[GIF-DEBUGGER] GifDebugger instance created");
  }
  
  /**
   * Create and show the debug UI
   */
  showDebugUI() {
    if (this.debugContainer) return;
    
    // Create container
    this.debugContainer = document.createElement('div');
    this.debugContainer.id = 'gif-debugger';
    this.debugContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 10000;
      max-height: 400px;
      overflow: auto;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.textContent = 'GIF Animation Debugger';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    this.debugContainer.appendChild(header);
    
    // Create preview canvas
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 150;
    this.previewCanvas.height = 150;
    this.previewCanvas.style.border = '1px solid #444';
    this.previewCanvas.style.display = 'block';
    this.previewCanvas.style.margin = '0 auto 10px auto';
    this.debugContainer.appendChild(this.previewCanvas);
    
    // Create log container
    const logContainer = document.createElement('div');
    logContainer.id = 'gif-debug-log';
    logContainer.style.cssText = `
      height: 150px;
      overflow-y: auto;
      font-size: 12px;
      border-top: 1px solid #444;
      padding-top: 5px;
    `;
    this.debugContainer.appendChild(logContainer);
    
    // Add to document
    document.body.appendChild(this.debugContainer);
    
    this.log('GIF Debugger UI initialized');
  }
  
  /**
   * Log a message to the debug UI
   * @param {string} message - Message to log
   */
  log(message) {
    this.debugLog.push({
      time: new Date(),
      message
    });
    
    // Update UI if visible
    if (this.debugContainer) {
      const logElement = document.getElementById('gif-debug-log');
      if (logElement) {
        const entry = document.createElement('div');
        entry.textContent = `${new Date().toISOString().substr(11, 8)}: ${message}`;
        logElement.appendChild(entry);
        
        // Auto-scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
      }
    }
    
    // Also log to console
    console.log(`[GIF-DEBUGGER] ${message}`);
  }
  
  /**
   * Preview a GIF frame on the debug canvas
   * @param {HTMLCanvasElement|HTMLImageElement} frame - Frame to preview
   */
  previewFrame(frame) {
    if (!this.previewCanvas) return;
    
    const ctx = this.previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    try {
      // Draw and scale the frame to fit
      const scale = Math.min(
        this.previewCanvas.width / frame.width,
        this.previewCanvas.height / frame.height
      );
      
      const width = frame.width * scale;
      const height = frame.height * scale;
      const x = (this.previewCanvas.width - width) / 2;
      const y = (this.previewCanvas.height - height) / 2;
      
      ctx.drawImage(frame, x, y, width, height);
      this.log(`Previewing frame: ${frame.width}x${frame.height}`);
    } catch (err) {
      this.log(`Error previewing frame: ${err.message}`);
    }
  }
  
  /**
   * Hide the debug UI
   */
  hideDebugUI() {
    if (this.debugContainer && this.debugContainer.parentNode) {
      this.debugContainer.parentNode.removeChild(this.debugContainer);
      this.debugContainer = null;
    }
  }
}

// Export the GifDebugger class and checkGIFAnimation function
window.GifDebugger = GifDebugger;
window.checkGIFAnimation = checkGIFAnimation;

console.log("[GIF-DEBUGGER] GIF debugging tools initialized");
