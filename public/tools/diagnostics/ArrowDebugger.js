/**
 * ArrowDebugger.js - Interactive debugging tool for beast arrow positioning
 * 
 * This utility creates a specialized UI for adjusting arrow positions and rotations
 * to help visualize and debug the directional arrows around beasts.
 */

/**
 * Class for debugging arrow positioning around beasts
 */
export class ArrowDebugger {
  /**
   * Create a new ArrowDebugger instance
   * @param {Object} beast - The beast object to debug arrows for
   * @param {HTMLElement} container - The container element for the UI
   */
  constructor(beast, container) {
    console.log("[ARROW_DEBUGGER] Initializing with beast:", beast);
    
    this.beast = beast;
    this.container = container;
    
    // Default arrow adjustment settings
    this.settings = {
      distance: 1.2,
      yPosition: 0.7,
      angleOffsets: [0, 0, 0, 0, 0, 0] // One per arrow
    };
    
    // Store references to UI elements
    this.elements = {};
    
    // Create UI
    this._createUI();
    
    console.log("[ARROW_DEBUGGER] Initialization complete");
  }
  
  /**
   * Update the beast reference
   * @param {Object} beast - New beast object to debug
   */
  setBeast(beast) {
    console.log("[ARROW_DEBUGGER] Updating beast reference:", beast);
    
    if (!beast) {
      console.error("[ARROW_DEBUGGER] Invalid beast object provided");
      this._showError("Invalid beast object provided");
      return;
    }
    
    this.beast = beast;
    this._updateArrowInfo();
  }
  
  /**
   * Create the debugging UI
   * @private
   */
  _createUI() {
    console.log("[ARROW_DEBUGGER] Creating UI in container:", this.container);
    
    try {
      if (!this.container) {
        throw new Error("No container element provided");
      }
      
      // Create main panel
      const panel = document.createElement("div");
      panel.className = "arrow-debugger-panel";
      panel.style.padding = "10px";
      
      // Create title
      const title = document.createElement("h3");
      title.textContent = "Beast Arrow Debugger";
      title.style.marginTop = "0";
      panel.appendChild(title);
      
      // Create status info section
      const infoSection = document.createElement("div");
      infoSection.className = "arrow-debugger-info";
      infoSection.style.marginBottom = "15px";
      infoSection.style.padding = "8px";
      infoSection.style.backgroundColor = "#222";
      infoSection.style.borderRadius = "4px";
      infoSection.style.fontSize = "13px";
      
      // Info panel content
      this.elements.infoPanel = infoSection;
      this._updateArrowInfo();
      
      panel.appendChild(infoSection);
      
      // Create controls section
      this._createControlPanel(panel);
      
      // Add to container
      this.container.appendChild(panel);
      
      console.log("[ARROW_DEBUGGER] UI creation complete");
    } catch (err) {
      console.error("[ARROW_DEBUGGER] Error creating UI:", err);
      this._showError(`Failed to create UI: ${err.message}`);
    }
  }
  
  /**
   * Create the control panel section
   * @param {HTMLElement} parent - Parent element
   * @private 
   */
  _createControlPanel(parent) {
    console.log("[ARROW_DEBUGGER] Creating control panel");
    
    // Create control section
    const controlSection = document.createElement("div");
    controlSection.className = "arrow-debugger-controls";
    
    // Global controls
    this._createGlobalControls(controlSection);
    
    // Direction-specific controls
    this._createDirectionControls(controlSection);
    
    // Apply changes button
    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply Changes";
    applyButton.style.width = "100%";
    applyButton.style.padding = "8px";
    applyButton.style.marginTop = "15px";
    applyButton.style.backgroundColor = "#4CAF50";
    applyButton.style.color = "white";
    applyButton.style.border = "none";
    applyButton.style.borderRadius = "4px";
    applyButton.style.cursor = "pointer";
    
    applyButton.addEventListener("click", () => {
      this._applyChanges();
    });
    
    controlSection.appendChild(applyButton);
    parent.appendChild(controlSection);
  }
  
  /**
   * Create global arrow controls (distance, height)
   * @param {HTMLElement} parent - Parent element
   * @private
   */
  _createGlobalControls(parent) {
    // Create global section
    const globalSection = document.createElement("div");
    globalSection.style.marginBottom = "15px";
    globalSection.style.padding = "10px";
    globalSection.style.backgroundColor = "#333";
    globalSection.style.borderRadius = "4px";
    
    // Title
    const title = document.createElement("h4");
    title.textContent = "Global Arrow Settings";
    title.style.margin = "0 0 10px 0";
    globalSection.appendChild(title);
    
    // Create distance slider
    const distanceContainer = document.createElement("div");
    distanceContainer.style.marginBottom = "10px";
    
    const distanceLabel = document.createElement("label");
    distanceLabel.textContent = "Arrow Distance: ";
    distanceLabel.htmlFor = "arrow-distance";
    distanceContainer.appendChild(distanceLabel);
    
    const distanceValue = document.createElement("span");
    distanceValue.textContent = this.settings.distance.toFixed(1);
    distanceValue.style.float = "right";
    distanceLabel.appendChild(distanceValue);
    
    const distanceSlider = document.createElement("input");
    distanceSlider.type = "range";
    distanceSlider.id = "arrow-distance";
    distanceSlider.min = "0.5";
    distanceSlider.max = "3.0";
    distanceSlider.step = "0.1";
    distanceSlider.value = this.settings.distance;
    distanceSlider.style.width = "100%";
    
    distanceSlider.addEventListener("input", () => {
      const value = parseFloat(distanceSlider.value);
      distanceValue.textContent = value.toFixed(1);
      this.settings.distance = value;
    });
    
    distanceContainer.appendChild(distanceSlider);
    globalSection.appendChild(distanceContainer);
    
    // Create height slider
    const heightContainer = document.createElement("div");
    
    const heightLabel = document.createElement("label");
    heightLabel.textContent = "Arrow Height: ";
    heightLabel.htmlFor = "arrow-height";
    heightContainer.appendChild(heightLabel);
    
    const heightValue = document.createElement("span");
    heightValue.textContent = this.settings.yPosition.toFixed(1);
    heightValue.style.float = "right";
    heightLabel.appendChild(heightValue);
    
    const heightSlider = document.createElement("input");
    heightSlider.type = "range";
    heightSlider.id = "arrow-height";
    heightSlider.min = "0.1";
    heightSlider.max = "2.0";
    heightSlider.step = "0.1";
    heightSlider.value = this.settings.yPosition;
    heightSlider.style.width = "100%";
    
    heightSlider.addEventListener("input", () => {
      const value = parseFloat(heightSlider.value);
      heightValue.textContent = value.toFixed(1);
      this.settings.yPosition = value;
    });
    
    heightContainer.appendChild(heightSlider);
    globalSection.appendChild(heightContainer);
    
    parent.appendChild(globalSection);
  }
  
  /**
   * Create direction-specific controls for each arrow
   * @param {HTMLElement} parent - Parent element
   * @private
   */
  _createDirectionControls(parent) {
    // Create direction section
    const directionSection = document.createElement("div");
    directionSection.style.padding = "10px";
    directionSection.style.backgroundColor = "#333";
    directionSection.style.borderRadius = "4px";
    
    // Title
    const title = document.createElement("h4");
    title.textContent = "Direction-Specific Adjustments";
    title.style.margin = "0 0 10px 0";
    directionSection.appendChild(title);
    
    // Direction names
    const directions = ["E", "NE", "NW", "W", "SW", "SE"];
    
    // Create controls for each direction
    directions.forEach((dir, index) => {
      const container = document.createElement("div");
      container.style.marginBottom = index < directions.length - 1 ? "10px" : "0";
      
      const label = document.createElement("label");
      label.textContent = `${dir} Angle Offset: `;
      label.htmlFor = `arrow-angle-${dir}`;
      container.appendChild(label);
      
      const value = document.createElement("span");
      value.textContent = "0°";
      value.style.float = "right";
      label.appendChild(value);
      
      const slider = document.createElement("input");
      slider.type = "range";
      slider.id = `arrow-angle-${dir}`;
      slider.min = "-180";
      slider.max = "180";
      slider.step = "5";
      slider.value = "0";
      slider.style.width = "100%";
      
      slider.addEventListener("input", () => {
        const degrees = parseInt(slider.value);
        value.textContent = `${degrees}°`;
        this.settings.angleOffsets[index] = degrees * (Math.PI / 180); // Convert to radians
      });
      
      container.appendChild(slider);
      directionSection.appendChild(container);
    });
    
    parent.appendChild(directionSection);
  }
  
  /**
   * Apply the current settings to the beast's arrows
   * @private
   */
  _applyChanges() {
    console.log("[ARROW_DEBUGGER] Applying arrow changes:", this.settings);
    
    try {
      if (!this.beast || !this.beast.directionalArrows) {
        throw new Error("Beast or directional arrows not available");
      }
      
      // Get the beast's hexDirections
      const hexDirections = this.beast.hexDirections;
      if (!hexDirections) {
        throw new Error("Beast's hexDirections not available");
      }
      
      // Apply changes to each arrow
      this.beast.directionalArrows.forEach((arrow, index) => {
        if (!arrow.mesh) {
          console.warn(`[ARROW_DEBUGGER] Arrow ${index} mesh not found`);
          return;
        }
        
        // Get base angle from hex directions
        const baseAngle = hexDirections[index].angle;
        
        // Apply offset angle
        const finalAngle = baseAngle + this.settings.angleOffsets[index];
        
        // Calculate new position with current distance setting
        const x = this.settings.distance * Math.cos(finalAngle);
        const z = this.settings.distance * Math.sin(finalAngle);
        
        // Update arrow position
        arrow.mesh.position.set(
          x,
          this.settings.yPosition,
          z
        );
        
        // Update arrow rotation 
        // Calculate rotation
        const xAxis = new THREE.Vector3(1, 0, 0);
        const yAxis = new THREE.Vector3(0, 1, 0);
        
        // Create rotation quaternion
        const quaternion = new THREE.Quaternion();
        
        // Apply X rotation first (90 degrees to make horizontal)
        quaternion.setFromAxisAngle(xAxis, Math.PI / 2);
        
        // Create temporary quaternion for Y rotation
        const yRotation = new THREE.Quaternion();
        yRotation.setFromAxisAngle(yAxis, finalAngle);
        
        // Combine rotations
        quaternion.premultiply(yRotation);
        
        // Apply the combined rotation
        arrow.mesh.setRotationFromQuaternion(quaternion);
        
        console.log(`[ARROW_DEBUGGER] Updated arrow ${index} (${arrow.direction}):`, {
          position: {x, y: this.settings.yPosition, z},
          angle: (finalAngle * 180 / Math.PI).toFixed(1) + '°',
          baseAngle: (baseAngle * 180 / Math.PI).toFixed(1) + '°',
          offset: (this.settings.angleOffsets[index] * 180 / Math.PI).toFixed(1) + '°'
        });
      });
      
      console.log("[ARROW_DEBUGGER] All arrow changes applied");
    } catch (err) {
      console.error("[ARROW_DEBUGGER] Error applying changes:", err);
      this._showError(`Failed to apply changes: ${err.message}`);
    }
  }
  
  /**
   * Update the arrow information display
   * @private
   */
  _updateArrowInfo() {
    console.log("[ARROW_DEBUGGER] Updating arrow information display");
    
    try {
      if (!this.elements.infoPanel) return;
      
      let infoContent = "";
      
      if (!this.beast) {
        infoContent = `<div style="color: #ff9900;">No beast connected</div>`;
      } else if (!this.beast.directionalArrows || this.beast.directionalArrows.length === 0) {
        infoContent = `
          <div>Beast: ${this.beast.type || "Unknown"}</div>
          <div style="color: #ff9900;">No directional arrows found</div>
        `;
      } else {
        infoContent = `
          <div>Beast: ${this.beast.type || "Unknown"}</div>
          <div>Arrow count: ${this.beast.directionalArrows.length}</div>
          <div>Position: ${JSON.stringify({
            x: this.beast.group.position.x.toFixed(1),
            y: this.beast.group.position.y.toFixed(1),
            z: this.beast.group.position.z.toFixed(1)
          })}</div>
        `;
      }
      
      this.elements.infoPanel.innerHTML = infoContent;
    } catch (err) {
      console.error("[ARROW_DEBUGGER] Error updating info panel:", err);
    }
  }
  
  /**
   * Show an error message in the container
   * @param {string} message - Error message
   * @private
   */
  _showError(message) {
    console.error("[ARROW_DEBUGGER] " + message);
    
    if (!this.container) return;
    
    const errorElement = document.createElement("div");
    errorElement.style.color = "red";
    errorElement.style.padding = "10px";
    errorElement.style.backgroundColor = "rgba(255,0,0,0.1)";
    errorElement.style.borderRadius = "4px";
    errorElement.style.marginBottom = "10px";
    errorElement.textContent = message;
    
    // Add to top of container
    if (this.container.firstChild) {
      this.container.insertBefore(errorElement, this.container.firstChild);
    } else {
      this.container.appendChild(errorElement);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);
  }
}

class ArrowDebugger {
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

// Export the class
export { ArrowDebugger };