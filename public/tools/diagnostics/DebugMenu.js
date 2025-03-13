/**
 * Debug menu for Beast Tactics
 * Provides real-time control of rendering parameters and game settings
 */
export class DebugMenu {
  /**
   * Creates a new debug menu
   * @param {THREE.Scene} scene - The THREE.js scene
   * @param {THREE.Camera} camera - The main camera
   * @param {THREE.WebGLRenderer} renderer - The renderer
   * @param {Array} hexagons - Array of hex tile objects
   * @param {Object} lights - Object containing light references
   * @param {Object} textures - Object containing loaded textures
   */
  constructor(scene, camera, renderer, hexagons, lights, textures) {
    console.log("[DEBUG] Initializing Debug Menu");
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.hexagons = hexagons;
    this.lights = lights;
    this.textures = textures;

    // Container for tracking changes
    this.changes = {
      material: {},
      lighting: {},
      camera: {},
      grid: {}
    };

    // Default material values
    this.materialDefaults = {
      shininess: 70,
      emissiveIntensity: 0.4,
      specularR: 0.4,
      specularG: 0.4,
      specularB: 0.4
    };

    // Default lighting values
    this.lightingDefaults = {
      ambientIntensity: 0.85,
      ambientColor: '#fffcf0',
      directionalIntensity: 1.2,
      directionalColor: '#fff0d0',
      fillIntensity: 0.5,
      fillColor: '#d0e8ff',
      rimIntensity: 0.3,
      rimColor: '#ffe8d0',
      pointIntensity: 0.7,
      pointColor: '#ffffff'
    };

    // Default grid values
    this.gridDefaults = {
      horizontalSpacing: 1.5,
      verticalFactor: 1.0
    };

    // Create the UI
    this._createUI();

    console.log("[DEBUG] Debug menu initialized");
  }

  /**
   * Create the debug UI panel and all controls
   * @private
   */
  _createUI() {
    console.log("[DEBUG] Creating debug UI with maximize functionality");

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'debug-menu';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '10px';
    this.container.style.left = '10px';
    this.container.style.background = 'rgba(0,0,0,0.8)';
    this.container.style.color = 'white';
    this.container.style.padding = '10px';
    this.container.style.borderRadius = '5px';
    this.container.style.fontFamily = 'monospace';
    this.container.style.zIndex = '1000';
    this.container.style.maxHeight = '40vh';
    this.container.style.width = '300px';
    this.container.style.overflowY = 'auto';
    this.container.style.transition = 'all 0.3s ease';
    
    // Create header container for title and buttons
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.marginBottom = '10px';
    headerContainer.style.borderBottom = '1px solid #444';
    headerContainer.style.paddingBottom = '5px';
    
    // Create header
    const header = document.createElement('h3');
    header.textContent = 'Debug Menu';
    header.style.margin = '0';
    headerContainer.appendChild(header);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    
    // Create maximize/minimize button
    this.maximizeButton = document.createElement('button');
    this.maximizeButton.textContent = '[ + ]';
    this.maximizeButton.style.background = 'none';
    this.maximizeButton.style.border = '1px solid #666';
    this.maximizeButton.style.color = 'white';
    this.maximizeButton.style.padding = '2px 6px';
    this.maximizeButton.style.cursor = 'pointer';
    this.maximizeButton.style.borderRadius = '3px';
    this.maximizeButton.style.marginLeft = '5px';
    
    // Track expanded state
    this.isExpanded = false;
    
    // Add maximize/minimize functionality
    this.maximizeButton.addEventListener('click', () => {
      console.log("[DEBUG] Toggle debug menu expansion");
      if (this.isExpanded) {
        // Minimize
        this.container.style.width = '300px';
        this.container.style.maxHeight = '40vh';
        this.maximizeButton.textContent = '[ + ]';
        this.isExpanded = false;
      } else {
        // Maximize
        this.container.style.width = '80vw';
        this.container.style.maxHeight = '80vh';
        this.maximizeButton.textContent = '[ - ]';
        this.isExpanded = true;
      }
    });
    
    buttonContainer.appendChild(this.maximizeButton);
    headerContainer.appendChild(buttonContainer);
    this.container.appendChild(headerContainer);

    // Create content area for all controls
    this.contentArea = document.createElement('div');
    this.container.appendChild(this.contentArea);
    
    // Add a simple status display
    const status = document.createElement('div');
    status.textContent = 'Debug tools initialized';
    status.style.marginBottom = '10px';
    this.contentArea.appendChild(status);

    // Add to document
    document.body.appendChild(this.container);
    
    console.log("[DEBUG] Debug UI created with maximize functionality");
  }

  /**
   * Set a camera manager instance to control
   * @param {CameraManager} cameraManager - The camera manager instance
   */
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[DEBUG] Camera manager connected to debug menu");
  }

  /**
   * Set a grid generator function to call when grid settings change
   * @param {Function} gridGeneratorFn - Function to call to regenerate grid
   */
  setGridGenerator(gridGeneratorFn) {
    this.gridGeneratorFn = gridGeneratorFn;
    console.log("[DEBUG] Grid generator function connected to debug menu");
  }
}