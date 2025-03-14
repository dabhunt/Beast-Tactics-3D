
/**
 * DebugMenu.js - Unified debugging system for Beast Tactics
 * 
 * Centralizes all debugging tools to avoid duplicate declarations and conflicts
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug namespace to avoid global pollution
const BeastTactics = window.BeastTactics || {};
window.BeastTactics = BeastTactics;

// Create debug namespace if it doesn't exist
BeastTactics.debug = BeastTactics.debug || {};

/**
 * Main Debug Menu class for coordinating all debugging tools
 */
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
      arrow: null,
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
   * Set up arrow debugger for beast directional indicators
   * @param {Beast} beast - The beast instance to debug
   */
  initArrowDebugger(beast) {
    console.log("[DEBUG-MENU] Initializing arrow debugger for beast");
    
    // Create arrow debugger if it doesn't exist
    if (!this.tools.arrow) {
      console.log("[DEBUG-MENU] Creating new arrow debugger instance");
      this.tools.arrow = new ArrowDebugger(this);
    }
    
    // Set the beast reference
    this.tools.arrow.setBeast(beast);
    
    // Update beasts array
    if (beast && !this.gameObjects.beasts.includes(beast)) {
      this.gameObjects.beasts.push(beast);
    }
  }
  
  /**
   * Initialize GIF debugging tools
   */
  initGIFDebugger() {
    console.log("[DEBUG-MENU] Initializing GIF debugger");
    
    // Create GIF debugger if it doesn't exist
    if (!this.tools.gif) {
      console.log("[DEBUG-MENU] Creating new GIF debugger instance");
      this.tools.gif = new GIFDebugger(this);
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

/**
 * ArrowDebugger class for debugging beast directional arrows
 */
export class ArrowDebugger {
  constructor(debugMenu) {
    console.log("[ARROW-DEBUG] Initializing arrow debugger tool");
    
    this.debugMenu = debugMenu;
    this.beast = null;
    this.selectedArrowId = null;
    
    // Create UI section
    this._createUI();
    
    console.log("[ARROW-DEBUG] Arrow debugger initialized with default settings");
  }
  
  /**
   * Create arrow debugger UI
   * @private
   */
  _createUI() {
    console.log("[ARROW-DEBUG] Creating arrow debug panel");
    
    // Create a section in the debug menu
    this.section = this.debugMenu.createSection('Direction Arrows');
    
    // Create UI container for arrows
    this.arrowsContainer = document.createElement('div');
    this.arrowsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3px;
      margin-top: 5px;
    `;
    this.section.appendChild(this.arrowsContainer);
    
    // Create message display
    this.messageDisplay = document.createElement('div');
    this.messageDisplay.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      color: #aaa;
    `;
    this.messageDisplay.textContent = 'No beast connected. Use `window.gameDebugMenu.initArrowDebugger(beast)` to connect';
    this.section.appendChild(this.messageDisplay);
    
    // Add toggle visibility button
    const toggleButton = this.debugMenu.createButton('Toggle Arrows', () => {
      if (this.beast && this.beast.toggleDebugVisualization) {
        this.arrowsVisible = !this.arrowsVisible;
        this.beast.toggleDebugVisualization(this.arrowsVisible);
        toggleButton.textContent = this.arrowsVisible ? 'Hide Arrows' : 'Show Arrows';
      }
    }, '#2ecc71');
    this.section.appendChild(toggleButton);
    
    // Track visibility state
    this.arrowsVisible = true;
    
    console.log("[ARROW-DEBUG] Arrow debug panel ready");
  }
  
  /**
   * Set the beast to debug
   * @param {Beast} beast - The beast instance
   */
  setBeast(beast) {
    console.log("[ARROW-DEBUG] Checking for existing beast to connect to");
    
    // Skip if no change
    if (this.beast === beast) return;
    
    this.beast = beast;
    
    // Clear existing arrow buttons
    this.arrowsContainer.innerHTML = '';
    
    if (!beast) {
      this.messageDisplay.textContent = 'No beast connected';
      return;
    }
    
    // Get arrow information from beast
    const arrows = beast.directionalArrows || [];
    
    if (arrows.length === 0) {
      this.messageDisplay.textContent = 'Beast has no directional arrows';
      return;
    }
    
    // Create debug buttons for each arrow
    arrows.forEach(arrow => {
      const button = this.debugMenu.createButton(arrow.directionId.toString(), () => {
        this.highlightArrow(arrow.directionId);
      }, '#f39c12');
      
      this.arrowsContainer.appendChild(button);
    });
    
    this.messageDisplay.textContent = `Connected to ${beast.type} Beast with ${arrows.length} arrows`;
    
    // Make debug visualization visible by default
    if (beast.toggleDebugVisualization) {
      beast.toggleDebugVisualization(true);
    }
  }
  
  /**
   * Highlight a specific arrow by ID
   * @param {number} arrowId - The ID of the arrow to highlight
   */
  highlightArrow(arrowId) {
    if (!this.beast || !this.beast.directionalArrows) return;
    
    // Reset any previously highlighted arrow
    if (this.selectedArrowId) {
      const oldArrow = this.beast.directionalArrows.find(a => a.directionId === this.selectedArrowId);
      if (oldArrow && oldArrow.mesh && oldArrow.mesh.material) {
        oldArrow.mesh.material.emissive.setHex(0x996600);
      }
    }
    
    // Find and highlight the new arrow
    const arrow = this.beast.directionalArrows.find(a => a.directionId === arrowId);
    if (arrow && arrow.mesh && arrow.mesh.material) {
      // Highlight by changing emissive color
      arrow.mesh.material.emissive.setHex(0xff0000);
      this.selectedArrowId = arrowId;
      
      // Log arrow details
      console.log(`[ARROW-DEBUG] Arrow ${arrowId} selected:`, {
        direction: arrow.direction,
        coordinates: arrow.coordinates,
        position: arrow.targetPosition
      });
      
      this.messageDisplay.textContent = `Selected: Arrow ${arrowId} (${arrow.direction})`;
    }
  }
}

/**
 * GIF Debugger for tracking and debugging animated GIFs
 */
export /**
 * GIFDebugger class for debugging animated GIF textures
 */
class GIFDebuggerComponent {
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
    this.section.appendChild(toggleButton);
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
  window.gameDebugMenu = new DebugMenu();
  console.log("[DEBUG] Debug menu initialized successfully");
}

// Export debugger classes and the global instance
export { ArrowDebugger, GIFDebugger };
export default window.gameDebugMenu;
