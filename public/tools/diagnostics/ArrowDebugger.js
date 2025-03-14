
/**
 * ArrowDebugger.js - Utility for debugging directional arrows on beasts
 * 
 * This module provides tools for adjusting and fine-tuning the directional
 * arrows used for beast movement in the game.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Single export of the ArrowDebugger class
export class ArrowDebugger {
  /**
   * Create a new arrow debugger
   * @param {Object} beast - Reference to the beast object being debugged
   * @param {HTMLElement} containerElement - Parent container element for the debugger
   */
  constructor(beast, containerElement) {
    console.log("[ARROW-DEBUG] Initializing arrow debugger tool");

    this.beast = beast;
    this.active = false;
    this.container = containerElement;

    // Default settings that will be applied to arrows
    this.settings = {
      // Position settings
      distance: 1.2,     // Distance from beast center
      height: 0.7,       // Height above ground
      heightOffset: 0.0, // Additional height offset for specific directions

      // Rotation settings
      baseRotationX: Math.PI / 2, // 90 degrees to make horizontal (default)
      rotationOffsetX: 0,         // Additional X rotation in radians
      rotationOffsetY: 0,         // Additional Y rotation in radians
      rotationOffsetZ: 0,         // Additional Z rotation in radians

      // Direction-specific offsets (can be expanded for more fine-tuning)
      directionOffsets: {
        E:  { angle: 0 },                    // East
        NE: { angle: Math.PI / 3 },          // Northeast
        NW: { angle: 2 * Math.PI / 3 },      // Northwest
        W:  { angle: Math.PI },              // West
        SW: { angle: 4 * Math.PI / 3 },      // Southwest
        SE: { angle: 5 * Math.PI / 3 },      // Southeast
      }
    };

    // Create the UI
    this._createDebugPanel();

    console.log("[ARROW-DEBUG] Arrow debugger initialized with default settings");
  }

  /**
   * Create the debug panel UI
   */
  _createDebugPanel() {
    console.log("[ARROW-DEBUG] Creating arrow debug panel");

    // Clear any existing content
    this.container.innerHTML = '';

    // Create form for controls
    const form = document.createElement("form");
    form.onsubmit = (e) => e.preventDefault();

    // Global position settings
    this._addSectionHeader(form, "Position Settings");
    this._addRangeControl(form, "distance", "Distance from Beast", 0.5, 3, 0.1, this.settings.distance);
    this._addRangeControl(form, "height", "Height", 0, 2, 0.1, this.settings.height);

    // Global rotation settings
    this._addSectionHeader(form, "Rotation Settings");
    this._addRangeControl(form, "baseRotationX", "Base X Rotation", 0, Math.PI, 0.1, this.settings.baseRotationX);
    this._addRangeControl(form, "rotationOffsetX", "X Offset", -Math.PI, Math.PI, 0.1, this.settings.rotationOffsetX);
    this._addRangeControl(form, "rotationOffsetY", "Y Offset", -Math.PI, Math.PI, 0.1, this.settings.rotationOffsetY);
    this._addRangeControl(form, "rotationOffsetZ", "Z Offset", -Math.PI, Math.PI, 0.1, this.settings.rotationOffsetZ);

    // Direction-specific angle offsets
    this._addSectionHeader(form, "Direction Angle Offsets");
    Object.keys(this.settings.directionOffsets).forEach(dir => {
      this._addRangeControl(
        form, 
        `directionAngle_${dir}`, 
        `${dir} Angle`, 
        0, 2 * Math.PI, 0.1, 
        this.settings.directionOffsets[dir].angle
      );
    });

    // Add button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "8px";
    buttonContainer.style.marginTop = "15px";

    // Add apply button
    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply Changes";
    applyButton.style.flex = "1";
    applyButton.style.padding = "8px";
    applyButton.style.backgroundColor = "#4CAF50";
    applyButton.style.color = "white";
    applyButton.style.border = "none";
    applyButton.style.borderRadius = "4px";
    applyButton.style.cursor = "pointer";
    applyButton.onclick = () => this.applyChanges();
    buttonContainer.appendChild(applyButton);

    // Add copy settings button
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy Settings";
    copyButton.style.flex = "1";
    copyButton.style.padding = "8px";
    copyButton.style.backgroundColor = "#2196F3";
    copyButton.style.color = "white";
    copyButton.style.border = "none";
    copyButton.style.borderRadius = "4px";
    copyButton.style.cursor = "pointer";
    copyButton.onclick = () => this.copySettingsToClipboard();
    buttonContainer.appendChild(copyButton);

    form.appendChild(buttonContainer);

    // Add reset button (separate row)
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset to Defaults";
    resetButton.style.width = "100%";
    resetButton.style.padding = "8px";
    resetButton.style.marginTop = "10px";
    resetButton.style.backgroundColor = "#f44336";
    resetButton.style.color = "white";
    resetButton.style.border = "none";
    resetButton.style.borderRadius = "4px";
    resetButton.style.cursor = "pointer";
    resetButton.onclick = () => this.resetToDefaults();
    form.appendChild(resetButton);

    // Add debug console
    this._addSectionHeader(form, "Debug Console");
    this.console = document.createElement("div");
    this.console.style.backgroundColor = "#000";
    this.console.style.color = "#0f0";
    this.console.style.padding = "5px";
    this.console.style.fontFamily = "monospace";
    this.console.style.fontSize = "11px";
    this.console.style.height = "100px";
    this.console.style.overflowY = "auto";
    this.console.style.marginBottom = "10px";
    form.appendChild(this.console);

    // Add form to container
    this.container.appendChild(form);

    this.log("Arrow debug panel ready");
  }

  /**
   * Add a section header to the form
   * @param {HTMLElement} form - The form to add to
   * @param {string} title - Section title
   */
  _addSectionHeader(form, title) {
    const header = document.createElement("h4");
    header.textContent = title;
    header.style.borderBottom = "1px solid #555";
    header.style.paddingBottom = "5px";
    header.style.marginTop = "15px";
    header.style.marginBottom = "10px";
    form.appendChild(header);
  }

  /**
   * Add a range control with label and value display
   * @param {HTMLElement} form - The form to add to
   * @param {string} name - Control name
   * @param {string} label - Control label
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} step - Step size
   * @param {number} value - Initial value
   */
  _addRangeControl(form, name, label, min, max, step, value) {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.style.display = "block";
    labelEl.style.marginBottom = "3px";
    container.appendChild(labelEl);

    const controlRow = document.createElement("div");
    controlRow.style.display = "flex";
    controlRow.style.alignItems = "center";

    const range = document.createElement("input");
    range.type = "range";
    range.name = name;
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = value;
    range.style.flex = "1";

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = value.toFixed(2);
    valueDisplay.style.marginLeft = "10px";
    valueDisplay.style.width = "50px";
    valueDisplay.style.textAlign = "right";

    // Update value display when range changes
    range.oninput = () => {
      const newValue = parseFloat(range.value);
      valueDisplay.textContent = newValue.toFixed(2);

      // Update the corresponding setting in our settings object
      if (name.startsWith('directionAngle_')) {
        const direction = name.split('_')[1];
        this.settings.directionOffsets[direction].angle = newValue;
      } else {
        // Update basic settings immediately
        this.settings[name] = newValue;
      }
      
      // Apply changes in real-time for all controls
      this.applyChanges();
      
      // Log the change for debugging
      console.log(`[ARROW-DEBUG] Updated ${name} to ${newValue.toFixed(2)}`);
    };

    controlRow.appendChild(range);
    controlRow.appendChild(valueDisplay);
    container.appendChild(controlRow);
    form.appendChild(container);
  }

  /**
   * Apply current settings to the beast arrows
   */
  applyChanges() {
    if (!this.beast || !this.beast.directionalArrows) {
      this.log("ERROR: Beast or arrows not available");
      return;
    }

    // Collect all settings from UI
    const form = this.container.querySelector("form");
    const inputs = form.querySelectorAll("input");

    // Update basic settings
    inputs.forEach(input => {
      if (input.name === "distance" || 
          input.name === "height" || 
          input.name === "baseRotationX" ||
          input.name === "rotationOffsetX" ||
          input.name === "rotationOffsetY" ||
          input.name === "rotationOffsetZ") {
        this.settings[input.name] = parseFloat(input.value);
      }

      // Handle direction-specific angles
      if (input.name.startsWith("directionAngle_")) {
        const direction = input.name.split("_")[1];
        this.settings.directionOffsets[direction].angle = parseFloat(input.value);
      }
    });

    // Apply to all arrows
    this.beast.directionalArrows.forEach(arrowData => {
      const arrow = arrowData.mesh;
      const direction = arrowData.direction;

      // Get angle for this direction
      const angle = this.settings.directionOffsets[direction].angle;

      // Calculate position with current distance setting
      const x = this.settings.distance * Math.cos(angle);
      const z = this.settings.distance * Math.sin(angle);

      // Update arrow position
      arrow.position.set(
        x,
        this.settings.height,
        z
      );

      // Create rotation quaternion
      const quaternion = new THREE.Quaternion();

      // Set up rotation axes
      const xAxis = new THREE.Vector3(1, 0, 0);
      const yAxis = new THREE.Vector3(0, 1, 0);
      const zAxis = new THREE.Vector3(0, 0, 1);

      // Apply base X rotation (making cone point horizontally)
      quaternion.setFromAxisAngle(xAxis, this.settings.baseRotationX);

      // Create and apply Y rotation (direction angle)
      const yRotation = new THREE.Quaternion().setFromAxisAngle(yAxis, angle);
      quaternion.premultiply(yRotation);

      // Apply additional rotation offsets if set
      if (this.settings.rotationOffsetX !== 0) {
        const xOffset = new THREE.Quaternion().setFromAxisAngle(xAxis, this.settings.rotationOffsetX);
        quaternion.multiply(xOffset);
      }

      if (this.settings.rotationOffsetY !== 0) {
        const yOffset = new THREE.Quaternion().setFromAxisAngle(yAxis, this.settings.rotationOffsetY);
        quaternion.multiply(yOffset);
      }

      if (this.settings.rotationOffsetZ !== 0) {
        const zOffset = new THREE.Quaternion().setFromAxisAngle(zAxis, this.settings.rotationOffsetZ);
        quaternion.multiply(zOffset);
      }

      // Apply combined rotations
      arrow.setRotationFromQuaternion(quaternion);

      // Update debug spheres too (if present)
      const debugSphere = this.beast.group.children.find(child => 
        child.type === "Mesh" && 
        child.geometry.type === "SphereGeometry" &&
        Math.abs(child.position.x - (x + 0.3 * Math.cos(angle))) < 0.1
      );

      if (debugSphere) {
        debugSphere.position.set(
          x + 0.3 * Math.cos(angle),
          this.settings.height,
          z + 0.3 * Math.sin(angle)
        );
      }
    });

    // Log changes
    this.log(`Applied settings: distance=${this.settings.distance.toFixed(2)}, height=${this.settings.height.toFixed(2)}`);

    console.log("[ARROW-DEBUG] Applied all settings to arrows", this.settings);
  }

  /**
   * Reset settings to default values
   */
  resetToDefaults() {
    // Reset to constructor defaults
    this.settings = {
      distance: 1.2,
      height: 0.7,
      heightOffset: 0.0,
      baseRotationX: Math.PI / 2,
      rotationOffsetX: 0,
      rotationOffsetY: 0,
      rotationOffsetZ: 0,
      directionOffsets: {
        E:  { angle: 0 },
        NE: { angle: Math.PI / 3 },
        NW: { angle: 2 * Math.PI / 3 },
        W:  { angle: Math.PI },
        SW: { angle: 4 * Math.PI / 3 },
        SE: { angle: 5 * Math.PI / 3 },
      }
    };

    // Update UI controls to match defaults
    const form = this.container.querySelector("form");
    const inputs = form.querySelectorAll("input");

    inputs.forEach(input => {
      if (input.name === "distance") {
        input.value = this.settings.distance;
      } else if (input.name === "height") {
        input.value = this.settings.height;
      } else if (input.name === "baseRotationX") {
        input.value = this.settings.baseRotationX;
      } else if (input.name === "rotationOffsetX") {
        input.value = this.settings.rotationOffsetX;
      } else if (input.name === "rotationOffsetY") {
        input.value = this.settings.rotationOffsetY;
      } else if (input.name === "rotationOffsetZ") {
        input.value = this.settings.rotationOffsetZ;
      } else if (input.name.startsWith("directionAngle_")) {
        const direction = input.name.split("_")[1];
        input.value = this.settings.directionOffsets[direction].angle;
      }

      // Also update displayed values
      const valueDisplay = input.parentElement.querySelector("span");
      if (valueDisplay) {
        valueDisplay.textContent = parseFloat(input.value).toFixed(2);
      }
    });

    // Apply the default settings
    this.applyChanges();

    this.log("Reset to default settings");
  }

  /**
   * Add a message to the debug console
   * @param {string} message - Message to display
   */
  log(message) {
    if (!this.console) return;

    const entry = document.createElement("div");
    entry.textContent = `> ${message}`;
    this.console.appendChild(entry);
    this.console.scrollTop = this.console.scrollHeight;

    // Also log to browser console
    console.log(`[ARROW-DEBUG] ${message}`);
  }

  /**
   * Copy current settings to clipboard in code format
   */
  copySettingsToClipboard() {
    const settingsJson = JSON.stringify(this.settings, null, 2);

    // Create formatted code
    const code = `// Arrow settings as of ${new Date().toLocaleString()}
const arrowSettings = ${settingsJson};

// Apply these settings in the _createDirectionalIndicators method:
/*
const hexDirections = [
  { q: 1, r: 0, name: "E", angle: ${this.settings.directionOffsets.E.angle.toFixed(2)} },
  { q: 0, r: -1, name: "NE", angle: ${this.settings.directionOffsets.NE.angle.toFixed(2)} },
  { q: -1, r: 0, name: "NW", angle: ${this.settings.directionOffsets.NW.angle.toFixed(2)} },
  { q: -1, r: 1, name: "W", angle: ${this.settings.directionOffsets.W.angle.toFixed(2)} },
  { q: 0, r: 1, name: "SW", angle: ${this.settings.directionOffsets.SW.angle.toFixed(2)} },
  { q: 1, r: -1, name: "SE", angle: ${this.settings.directionOffsets.SE.angle.toFixed(2)} },
];

const arrowDistance = ${this.settings.distance.toFixed(2)};
const arrowHeight = ${this.settings.height.toFixed(2)};
*/`;

    // Copy to clipboard
    navigator.clipboard.writeText(code)
      .then(() => {
        this.log("Settings copied to clipboard");
      })
      .catch(err => {
        this.log(`Error copying: ${err}`);
        console.error("Could not copy settings:", err);
      });
  }

  /**
   * Set beast reference for debugging
   * @param {Object} beast - The beast to debug
   */
  setBeast(beast) {
    this.beast = beast;
    this.log(`Beast reference updated`);
    console.log("[ARROW-DEBUG] Beast reference updated", beast);
  }
}
/**
 * ArrowDebugger.js - Debug utility for Beast movement arrows
 * 
 * Provides visualization tools and UI controls for debugging
 * the directional movement arrows used by Beasts to navigate the hex grid.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Enhanced logging function that only logs in debug mode
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[ARROW-DEBUG] ${message}`, data);
  } else {
    console.log(`[ARROW-DEBUG] ${message}`);
  }
}

/**
 * ArrowDebugger class for visualization and testing of directional arrows
 */
export class ArrowDebugger {
  /**
   * Create a new ArrowDebugger instance
   * @param {THREE.Scene} scene - The THREE.js scene
   */
  constructor(scene) {
    debugLog("Initializing ArrowDebugger");
    this.scene = scene;
    this.currentBeast = null;
    this.enabled = true;
    this.showVectors = true;
    this.showLabels = true;
    this.showTargetPoints = true;
    
    // Create UI panel for controlling debugging options
    this._createDebugUI();
  }
  
  /**
   * Connect a Beast instance to the debugger
   * @param {Beast} beast - The Beast instance to debug
   */
  setBeast(beast) {
    debugLog("Setting Beast for debugging:", {
      type: beast?.type,
      arrows: beast?.directionalArrows?.length || 0
    });
    
    this.currentBeast = beast;
    this._updateUI();
  }
  
  /**
   * Toggle visibility of debug visualization
   * @param {boolean} visible - Whether debug elements should be visible
   */
  toggleVisibility(visible) {
    if (!this.currentBeast || !this.currentBeast.debugObjects) {
      debugLog("No Beast or debug objects available");
      return;
    }
    
    debugLog(`Setting debug visibility to ${visible}`);
    
    // Toggle direction vectors
    if (this.currentBeast.debugObjects.directionVectors) {
      this.currentBeast.debugObjects.directionVectors.forEach(line => {
        line.visible = visible && this.showVectors;
      });
    }
    
    // Toggle labels
    if (this.currentBeast.debugObjects.directionLabels) {
      this.currentBeast.debugObjects.directionLabels.forEach(label => {
        label.visible = visible && this.showLabels;
      });
    }
    
    // Toggle target hex labels
    if (this.currentBeast.debugObjects.targetHexLabels) {
      this.currentBeast.debugObjects.targetHexLabels.forEach(label => {
        label.visible = visible && this.showTargetPoints;
      });
    }
  }
  
  /**
   * Toggle the visibility of direction vectors
   * @param {boolean} visible - Whether vectors should be visible
   */
  toggleVectors(visible) {
    this.showVectors = visible;
    debugLog(`Vector visibility set to ${visible}`);
    this.toggleVisibility(this.enabled);
  }
  
  /**
   * Toggle the visibility of direction labels
   * @param {boolean} visible - Whether labels should be visible
   */
  toggleLabels(visible) {
    this.showLabels = visible;
    debugLog(`Label visibility set to ${visible}`);
    this.toggleVisibility(this.enabled);
  }
  
  /**
   * Toggle the visibility of target points
   * @param {boolean} visible - Whether target points should be visible
   */
  toggleTargetPoints(visible) {
    this.showTargetPoints = visible;
    debugLog(`Target point visibility set to ${visible}`);
    this.toggleVisibility(this.enabled);
  }
  
  /**
   * Create UI controls for the debugger
   * @private
   */
  _createDebugUI() {
    // Create container for UI
    const container = document.createElement('div');
    container.id = 'arrow-debugger-ui';
    container.style.position = 'absolute';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0,0,0,0.7)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '1000';
    container.style.maxWidth = '300px';
    container.innerHTML = `
      <h3>Arrow Debugger</h3>
      <div id="beast-info">No beast connected</div>
      <div class="control">
        <label><input type="checkbox" id="toggle-debug" checked> Enable Debug Visualization</label>
      </div>
      <div class="control">
        <label><input type="checkbox" id="toggle-vectors" checked> Show Direction Vectors</label>
      </div>
      <div class="control">
        <label><input type="checkbox" id="toggle-labels" checked> Show Arrow Labels</label>
      </div>
      <div class="control">
        <label><input type="checkbox" id="toggle-targets" checked> Show Target Points</label>
      </div>
      <div id="arrow-details">
        <h4>Arrow Details</h4>
        <div id="arrow-info">Select an arrow to see details</div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Add event listeners to controls
    document.getElementById('toggle-debug').addEventListener('change', e => {
      this.enabled = e.target.checked;
      this.toggleVisibility(this.enabled);
    });
    
    document.getElementById('toggle-vectors').addEventListener('change', e => {
      this.toggleVectors(e.target.checked);
    });
    
    document.getElementById('toggle-labels').addEventListener('change', e => {
      this.toggleLabels(e.target.checked);
    });
    
    document.getElementById('toggle-targets').addEventListener('change', e => {
      this.toggleTargetPoints(e.target.checked);
    });
    
    debugLog("Debug UI created");
  }
  
  /**
   * Update UI with current Beast information
   * @private
   */
  _updateUI() {
    const infoElement = document.getElementById('beast-info');
    if (!infoElement) return;
    
    if (!this.currentBeast) {
      infoElement.textContent = "No beast connected";
      return;
    }
    
    infoElement.innerHTML = `
      <strong>Beast:</strong> ${this.currentBeast.type}<br>
      <strong>Arrows:</strong> ${this.currentBeast.directionalArrows?.length || 0}<br>
      <strong>Position:</strong> (${this.currentBeast.group.position.x.toFixed(1)}, 
                             ${this.currentBeast.group.position.y.toFixed(1)}, 
                             ${this.currentBeast.group.position.z.toFixed(1)})
    `;
    
    // Create arrow details table
    const arrowInfoElem = document.getElementById('arrow-info');
    if (arrowInfoElem && this.currentBeast.directionalArrows) {
      let html = `<table style="font-size: 10px; width: 100%;">
        <tr>
          <th>ID</th>
          <th>Dir</th>
          <th>q,r</th>
          <th>Pos (x,z)</th>
        </tr>`;
      
      this.currentBeast.directionalArrows.forEach(arrow => {
        html += `<tr>
          <td>${arrow.directionId}</td>
          <td>${arrow.direction.substring(0,1)}</td>
          <td>${arrow.coordinates.q},${arrow.coordinates.r}</td>
          <td>${arrow.targetPosition.x.toFixed(1)},${arrow.targetPosition.z.toFixed(1)}</td>
        </tr>`;
      });
      
      html += `</table>`;
      arrowInfoElem.innerHTML = html;
    }
    
    debugLog("UI updated with Beast information");
  }
  
  /**
   * Highlight a specific arrow for debugging
   * @param {number} arrowId - The ID of the arrow to highlight
   */
  highlightArrow(arrowId) {
    if (!this.currentBeast || !this.currentBeast.directionalArrows) return;
    
    this.currentBeast.directionalArrows.forEach(arrow => {
      // Reset all arrows to default color
      arrow.mesh.material.color.set(0xffcc00);
      arrow.mesh.material.emissive.set(0x996600);
      
      // Highlight the selected arrow
      if (arrow.directionId === arrowId) {
        arrow.mesh.material.color.set(0xff0000);
        arrow.mesh.material.emissive.set(0xff0000);
        
        // Log details about this arrow
        debugLog(`Highlighted arrow #${arrowId}:`, {
          direction: arrow.direction,
          coordinates: arrow.coordinates,
          target: {
            x: arrow.targetPosition.x.toFixed(2),
            y: arrow.targetPosition.y.toFixed(2),
            z: arrow.targetPosition.z.toFixed(2)
          }
        });
      }
    });
  }
}

// Make ArrowDebugger globally available for console debugging
window.ArrowDebugger = ArrowDebugger;
