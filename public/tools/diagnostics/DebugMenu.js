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
      grid: {},
    };

    // Default material values
    this.materialDefaults = {
      shininess: 70,
      emissiveIntensity: 0.4,
      specularR: 0.4,
      specularG: 0.4,
      specularB: 0.4,
    };

    // Default lighting values
    this.lightingDefaults = {
      ambientIntensity: 0.85,
      ambientColor: "#fffcf0",
      directionalIntensity: 1.2,
      directionalColor: "#fff0d0",
      fillIntensity: 0.5,
      fillColor: "#d0e8ff",
      rimIntensity: 0.3,
      rimColor: "#ffe8d0",
      pointIntensity: 0.7,
      pointColor: "#ffffff",
    };

    // Default grid values
    this.gridDefaults = {
      horizontalSpacing: 1.5,
      verticalFactor: 1.0,
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
    this.container = document.createElement("div");
    this.container.id = "debug-menu";
    this.container.style.position = "fixed";
    this.container.style.bottom = "10px";
    this.container.style.left = "10px";
    this.container.style.background = "rgba(0,0,0,0.8)";
    this.container.style.color = "white";
    this.container.style.padding = "10px";
    this.container.style.borderRadius = "5px";
    this.container.style.fontFamily = "monospace";
    this.container.style.zIndex = "1000";
    this.container.style.maxHeight = "40vh";
    this.container.style.width = "300px";
    this.container.style.overflowY = "auto";
    this.container.style.transition = "all 0.3s ease";

    // Create header container for title and buttons
    const headerContainer = document.createElement("div");
    headerContainer.style.display = "flex";
    headerContainer.style.justifyContent = "space-between";
    headerContainer.style.alignItems = "center";
    headerContainer.style.marginBottom = "10px";
    headerContainer.style.borderBottom = "1px solid #444";
    headerContainer.style.paddingBottom = "5px";

    // Create header
    const header = document.createElement("h3");
    header.textContent = "Debug Menu";
    header.style.margin = "0";
    headerContainer.appendChild(header);

    // Create button container
    const buttonContainer = document.createElement("div");

    // Create maximize/minimize button
    this.maximizeButton = document.createElement("button");
    this.maximizeButton.textContent = "[ + ]";
    this.maximizeButton.style.background = "none";
    this.maximizeButton.style.border = "1px solid #666";
    this.maximizeButton.style.color = "white";
    this.maximizeButton.style.padding = "2px 6px";
    this.maximizeButton.style.cursor = "pointer";
    this.maximizeButton.style.borderRadius = "3px";
    this.maximizeButton.style.marginLeft = "5px";

    // Track expanded state
    this.isExpanded = false;

    // Add maximize/minimize functionality
    this.maximizeButton.addEventListener("click", () => {
      console.log("[DEBUG] Toggle debug menu expansion");
      if (this.isExpanded) {
        // Minimize
        this.container.style.width = "300px";
        this.container.style.maxHeight = "40vh";
        this.maximizeButton.textContent = "[ + ]";
        this.isExpanded = false;
      } else {
        // Maximize
        this.container.style.width = "80vw";
        this.container.style.maxHeight = "80vh";
        this.maximizeButton.textContent = "[ - ]";
        this.isExpanded = true;
      }
    });

    buttonContainer.appendChild(this.maximizeButton);
    headerContainer.appendChild(buttonContainer);
    this.container.appendChild(headerContainer);

    // Create content area for all controls
    this.contentArea = document.createElement("div");
    this.container.appendChild(this.contentArea);

    // Add a simple status display
    const status = document.createElement("div");
    status.textContent = "Debug tools initialized";
    status.style.marginBottom = "10px";
    this.contentArea.appendChild(status);

    // Create tabs for different categories
    this._createTabSystem();

    // Create controls for each category
    this._createMaterialControls();
    this._createLightingControls();
    this._createGridControls();
    this._createCameraControls();

    // Add to document
    document.body.appendChild(this.container);

    console.log(
      "[DEBUG] Debug UI created with maximize functionality and control panels",
    );
  }

  /**
   * Create a tab system for organizing different control panels
   * @private
   */
  _createTabSystem() {
    console.log("[DEBUG] Creating tabbed interface for debug controls");

    // Create tab container
    const tabContainer = document.createElement("div");
    tabContainer.style.display = "flex";
    tabContainer.style.marginBottom = "10px";

    // Define tabs
    const tabs = [
      { id: "materials", label: "Materials" },
      { id: "lighting", label: "Lighting" },
      { id: "grid", label: "Grid" },
      { id: "camera", label: "Camera" },
      { id: "arrow", label: "Arrow Debugger" }, // Add Arrow Debugger tab
    ];

    // Create content areas for each tab
    this.tabContents = {};
    tabs.forEach((tab) => {
      const content = document.createElement("div");
      content.id = `tab-${tab.id}`;
      content.style.display = "none"; // Hide initially
      this.contentArea.appendChild(content);
      this.tabContents[tab.id] = content;
    });

    // Create tab buttons
    tabs.forEach((tab, index) => {
      const tabButton = document.createElement("button");
      tabButton.textContent = tab.label;
      tabButton.style.flex = "1";
      tabButton.style.background = index === 0 ? "#444" : "#222";
      tabButton.style.color = "white";
      tabButton.style.border = "1px solid #555";
      tabButton.style.padding = "5px";
      tabButton.style.cursor = "pointer";

      // Tab click handler
      tabButton.addEventListener("click", () => {
        console.log(`[DEBUG] Switching to ${tab.id} tab`);

        // Hide all tab contents
        Object.values(this.tabContents).forEach((content) => {
          content.style.display = "none";
        });

        // Reset all tab button styles
        tabContainer.childNodes.forEach((button) => {
          button.style.background = "#222";
        });

        // Show selected tab content and highlight button
        this.tabContents[tab.id].style.display = "block";
        tabButton.style.background = "#444";
      });

      tabContainer.appendChild(tabButton);
    });

    this.contentArea.appendChild(tabContainer);

    // Show first tab by default
    this.tabContents["materials"].style.display = "block";
  }

  /**
   * Create a slider control with label and value display
   * @private
   * @param {string} id - Control ID
   * @param {string} label - Display label
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} value - Initial value
   * @param {number} step - Step increment
   * @param {Function} onChange - Change handler function
   * @returns {HTMLElement} The container element
   */
  _createSliderControl(id, label, min, max, value, step, onChange) {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";

    // Create label with value display
    const labelElement = document.createElement("label");
    labelElement.textContent = `${label}: `;
    labelElement.htmlFor = id;
    container.appendChild(labelElement);

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = value;
    valueDisplay.style.float = "right";
    labelElement.appendChild(valueDisplay);

    // Create slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.width = "100%";

    // Attach change handler
    slider.addEventListener("input", () => {
      const newValue = parseFloat(slider.value);
      valueDisplay.textContent = newValue;
      onChange(newValue);
    });

    container.appendChild(slider);
    return container;
  }

  /**
   * Create a color picker control with label
   * @private
   * @param {string} id - Control ID
   * @param {string} label - Display label
   * @param {string} value - Initial color (hex)
   * @param {Function} onChange - Change handler function
   * @returns {HTMLElement} The container element
   */
  _createColorControl(id, label, value, onChange) {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";
    container.style.display = "flex";
    container.style.alignItems = "center";

    // Create label
    const labelElement = document.createElement("label");
    labelElement.textContent = `${label}: `;
    labelElement.htmlFor = id;
    labelElement.style.flex = "1";
    container.appendChild(labelElement);

    // Create color picker
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.id = id;
    colorPicker.value = value;

    // Attach change handler
    colorPicker.addEventListener("input", () => {
      onChange(colorPicker.value);
    });

    container.appendChild(colorPicker);
    return container;
  }

  /**
   * Create material control panel
   * @private
   */
  _createMaterialControls() {
    console.log("[DEBUG] Creating material controls");
    const container = this.tabContents["materials"];

    // Create control for shininess
    container.appendChild(
      this._createSliderControl(
        "material-shininess",
        "Shininess",
        0,
        200,
        this.materialDefaults.shininess,
        1,
        (value) => {
          console.log(`[DEBUG] Setting material shininess to ${value}`);
          this.changes.material.shininess = value;
          this._updateMaterials();
        },
      ),
    );

    // Create control for emissive intensity
    container.appendChild(
      this._createSliderControl(
        "material-emissive",
        "Emissive Intensity",
        0,
        1,
        this.materialDefaults.emissiveIntensity,
        0.05,
        (value) => {
          console.log(`[DEBUG] Setting emissive intensity to ${value}`);
          this.changes.material.emissiveIntensity = value;
          this._updateMaterials();
        },
      ),
    );

    // Add reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Materials";
    resetButton.style.width = "100%";
    resetButton.style.padding = "5px";
    resetButton.style.marginTop = "10px";
    resetButton.addEventListener("click", () => {
      console.log("[DEBUG] Resetting material controls to defaults");
      this.changes.material = {};
      this._updateMaterials();

      // Reset UI controls
      document.getElementById("material-shininess").value =
        this.materialDefaults.shininess;
      document.getElementById("material-emissive").value =
        this.materialDefaults.emissiveIntensity;
    });
    container.appendChild(resetButton);
  }

  /**
   * Create lighting control panel
   * @private
   */
  _createLightingControls() {
    console.log("[DEBUG] Creating lighting controls");
    const container = this.tabContents["lighting"];

    // Ambient light controls
    const ambientHeader = document.createElement("h4");
    ambientHeader.textContent = "Ambient Light";
    ambientHeader.style.marginBottom = "5px";
    container.appendChild(ambientHeader);

    container.appendChild(
      this._createSliderControl(
        "ambient-intensity",
        "Intensity",
        0,
        2,
        this.lightingDefaults.ambientIntensity,
        0.05,
        (value) => {
          console.log(`[DEBUG] Setting ambient light intensity to ${value}`);
          this.changes.lighting.ambientIntensity = value;
          this._updateLighting();
        },
      ),
    );

    container.appendChild(
      this._createColorControl(
        "ambient-color",
        "Color",
        this.lightingDefaults.ambientColor,
        (value) => {
          console.log(`[DEBUG] Setting ambient light color to ${value}`);
          this.changes.lighting.ambientColor = value;
          this._updateLighting();
        },
      ),
    );

    // Directional light controls
    const directionalHeader = document.createElement("h4");
    directionalHeader.textContent = "Directional Light";
    directionalHeader.style.marginBottom = "5px";
    directionalHeader.style.marginTop = "15px";
    container.appendChild(directionalHeader);

    container.appendChild(
      this._createSliderControl(
        "directional-intensity",
        "Intensity",
        0,
        2,
        this.lightingDefaults.directionalIntensity,
        0.05,
        (value) => {
          console.log(
            `[DEBUG] Setting directional light intensity to ${value}`,
          );
          this.changes.lighting.directionalIntensity = value;
          this._updateLighting();
        },
      ),
    );

    // Add reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Lighting";
    resetButton.style.width = "100%";
    resetButton.style.padding = "5px";
    resetButton.style.marginTop = "15px";
    resetButton.addEventListener("click", () => {
      console.log("[DEBUG] Resetting lighting controls to defaults");
      this.changes.lighting = {};
      this._updateLighting();

      // Reset UI controls
      document.getElementById("ambient-intensity").value =
        this.lightingDefaults.ambientIntensity;
      document.getElementById("ambient-color").value =
        this.lightingDefaults.ambientColor;
      document.getElementById("directional-intensity").value =
        this.lightingDefaults.directionalIntensity;
    });
    container.appendChild(resetButton);
  }

  /**
   * Create grid control panel
   * @private
   */
  _createGridControls() {
    console.log("[DEBUG] Creating grid controls");
    const container = this.tabContents["grid"];

    // Create control for horizontal spacing
    container.appendChild(
      this._createSliderControl(
        "grid-horizontal",
        "Horizontal Spacing",
        1,
        3,
        this.gridDefaults.horizontalSpacing,
        0.1,
        (value) => {
          console.log(`[DEBUG] Setting grid horizontal spacing to ${value}`);
          this.changes.grid.horizontalSpacing = value;
        },
      ),
    );

    // Create control for vertical factor
    container.appendChild(
      this._createSliderControl(
        "grid-vertical",
        "Vertical Factor",
        0.5,
        1.5,
        this.gridDefaults.verticalFactor,
        0.05,
        (value) => {
          console.log(`[DEBUG] Setting grid vertical factor to ${value}`);
          this.changes.grid.verticalFactor = value;
        },
      ),
    );

    // Add regenerate button
    const regenerateButton = document.createElement("button");
    regenerateButton.textContent = "Regenerate Grid";
    regenerateButton.style.width = "100%";
    regenerateButton.style.padding = "5px";
    regenerateButton.style.marginTop = "10px";
    regenerateButton.addEventListener("click", () => {
      if (this.gridGeneratorFn) {
        console.log(
          "[DEBUG] Regenerating grid with new settings",
          this.changes.grid,
        );
        const horizontalSpacing =
          this.changes.grid.horizontalSpacing ||
          this.gridDefaults.horizontalSpacing;
        const verticalFactor =
          this.changes.grid.verticalFactor || this.gridDefaults.verticalFactor;

        this.gridGeneratorFn(horizontalSpacing, verticalFactor);
      } else {
        console.warn("[DEBUG] Grid generator function not set");
      }
    });
    container.appendChild(regenerateButton);

    // Add reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Grid Settings";
    resetButton.style.width = "100%";
    resetButton.style.padding = "5px";
    resetButton.style.marginTop = "10px";
    resetButton.addEventListener("click", () => {
      console.log("[DEBUG] Resetting grid controls to defaults");
      this.changes.grid = {};

      // Reset UI controls
      document.getElementById("grid-horizontal").value =
        this.gridDefaults.horizontalSpacing;
      document.getElementById("grid-vertical").value =
        this.gridDefaults.verticalFactor;
    });
    container.appendChild(resetButton);
  }

  /**
   * Create camera control panel
   * @private
   */
  _createCameraControls() {
    console.log("[DEBUG] Creating camera controls");
    const container = this.tabContents["camera"];

    // Add reset camera button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Camera Position";
    resetButton.style.width = "100%";
    resetButton.style.padding = "5px";
    resetButton.style.marginTop = "10px";
    resetButton.addEventListener("click", () => {
      if (this.cameraManager) {
        console.log("[DEBUG] Resetting camera position");
        this.cameraManager.resetPosition();
      } else {
        console.warn("[DEBUG] Camera manager not set");
      }
    });
    container.appendChild(resetButton);

    // Add camera info display
    const cameraInfo = document.createElement("div");
    cameraInfo.style.marginTop = "15px";
    cameraInfo.style.padding = "10px";
    cameraInfo.style.backgroundColor = "#222";
    cameraInfo.style.borderRadius = "3px";
    container.appendChild(cameraInfo);

    // Update camera info every frame
    const updateCameraInfo = () => {
      if (this.camera) {
        cameraInfo.innerHTML = `
          <div>Position X: ${this.camera.position.x.toFixed(2)}</div>
          <div>Position Y: ${this.camera.position.y.toFixed(2)}</div>
          <div>Position Z: ${this.camera.position.z.toFixed(2)}</div>
          <div>Rotation X: ${this.camera.rotation.x.toFixed(2)}</div>
          <div>Rotation Y: ${this.camera.rotation.y.toFixed(2)}</div>
          <div>Rotation Z: ${this.camera.rotation.z.toFixed(2)}</div>
        `;
      }
      requestAnimationFrame(updateCameraInfo);
    };
    updateCameraInfo();
  }

  /**
   * Apply changes to all material properties
   * @private
   */
  _updateMaterials() {
    console.log("[DEBUG] Updating material properties", this.changes.material);

    // For each hexagon, update material properties
    this.hexagons.forEach((hex) => {
      // Update top and bottom faces (indices 1 and 2)
      [1, 2].forEach((index) => {
        if (hex.material && hex.material[index]) {
          // Update shininess if changed
          if (this.changes.material.shininess !== undefined) {
            hex.material[index].shininess = this.changes.material.shininess;
          }

          // Update emissive intensity if changed
          if (this.changes.material.emissiveIntensity !== undefined) {
            hex.material[index].emissiveIntensity =
              this.changes.material.emissiveIntensity;
          }
        }
      });
    });

    console.log("[DEBUG] Material properties updated");
  }

  /**
   * Apply changes to lighting
   * @private
   */
  _updateLighting() {
    console.log("[DEBUG] Updating lighting properties", this.changes.lighting);

    // Update ambient light
    if (this.lights.ambient) {
      // Update intensity if changed
      if (this.changes.lighting.ambientIntensity !== undefined) {
        this.lights.ambient.intensity = this.changes.lighting.ambientIntensity;
      }

      // Update color if changed
      if (this.changes.lighting.ambientColor !== undefined) {
        this.lights.ambient.color.set(this.changes.lighting.ambientColor);
      }
    }

    // Update directional light
    if (this.lights.directional) {
      // Update intensity if changed
      if (this.changes.lighting.directionalIntensity !== undefined) {
        this.lights.directional.intensity =
          this.changes.lighting.directionalIntensity;
      }

      // Update color if changed
      if (this.changes.lighting.directionalColor !== undefined) {
        this.lights.directional.color.set(
          this.changes.lighting.directionalColor,
        );
      }
    }

    console.log("[DEBUG] Lighting properties updated");
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

  /**
   * Create a panel for the debug menu
   * @param {string} id - Panel ID
   * @param {string} label - Panel label
   * @param {Function} contentCallback - Function to generate panel content
   * @returns {HTMLElement} The created panel
   * @private
   */
  _createPanel(id, label, contentCallback) {
    const panel = document.createElement('div');
    panel.className = 'debug-panel';
    panel.id = `panel-${id}`;
    panel.style.display = 'none';

    // Create panel header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.textContent = label;
    panel.appendChild(header);

    // Create panel content
    const content = document.createElement('div');
    content.className = 'panel-content';
    contentCallback(content);
    panel.appendChild(content);

    // Add Save Settings button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Current Settings';
    saveButton.className = 'debug-save-button';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.padding = '8px 12px';
    saveButton.style.margin = '10px 0';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.width = '100%';
    saveButton.style.fontWeight = 'bold';

    saveButton.addEventListener('click', () => {
      this._saveCurrentSettings();
    });

    panel.appendChild(saveButton);

    return panel;
  }

    _saveCurrentSettings() {
        //Implementation to save settings to local storage or server.
        console.log("[DEBUG] Saving current settings.  Implementation needed.");
    }

}