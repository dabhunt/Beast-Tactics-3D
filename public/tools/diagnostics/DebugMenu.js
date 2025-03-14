/**
 * DebugMenu.js - Unified debug menu for Beast Tactics
 * 
 * This system provides a visual debug interface that can be toggled on/off
 * during development and testing.
 */

// Only export one version of the class
export class DebugMenu {
  constructor() {
    console.log("[DEBUG-MENU] Initializing unified debug menu");

    // Track initialization state
    this.initialized = false;

    // Store references to game objects
    this.gameObjects = {
      camera: null,
      scene: null,
      beasts: []
    };

    // Create menu UI
    this._createUI();

    // Initialize tools only when created (lazy loading)
    this.tools = {
      gif: null,
      performance: null
    };

    // Mark as initialized
    this.initialized = true;
    console.log("[DEBUG-MENU] Debug menu initialized successfully");
  }

  /**
   * Create the debug menu UI
   * @private
   */
  _createUI() {
    console.log("[DEBUG-MENU] Creating UI elements");

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'debug-menu';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 1000;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 200px;
    `;

    // Create header
    const header = document.createElement('div');
    header.textContent = 'BEAST TACTICS DEBUG';
    header.style.cssText = `
      font-weight: bold;
      text-align: center;
      padding-bottom: 5px;
      border-bottom: 1px solid #555;
    `;
    this.container.appendChild(header);

    // Create sections container
    this.sectionsContainer = document.createElement('div');
    this.container.appendChild(this.sectionsContainer);

    // Add toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.textContent = 'Hide Debug Menu';
    this.toggleButton.style.cssText = `
      background: #444;
      border: none;
      color: white;
      padding: 5px;
      margin-top: 5px;
      cursor: pointer;
      border-radius: 3px;
    `;

    this.toggleButton.addEventListener('click', () => {
      if (this.sectionsContainer.style.display === 'none') {
        this.sectionsContainer.style.display = 'block';
        this.toggleButton.textContent = 'Hide Debug Menu';
      } else {
        this.sectionsContainer.style.display = 'none';
        this.toggleButton.textContent = 'Show Debug Menu';
      }
    });

    this.container.appendChild(this.toggleButton);

    // Add to document
    document.body.appendChild(this.container);

    console.log("[DEBUG-MENU] UI elements created");
  }

  /**
   * Create a new section in the debug menu
   * @param {string} title - Section title
   * @returns {HTMLElement} The section container element
   */
  createSection(title) {
    console.log(`[DEBUG-MENU] Creating section: ${title}`);

    const section = document.createElement('div');
    section.className = 'debug-section';
    section.style.cssText = `
      margin-top: 5px;
      padding: 5px;
      background: rgba(80, 80, 80, 0.3);
      border-radius: 3px;
    `;

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 5px;
      color: #aaddff;
    `;
    section.appendChild(sectionTitle);

    const sectionContent = document.createElement('div');
    sectionContent.className = 'section-content';
    section.appendChild(sectionContent);

    this.sectionsContainer.appendChild(section);

    return sectionContent;
  }

  /**
   * Create a button with specified label and click handler
   * @param {string} label - Button text
   * @param {Function} onClick - Click handler
   * @param {string} [color='#444'] - Button background color
   * @returns {HTMLButtonElement} The created button
   */
  createButton(label, onClick, color = '#444') {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = `
      background: ${color};
      border: none;
      color: white;
      padding: 5px;
      margin: 2px;
      cursor: pointer;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    `;

    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * Set the camera manager reference
   * @param {CameraManager} cameraManager - The camera manager instance
   */
  setCameraManager(cameraManager) {
    console.log("[DEBUG-MENU] Setting camera manager reference");
    this.gameObjects.camera = cameraManager;

    // Initialize camera debugging if needed
    this._initializeCameraDebugger();
  }

  /**
   * Initialize camera debugging tools
   * @private
   */
  _initializeCameraDebugger() {
    if (!this.gameObjects.camera) return;

    console.log("[DEBUG-MENU] Initializing camera debugger");

    const cameraSection = this.createSection('Camera');

    // Reset camera button
    const resetButton = this.createButton('Reset Camera', () => {
      this.gameObjects.camera.resetCamera();
    }, '#3498db');
    cameraSection.appendChild(resetButton);

    // Toggle constraints button
    const constraintsButton = this.createButton('Toggle Strict Constraints', () => {
      const constraints = this.gameObjects.camera.settings.constraints;
      const isStrict = constraints.maxPolarAngle < Math.PI * 0.4;

      if (isStrict) {
        // Make constraints more relaxed
        this.gameObjects.camera.updateConstraints({
          maxPolarAngle: Math.PI * 0.6
        });
        constraintsButton.textContent = 'Enable Strict Constraints';
      } else {
        // Make constraints more strict
        this.gameObjects.camera.updateConstraints({
          maxPolarAngle: Math.PI * 0.35
        });
        constraintsButton.textContent = 'Disable Strict Constraints';
      }
    }, '#9b59b6');
    cameraSection.appendChild(constraintsButton);
  }

  /**
   * Initialize GIF debugging tools
   */
  initGIFDebugger() {
    console.log("[DEBUG-MENU] Initializing GIF debugger");

    // Create GIF debugger if it doesn't exist
    if (!this.tools.gif) {
      console.log("[DEBUG-MENU] Creating new GIF debugger instance");
      // We'll import GIFDebugger on demand instead of initializing it here
    }

    return this.tools.gif;
  }

  /**
   * Toggle visibility of the debug menu
   * @param {boolean} visible - Whether the menu should be visible
   */
  toggleVisibility(visible) {
    if (visible === undefined) {
      // Toggle current state
      this.container.style.display = 
        this.container.style.display === 'none' ? 'flex' : 'none';
    } else {
      // Set to specified state
      this.container.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * Log debug messages to console and optionally to UI
   * @param {string} source - Source of the message
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to log
   */
  logDebug(source, message, data = null) {
    const sourceTag = `[${source.toUpperCase()}]`;
    if (data) {
      console.log(`${sourceTag} ${message}`, data);
    } else {
      console.log(`${sourceTag} ${message}`);
    }

    // TODO: Add UI logging if needed
  }
}

// Export an instance for direct use
export const debugMenu = new DebugMenu();

/**
 * GIFDebugger class for debugging animated GIF textures
 */
export class GIFDebuggerComponent {
  constructor(debugMenu) {
    console.log("[GIF-DEBUG] Initializing GIF debugger");
    
    this.debugMenu = debugMenu;
    this.animatedTextures = [];
    
    // Create UI
    this._createUI();
    
    // Add to global scope for console access
    window.gifDebugger = this;
    
    console.log("[GIF-DEBUG] GIF debugger initialized and available as window.gifDebugger");
  }
  
  /**
   * Create GIF debugger UI
   * @private
   */
  _createUI() {
    // Create a section in the debug menu
    this.section = this.debugMenu.createSection('GIF Animations');
    
    // Create UI for animated textures
    this.textureList = document.createElement('div');
    this.section.appendChild(this.textureList);
    
    // Update message
    this.messageDisplay = document.createElement('div');
    this.messageDisplay.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      color: #aaa;
    `;
    this.messageDisplay.textContent = 'No GIF animations registered';
    this.section.appendChild(this.messageDisplay);
    
    // Add refresh button
    const refreshButton = this.debugMenu.createButton('Refresh List', () => {
      this._updateTextureList();
    }, '#3498db');
    this.section.appendChild(refreshButton);
    
    // Add toggle all button
    const toggleAllButton = this.debugMenu.createButton('Toggle All', () => {
      this.animatedTextures.forEach(texture => {
        texture.isPlaying = !texture.isPlaying;
      });
      this._updateTextureList();
    }, '#e74c3c');
    this.section.appendChild(toggleAllButton);
  }
  
  /**
   * Register an animated texture for debugging
   * @param {THREE.Texture} texture - The animated texture
   * @param {string} name - A name for the texture
   * @returns {number} The index of the registered texture
   */
  registerTexture(texture, name) {
    const textureInfo = {
      texture,
      name,
      isPlaying: true,
      frames: texture.frames || 0,
      currentFrame: texture.frameIndex || 0
    };
    
    this.animatedTextures.push(textureInfo);
    this._updateTextureList();
    
    return this.animatedTextures.length - 1;
  }
  
  /**
   * Update the texture list in the UI
   * @private
   */
  _updateTextureList() {
    this.textureList.innerHTML = '';
    
    if (this.animatedTextures.length === 0) {
      this.messageDisplay.textContent = 'No GIF animations registered';
      return;
    }
    
    this.messageDisplay.textContent = `${this.animatedTextures.length} GIF animations registered`;
    
    // Create list of textures
    this.animatedTextures.forEach((textureInfo, index) => {
      const textureItem = document.createElement('div');
      textureItem.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px;
        border-bottom: 1px solid #444;
      `;
      
      // Texture name and status
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${textureInfo.name} (${textureInfo.isPlaying ? 'Playing' : 'Paused'})`;
      textureItem.appendChild(nameSpan);
      
      // Toggle button
      const toggleButton = this.debugMenu.createButton(
        textureInfo.isPlaying ? '❚❚' : '▶', 
        () => {
          textureInfo.isPlaying = !textureInfo.isPlaying;
          this._updateTextureList();
        },
        textureInfo.isPlaying ? '#e74c3c' : '#2ecc71'
      );
      toggleButton.style.width = '30px';
      textureItem.appendChild(toggleButton);
      
      this.textureList.appendChild(textureItem);
    });
  }
  
  /**
   * Log animation activity for debugging
   */
  logAnimationActivity() {
    console.log("[ANIM-DEBUG] Animation cycle check - active:", this.animatedTextures.some(t => t.isPlaying), "textures:", this.animatedTextures.length);
  }
}

// Create the global instance
if (!window.gameDebugMenu) {
  console.log("[DEBUG] Initializing global debug menu");
  window.gameDebugMenu = debugMenu;
  console.log("[DEBUG] Debug menu initialized successfully");
}

//Export GIFDebuggerComponent
export { GIFDebuggerComponent };