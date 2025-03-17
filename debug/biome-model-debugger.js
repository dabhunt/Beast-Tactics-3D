/**
 * Biome Model Debugger
 * 
 * This debug utility helps diagnose issues with biome model loading
 * It tests various paths, loader configurations, and displays detailed results
 */

// Elements and biomes to test
const ELEMENTS_TO_TEST = [
  "Combat",
  "Dark",
  "Earth",
  "Fire",
  "Light",
  "Metal",
  "Plant",
  "Spirit",
  "Water",
  "Wind",
  "Electric",
  "Corrosion"
];

const BIOME_MAPPINGS = {
  "Combat": "Arena",
  "Dark": "Cave",
  "Earth": "Mountain",
  "Fire": "Volcano",
  "Light": "Desert",
  "Metal": "Mineshaft",
  "Plant": "Jungle",
  "Spirit": "Temple",
  "Water": "Ocean",
  "Wind": "Plains",
  "Electric": "Thunderlands",
  "Corrosion": "Swamp"
};

// Paths to test
const PATHS_TO_TEST = [
  "./assets/BiomeTiles/Models/",
  "/assets/BiomeTiles/Models/",
  "assets/BiomeTiles/Models/",
  "../assets/BiomeTiles/Models/",
  "../../assets/BiomeTiles/Models/"
];

// Log container for results
const debugResults = {
  successful: [],
  failed: [],
  errors: []
};

// Create UI for displaying results
function createDebugUI() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'biomeDebugPanel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 80vh;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    font-family: monospace;
    padding: 10px;
    border-radius: 5px;
    overflow-y: auto;
    z-index: 10000;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
  `;

  const titleBar = document.createElement('div');
  titleBar.innerHTML = '<h3 style="margin: 0 0 10px 0;">🔍 Biome Model Debugger</h3>';
  titleBar.style.cssText = `
    padding-bottom: 5px;
    border-bottom: 1px solid #666;
    margin-bottom: 10px;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #f44336;
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: bold;
  `;
  closeButton.onclick = () => {
    document.body.removeChild(debugPanel);
  };

  const content = document.createElement('div');
  content.id = 'biomeDebugContent';
  
  const buttonsRow = document.createElement('div');
  buttonsRow.style.cssText = `
    display: flex;
    margin-bottom: 10px;
    gap: 10px;
  `;
  
  const testPathsButton = document.createElement('button');
  testPathsButton.textContent = '🔄 Test Paths';
  testPathsButton.style.cssText = `
    background: #4caf50;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  `;
  testPathsButton.onclick = testBiomePaths;
  
  const testLoaderButton = document.createElement('button');
  testLoaderButton.textContent = '🧪 Test FBX Loader';
  testLoaderButton.style.cssText = `
    background: #2196f3;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  `;
  testLoaderButton.onclick = testFBXLoader;
  
  buttonsRow.appendChild(testPathsButton);
  buttonsRow.appendChild(testLoaderButton);
  
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'biomeDebugResults';
  
  debugPanel.appendChild(titleBar);
  debugPanel.appendChild(closeButton);
  debugPanel.appendChild(buttonsRow);
  debugPanel.appendChild(content);
  debugPanel.appendChild(resultsContainer);
  
  document.body.appendChild(debugPanel);
  updateUI('Ready to test. Click a button to start.');
}

// Update the UI with results
function updateUI(message, data = null) {
  const content = document.getElementById('biomeDebugContent');
  if (!content) return;
  
  if (data) {
    content.innerHTML = `
      <div style="margin-bottom: 10px;">${message}</div>
      <pre style="background: #222; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">${JSON.stringify(data, null, 2)}</pre>
    `;
  } else {
    content.innerHTML = `<div>${message}</div>`;
  }
  
  updateResults();
}

// Update the results display
function updateResults() {
  const resultsContainer = document.getElementById('biomeDebugResults');
  if (!resultsContainer) return;
  
  const formatResult = (result, type) => {
    const color = type === 'success' ? '#4caf50' : '#f44336';
    const icon = type === 'success' ? '✅' : '❌';
    return `<div style="padding: 5px; margin-bottom: 5px; background: ${color}22;">
      <span style="color: ${color};">${icon}</span> ${result}
    </div>`;
  };
  
  let resultsHTML = '<h4 style="margin: 20px 0 10px 0;">Results:</h4>';
  
  if (debugResults.successful.length > 0) {
    resultsHTML += '<div style="margin-bottom: 10px;"><b style="color: #4caf50;">Successful:</b></div>';
    debugResults.successful.forEach(result => {
      resultsHTML += formatResult(result, 'success');
    });
  }
  
  if (debugResults.failed.length > 0) {
    resultsHTML += '<div style="margin-bottom: 10px;"><b style="color: #f44336;">Failed:</b></div>';
    debugResults.failed.forEach(result => {
      resultsHTML += formatResult(result, 'failure');
    });
  }
  
  if (debugResults.errors.length > 0) {
    resultsHTML += '<div style="margin-top: 10px;"><b style="color: #ff9800;">Errors:</b></div>';
    debugResults.errors.forEach(error => {
      resultsHTML += `<div style="padding: 5px; margin-bottom: 5px; background: #ff980022; font-size: 12px;">${error}</div>`;
    });
  }
  
  resultsContainer.innerHTML = resultsHTML;
}

// Test if a file exists at a path
async function fileExists(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    debugResults.errors.push(`Error checking ${path}: ${error.message}`);
    return false;
  }
}

// Test all biome model paths
async function testBiomePaths() {
  debugResults.successful = [];
  debugResults.failed = [];
  debugResults.errors = [];
  
  updateUI('Testing biome model paths...', { pathsToTest: PATHS_TO_TEST });
  
  for (const element of ELEMENTS_TO_TEST) {
    const biomeName = BIOME_MAPPINGS[element] || 'Unknown';
    const fileName = `${element}_${biomeName}.fbx`;
    
    let found = false;
    for (const basePath of PATHS_TO_TEST) {
      const fullPath = `${basePath}${fileName}`;
      try {
        const exists = await fileExists(fullPath);
        if (exists) {
          debugResults.successful.push(`${element} (${biomeName}): ${fullPath}`);
          found = true;
          break;
        }
      } catch (error) {
        debugResults.errors.push(`Error checking ${fullPath}: ${error.message}`);
      }
    }
    
    if (!found) {
      debugResults.failed.push(`${element} (${biomeName}): Not found in any path`);
    }
  }
  
  updateUI('Path testing complete', { 
    successful: debugResults.successful.length,
    failed: debugResults.failed.length,
    errors: debugResults.errors.length 
  });
}

// Test FBX loader initialization strategies
async function testFBXLoader() {
  debugResults.successful = [];
  debugResults.failed = [];
  debugResults.errors = [];
  
  updateUI('Testing FBX loader initialization...', {
    strategies: [
      "Direct import",
      "Handler-based import",
      "Dynamic import"
    ]
  });

  // Strategy 1: Direct import
  try {
    const { FBXLoader } = await import('../libs/three/addons/loaders/FBXLoader.js');
    const loader = new FBXLoader();
    if (loader && typeof loader.load === 'function') {
      debugResults.successful.push('Strategy 1: Direct import successful');
    } else {
      debugResults.failed.push('Strategy 1: Direct import failed - invalid loader');
    }
  } catch (error) {
    debugResults.failed.push('Strategy 1: Direct import failed');
    debugResults.errors.push(`Direct import error: ${error.message}`);
  }
  
  // Strategy 2: Handler-based import
  try {
    const { getFBXLoader, isFBXLoaderReady } = await import('../libs/three/addons/loaders/FBXLoader.handler.js');
    const isReady = isFBXLoaderReady();
    debugResults.successful.push(`Handler reports loader is ready: ${isReady}`);
    
    try {
      const LoaderClass = await getFBXLoader();
      const loader = new LoaderClass();
      if (loader && typeof loader.load === 'function') {
        debugResults.successful.push('Strategy 2: Handler-based import successful');
      } else {
        debugResults.failed.push('Strategy 2: Handler-based import failed - invalid loader');
      }
    } catch (error) {
      debugResults.failed.push('Strategy 2: Handler-based import failed');
      debugResults.errors.push(`Handler-based import error: ${error.message}`);
    }
  } catch (error) {
    debugResults.failed.push('Strategy 2: Handler import failed');
    debugResults.errors.push(`Handler import error: ${error.message}`);
  }
  
  // Strategy 3: Dynamic import with various paths
  const pathsToTry = [
    '/libs/three/addons/loaders/FBXLoader.js',
    './libs/three/addons/loaders/FBXLoader.js',
    '../libs/three/addons/loaders/FBXLoader.js'
  ];
  
  for (const path of pathsToTry) {
    try {
      const module = await import(path);
      const loader = new module.FBXLoader();
      if (loader && typeof loader.load === 'function') {
        debugResults.successful.push(`Strategy 3: Dynamic import successful with path: ${path}`);
      } else {
        debugResults.failed.push(`Strategy 3: Dynamic import failed with path: ${path} - invalid loader`);
      }
    } catch (error) {
      debugResults.failed.push(`Strategy 3: Dynamic import failed with path: ${path}`);
      debugResults.errors.push(`Dynamic import error (${path}): ${error.message}`);
    }
  }
  
  updateUI('FBX loader testing complete', {
    successful: debugResults.successful.length,
    failed: debugResults.failed.length,
    errors: debugResults.errors.length
  });
}

// Initialize debugger
window.showBiomeDebugger = function() {
  createDebugUI();
  console.log('[BIOME-DEBUGGER] Initialized and ready');
};

// Auto-run on load if URL has debug parameter
if (window.location.search.includes('biomeDebug=true')) {
  window.addEventListener('load', () => {
    window.showBiomeDebugger();
  });
}

console.log('[BIOME-DEBUGGER] Script loaded. Call window.showBiomeDebugger() to open the debug panel');
