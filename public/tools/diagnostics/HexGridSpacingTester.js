
/**
 * Hex Grid Spacing Tester
 * Diagnostic tool for adjusting and testing hex grid spacing in Beast Tactics
 */

// Console tags for easier identification in logs
const LOG_TAG = "[HEX GRID TESTER]";
const WARNING_TAG = "[HEX GRID WARNING]";
const ERROR_TAG = "[HEX GRID ERROR]";
const DIAGNOSTICS_TAG = "[DIAGNOSTICS]";

// Start module with verbose logging
console.log(`${LOG_TAG} Starting hex grid spacing tester...`);

/**
 * Creates the hex grid spacing tester UI
 * @returns {HTMLElement} The tester UI panel
 */
function createTesterUI() {
  console.log(`${LOG_TAG} Creating tester UI panel`);
  
  // Create UI container
  const panel = document.createElement('div');
  panel.id = 'hex-grid-tester';
  panel.style.position = 'fixed';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.padding = '15px';
  panel.style.borderRadius = '5px';
  panel.style.fontFamily = 'monospace';
  panel.style.zIndex = '1001';
  panel.style.maxWidth = '300px';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Hex Grid Spacing Tester';
  title.style.marginTop = '0';
  panel.appendChild(title);

  // Create control for horizontal spacing
  const hSpacingContainer = document.createElement('div');
  hSpacingContainer.style.marginBottom = '10px';
  
  const hSpacingLabel = document.createElement('label');
  hSpacingLabel.textContent = 'Horizontal Spacing: ';
  hSpacingLabel.setAttribute('for', 'h-spacing-slider');
  hSpacingContainer.appendChild(hSpacingLabel);
  
  const hSpacingValue = document.createElement('span');
  hSpacingValue.id = 'h-spacing-value';
  hSpacingValue.textContent = '1.5';
  hSpacingContainer.appendChild(hSpacingValue);
  
  const hSpacingSlider = document.createElement('input');
  hSpacingSlider.id = 'h-spacing-slider';
  hSpacingSlider.type = 'range';
  hSpacingSlider.min = '1.0';
  hSpacingSlider.max = '2.0';
  hSpacingSlider.step = '0.05';
  hSpacingSlider.value = '1.5';
  hSpacingSlider.style.width = '100%';
  hSpacingContainer.appendChild(hSpacingSlider);
  
  panel.appendChild(hSpacingContainer);
  
  // Create control for vertical factor
  const vFactorContainer = document.createElement('div');
  vFactorContainer.style.marginBottom = '10px';
  
  const vFactorLabel = document.createElement('label');
  vFactorLabel.textContent = 'Vertical Factor: ';
  vFactorLabel.setAttribute('for', 'v-factor-slider');
  vFactorContainer.appendChild(vFactorLabel);
  
  const vFactorValue = document.createElement('span');
  vFactorValue.id = 'v-factor-value';
  vFactorValue.textContent = '1.0';
  vFactorContainer.appendChild(vFactorValue);
  
  const vFactorSlider = document.createElement('input');
  vFactorSlider.id = 'v-factor-slider';
  vFactorSlider.type = 'range';
  vFactorSlider.min = '0.8';
  vFactorSlider.max = '1.2';
  vFactorSlider.step = '0.05';
  vFactorSlider.value = '1.0';
  vFactorSlider.style.width = '100%';
  vFactorContainer.appendChild(vFactorSlider);
  
  panel.appendChild(vFactorContainer);
  
  // Apply button
  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply Settings';
  applyButton.style.padding = '5px 10px';
  applyButton.style.marginRight = '10px';
  applyButton.style.backgroundColor = '#4CAF50';
  applyButton.style.border = 'none';
  applyButton.style.color = 'white';
  applyButton.style.cursor = 'pointer';
  panel.appendChild(applyButton);
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.style.padding = '5px 10px';
  resetButton.style.backgroundColor = '#f44336';
  resetButton.style.border = 'none';
  resetButton.style.color = 'white';
  resetButton.style.cursor = 'pointer';
  panel.appendChild(resetButton);
  
  // Add status display
  const statusDisplay = document.createElement('div');
  statusDisplay.id = 'tester-status';
  statusDisplay.style.marginTop = '10px';
  statusDisplay.style.padding = '5px';
  statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.4)';
  statusDisplay.style.borderRadius = '3px';
  statusDisplay.textContent = 'Ready';
  panel.appendChild(statusDisplay);
  
  // Set up event handlers
  hSpacingSlider.addEventListener('input', function() {
    hSpacingValue.textContent = this.value;
    updatePreview();
  });
  
  vFactorSlider.addEventListener('input', function() {
    vFactorValue.textContent = this.value;
    updatePreview();
  });
  
  applyButton.addEventListener('click', function() {
    applySettings();
  });
  
  resetButton.addEventListener('click', function() {
    resetSettings();
  });
  
  console.log(`${LOG_TAG} Tester UI created`);
  return panel;
}

/**
 * Updates the preview of changes based on current slider values
 */
function updatePreview() {
  const hSpacing = parseFloat(document.getElementById('h-spacing-slider').value);
  const vFactor = parseFloat(document.getElementById('v-factor-slider').value);
  
  console.log(`${LOG_TAG} Preview updated: hSpacing=${hSpacing}, vFactor=${vFactor}`);
  
  // Update status display
  const statusDisplay = document.getElementById('tester-status');
  if (statusDisplay) {
    statusDisplay.textContent = `Preview: hSpacing=${hSpacing}, vFactor=${vFactor}`;
    statusDisplay.style.backgroundColor = 'rgba(255,165,0,0.4)'; // Orange background for preview state
  }
}

/**
 * Applies the current settings to regenerate the hex grid
 */
function applySettings() {
  try {
    const hSpacing = parseFloat(document.getElementById('h-spacing-slider').value);
    const vFactor = parseFloat(document.getElementById('v-factor-slider').value);
    
    console.log(`${LOG_TAG} Applying settings: hSpacing=${hSpacing}, vFactor=${vFactor}`);
    
    // Check if the generateHexagonGrid function is available
    if (typeof window.generateHexagonGrid === 'function') {
      // Call the function to regenerate the grid with new spacing values
      window.generateHexagonGrid(hSpacing, vFactor);
      
      // Update status display
      const statusDisplay = document.getElementById('tester-status');
      if (statusDisplay) {
        statusDisplay.textContent = `Applied: hSpacing=${hSpacing}, vFactor=${vFactor}`;
        statusDisplay.style.backgroundColor = 'rgba(0,255,0,0.2)'; // Green background for success
      }
      
      console.log(`${LOG_TAG} Settings applied successfully`);
    } else {
      throw new Error('generateHexagonGrid function not found');
    }
  } catch (error) {
    console.error(`${ERROR_TAG} Failed to apply settings:`, error);
    
    // Update status display with error
    const statusDisplay = document.getElementById('tester-status');
    if (statusDisplay) {
      statusDisplay.textContent = `Error: ${error.message}`;
      statusDisplay.style.backgroundColor = 'rgba(255,0,0,0.3)'; // Red background for error
    }
  }
}

/**
 * Resets settings to default values
 */
function resetSettings() {
  console.log(`${LOG_TAG} Resetting to default settings`);
  
  // Reset slider values
  const hSpacingSlider = document.getElementById('h-spacing-slider');
  const vFactorSlider = document.getElementById('v-factor-slider');
  const hSpacingValue = document.getElementById('h-spacing-value');
  const vFactorValue = document.getElementById('v-factor-value');
  
  if (hSpacingSlider && vFactorSlider) {
    hSpacingSlider.value = '1.5';
    vFactorSlider.value = '1.0';
    
    if (hSpacingValue && vFactorValue) {
      hSpacingValue.textContent = '1.5';
      vFactorValue.textContent = '1.0';
    }
    
    // Apply default settings
    applySettings();
  } else {
    console.warn(`${WARNING_TAG} Could not find slider elements to reset`);
  }
}

// Main initialization function
function initTester() {
  console.log(`${LOG_TAG} Initializing hex grid spacing tester`);
  
  try {
    // Check if diagnostics panel exists
    let diagPanel = document.getElementById('diagnostics-panel');
    
    // If not, create it
    if (!diagPanel) {
      console.log(`${LOG_TAG} Creating diagnostics panel`);
      diagPanel = document.createElement('div');
      diagPanel.id = 'diagnostics-panel';
      diagPanel.style.display = 'block';
      document.body.appendChild(diagPanel);
    }
    
    // Clear existing content
    diagPanel.innerHTML = '';
    
    // Create and add the tester UI
    const testerUI = createTesterUI();
    diagPanel.appendChild(testerUI);
    
    console.log(`${DIAGNOSTICS_TAG} HexGridSpacingTester loaded`);
  } catch (error) {
    console.error(`${ERROR_TAG} Failed to initialize tester:`, error);
  }
}

// Initialize when document is fully loaded
if (document.readyState === 'complete') {
  initTester();
} else {
  window.addEventListener('load', initTester);
}

// Export for module usage
export { initTester };
