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
    // Basic UI stub - to be expanded
    console.log("[DEBUG] Creating debug UI");

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

    // Create a simple header
    const header = document.createElement('h3');
    header.textContent = 'Debug Menu';
    this.container.appendChild(header);

    // Add a simple status display
    const status = document.createElement('div');
    status.textContent = 'Debug tools initialized';
    this.container.appendChild(status);

    // Add to document
    document.body.appendChild(this.container);
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