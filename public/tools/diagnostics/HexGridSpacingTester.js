
/**
 * HexGridSpacingTester.js
 * A diagnostic tool to test and visualize different spacing parameters
 * for hexagonal grids to ensure they fit together seamlessly.
 * 
 * This tool allows interactive adjustment of spacing parameters
 * to find the optimal values for the hex grid.
 */

console.log('[HEX GRID TESTER] Starting hex grid spacing tester...');

// Add UI for the tester
function createHexGridTesterUI() {
  // Create a container for the UI
  const uiContainer = document.createElement('div');
  uiContainer.id = 'hex-grid-tester-ui';
  uiContainer.style.position = 'absolute';
  uiContainer.style.bottom = '10px';
  uiContainer.style.left = '10px';
  uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  uiContainer.style.color = 'white';
  uiContainer.style.padding = '15px';
  uiContainer.style.borderRadius = '5px';
  uiContainer.style.fontFamily = 'monospace';
  uiContainer.style.zIndex = '1000';
  uiContainer.style.maxWidth = '400px';

  uiContainer.innerHTML = `
    <h3>Hex Grid Spacing Tester</h3>
    
    <div>
      <label for="hex-h-spacing">Horizontal Spacing Multiplier: <span id="h-spacing-value">1.5</span></label>
      <input type="range" id="hex-h-spacing" min="1.0" max="2.0" step="0.05" value="1.5">
    </div>
    
    <div>
      <label for="hex-v-spacing">Vertical Spacing Factor: <span id="v-spacing-value">1.0</span></label>
      <input type="range" id="hex-v-spacing" min="0.8" max="1.2" step="0.05" value="1.0">
    </div>
    
    <div style="margin-top: 10px;">
      <button id="test-grid-button">Regenerate Grid</button>
      <button id="toggle-grid-lines">Toggle Grid Lines</button>
    </div>
    
    <div style="margin-top: 10px;">
      <p id="current-spacing-values">Current: h=1.5, v=1.0</p>
    </div>
  `;
  
  document.body.appendChild(uiContainer);
  
  // Add event listeners
  let hSpacing = 1.5;
  let vSpacing = 1.0;
  let showGridLines = false;
  
  document.getElementById('hex-h-spacing').addEventListener('input', function(e) {
    hSpacing = parseFloat(e.target.value);
    document.getElementById('h-spacing-value').textContent = hSpacing.toFixed(2);
    updateSpacingValues();
  });
  
  document.getElementById('hex-v-spacing').addEventListener('input', function(e) {
    vSpacing = parseFloat(e.target.value);
    document.getElementById('v-spacing-value').textContent = vSpacing.toFixed(2);
    updateSpacingValues();
  });
  
  document.getElementById('test-grid-button').addEventListener('click', function() {
    applyNewSpacing(hSpacing, vSpacing);
  });
  
  document.getElementById('toggle-grid-lines').addEventListener('click', function() {
    showGridLines = !showGridLines;
    toggleGridLines(showGridLines);
  });
  
  function updateSpacingValues() {
    document.getElementById('current-spacing-values').textContent = 
      `Current: h=${hSpacing.toFixed(2)}, v=${vSpacing.toFixed(2)}`;
  }
}

// Function to apply new spacing parameters
function applyNewSpacing(hSpacingMultiplier, vSpacingFactor) {
  console.log(`[HEX GRID TESTER] Applying new spacing: h=${hSpacingMultiplier}, v=${vSpacingFactor}`);
  
  // Store the current values to be used in createHex function
  window.hexGridTesterValues = {
    hSpacing: hSpacingMultiplier,
    vSpacing: vSpacingFactor
  };
  
  // Use the existing hex grid regeneration mechanism
  if (typeof generateHexagonGrid === 'function') {
    // Modify how hexes are positioned
    window.createHexOriginal = window.createHexOriginal || createHex;
    
    // Override the createHex function temporarily
    window.createHex = function(q, r) {
      const randomElement = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      const hexMaterial = hexMaterials[randomElement] || fallbackMaterials[0];
      
      const materials = [
        edgeMaterial,
        hexMaterial,
        hexMaterial,
      ];
      
      const hex = new THREE.Mesh(hexGeometry, materials);
      
      hex.userData.element = randomElement;
      hex.userData.q = q;
      hex.userData.r = r;
      
      // Use the tester values for spacing
      const testerValues = window.hexGridTesterValues || { hSpacing: 1.5, vSpacing: 1.0 };
      const x = hexRadius * testerValues.hSpacing * q;
      const z = hexRadius * Math.sqrt(3) * testerValues.vSpacing * (r + q/2);
      
      hex.position.set(x, 0, z);
      
      debugLog(`Creating hex at (${q},${r}) with position (${x},0,${z}) - Element: ${randomElement}`);
      
      hex.rotation.x = 0;
      hex.rotation.y = Math.PI / 6;
      hex.rotation.z = 0;
      
      scene.add(hex);
      return hex;
    };
    
    // Regenerate the grid with new spacing
    generateHexagonGrid();
    
    console.log(`[HEX GRID TESTER] Grid regenerated with new spacing values`);
  } else {
    console.error('[HEX GRID TESTER] Could not find generateHexagonGrid function');
  }
}

// Function to toggle grid lines
function toggleGridLines(show) {
  console.log(`[HEX GRID TESTER] ${show ? 'Showing' : 'Hiding'} grid lines`);
  
  // Remove any existing grid lines
  const existingLines = scene.children.filter(child => child.userData.isGridLine);
  existingLines.forEach(line => scene.remove(line));
  
  if (!show) return;
  
  // Create new grid lines
  const gridRadius = 7; // Match the same radius as the hex grid
  const gridLines = [];
  
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffff00, 
    transparent: true,
    opacity: 0.3
  });
  
  // Create a line for each q-axis
  for (let q = -gridRadius; q <= gridRadius; q++) {
    const points = [];
    for (
      let r = Math.max(-gridRadius, -q - gridRadius);
      r <= Math.min(gridRadius, -q + gridRadius);
      r++
    ) {
      // Use the current test spacing values
      const testerValues = window.hexGridTesterValues || { hSpacing: 1.5, vSpacing: 1.0 };
      const x = hexRadius * testerValues.hSpacing * q;
      const z = hexRadius * Math.sqrt(3) * testerValues.vSpacing * (r + q/2);
      
      points.push(new THREE.Vector3(x, 0.1, z)); // Slightly above the hexes
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    line.userData.isGridLine = true;
    
    scene.add(line);
    gridLines.push(line);
  }
  
  console.log(`[HEX GRID TESTER] Added ${gridLines.length} grid lines`);
}

// Initialize the tester
function initHexGridTester() {
  createHexGridTesterUI();
  console.log('[HEX GRID TESTER] Hex Grid Spacing Tester initialized');
  console.log('[HEX GRID TESTER] Use the sliders to adjust spacing and click "Regenerate Grid" to apply');
}

// Wait until the page is fully loaded
if (document.readyState === 'complete') {
  initHexGridTester();
} else {
  window.addEventListener('load', initHexGridTester);
}
/**
 * HexGridSpacingTester.js - Tool for testing hexagonal grid spacing
 */

console.log("[DIAGNOSTICS] HexGridSpacingTester loaded");

// Only run diagnostic when in diagnostic mode
if (window.location.search.includes('diagnostics=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("[DIAGNOSTICS] Initializing hex grid spacing tester");
    
    const diagPanel = document.getElementById('diagnostics-panel');
    if (!diagPanel) {
      console.error("[DIAGNOSTICS] Diagnostics panel not found");
      return;
    }
    
    diagPanel.innerHTML = `
      <h3>Hex Grid Spacing Tester</h3>
      <div>
        <label>Horizontal Spacing: <span id="h-spacing-val">1.5</span></label>
        <input type="range" id="h-spacing" min="1.0" max="2.0" step="0.05" value="1.5">
      </div>
      <div>
        <label>Vertical Factor: <span id="v-factor-val">1.0</span></label>
        <input type="range" id="v-factor" min="0.8" max="1.2" step="0.05" value="1.0">
      </div>
      <button id="apply-spacing">Apply Spacing</button>
      <div id="diagnostics-log" style="margin-top: 10px; max-height: 200px; overflow-y: auto;"></div>
    `;
    
    // Log function for diagnostics
    function logDiagnostic(message) {
      const logElement = document.getElementById('diagnostics-log');
      if (logElement) {
        const time = new Date().toLocaleTimeString();
        logElement.innerHTML += `<div>[${time}] ${message}</div>`;
        logElement.scrollTop = logElement.scrollHeight;
      }
      console.log(`[DIAGNOSTICS] ${message}`);
    }
    
    logDiagnostic("Spacing tester initialized");
    
    // Setup event listeners
    const hSpacing = document.getElementById('h-spacing');
    const vFactor = document.getElementById('v-factor');
    const hSpacingVal = document.getElementById('h-spacing-val');
    const vFactorVal = document.getElementById('v-factor-val');
    const applyButton = document.getElementById('apply-spacing');
    
    if (hSpacing && vFactor && hSpacingVal && vFactorVal && applyButton) {
      hSpacing.addEventListener('input', () => {
        hSpacingVal.textContent = hSpacing.value;
      });
      
      vFactor.addEventListener('input', () => {
        vFactorVal.textContent = vFactor.value;
      });
      
      applyButton.addEventListener('click', () => {
        const horizontalSpacing = parseFloat(hSpacing.value);
        const verticalFactor = parseFloat(vFactor.value);
        
        logDiagnostic(`Applying new spacing: h=${horizontalSpacing}, v=${verticalFactor}`);
        
        // Look for the generateHexagonGrid function in the global scope
        if (typeof window.generateHexagonGrid === 'function') {
          window.generateHexagonGrid(horizontalSpacing, verticalFactor);
          logDiagnostic("Grid regenerated successfully");
        } else {
          logDiagnostic("ERROR: generateHexagonGrid function not found");
        }
      });
      
      logDiagnostic("Controls setup complete");
    } else {
      logDiagnostic("ERROR: Failed to find control elements");
    }
  });
}
