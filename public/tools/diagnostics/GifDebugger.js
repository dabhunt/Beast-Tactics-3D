
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
