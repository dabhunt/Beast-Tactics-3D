
/**
 * AnimationDebugger.js - Tool for diagnosing and fixing animation issues
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Helper class to debug GIF animation issues
export class AnimationDebugger {
  constructor() {
    console.log("[ANIM-DEBUG] Initializing Animation Debugger");
    
    this.active = false;
    this.animatedTextures = [];
    this.lastFrameUpdate = Date.now();
    this.frameCounter = 0;
    this.debugElement = null;
    
    // Create debug UI
    this._createDebugUI();
  }
  
  /**
   * Create debug UI for animation testing
   * @private
   */
  _createDebugUI() {
    // Create debug panel
    this.debugElement = document.createElement('div');
    this.debugElement.id = 'animation-debug-panel';
    this.debugElement.style.position = 'fixed';
    this.debugElement.style.left = '10px';
    this.debugElement.style.top = '10px';
    this.debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    this.debugElement.style.color = 'white';
    this.debugElement.style.padding = '10px';
    this.debugElement.style.borderRadius = '5px';
    this.debugElement.style.fontFamily = 'monospace';
    this.debugElement.style.zIndex = '1000';
    this.debugElement.style.maxHeight = '300px';
    this.debugElement.style.overflowY = 'auto';
    this.debugElement.style.display = 'none';
    
    // Add debug content
    this.debugElement.innerHTML = `
      <h3>Animation Debugger</h3>
      <div id="anim-stats">Tracking 0 animated textures</div>
      <div id="anim-frame-info">Last frame update: N/A</div>
      <div id="anim-controls">
        <button id="anim-toggle">Enable Animation</button>
        <button id="anim-force-update">Force Frame Update</button>
        <button id="anim-toggle-debug">Toggle Debug Display</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(this.debugElement);
    
    // Set up button handlers
    document.getElementById('anim-toggle').addEventListener('click', () => {
      this.active = !this.active;
      document.getElementById('anim-toggle').textContent = 
        this.active ? 'Disable Animation' : 'Enable Animation';
      console.log(`[ANIM-DEBUG] Animation ${this.active ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('anim-force-update').addEventListener('click', () => {
      this._forceFrameUpdate();
    });
    
    document.getElementById('anim-toggle-debug').addEventListener('click', () => {
      this.debugElement.style.display = 
        this.debugElement.style.display === 'none' ? 'block' : 'none';
    });
    
    console.log("[ANIM-DEBUG] Debug UI created");
  }
  
  /**
   * Register an animated texture to be monitored
   * @param {THREE.Texture} texture - The animated texture to track
   * @param {string} name - Name identifier for the texture
   */
  registerTexture(texture, name) {
    console.log(`[ANIM-DEBUG] Registering animated texture: ${name}`);
    
    // Store texture with metadata
    this.animatedTextures.push({
      texture: texture,
      name: name,
      lastFrameTime: Date.now(),
      frameCount: 0,
      isUpdating: false
    });
    
    // Update the debug display
    this._updateDebugInfo();
    
    return this.animatedTextures.length - 1; // Return index for reference
  }
  
  /**
   * Force a frame update on all tracked textures
   * @private
   */
  _forceFrameUpdate() {
    console.log(`[ANIM-DEBUG] Forcing frame update on ${this.animatedTextures.length} textures`);
    
    this.animatedTextures.forEach(item => {
      // Check if texture has update method
      if (item.texture && typeof item.texture.update === 'function') {
        try {
          item.texture.update();
          item.frameCount++;
          item.lastFrameTime = Date.now();
          item.isUpdating = true;
          console.log(`[ANIM-DEBUG] Forced update on texture: ${item.name}`);
        } catch (err) {
          console.error(`[ANIM-DEBUG] Error updating texture ${item.name}:`, err);
        }
      } else {
        console.warn(`[ANIM-DEBUG] Texture ${item.name} has no update method`);
      }
    });
    
    this._updateDebugInfo();
  }
  
  /**
   * Update debug information display
   * @private
   */
  _updateDebugInfo() {
    const statsElement = document.getElementById('anim-stats');
    const frameElement = document.getElementById('anim-frame-info');
    
    if (statsElement) {
      statsElement.textContent = `Tracking ${this.animatedTextures.length} animated textures`;
      
      // Add texture details if any exist
      if (this.animatedTextures.length > 0) {
        let details = '<ul>';
        this.animatedTextures.forEach((item, index) => {
          details += `<li>${item.name}: ${item.frameCount} frames, last update ${Date.now() - item.lastFrameTime}ms ago</li>`;
        });
        details += '</ul>';
        statsElement.innerHTML += details;
      }
    }
    
    if (frameElement) {
      frameElement.textContent = `Last frame check: ${Date.now() - this.lastFrameUpdate}ms ago`;
    }
  }
  
  /**
   * Update animation - should be called in render loop
   */
  update() {
    // Only process if active
    if (!this.active) return;
    
    // Update frame counter
    this.frameCounter++;
    
    // Only update debug info every 30 frames to avoid performance impact
    if (this.frameCounter % 30 === 0) {
      this._updateDebugInfo();
    }
    
    // Check if any textures need updating (every frame)
    this.animatedTextures.forEach(item => {
      if (item.texture && typeof item.texture.update === 'function') {
        try {
          // Update the texture
          item.texture.update();
          
          // Update metadata
          item.frameCount++;
          item.lastFrameTime = Date.now();
          item.isUpdating = true;
        } catch (err) {
          console.warn(`[ANIM-DEBUG] Error updating texture ${item.name}:`, err);
          item.isUpdating = false;
        }
      }
    });
    
    this.lastFrameUpdate = Date.now();
  }
}
