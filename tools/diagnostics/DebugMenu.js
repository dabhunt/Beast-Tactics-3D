
/**
 * DebugMenu.js - Comprehensive debug UI for Beast Tactics
 * 
 * Provides a unified interface for real-time adjustment of:
 * - Material properties
 * - Lighting settings
 * - Camera parameters
 * - Hex grid spacing
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

export class DebugMenu {
  constructor(scene, camera, renderer, hexagons, lights, textures) {
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
    
    console.log("[DEBUG] Debug menu initialized with controls for materials, lighting, and camera");
  }
  
  /**
   * Create the debug UI panel and all controls
   */
  _createUI() {
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
    this.container.style.maxHeight = '80vh';
    this.container.style.overflowY = 'auto';
    this.container.style.width = '300px';
    this.container.style.maxWidth = '90vw';
    this.container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    // Create header with toggle button
    this.header = document.createElement('div');
    this.header.style.display = 'flex';
    this.header.style.justifyContent = 'space-between';
    this.header.style.alignItems = 'center';
    this.header.style.marginBottom = '10px';
    this.header.style.borderBottom = '1px solid #666';
    this.header.style.paddingBottom = '5px';
    
    const title = document.createElement('h3');
    title.textContent = 'Beast Tactics Debug Menu';
    title.style.margin = '0';
    
    this.toggleButton = document.createElement('button');
    this.toggleButton.textContent = 'Minimize';
    this.toggleButton.style.backgroundColor = '#444';
    this.toggleButton.style.color = 'white';
    this.toggleButton.style.border = 'none';
    this.toggleButton.style.padding = '5px 10px';
    this.toggleButton.style.borderRadius = '3px';
    this.toggleButton.style.cursor = 'pointer';
    
    this.content = document.createElement('div');
    this.content.style.transition = 'height 0.3s ease';
    
    this.header.appendChild(title);
    this.header.appendChild(this.toggleButton);
    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    
    // Toggle button functionality
    this.toggleButton.addEventListener('click', () => {
      if (this.content.style.display === 'none') {
        this.content.style.display = 'block';
        this.toggleButton.textContent = 'Minimize';
      } else {
        this.content.style.display = 'none';
        this.toggleButton.textContent = 'Expand';
      }
    });
    
    // Create tabs
    this._createTabContainer();
    
    // Add all control sections
    this._createMaterialControls();
    this._createLightingControls();
    this._createCameraControls();
    this._createGridControls();
    
    // Add preset and save controls
    this._createPresetControls();
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Set initial tab
    this.showTab('materials');
    
    console.log("[DEBUG] Debug menu UI created and attached to DOM");
  }
  
  /**
   * Create tab container and tab buttons
   */
  _createTabContainer() {
    const tabContainer = document.createElement('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.marginBottom = '10px';
    tabContainer.style.borderBottom = '1px solid #666';
    
    // Define tabs
    const tabs = [
      { id: 'materials', label: 'Materials' },
      { id: 'lighting', label: 'Lighting' },
      { id: 'camera', label: 'Camera' },
      { id: 'grid', label: 'Grid' }
    ];
    
    // Create tab buttons
    this.tabButtons = {};
    this.tabPanels = {};
    
    tabs.forEach(tab => {
      // Create button
      const button = document.createElement('button');
      button.textContent = tab.label;
      button.dataset.tabId = tab.id;
      button.style.flex = '1';
      button.style.backgroundColor = '#333';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.padding = '5px';
      button.style.margin = '0 2px';
      button.style.cursor = 'pointer';
      
      // Add click event
      button.addEventListener('click', () => this.showTab(tab.id));
      
      // Store button reference
      this.tabButtons[tab.id] = button;
      tabContainer.appendChild(button);
      
      // Create content panel
      const panel = document.createElement('div');
      panel.id = `tab-panel-${tab.id}`;
      panel.style.display = 'none';
      this.tabPanels[tab.id] = panel;
      this.content.appendChild(panel);
    });
    
    this.content.insertBefore(tabContainer, this.content.firstChild);
  }
  
  /**
   * Show the selected tab panel
   * @param {string} tabId - The ID of the tab to show
   */
  showTab(tabId) {
    // Hide all panels
    Object.values(this.tabPanels).forEach(panel => {
      panel.style.display = 'none';
    });
    
    // Reset all tab buttons
    Object.values(this.tabButtons).forEach(button => {
      button.style.backgroundColor = '#333';
    });
    
    // Show selected panel
    this.tabPanels[tabId].style.display = 'block';
    
    // Highlight selected tab
    this.tabButtons[tabId].style.backgroundColor = '#555';
  }
  
  /**
   * Create a slider control
   * @param {string} id - Element ID
   * @param {string} label - Display label
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} value - Default value
   * @param {number} step - Step increment
   * @param {function} onChange - Change handler function
   */
  _createSlider(id, label, min, max, value, step, onChange) {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = `${label}: `;
    
    const valueSpan = document.createElement('span');
    valueSpan.id = `${id}-value`;
    valueSpan.textContent = value;
    labelElement.appendChild(valueSpan);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.width = '100%';
    
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueSpan.textContent = value.toFixed(2);
      onChange(value);
    });
    
    container.appendChild(labelElement);
    container.appendChild(slider);
    
    return container;
  }
  
  /**
   * Create a color picker control
   * @param {string} id - Element ID
   * @param {string} label - Display label
   * @param {string} value - Default hex color
   * @param {function} onChange - Change handler function
   */
  _createColorPicker(id, label, value, onChange) {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = `${label}: `;
    labelElement.style.flex = '1';
    
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.id = id;
    colorPicker.value = value;
    
    colorPicker.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
    
    container.appendChild(labelElement);
    container.appendChild(colorPicker);
    
    return container;
  }
  
  /**
   * Create a button element
   * @param {string} label - Button text
   * @param {function} onClick - Click handler
   */
  _createButton(label, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.backgroundColor = '#4a4a4a';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '5px 10px';
    button.style.margin = '5px';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', onClick);
    
    return button;
  }
  
  /**
   * Create material control panel
   */
  _createMaterialControls() {
    const panel = this.tabPanels['materials'];
    
    // Shininess slider
    panel.appendChild(this._createSlider(
      'material-shininess',
      'Shininess',
      0,
      200,
      this.materialDefaults.shininess,
      1,
      (value) => {
        this.changes.material.shininess = value;
        this._updateMaterials();
      }
    ));
    
    // Emissive intensity slider
    panel.appendChild(this._createSlider(
      'material-emissive',
      'Emissive Intensity',
      0,
      1,
      this.materialDefaults.emissiveIntensity,
      0.05,
      (value) => {
        this.changes.material.emissiveIntensity = value;
        this._updateMaterials();
      }
    ));
    
    // Specular color
    const specularControls = document.createElement('div');
    specularControls.style.marginBottom = '10px';
    specularControls.innerHTML = '<label>Specular Color:</label>';
    
    // RGB sliders for specular
    ['R', 'G', 'B'].forEach((channel, index) => {
      const defaultVal = this.materialDefaults[`specular${channel}`];
      
      specularControls.appendChild(this._createSlider(
        `material-specular-${channel.toLowerCase()}`,
        channel,
        0,
        1,
        defaultVal,
        0.05,
        (value) => {
          this.changes.material[`specular${channel}`] = value;
          this._updateMaterials();
        }
      ));
    });
    
    panel.appendChild(specularControls);
    
    // Reset button
    const resetButton = this._createButton('Reset Materials', () => {
      this.changes.material = {};
      this._resetControlValues('material');
      this._updateMaterials();
    });
    
    resetButton.style.marginTop = '10px';
    panel.appendChild(resetButton);
    
    // Log current state button
    const logButton = this._createButton('Log Material State', () => {
      console.log('[DEBUG] Current material state:', this._getCurrentMaterialState());
    });
    
    panel.appendChild(logButton);
  }
  
  /**
   * Create lighting control panel
   */
  _createLightingControls() {
    const panel = this.tabPanels['lighting'];
    
    // Ambient light
    const ambientSection = document.createElement('fieldset');
    ambientSection.innerHTML = '<legend>Ambient Light</legend>';
    
    ambientSection.appendChild(this._createSlider(
      'ambient-intensity',
      'Intensity',
      0,
      2,
      this.lightingDefaults.ambientIntensity,
      0.05,
      (value) => {
        this.changes.lighting.ambientIntensity = value;
        this._updateLighting();
      }
    ));
    
    ambientSection.appendChild(this._createColorPicker(
      'ambient-color',
      'Color',
      this.lightingDefaults.ambientColor,
      (value) => {
        this.changes.lighting.ambientColor = value;
        this._updateLighting();
      }
    ));
    
    panel.appendChild(ambientSection);
    
    // Directional light
    const directionalSection = document.createElement('fieldset');
    directionalSection.innerHTML = '<legend>Directional Light (Main)</legend>';
    
    directionalSection.appendChild(this._createSlider(
      'directional-intensity',
      'Intensity',
      0,
      2,
      this.lightingDefaults.directionalIntensity,
      0.05,
      (value) => {
        this.changes.lighting.directionalIntensity = value;
        this._updateLighting();
      }
    ));
    
    directionalSection.appendChild(this._createColorPicker(
      'directional-color',
      'Color',
      this.lightingDefaults.directionalColor,
      (value) => {
        this.changes.lighting.directionalColor = value;
        this._updateLighting();
      }
    ));
    
    panel.appendChild(directionalSection);
    
    // Fill light
    const fillSection = document.createElement('fieldset');
    fillSection.innerHTML = '<legend>Fill Light</legend>';
    
    fillSection.appendChild(this._createSlider(
      'fill-intensity',
      'Intensity',
      0,
      2,
      this.lightingDefaults.fillIntensity,
      0.05,
      (value) => {
        this.changes.lighting.fillIntensity = value;
        this._updateLighting();
      }
    ));
    
    fillSection.appendChild(this._createColorPicker(
      'fill-color',
      'Color',
      this.lightingDefaults.fillColor,
      (value) => {
        this.changes.lighting.fillColor = value;
        this._updateLighting();
      }
    ));
    
    panel.appendChild(fillSection);
    
    // Rim light
    const rimSection = document.createElement('fieldset');
    rimSection.innerHTML = '<legend>Rim Light</legend>';
    
    rimSection.appendChild(this._createSlider(
      'rim-intensity',
      'Intensity',
      0,
      2,
      this.lightingDefaults.rimIntensity,
      0.05,
      (value) => {
        this.changes.lighting.rimIntensity = value;
        this._updateLighting();
      }
    ));
    
    rimSection.appendChild(this._createColorPicker(
      'rim-color',
      'Color',
      this.lightingDefaults.rimColor,
      (value) => {
        this.changes.lighting.rimColor = value;
        this._updateLighting();
      }
    ));
    
    panel.appendChild(rimSection);
    
    // Reset button
    const resetButton = this._createButton('Reset Lighting', () => {
      this.changes.lighting = {};
      this._resetControlValues('lighting');
      this._updateLighting();
    });
    
    resetButton.style.marginTop = '10px';
    panel.appendChild(resetButton);
    
    // Apply dramatic lighting preset
    const dramaticButton = this._createButton('Dramatic Lighting Preset', () => {
      // Set dramatic lighting values
      this._setControlValue('ambient-intensity', 0.5);
      this._setControlValue('ambient-color', '#2a2a3a');
      this._setControlValue('directional-intensity', 1.5);
      this._setControlValue('directional-color', '#ffa030');
      this._setControlValue('fill-intensity', 0.3);
      this._setControlValue('fill-color', '#3050ff');
      this._setControlValue('rim-intensity', 0.7);
      this._setControlValue('rim-color', '#ff3030');
      
      // Update changes object
      this.changes.lighting = {
        ambientIntensity: 0.5,
        ambientColor: '#2a2a3a',
        directionalIntensity: 1.5,
        directionalColor: '#ffa030',
        fillIntensity: 0.3,
        fillColor: '#3050ff',
        rimIntensity: 0.7,
        rimColor: '#ff3030'
      };
      
      this._updateLighting();
    });
    
    panel.appendChild(dramaticButton);
    
    // Apply vibrant lighting preset
    const vibrantButton = this._createButton('Vibrant Lighting Preset', () => {
      // Set vibrant lighting values
      this._setControlValue('ambient-intensity', 1.0);
      this._setControlValue('ambient-color', '#fffaf0');
      this._setControlValue('directional-intensity', 1.4);
      this._setControlValue('directional-color', '#ffed9a');
      this._setControlValue('fill-intensity', 0.7);
      this._setControlValue('fill-color', '#90c0ff');
      this._setControlValue('rim-intensity', 0.5);
      this._setControlValue('rim-color', '#ffe0a0');
      
      // Update changes object
      this.changes.lighting = {
        ambientIntensity: 1.0,
        ambientColor: '#fffaf0',
        directionalIntensity: 1.4,
        directionalColor: '#ffed9a',
        fillIntensity: 0.7,
        fillColor: '#90c0ff',
        rimIntensity: 0.5,
        rimColor: '#ffe0a0'
      };
      
      this._updateLighting();
    });
    
    panel.appendChild(vibrantButton);
  }
  
  /**
   * Create camera control panel
   */
  _createCameraControls() {
    const panel = this.tabPanels['camera'];
    
    // Min/Max polar angle
    panel.appendChild(this._createSlider(
      'camera-min-polar',
      'Min Polar Angle',
      0,
      Math.PI / 2,
      0.1,
      0.05,
      (value) => {
        if (value < this._getControlValue('camera-max-polar')) {
          this.changes.camera.minPolarAngle = value;
          this._updateCamera();
        } else {
          // Reset to valid value if conflict
          this._setControlValue('camera-min-polar', this.changes.camera.minPolarAngle || 0.1);
        }
      }
    ));
    
    panel.appendChild(this._createSlider(
      'camera-max-polar',
      'Max Polar Angle',
      0.1,
      Math.PI,
      Math.PI * 0.6,
      0.05,
      (value) => {
        if (value > this._getControlValue('camera-min-polar')) {
          this.changes.camera.maxPolarAngle = value;
          this._updateCamera();
        } else {
          // Reset to valid value if conflict
          this._setControlValue('camera-max-polar', this.changes.camera.maxPolarAngle || Math.PI * 0.6);
        }
      }
    ));
    
    // Sensitivity sliders
    panel.appendChild(this._createSlider(
      'camera-pan-sensitivity',
      'Pan Sensitivity',
      0.001,
      0.01,
      0.003,
      0.001,
      (value) => {
        this.changes.camera.panSensitivity = value;
        this._updateCamera();
      }
    ));
    
    panel.appendChild(this._createSlider(
      'camera-rotate-sensitivity',
      'Rotation Sensitivity',
      0.001,
      0.01,
      0.005,
      0.001,
      (value) => {
        this.changes.camera.rotateSensitivity = value;
        this._updateCamera();
      }
    ));
    
    panel.appendChild(this._createSlider(
      'camera-zoom-sensitivity',
      'Zoom Sensitivity',
      0.005,
      0.05,
      0.01,
      0.005,
      (value) => {
        this.changes.camera.zoomSensitivity = value;
        this._updateCamera();
      }
    ));
    
    // Reset camera button
    const resetButton = this._createButton('Reset Camera Position', () => {
      // This is a direct action rather than a setting
      if (this.cameraManager) {
        this.cameraManager.resetCamera();
      }
    });
    
    panel.appendChild(resetButton);
    
    // Reset settings button
    const resetSettingsButton = this._createButton('Reset Camera Settings', () => {
      this.changes.camera = {};
      this._resetControlValues('camera');
      this._updateCamera();
    });
    
    panel.appendChild(resetSettingsButton);
  }
  
  /**
   * Create grid control panel
   */
  _createGridControls() {
    const panel = this.tabPanels['grid'];
    
    panel.appendChild(this._createSlider(
      'grid-horizontal',
      'Horizontal Spacing',
      1.0,
      2.0,
      this.gridDefaults.horizontalSpacing,
      0.05,
      (value) => {
        this.changes.grid.horizontalSpacing = value;
        // Note: This requires regenerating the grid, not just updating
      }
    ));
    
    panel.appendChild(this._createSlider(
      'grid-vertical',
      'Vertical Factor',
      0.8,
      1.2,
      this.gridDefaults.verticalFactor,
      0.05,
      (value) => {
        this.changes.grid.verticalFactor = value;
        // Note: This requires regenerating the grid, not just updating
      }
    ));
    
    // Apply grid settings button
    const applyButton = this._createButton('Apply Grid Settings', () => {
      this._applyGridSettings();
    });
    
    applyButton.style.backgroundColor = '#2a7d2a';
    panel.appendChild(applyButton);
    
    // Reset grid button
    const resetButton = this._createButton('Reset Grid', () => {
      this.changes.grid = {};
      this._resetControlValues('grid');
      this._applyGridSettings();
    });
    
    panel.appendChild(resetButton);
    
    // Info text
    const infoText = document.createElement('p');
    infoText.textContent = 'Note: Changing grid settings requires regenerating the entire hex grid.';
    infoText.style.fontSize = '0.8em';
    infoText.style.opacity = '0.7';
    panel.appendChild(infoText);
  }
  
  /**
   * Create preset controls section
   */
  _createPresetControls() {
    // Create a button container at the bottom
    const presetContainer = document.createElement('div');
    presetContainer.style.borderTop = '1px solid #666';
    presetContainer.style.paddingTop = '10px';
    presetContainer.style.marginTop = '10px';
    presetContainer.style.textAlign = 'center';
    
    // Save current settings as code
    const saveButton = this._createButton('Export Settings as Code', () => {
      this._exportSettingsAsCode();
    });
    
    // Reset all settings
    const resetAllButton = this._createButton('Reset All Settings', () => {
      this.changes = {
        material: {},
        lighting: {},
        camera: {},
        grid: {}
      };
      
      this._resetControlValues('material');
      this._resetControlValues('lighting');
      this._resetControlValues('camera');
      this._resetControlValues('grid');
      
      this._updateMaterials();
      this._updateLighting();
      this._updateCamera();
      this._applyGridSettings();
    });
    
    presetContainer.appendChild(saveButton);
    presetContainer.appendChild(resetAllButton);
    
    this.content.appendChild(presetContainer);
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
   * Update all materials with current settings
   */
  _updateMaterials() {
    console.log("[DEBUG] Updating materials with:", this.changes.material);
    
    if (!this.hexagons) {
      console.warn("[DEBUG] No hexagons available to update materials");
      return;
    }
    
    // Apply changes to all relevant materials
    this.hexagons.forEach(hex => {
      // Skip if no materials array
      if (!hex.material || !Array.isArray(hex.material)) return;
      
      // Update top and bottom materials (indices 1 and 2)
      [1, 2].forEach(index => {
        const material = hex.material[index];
        if (!material) return;
        
        // Shininess
        if (this.changes.material.shininess !== undefined) {
          material.shininess = this.changes.material.shininess;
        }
        
        // Emissive intensity
        if (this.changes.material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = this.changes.material.emissiveIntensity;
        }
        
        // Specular color
        if (
          this.changes.material.specularR !== undefined ||
          this.changes.material.specularG !== undefined ||
          this.changes.material.specularB !== undefined
        ) {
          const r = this.changes.material.specularR !== undefined ? 
                    this.changes.material.specularR : material.specular.r;
          const g = this.changes.material.specularG !== undefined ? 
                    this.changes.material.specularG : material.specular.g;
          const b = this.changes.material.specularB !== undefined ? 
                    this.changes.material.specularB : material.specular.b;
          
          material.specular.setRGB(r, g, b);
        }
        
        material.needsUpdate = true;
      });
    });
  }
  
  /**
   * Update lighting with current settings
   */
  _updateLighting() {
    console.log("[DEBUG] Updating lighting with:", this.changes.lighting);
    
    if (!this.lights) {
      console.warn("[DEBUG] No lights available to update");
      return;
    }
    
    // Ambient light
    if (this.lights.ambient) {
      if (this.changes.lighting.ambientIntensity !== undefined) {
        this.lights.ambient.intensity = this.changes.lighting.ambientIntensity;
      }
      
      if (this.changes.lighting.ambientColor) {
        this.lights.ambient.color.set(this.changes.lighting.ambientColor);
      }
    }
    
    // Directional light
    if (this.lights.directional) {
      if (this.changes.lighting.directionalIntensity !== undefined) {
        this.lights.directional.intensity = this.changes.lighting.directionalIntensity;
      }
      
      if (this.changes.lighting.directionalColor) {
        this.lights.directional.color.set(this.changes.lighting.directionalColor);
      }
    }
    
    // Fill light
    if (this.lights.fill) {
      if (this.changes.lighting.fillIntensity !== undefined) {
        this.lights.fill.intensity = this.changes.lighting.fillIntensity;
      }
      
      if (this.changes.lighting.fillColor) {
        this.lights.fill.color.set(this.changes.lighting.fillColor);
      }
    }
    
    // Rim light
    if (this.lights.rim) {
      if (this.changes.lighting.rimIntensity !== undefined) {
        this.lights.rim.intensity = this.changes.lighting.rimIntensity;
      }
      
      if (this.changes.lighting.rimColor) {
        this.lights.rim.color.set(this.changes.lighting.rimColor);
      }
    }
    
    // Point light
    if (this.lights.point) {
      if (this.changes.lighting.pointIntensity !== undefined) {
        this.lights.point.intensity = this.changes.lighting.pointIntensity;
      }
      
      if (this.changes.lighting.pointColor) {
        this.lights.point.color.set(this.changes.lighting.pointColor);
      }
    }
  }
  
  /**
   * Update camera settings
   */
  _updateCamera() {
    console.log("[DEBUG] Updating camera with:", this.changes.camera);
    
    if (!this.cameraManager) {
      console.warn("[DEBUG] No camera manager available to update");
      return;
    }
    
    // Update constraints
    const constraints = {};
    if (this.changes.camera.minPolarAngle !== undefined) {
      constraints.minPolarAngle = this.changes.camera.minPolarAngle;
    }
    
    if (this.changes.camera.maxPolarAngle !== undefined) {
      constraints.maxPolarAngle = this.changes.camera.maxPolarAngle;
    }
    
    if (Object.keys(constraints).length > 0) {
      this.cameraManager.updateConstraints(constraints);
    }
    
    // Update sensitivity
    const sensitivity = {};
    if (this.changes.camera.panSensitivity !== undefined) {
      sensitivity.panSensitivity = this.changes.camera.panSensitivity;
    }
    
    if (this.changes.camera.rotateSensitivity !== undefined) {
      sensitivity.rotateSensitivity = this.changes.camera.rotateSensitivity;
    }
    
    if (this.changes.camera.zoomSensitivity !== undefined) {
      sensitivity.zoomSensitivity = this.changes.camera.zoomSensitivity;
    }
    
    if (Object.keys(sensitivity).length > 0) {
      this.cameraManager.updateSensitivity(sensitivity);
    }
  }
  
  /**
   * Apply grid settings by calling the grid generator function
   */
  _applyGridSettings() {
    console.log("[DEBUG] Applying grid settings:", this.changes.grid);
    
    if (!this.gridGeneratorFn) {
      console.warn("[DEBUG] No grid generator function available");
      return;
    }
    
    // Get current values
    const horizontalSpacing = this.changes.grid.horizontalSpacing || this.gridDefaults.horizontalSpacing;
    const verticalFactor = this.changes.grid.verticalFactor || this.gridDefaults.verticalFactor;
    
    // Call the grid generator with new settings
    this.gridGeneratorFn(horizontalSpacing, verticalFactor);
  }
  
  /**
   * Reset all control values for a specific section to defaults
   * @param {string} section - The section to reset (material, lighting, camera, grid)
   */
  _resetControlValues(section) {
    switch (section) {
      case 'material':
        this._setControlValue('material-shininess', this.materialDefaults.shininess);
        this._setControlValue('material-emissive', this.materialDefaults.emissiveIntensity);
        this._setControlValue('material-specular-r', this.materialDefaults.specularR);
        this._setControlValue('material-specular-g', this.materialDefaults.specularG);
        this._setControlValue('material-specular-b', this.materialDefaults.specularB);
        break;
        
      case 'lighting':
        this._setControlValue('ambient-intensity', this.lightingDefaults.ambientIntensity);
        this._setControlValue('ambient-color', this.lightingDefaults.ambientColor);
        this._setControlValue('directional-intensity', this.lightingDefaults.directionalIntensity);
        this._setControlValue('directional-color', this.lightingDefaults.directionalColor);
        this._setControlValue('fill-intensity', this.lightingDefaults.fillIntensity);
        this._setControlValue('fill-color', this.lightingDefaults.fillColor);
        this._setControlValue('rim-intensity', this.lightingDefaults.rimIntensity);
        this._setControlValue('rim-color', this.lightingDefaults.rimColor);
        break;
        
      case 'camera':
        this._setControlValue('camera-min-polar', 0.1);
        this._setControlValue('camera-max-polar', Math.PI * 0.6);
        this._setControlValue('camera-pan-sensitivity', 0.003);
        this._setControlValue('camera-rotate-sensitivity', 0.005);
        this._setControlValue('camera-zoom-sensitivity', 0.01);
        break;
        
      case 'grid':
        this._setControlValue('grid-horizontal', this.gridDefaults.horizontalSpacing);
        this._setControlValue('grid-vertical', this.gridDefaults.verticalFactor);
        break;
    }
  }
  
  /**
   * Set a control value and update its display
   * @param {string} id - The control ID
   * @param {*} value - The value to set
   */
  _setControlValue(id, value) {
    const control = document.getElementById(id);
    if (!control) return;
    
    control.value = value;
    
    // Update display value for sliders
    const valueDisplay = document.getElementById(`${id}-value`);
    if (valueDisplay) {
      valueDisplay.textContent = typeof value === 'number' ? value.toFixed(2) : value;
    }
  }
  
  /**
   * Get the current value of a control
   * @param {string} id - The control ID
   * @returns {*} The control value
   */
  _getControlValue(id) {
    const control = document.getElementById(id);
    if (!control) return null;
    
    // Parse numeric values
    return control.type === 'range' ? parseFloat(control.value) : control.value;
  }
  
  /**
   * Get the current state of all materials
   * @returns {Object} The current material state
   */
  _getCurrentMaterialState() {
    // Sample the first hex material
    if (!this.hexagons || this.hexagons.length === 0) {
      return 'No hexagons available';
    }
    
    const hex = this.hexagons[0];
    if (!hex.material || !Array.isArray(hex.material) || !hex.material[1]) {
      return 'No material available';
    }
    
    const material = hex.material[1];
    
    return {
      shininess: material.shininess,
      emissiveIntensity: material.emissiveIntensity,
      specular: {
        r: material.specular.r,
        g: material.specular.g,
        b: material.specular.b,
        hex: material.specular.getHexString()
      },
      emissive: {
        r: material.emissive.r,
        g: material.emissive.g,
        b: material.emissive.b,
        hex: material.emissive.getHexString()
      }
    };
  }
  
  /**
   * Export current settings as code that can be pasted into the project
   */
  _exportSettingsAsCode() {
    const settings = {
      material: this.changes.material,
      lighting: this.changes.lighting,
      camera: this.changes.camera,
      grid: this.changes.grid
    };
    
    const code = `
// Material settings
const materialSettings = ${JSON.stringify(settings.material, null, 2)};

// Lighting settings
const lightingSettings = ${JSON.stringify(settings.lighting, null, 2)};

// Camera settings
const cameraSettings = ${JSON.stringify(settings.camera, null, 2)};

// Grid settings
const gridSettings = ${JSON.stringify(settings.grid, null, 2)};
`;
    
    console.log("[DEBUG] Exported settings as code:");
    console.log(code);
    
    // Create a modal to display the code
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = '80%';
    modal.style.maxWidth = '600px';
    modal.style.maxHeight = '80%';
    modal.style.backgroundColor = '#222';
    modal.style.color = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '5px';
    modal.style.zIndex = '2000';
    modal.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    
    const title = document.createElement('h3');
    title.textContent = 'Exported Settings';
    title.style.marginTop = '0';
    
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.width = '100%';
    textarea.style.height = '300px';
    textarea.style.backgroundColor = '#333';
    textarea.style.color = '#fff';
    textarea.style.border = '1px solid #555';
    textarea.style.padding = '10px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.marginBottom = '10px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.alignSelf = 'flex-end';
    closeButton.style.padding = '5px 15px';
    closeButton.style.backgroundColor = '#444';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy to Clipboard';
    copyButton.style.alignSelf = 'flex-end';
    copyButton.style.padding = '5px 15px';
    copyButton.style.backgroundColor = '#4a75a2';
    copyButton.style.color = '#fff';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '3px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.marginRight = '10px';
    
    copyButton.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy to Clipboard';
      }, 2000);
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    
    modal.appendChild(title);
    modal.appendChild(textarea);
    modal.appendChild(buttonContainer);
    
    document.body.appendChild(modal);
  }
}
/**
 * DebugMenu.js - Interactive debug tools for Beast Tactics
 */

export class DebugMenu {
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
