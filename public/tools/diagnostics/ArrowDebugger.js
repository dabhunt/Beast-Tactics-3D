/**
 * ArrowDebugger.js - Tool for debugging directional movement arrows
 * 
 * This tool helps visualize and test the directional movement arrows
 * used by the Beast entity for movement around the hex grid.
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
 * ArrowDebugger class for testing and visualizing beast movement arrows
 */
export class ArrowDebugger {
  /**
   * Create a new ArrowDebugger instance
   * @param {THREE.Scene} scene - The THREE.js scene
   */
  constructor(scene) {
    debugLog("Initializing arrow debugger tool");

    this.scene = scene;
    this.beast = null;
    this.selectedArrow = null;
    this.highlightedArrows = [];
    this.debugObjects = [];

    // Track original materials for restoring after highlight
    this.originalMaterials = new Map();

    // Create UI for debugging arrows
    this._createDebugPanel();

    debugLog("Arrow debugger initialized with default settings");
  }

  /**
   * Create debugging UI panel
   * @private
   */
  _createDebugPanel() {
    debugLog("Creating arrow debug panel");

    // Create debug panel container
    this.panel = document.createElement('div');
    this.panel.id = 'arrow-debug-panel';
    this.panel.style.position = 'absolute';
    this.panel.style.top = '80px';
    this.panel.style.right = '10px';
    this.panel.style.width = '250px';
    this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.panel.style.color = 'white';
    this.panel.style.padding = '10px';
    this.panel.style.borderRadius = '5px';
    this.panel.style.fontFamily = 'monospace';
    this.panel.style.fontSize = '12px';
    this.panel.style.zIndex = '1000';
    this.panel.style.display = 'none'; // Hidden by default

    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Arrow Debugger';
    title.style.margin = '0 0 10px 0';
    this.panel.appendChild(title);

    // Add content container
    this.content = document.createElement('div');
    this.panel.appendChild(this.content);

    // Create status display
    this.statusDisplay = document.createElement('div');
    this.statusDisplay.innerHTML = 'No beast connected';
    this.content.appendChild(this.statusDisplay);

    // Add arrow information section
    this.arrowInfo = document.createElement('div');
    this.arrowInfo.style.marginTop = '10px';
    this.arrowInfo.innerHTML = 'Select an arrow to see details';
    this.content.appendChild(this.arrowInfo);

    // Create arrow selector
    this.arrowSelector = document.createElement('div');
    this.arrowSelector.style.marginTop = '10px';
    this.content.appendChild(this.arrowSelector);

    // Add controls
    const controls = document.createElement('div');
    controls.style.marginTop = '15px';

    // Toggle visibility button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug Visuals';
    toggleButton.style.marginRight = '10px';
    toggleButton.style.padding = '5px';
    toggleButton.style.backgroundColor = '#555';
    toggleButton.style.border = 'none';
    toggleButton.style.color = 'white';
    toggleButton.style.borderRadius = '3px';
    toggleButton.onclick = () => this.toggleDebugVisuals();
    controls.appendChild(toggleButton);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '5px';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.borderRadius = '3px';
    closeButton.onclick = () => this.hidePanel();
    controls.appendChild(closeButton);

    this.content.appendChild(controls);

    // Add to document
    document.body.appendChild(this.panel);

    debugLog("Arrow debug panel ready");
  }

  /**
   * Connect a beast to the debugger
   * @param {Beast} beast - The beast entity with directional arrows
   */
  setBeast(beast) {
    debugLog("Setting beast reference", {
      beastType: beast?.type || 'undefined',
      hasArrows: beast?.directionalArrows?.length > 0
    });

    this.beast = beast;
    this.updatePanel();

    // Make the debugger available globally
    window.arrowDebugger = this;
  }

  /**
   * Update the debug panel with current beast information
   */
  updatePanel() {
    if (!this.beast) {
      this.statusDisplay.innerHTML = 'No beast connected';
      return;
    }

    // Update status display
    this.statusDisplay.innerHTML = `
      <div><strong>Beast:</strong> ${this.beast.type}</div>
      <div><strong>Position:</strong> (${this.beast.group.position.x.toFixed(1)}, 
                                      ${this.beast.group.position.y.toFixed(1)}, 
                                      ${this.beast.group.position.z.toFixed(1)})</div>
      <div><strong>Hex:</strong> q=${this.beast.currentAxialPos?.q || '?'}, 
                                r=${this.beast.currentAxialPos?.r || '?'}</div>
      <div><strong>Arrows:</strong> ${this.beast.directionalArrows?.length || 0}</div>
    `;

    // Clear previous arrow selector
    this.arrowSelector.innerHTML = '';

    // Create selector buttons for each arrow
    if (this.beast.directionalArrows && this.beast.directionalArrows.length > 0) {
      const label = document.createElement('div');
      label.textContent = 'Highlight arrow:';
      label.style.marginBottom = '5px';
      this.arrowSelector.appendChild(label);

      // Create a button grid for arrows
      const buttonGrid = document.createElement('div');
      buttonGrid.style.display = 'grid';
      buttonGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      buttonGrid.style.gap = '5px';

      this.beast.directionalArrows.forEach(arrow => {
        const button = document.createElement('button');
        button.textContent = arrow.directionId;
        button.style.padding = '5px';
        button.style.backgroundColor = '#333';
        button.style.border = '1px solid #555';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.onclick = () => this.highlightArrow(arrow.directionId);
        buttonGrid.appendChild(button);
      });

      this.arrowSelector.appendChild(buttonGrid);
    }
  }

  /**
   * Highlight a specific arrow by ID
   * @param {number} arrowId - The ID of the arrow to highlight
   */
  highlightArrow(arrowId) {
    debugLog(`Highlighting arrow ${arrowId}`);

    if (!this.beast || !this.beast.directionalArrows) {
      console.warn('[ARROW-DEBUG] Cannot highlight arrow: No beast or arrows available');
      return;
    }

    // Reset previously highlighted arrows
    this.resetHighlightedArrows();

    // Find the target arrow
    const targetArrow = this.beast.directionalArrows.find(
      arrow => arrow.directionId === arrowId
    );

    if (!targetArrow) {
      console.warn(`[ARROW-DEBUG] Arrow with ID ${arrowId} not found`);
      return;
    }

    // Store original material
    this.originalMaterials.set(targetArrow.mesh.id, targetArrow.mesh.material);

    // Create highlight material
    const highlightMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff5500,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    // Apply highlight material
    targetArrow.mesh.material = highlightMaterial;

    // Store as highlighted
    this.highlightedArrows.push(targetArrow);

    // Update arrow info display
    this.arrowInfo.innerHTML = `
      <div><strong>Selected:</strong> ${targetArrow.direction} (#${targetArrow.directionId})</div>
      <div><strong>Offset:</strong> q=${targetArrow.coordinates.q}, r=${targetArrow.coordinates.r}</div>
      <div><strong>Target:</strong> (${targetArrow.targetPosition.x.toFixed(2)}, 
                                   ${targetArrow.targetPosition.y.toFixed(2)}, 
                                   ${targetArrow.targetPosition.z.toFixed(2)})</div>
    `;

    // Add visual debug elements (line to target)
    this.addDebugVisual(
      new THREE.Vector3().copy(this.beast.group.position),
      new THREE.Vector3().copy(targetArrow.targetPosition).add(this.beast.group.position)
    );

    debugLog(`Arrow ${arrowId} highlighted`, {
      direction: targetArrow.direction,
      coordinates: targetArrow.coordinates,
      targetPosition: {
        x: targetArrow.targetPosition.x.toFixed(2),
        y: targetArrow.targetPosition.y.toFixed(2),
        z: targetArrow.targetPosition.z.toFixed(2)
      }
    });
  }

  /**
   * Reset all highlighted arrows to original materials
   */
  resetHighlightedArrows() {
    this.highlightedArrows.forEach(arrow => {
      // Restore original material if available
      const originalMaterial = this.originalMaterials.get(arrow.mesh.id);
      if (originalMaterial) {
        arrow.mesh.material = originalMaterial;
      }
    });

    // Clear highlighted arrows array
    this.highlightedArrows = [];

    // Clear debug visuals
    this.clearDebugVisuals();
  }

  /**
   * Add a debug visual line between two points
   * @param {THREE.Vector3} start - Start position
   * @param {THREE.Vector3} end - End position 
   */
  addDebugVisual(start, end) {
    // Create line geometry
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    // Create line material
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });

    // Create line
    const line = new THREE.Line(geometry, material);

    // Add to scene
    this.scene.add(line);

    // Store for later cleanup
    this.debugObjects.push(line);
  }

  /**
   * Clear all debug visuals
   */
  clearDebugVisuals() {
    this.debugObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    this.debugObjects = [];
  }

  /**
   * Toggle visibility of all debug visualizations
   */
  toggleDebugVisuals() {
    if (!this.beast) return;

    const visible = this.beast.toggleDebugVisualization();
    debugLog(`Debug visualizations ${visible ? 'enabled' : 'disabled'}`);
  }

  /**
   * Show the debug panel
   */
  showPanel() {
    this.panel.style.display = 'block';
    this.updatePanel();
  }

  /**
   * Hide the debug panel
   */
  hidePanel() {
    this.panel.style.display = 'none';
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    if (this.panel.style.display === 'none') {
      this.showPanel();
    } else {
      this.hidePanel();
    }
  }
}