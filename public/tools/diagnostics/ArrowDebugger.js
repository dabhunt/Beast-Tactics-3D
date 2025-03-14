/**
 * ArrowDebugger.js - Tool for debugging directional arrows in beast movement
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

/**
 * Debug logging helper
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (data) {
    console.log(`[ARROW-DEBUG] ${message}`, data);
  } else {
    console.log(`[ARROW-DEBUG] ${message}`);
  }
}

/**
 * Class for debugging directional arrows in beast movement
 */
export class ArrowDebugger {
  /**
   * Create a new arrow debugger
   */
  constructor() {
    debugLog("Initializing arrow debugger tool");

    // Beast reference
    this.beast = null;

    // UI elements
    this.panel = null;
    this.arrowInfo = {};

    // Create UI
    this._createDebugPanel();

    // Default settings
    this.settings = {
      enabled: true,
      showArrowNumbers: true,
      showVectors: true,
      highlightOnHover: true
    };

    debugLog("Arrow debugger initialized with default settings");
  }

  /**
   * Create the debug panel UI
   * @private
   */
  _createDebugPanel() {
    debugLog("Creating arrow debug panel");

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'arrow-debugger-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      max-height: 500px;
      overflow-y: auto;
      display: none;
    `;

    // Create header
    const header = document.createElement('div');
    header.innerHTML = '<h3 style="margin-top: 0">Arrow Debugger</h3>';
    this.panel.appendChild(header);

    // Create content section
    const content = document.createElement('div');
    content.id = 'arrow-debugger-content';
    this.panel.appendChild(content);

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug Visuals';
    toggleButton.style.cssText = 'margin: 5px 0; padding: 5px;';
    toggleButton.addEventListener('click', () => {
      this.toggleDebugVisuals();
    });
    this.panel.appendChild(toggleButton);

    // Add to document
    document.body.appendChild(this.panel);

    debugLog("Arrow debug panel ready");
  }

  /**
   * Set the beast to debug
   * @param {Object} beast - The beast instance to debug
   */
  setBeast(beast) {
    if (!beast) {
      debugLog("Cannot set beast: Invalid beast object");
      return;
    }

    this.beast = beast;
    debugLog("Set beast for debugging:", beast.type);

    // Update UI with arrow information
    this._updateArrowInfo();
  }

  /**
   * Update the arrow information in the UI
   * @private
   */
  _updateArrowInfo() {
    if (!this.beast || !this.beast.directionalArrows) {
      return;
    }

    const content = document.getElementById('arrow-debugger-content');
    if (!content) return;

    // Clear existing content
    content.innerHTML = '';

    // Add beast information
    const beastInfo = document.createElement('div');
    beastInfo.innerHTML = `
      <div><strong>Beast Type:</strong> ${this.beast.type}</div>
      <div><strong>Position:</strong> (${this.beast.position.x.toFixed(1)}, ${this.beast.position.y.toFixed(1)}, ${this.beast.position.z.toFixed(1)})</div>
      <div><strong>Arrows:</strong> ${this.beast.directionalArrows.length}</div>
    `;
    content.appendChild(beastInfo);

    // Add arrow information
    const arrowsContainer = document.createElement('div');
    arrowsContainer.innerHTML = '<h4>Directional Arrows</h4>';

    this.beast.directionalArrows.forEach((arrow, index) => {
      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'arrow-info';
      arrowDiv.dataset.arrowId = arrow.directionId;
      arrowDiv.style.cssText = 'margin: 5px 0; padding: 5px; border: 1px solid #555;';

      arrowDiv.innerHTML = `
        <div><strong>ID:</strong> ${arrow.directionId}</div>
        <div><strong>Direction:</strong> ${arrow.direction}</div>
        <div><strong>Coords:</strong> q=${arrow.coordinates.q}, r=${arrow.coordinates.r}</div>
        <div><strong>Target Pos:</strong> (${arrow.targetPosition.x.toFixed(1)}, 
                                         ${arrow.targetPosition.y.toFixed(1)}, 
                                         ${arrow.targetPosition.z.toFixed(1)})</div>
      `;

      // Add highlight button
      const highlightBtn = document.createElement('button');
      highlightBtn.textContent = 'Highlight';
      highlightBtn.style.margin = '5px 0';
      highlightBtn.addEventListener('click', () => {
        this.highlightArrow(arrow.directionId);
      });
      arrowDiv.appendChild(highlightBtn);

      arrowsContainer.appendChild(arrowDiv);

      // Store reference to the div for later highlighting
      this.arrowInfo[arrow.directionId] = arrowDiv;
    });

    content.appendChild(arrowsContainer);
  }

  /**
   * Show the debug panel
   */
  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
      debugLog("Arrow debug panel shown");
    }
  }

  /**
   * Hide the debug panel
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
      debugLog("Arrow debug panel hidden");
    }
  }

  /**
   * Toggle visibility of debug visuals
   */
  toggleDebugVisuals() {
    if (!this.beast || !this.beast.toggleDebugVisualization) {
      debugLog("Cannot toggle debug visuals: No beast or missing method");
      return;
    }

    this.settings.enabled = !this.settings.enabled;
    this.beast.toggleDebugVisualization(this.settings.enabled);
    debugLog(`Debug visuals ${this.settings.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Highlight a specific arrow in both the UI and the 3D scene
   * @param {number} arrowId - ID of the arrow to highlight
   */
  highlightArrow(arrowId) {
    debugLog(`Highlighting arrow ${arrowId}`);

    // Highlight in UI
    if (this.arrowInfo[arrowId]) {
      // Reset all arrow elements
      Object.values(this.arrowInfo).forEach(div => {
        div.style.backgroundColor = 'transparent';
      });

      // Highlight this arrow
      this.arrowInfo[arrowId].style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
    }

    // Highlight in 3D scene
    if (this.beast && this.beast.directionalArrows) {
      const arrow = this.beast.directionalArrows.find(a => a.directionId === arrowId);

      if (arrow && arrow.mesh) {
        // Store original material
        if (!arrow.mesh.originalMaterial) {
          arrow.mesh.originalMaterial = arrow.mesh.material.clone();
        }

        // Apply highlight material
        arrow.mesh.material = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff5500,
          transparent: true,
          opacity: 0.8
        });

        // Reset after a short delay
        setTimeout(() => {
          if (arrow.mesh && arrow.mesh.originalMaterial) {
            arrow.mesh.material = arrow.mesh.originalMaterial;
          }
        }, 2000);
      }
    }
  }
}

// Create singleton instance for global access
let instance = null;

export function getArrowDebugger() {
  if (!instance) {
    instance = new ArrowDebugger();

    // Make it globally accessible for console debugging
    window.arrowDebugger = instance;
  }

  return instance;
}

// Check for existing beast to connect to
debugLog("Checking for existing beast to connect to");
if (window.gameDebugMenu && window.gameDebugMenu.getCurrentBeast) {
  const existingBeast = window.gameDebugMenu.getCurrentBeast();
  if (existingBeast) {
    getArrowDebugger().setBeast(existingBeast);
  }
}