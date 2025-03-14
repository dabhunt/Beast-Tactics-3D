
/**
 * ArrowDebugger.js - Debugging tool for Beast movement arrows
 * 
 * This script creates a debugger interface for visualizing and testing
 * directional movement arrows in the Beast Tactics game.
 */

// Use export class instead of plain class to properly expose as ES module
export class ArrowDebugger {
  /**
   * Create a new ArrowDebugger instance
   * @param {THREE.Scene} scene - The THREE.js scene for visualization
   */
  constructor(scene) {
    console.log("[ARROW-DEBUG] Initializing arrow debugger tool");

    // Store reference to scene
    this.scene = scene;
    
    // Track the current beast being debugged
    this.beast = null;
    
    // Track which arrow is selected for highlighting
    this.selectedArrowId = null;
    
    // Reference to the highlight mesh
    this.highlightMesh = null;
    
    // Debug panel UI element
    this.debugPanel = null;

    // Create debug UI
    this._createDebugPanel();

    // Default settings
    this.settings = {
      highlightColor: 0xff0000,
      showLabels: true,
      showVectors: true,
      showHexTargets: true
    };

    console.log("[ARROW-DEBUG] Arrow debugger initialized with default settings");
  }

  /**
   * Create the debug panel UI
   * @private
   */
  _createDebugPanel() {
    console.log("[ARROW-DEBUG] Creating arrow debug panel");

    // Create main container
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'arrow-debugger';
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 280px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-height: 90vh;
      overflow-y: auto;
      pointer-events: auto;
      display: none;
    `;

    // Create header
    const header = document.createElement('div');
    header.innerHTML = '<b>Arrow Debugger</b>';
    header.style.marginBottom = '8px';
    header.style.borderBottom = '1px solid #666';
    header.style.paddingBottom = '5px';
    this.debugPanel.appendChild(header);

    // Create content container
    const content = document.createElement('div');
    content.id = 'arrow-debug-content';
    content.innerHTML = '<div>No beast connected</div>';
    this.debugPanel.appendChild(content);

    // Create control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';

    // Toggle visibility button
    const toggleVisibilityBtn = document.createElement('button');
    toggleVisibilityBtn.textContent = 'Toggle Debug Visuals';
    toggleVisibilityBtn.onclick = () => this.toggleDebugVisuals();
    toggleVisibilityBtn.style.padding = '5px';
    buttonContainer.appendChild(toggleVisibilityBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => this.hideDebugPanel();
    closeBtn.style.padding = '5px';
    buttonContainer.appendChild(closeBtn);

    this.debugPanel.appendChild(buttonContainer);

    // Add to document
    document.body.appendChild(this.debugPanel);

    console.log("[ARROW-DEBUG] Arrow debug panel ready");
  }

  /**
   * Show the debug panel
   */
  showDebugPanel() {
    if (this.debugPanel) {
      this.debugPanel.style.display = 'block';
      this._updateDebugContent();
      console.log("[ARROW-DEBUG] Debug panel shown");
    }
  }

  /**
   * Hide the debug panel
   */
  hideDebugPanel() {
    if (this.debugPanel) {
      this.debugPanel.style.display = 'none';
      console.log("[ARROW-DEBUG] Debug panel hidden");
    }
  }

  /**
   * Toggle the visibility of the debug panel
   */
  toggleDebugPanel() {
    if (this.debugPanel.style.display === 'none') {
      this.showDebugPanel();
    } else {
      this.hideDebugPanel();
    }
  }

  /**
   * Toggle debug visuals (labels, vectors, etc.)
   */
  toggleDebugVisuals() {
    if (!this.beast) {
      console.warn("[ARROW-DEBUG] No beast connected, cannot toggle visuals");
      return;
    }

    // Toggle visibility using the beast's helper function
    if (this.beast.toggleDebugVisualization) {
      const currentState = this.beast.debugObjects?.directionLabels?.[0]?.visible || false;
      this.beast.toggleDebugVisualization(!currentState);
      console.log(`[ARROW-DEBUG] Debug visuals ${!currentState ? 'enabled' : 'disabled'}`);
    } else {
      console.warn("[ARROW-DEBUG] Beast doesn't have debug visualization toggle");
    }
  }

  /**
   * Set the beast to debug
   * @param {Beast} beast - The beast instance to debug
   */
  setBeast(beast) {
    console.log("[ARROW-DEBUG] Setting beast for debugging:", beast?.type || 'undefined');

    this.beast = beast;
    this._updateDebugContent();

    // Clean up previous highlight if any
    this._removeHighlight();
  }

  /**
   * Highlight a specific arrow by ID
   * @param {number} arrowId - The ID of the arrow to highlight
   */
  highlightArrow(arrowId) {
    console.log(`[ARROW-DEBUG] Highlighting arrow #${arrowId}`);

    if (!this.beast) {
      console.warn("[ARROW-DEBUG] No beast connected, cannot highlight arrow");
      return;
    }

    // Clean up previous highlight
    this._removeHighlight();

    // Find the arrow in the beast's directional arrows
    const arrow = this.beast.directionalArrows.find(a => a.directionId === arrowId);

    if (!arrow) {
      console.warn(`[ARROW-DEBUG] Arrow #${arrowId} not found`);
      return;
    }

    // Store selected arrow
    this.selectedArrowId = arrowId;

    // Create highlight mesh
    this._createHighlight(arrow.mesh);

    // Update debug panel content to show selection
    this._updateDebugContent();

    // Show debug panel if it's hidden
    this.showDebugPanel();
  }

  /**
   * Create a highlight mesh around the selected arrow
   * @param {THREE.Mesh} arrowMesh - The arrow mesh to highlight
   * @private
   */
  _createHighlight(arrowMesh) {
    if (!arrowMesh) return;

    // We need THREE.js for this function
    import("https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js").then(THREE => {
      // Create a box geometry slightly larger than the arrow
      const boundingBox = new THREE.Box3().setFromObject(arrowMesh);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
  
      // Add some padding
      size.x += 0.1;
      size.y += 0.1;
      size.z += 0.1;
  
      // Create highlight mesh
      const highlightGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: this.settings.highlightColor,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
  
      this.highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
  
      // Position highlight to match arrow
      this.highlightMesh.position.copy(arrowMesh.position);
      this.highlightMesh.rotation.copy(arrowMesh.rotation);
  
      // Add to scene
      this.scene.add(this.highlightMesh);
  
      // Pulse animation
      this._animateHighlight();
    }).catch(err => {
      console.error("[ARROW-DEBUG] Failed to import THREE.js for highlight creation:", err);
    });
  }

  /**
   * Animate the highlight mesh for better visibility
   * @private
   */
  _animateHighlight() {
    if (!this.highlightMesh) return;

    // Pulse opacity animation
    const startTime = Date.now();
    const animate = () => {
      if (!this.highlightMesh) return;

      const elapsedTime = Date.now() - startTime;
      const opacity = 0.3 + 0.5 * Math.sin(elapsedTime * 0.005);

      this.highlightMesh.material.opacity = opacity;

      // Continue animation
      requestAnimationFrame(animate);
    };

    // Start animation
    animate();
  }

  /**
   * Remove the highlight mesh
   * @private
   */
  _removeHighlight() {
    if (this.highlightMesh) {
      this.scene.remove(this.highlightMesh);

      // Properly dispose of resources
      if (this.highlightMesh.geometry) {
        this.highlightMesh.geometry.dispose();
      }

      if (this.highlightMesh.material) {
        this.highlightMesh.material.dispose();
      }

      this.highlightMesh = null;
    }

    this.selectedArrowId = null;
  }

  /**
   * Update the debug panel content with current arrow information
   * @private
   */
  _updateDebugContent() {
    const content = document.getElementById('arrow-debug-content');
    if (!content) return;

    if (!this.beast) {
      content.innerHTML = '<div>No beast connected</div>';
      return;
    }

    let html = `<div>Beast: ${this.beast.type} at position: 
      X:${this.beast.position.x.toFixed(1)}, 
      Y:${this.beast.position.y.toFixed(1)}, 
      Z:${this.beast.position.z.toFixed(1)}</div>
      <div>Hex coordinates: Q:${this.beast.currentAxialPos?.q || '?'}, R:${this.beast.currentAxialPos?.r || '?'}</div>
      <div>Arrows:</div>`;

    // Add arrow information
    if (this.beast.directionalArrows && this.beast.directionalArrows.length > 0) {
      html += '<table style="width:100%; font-size:10px; margin-top:5px;">';
      html += '<tr><th>ID</th><th>Direction</th><th>Target</th></tr>';

      this.beast.directionalArrows.forEach(arrow => {
        const isSelected = arrow.directionId === this.selectedArrowId;
        const style = isSelected ? 'background-color:#550000; font-weight:bold;' : '';

        html += `<tr style="${style}">
          <td>${arrow.directionId}</td>
          <td>${arrow.direction}</td>
          <td>Q:${arrow.coordinates?.q || '?'}, R:${arrow.coordinates?.r || '?'}</td>
        </tr>`;
      });

      html += '</table>';

      // Add detailed info for selected arrow
      if (this.selectedArrowId !== null) {
        const selectedArrow = this.beast.directionalArrows.find(a => a.directionId === this.selectedArrowId);

        if (selectedArrow) {
          html += `<div style="margin-top:10px; border-top:1px solid #666; padding-top:5px;">
            <b>Selected: Arrow #${selectedArrow.directionId} (${selectedArrow.direction})</b><br>
            Position: X:${selectedArrow.mesh.position.x.toFixed(2)}, Y:${selectedArrow.mesh.position.y.toFixed(2)}, Z:${selectedArrow.mesh.position.z.toFixed(2)}<br>
            Target: Q:${selectedArrow.coordinates?.q || '?'}, R:${selectedArrow.coordinates?.r || '?'}<br>
            Target Pos: X:${selectedArrow.targetPosition?.x.toFixed(2) || '?'}, Y:${selectedArrow.targetPosition?.y.toFixed(2) || '?'}, Z:${selectedArrow.targetPosition?.z.toFixed(2) || '?'}
          </div>`;
        }
      }
    } else {
      html += '<div>No arrows found</div>';
    }

    content.innerHTML = html;
  }

  /**
   * Update the debugger when the game updates
   * Called from animation loop
   */
  update() {
    // Update highlight position if arrow moved
    if (this.highlightMesh && this.selectedArrowId !== null && this.beast) {
      const arrow = this.beast.directionalArrows?.find(a => a.directionId === this.selectedArrowId);
      if (arrow && arrow.mesh) {
        this.highlightMesh.position.copy(arrow.mesh.position);
        this.highlightMesh.rotation.copy(arrow.mesh.rotation);
      }
    }
  }
}
