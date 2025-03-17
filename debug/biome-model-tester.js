/**
 * Biome Model Testing UI
 * 
 * This script creates a debugging interface for testing biome model loading
 * It provides controls to test individual biome models, view diagnostics,
 * and troubleshoot loading issues.
 */

// Elements and biomes to test
const ELEMENTS = [
  "Combat",
  "Dark",
  "Earth",
  "Fire",
  "Light",
  "Metal",
  "Plant",
  "Spirit",
  "Water",
  "Wind"
];

// Debug UI styles
const UI_STYLES = `
  #biomeTestPanel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    max-height: 80vh;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    font-family: monospace;
    padding: 15px;
    border-radius: 8px;
    z-index: 9999;
    overflow-y: auto;
    box-shadow: 0 0 15px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  #biomeTestPanel h3 {
    margin: 0 0 10px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.3);
  }
  
  #biomeTestPanel button {
    background: #2a2a2a;
    border: 1px solid #444;
    color: white;
    padding: 8px;
    margin: 3px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  #biomeTestPanel button:hover {
    background: #444;
  }
  
  #biomeTestPanel button.success {
    background: #2e7d32;
  }
  
  #biomeTestPanel button.error {
    background: #c62828;
  }
  
  #biomeTestPanel pre {
    background: #1a1a1a;
    padding: 10px;
    margin: 5px 0;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    font-size: 12px;
    white-space: pre-wrap;
  }
  
  #biomeTestPanel .statusMsg {
    padding: 8px;
    margin: 5px 0;
    border-radius: 4px;
  }
  
  #biomeTestPanel .success {
    background: rgba(46, 125, 50, 0.2);
  }
  
  #biomeTestPanel .error {
    background: rgba(198, 40, 40, 0.2);
  }
  
  #biomeTestPanel .warning {
    background: rgba(255, 152, 0, 0.2);
  }
  
  #biomodelControls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }

  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin: 10px auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Test results storage
const testResults = {
  successful: [],
  failed: [],
  errors: []
};

/**
 * Create and inject the debug UI
 */
function createBiomeTestUI() {
  console.log('[BIOME-DEBUG] Creating Biome Testing UI');
  
  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = UI_STYLES;
  document.head.appendChild(styleEl);
  
  // Create UI container
  const panel = document.createElement('div');
  panel.id = 'biomeTestPanel';
  
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3>🧪 Biome Model Tester</h3>
      <button id="closeBiomeTest" style="padding: 0; width: 25px; height: 25px; border-radius: 50%;">✕</button>
    </div>
    
    <div>
      <div class="statusMsg">Select an element to test its model loading:</div>
      <div id="biomodelControls"></div>
    </div>
    
    <div>
      <button id="testAllBiomeModels">🔄 Test All Models</button>
      <button id="checkPaths">📂 Check Paths</button>
      <button id="testFBXLoader">🔧 Test FBX Loader</button>
    </div>
    
    <div>
      <div class="statusMsg">Results:</div>
      <div id="biomeTestResults"></div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add element buttons
  const controls = document.getElementById('biomodelControls');
  ELEMENTS.forEach(element => {
    const btn = document.createElement('button');
    btn.textContent = element;
    btn.onclick = () => testSingleBiomeModel(element);
    controls.appendChild(btn);
  });
  
  // Add event listeners
  document.getElementById('closeBiomeTest').onclick = () => panel.remove();
  document.getElementById('testAllBiomeModels').onclick = testAllBiomeModels;
  document.getElementById('checkPaths').onclick = checkAllPaths;
  document.getElementById('testFBXLoader').onclick = testFBXLoader;
  
  displayStatus('UI ready - click a button to start testing');
  console.log('[BIOME-DEBUG] UI created successfully');
}

/**
 * Display a status message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, warning, or empty)
 */
function displayStatus(message, type = '') {
  const results = document.getElementById('biomeTestResults');
  if (!results) return;
  
  const msgElement = document.createElement('div');
  msgElement.className = `statusMsg ${type}`;
  msgElement.textContent = message;
  
  // Clear previous results if this is a new test
  if (type === '') {
    results.innerHTML = '';
  }
  
  results.appendChild(msgElement);
  console.log(`[BIOME-DEBUG] ${message}`);
}

/**
 * Show detailed error information
 * @param {string} message - The error message
 * @param {Error|object} error - The error object
 */
function displayError(message, error) {
  const results = document.getElementById('biomeTestResults');
  if (!results) return;
  
  const msgElement = document.createElement('div');
  msgElement.className = 'statusMsg error';
  msgElement.textContent = message;
  
  const detailsElement = document.createElement('pre');
  if (error instanceof Error) {
    detailsElement.textContent = `${error.message}\n${error.stack}`;
  } else {
    detailsElement.textContent = JSON.stringify(error, null, 2);
  }
  
  results.appendChild(msgElement);
  results.appendChild(detailsElement);
  console.error(`[BIOME-DEBUG] ${message}`, error);
}

/**
 * Show a loading indicator
 * @param {boolean} show - Whether to show or hide the loader
 */
function showLoader(show) {
  const results = document.getElementById('biomeTestResults');
  if (!results) return;
  
  if (show) {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'biomeTestLoader';
    results.appendChild(loader);
  } else {
    const loader = document.getElementById('biomeTestLoader');
    if (loader) loader.remove();
  }
}

/**
 * Test loading a single biome model by element type
 * @param {string} element - The element to test
 */
async function testSingleBiomeModel(element) {
  displayStatus(`Testing ${element} biome model...`);
  showLoader(true);
  
  try {
    // Find the biome model manager
    const manager = getBiomeModelManager();
    
    if (!manager) {
      throw new Error('Biome model manager not found. Make sure the game is running.');
    }
    
    // Create a temporary hex object for testing
    const testHex = createTestHex(element);
    
    // Attempt to load the model
    const result = await manager.loadBiomeModel(testHex);
    
    if (result) {
      displayStatus(`✅ Successfully loaded ${element} biome model!`, 'success');
      testResults.successful.push(element);
      
      // Show the model information
      const modelKey = `${element}_${manager.biomeMappings[element]?.biomeName || 'Unknown'}`;
      const modelInfo = manager.loadedModels[modelKey];
      
      if (modelInfo) {
        const infoElement = document.createElement('pre');
        infoElement.textContent = JSON.stringify({
          modelKey,
          hasModel: !!modelInfo.fbx,
          hasTexture: !!modelInfo.texture,
          position: testHex.position
        }, null, 2);
        document.getElementById('biomeTestResults').appendChild(infoElement);
      }
    } else {
      displayStatus(`❌ Failed to load ${element} biome model`, 'error');
      testResults.failed.push(element);
      
      // Show debug information
      displayError('Debug information:', {
        element,
        biomeMappings: manager.biomeMappings[element] || 'No mapping found',
        potentialPaths: manager.potentialBasePaths || [],
        currentBasePath: manager.config.modelBasePath
      });
    }
  } catch (error) {
    displayError(`Error testing ${element} biome model:`, error);
    testResults.errors.push(`${element}: ${error.message}`);
  } finally {
    showLoader(false);
  }
}

/**
 * Test all biome models
 */
async function testAllBiomeModels() {
  displayStatus('Testing all biome models...');
  
  testResults.successful = [];
  testResults.failed = [];
  testResults.errors = [];
  
  // Process elements sequentially to avoid overwhelming the system
  for (const element of ELEMENTS) {
    await testSingleBiomeModel(element);
  }
  
  // Show summary
  displayStatus(`Test complete: ${testResults.successful.length} successful, ${testResults.failed.length} failed, ${testResults.errors.length} errors.`, 
    testResults.failed.length || testResults.errors.length ? 'warning' : 'success');
}

/**
 * Check all paths for biome models
 */
async function checkAllPaths() {
  displayStatus('Checking paths for biome models...');
  showLoader(true);
  
  try {
    const manager = getBiomeModelManager();
    
    if (!manager) {
      throw new Error('Biome model manager not found');
    }
    
    // Paths to check
    const paths = manager.potentialBasePaths || [
      './assets/BiomeTiles/Models/',
      '/assets/BiomeTiles/Models/',
      'assets/BiomeTiles/Models/',
      '../assets/BiomeTiles/Models/'
    ];
    
    // Results storage
    const results = {};
    
    for (const path of paths) {
      results[path] = {
        exists: false,
        models: []
      };
      
      for (const element of ELEMENTS) {
        const mapping = manager.biomeMappings[element] || { 
          biomeName: getBiomeName(element),
          modelFile: `${element}_${getBiomeName(element)}.fbx` 
        };
        
        const modelPath = `${path}${mapping.modelFile}`;
        
        try {
          const exists = await manager.checkFileExists(modelPath);
          
          if (exists) {
            results[path].exists = true;
            results[path].models.push({
              element,
              file: mapping.modelFile,
              exists
            });
          }
        } catch (error) {
          console.error(`Error checking ${modelPath}:`, error);
        }
      }
    }
    
    // Display results
    const infoElement = document.createElement('pre');
    infoElement.textContent = JSON.stringify(results, null, 2);
    document.getElementById('biomeTestResults').appendChild(infoElement);
    
    // Update with working path
    const workingPaths = Object.keys(results).filter(path => results[path].exists);
    
    if (workingPaths.length > 0) {
      displayStatus(`✅ Found working paths: ${workingPaths.join(', ')}`, 'success');
      
      // Suggest updating base path
      if (manager.config.modelBasePath !== workingPaths[0]) {
        displayStatus(`Consider using this path: ${workingPaths[0]}`, 'warning');
      }
    } else {
      displayStatus('❌ No working paths found!', 'error');
    }
  } catch (error) {
    displayError('Error checking paths:', error);
  } finally {
    showLoader(false);
  }
}

/**
 * Test the FBX loader initialization
 */
async function testFBXLoader() {
  displayStatus('Testing FBX loader initialization...');
  showLoader(true);
  
  try {
    const manager = getBiomeModelManager();
    
    if (!manager) {
      throw new Error('Biome model manager not found');
    }
    
    // Test reinitializing the loader
    await manager.initializeFBXLoader();
    
    if (manager.fbxLoader && typeof manager.fbxLoader.load === 'function') {
      displayStatus('✅ FBX loader initialized successfully!', 'success');
      
      // Show loader details
      const loaderInfo = {
        type: typeof manager.fbxLoader,
        methods: Object.keys(manager.fbxLoader),
        hasLoadMethod: typeof manager.fbxLoader.load === 'function'
      };
      
      const infoElement = document.createElement('pre');
      infoElement.textContent = JSON.stringify(loaderInfo, null, 2);
      document.getElementById('biomeTestResults').appendChild(infoElement);
    } else {
      displayStatus('❌ FBX loader initialization failed!', 'error');
      
      // Check for errors
      if (window._biomeModelErrors && window._biomeModelErrors.length > 0) {
        displayError('Last error:', window._biomeModelErrors[window._biomeModelErrors.length - 1]);
      }
    }
  } catch (error) {
    displayError('Error testing FBX loader:', error);
  } finally {
    showLoader(false);
  }
}

/**
 * Get the biome model manager from the game instance
 * @returns {Object} The biome model manager instance
 */
function getBiomeModelManager() {
  // Try to find from the window._biomeModelManager
  if (window._biomeModelManager) {
    return window._biomeModelManager;
  }
  
  // Try to find from the scene objects
  try {
    // Find all THREE.js scene instances
    const scenes = [];
    
    // Search through game-related objects
    if (window.game && window.game.scene) {
      scenes.push(window.game.scene);
    }
    
    if (window.mapGenerator && window.mapGenerator.scene) {
      scenes.push(window.mapGenerator.scene);
    }
    
    // Check for biomeModelManager in scene userData
    for (const scene of scenes) {
      if (scene.userData && scene.userData.biomeModelManager) {
        return scene.userData.biomeModelManager;
      }
    }
    
    // If not found, create a helpful error message
    console.error('[BIOME-DEBUG] Could not find biome model manager in any scene');
    return null;
  } catch (error) {
    console.error('[BIOME-DEBUG] Error finding biome model manager:', error);
    return null;
  }
}

/**
 * Create a test hexagon for a given element
 * @param {string} element - The element to assign to the hexagon
 * @returns {Object} A simple object representing a hexagon
 */
function createTestHex(element) {
  return {
    position: { x: 0, y: 0, z: 0 },
    userData: {
      element,
      biomeModel: null
    }
  };
}

/**
 * Get a default biome name for an element if not known
 * @param {string} element - The element
 * @returns {string} The biome name
 */
function getBiomeName(element) {
  const biomeMap = {
    "Combat": "Arena",
    "Dark": "Cave",
    "Earth": "Mountain",
    "Fire": "Volcano",
    "Light": "Desert",
    "Metal": "Mineshaft",
    "Plant": "Jungle",
    "Spirit": "Temple",
    "Water": "Ocean",
    "Wind": "Plains"
  };
  
  return biomeMap[element] || element;
}

// Exports and initialization
window.showBiomeModelTester = function() {
  createBiomeTestUI();
};

// Auto-initialize if URL has biomeTest parameter
if (window.location.search.includes('biomeTest=true')) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.showBiomeModelTester();
    }, 1000); // Slight delay to ensure game is loaded
  });
}

console.log('[BIOME-TEST] Biome model tester loaded. Call window.showBiomeModelTester() to show the UI.');
