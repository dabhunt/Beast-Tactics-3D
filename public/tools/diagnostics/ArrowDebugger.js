
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
      valueDisplay.textContent = parseFloat(range.value).toFixed(2);

      // Update settings in real-time if it's a direction angle setting
      if (name.startsWith('directionAngle_')) {
        const direction = name.split('_')[1];
        this.settings.directionOffsets[direction].angle = parseFloat(range.value);
        this.applyChanges();
      }
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
