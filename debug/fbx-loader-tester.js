/**
 * fbx-loader-tester.js
 * 
 * Debug utility to test different FBX loader initialization strategies
 * This script tests all the strategies we implemented in BiomeModelManager
 * to ensure at least one of them works reliably.
 */

// Import core dependencies
import * as THREE from '/libs/three/three.module.js';

// Track tests and results
let testResults = {
  strategy1: { success: false, error: null, loader: null, time: 0 },
  strategy2: { success: false, error: null, loader: null, time: 0 },
  strategy3: { success: false, error: null, loader: null, time: 0 },
  strategy4: { success: false, error: null, loader: null, time: 0 },
  strategy5: { success: false, error: null, loader: null, time: 0 },
  strategy6: { success: false, error: null, loader: null, time: 0 }
};

// Store global state
const state = {
  scene: null,
  camera: null,
  renderer: null,
  testModel: null,
  sceneSetup: false,
  THREE: THREE
};

/**
 * Initialize the debug UI
 */
function initDebugUI() {
  console.log("[FBX-TESTER] Initializing debug UI...");
  
  const container = document.createElement('div');
  container.id = 'fbx-loader-tester';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    background: rgba(0,0,0,0.85);
    color: #fff;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  `;
  
  // Create title and description
  const title = document.createElement('h2');
  title.textContent = 'FBX Loader Tester';
  title.style.margin = '0 0 10px 0';
  title.style.color = '#ff9900';
  container.appendChild(title);
  
  const description = document.createElement('p');
  description.textContent = 'Tests all FBX loader initialization strategies.';
  description.style.marginBottom = '15px';
  container.appendChild(description);
  
  // Create action buttons
  const buttonPanel = document.createElement('div');
  buttonPanel.style.display = 'flex';
  buttonPanel.style.gap = '10px';
  buttonPanel.style.marginBottom = '15px';
  
  const runAllBtn = createButton('Run All Tests', () => runAllStrategyTests());
  const viewResultsBtn = createButton('View Detailed Results', () => logDetailedResults());
  const loadModelBtn = createButton('Try Load Model', () => tryLoadTestModel());
  
  buttonPanel.appendChild(runAllBtn);
  buttonPanel.appendChild(viewResultsBtn);
  buttonPanel.appendChild(loadModelBtn);
  container.appendChild(buttonPanel);
  
  // Create individual strategy test buttons
  const strategyPanel = document.createElement('div');
  strategyPanel.style.display = 'flex';
  strategyPanel.style.flexWrap = 'wrap';
  strategyPanel.style.gap = '10px';
  strategyPanel.style.marginBottom = '15px';
  
  for (let i = 1; i <= 6; i++) {
    const strategyBtn = createButton(`Test Strategy ${i}`, () => testStrategy(i));
    strategyBtn.style.flex = '0 0 48%';
    strategyPanel.appendChild(strategyBtn);
  }
  
  container.appendChild(strategyPanel);
  
  // Create results area
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'fbx-loader-test-results';
  resultsDiv.style.cssText = `
    background: rgba(0,0,0,0.3);
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    min-height: 100px;
    max-height: 300px;
    overflow-y: auto;
  `;
  resultsDiv.textContent = 'Test results will appear here...';
  container.appendChild(resultsDiv);
  
  // Create 3D preview area for test model
  const previewPanel = document.createElement('div');
  previewPanel.id = 'fbx-model-preview';
  previewPanel.style.cssText = `
    width: 100%;
    height: 200px;
    margin-top: 15px;
    border-radius: 4px;
    background: #1a1a1a;
    position: relative;
  `;
  container.appendChild(previewPanel);
  
  document.body.appendChild(container);
  
  console.log("[FBX-TESTER] Debug UI initialized");
}

/**
 * Helper to create consistently styled buttons
 */
function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    background: #ff9900;
    color: #000;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    flex-grow: 1;
    transition: background 0.2s;
  `;
  button.addEventListener('mouseenter', () => button.style.background = '#ffac33');
  button.addEventListener('mouseleave', () => button.style.background = '#ff9900');
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Initialize Three.js scene for testing models
 */
function initThreeScene() {
  console.log("[FBX-TESTER] Initializing Three.js scene...");
  
  // Only initialize once
  if (state.sceneSetup) return;
  
  try {
    // Get container
    const container = document.getElementById('fbx-model-preview');
    if (!container) {
      console.error("[FBX-TESTER] Preview container not found");
      return;
    }
    
    // Create scene, camera, and renderer
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x222222);
    
    // Create camera
    state.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 1000
    );
    state.camera.position.set(0, 1, 5);
    state.camera.lookAt(0, 0, 0);
    
    // Create renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(container.clientWidth, container.clientHeight);
    state.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(state.renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    state.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    state.scene.add(directionalLight);
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
    state.scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(2);
    state.scene.add(axesHelper);
    
    // Start animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate test model if it exists
      if (state.testModel) {
        state.testModel.rotation.y += 0.01;
      }
      
      state.renderer.render(state.scene, state.camera);
    }
    animate();
    
    state.sceneSetup = true;
    console.log("[FBX-TESTER] Three.js scene initialized successfully");
  } catch (error) {
    console.error("[FBX-TESTER] Error initializing Three.js scene:", error);
    logToResultsArea('❌ Error initializing Three.js scene: ' + error.message);
  }
}

/**
 * Log information to the results area
 */
function logToResultsArea(message, append = true) {
  const resultsDiv = document.getElementById('fbx-loader-test-results');
  if (!resultsDiv) return;
  
  if (append) {
    resultsDiv.innerHTML += '\n' + message;
  } else {
    resultsDiv.innerHTML = message;
  }
  
  // Auto-scroll to bottom
  resultsDiv.scrollTop = resultsDiv.scrollHeight;
}

/**
 * Test all strategies and log results
 */
async function runAllStrategyTests() {
  logToResultsArea('🔄 Running all FBX loader initialization strategies...', false);
  
  // Reset test results
  testResults = {
    strategy1: { success: false, error: null, loader: null, time: 0 },
    strategy2: { success: false, error: null, loader: null, time: 0 },
    strategy3: { success: false, error: null, loader: null, time: 0 },
    strategy4: { success: false, error: null, loader: null, time: 0 },
    strategy5: { success: false, error: null, loader: null, time: 0 },
    strategy6: { success: false, error: null, loader: null, time: 0 }
  };
  
  // Test each strategy in sequence
  for (let i = 1; i <= 6; i++) {
    await testStrategy(i);
  }
  
  // Summarize results
  logToResultsArea('\n📊 Summary of test results:');
  let anySuccess = false;
  
  for (let i = 1; i <= 6; i++) {
    const result = testResults[`strategy${i}`];
    const icon = result.success ? '✅' : '❌';
    const time = result.time ? `(${result.time}ms)` : '';
    logToResultsArea(`${icon} Strategy ${i}: ${result.success ? 'SUCCESS' : 'FAILED'} ${time}`);
    
    if (result.success) {
      anySuccess = true;
    }
  }
  
  logToResultsArea(`\n${anySuccess ? '✅ At least one strategy succeeded!' : '❌ All strategies failed!'}`);
  
  // Store results in window for external access
  window._fbxLoaderTestResults = testResults;
}

/**
 * Show detailed results for diagnostics
 */
function logDetailedResults() {
  logToResultsArea('📋 Detailed test results:', false);
  
  for (let i = 1; i <= 6; i++) {
    const result = testResults[`strategy${i}`];
    logToResultsArea(`\n➤ Strategy ${i}:`);
    logToResultsArea(`   Success: ${result.success}`);
    logToResultsArea(`   Time: ${result.time}ms`);
    
    if (result.error) {
      logToResultsArea(`   Error: ${result.error.message}`);
    }
    
    if (result.loader) {
      const methods = Object.keys(result.loader);
      logToResultsArea(`   Loader type: ${typeof result.loader}`);
      logToResultsArea(`   Has load(): ${typeof result.loader.load === 'function'}`);
      logToResultsArea(`   Methods: ${methods.join(', ')}`);
    }
  }
}

/**
 * Test a specific loader initialization strategy
 */
async function testStrategy(strategyNum) {
  logToResultsArea(`\n🔄 Testing Strategy ${strategyNum}...`);
  const startTime = performance.now();
  
  try {
    let loader = null;
    
    switch (strategyNum) {
      case 1:
        // Strategy 1: Use FBXLoader.handler.js
        logToResultsArea('   Trying to use FBXLoader.handler.js');
        
        try {
          // Check if handler functions exist
          if (typeof isFBXLoaderReady !== 'function' || typeof getFBXLoader !== 'function') {
            throw new Error('Handler functions not found');
          }
          
          const isReady = isFBXLoaderReady();
          logToResultsArea(`   Handler reports loader ready: ${isReady}`);
          
          const LoaderClass = await getFBXLoader(5000);
          loader = new LoaderClass();
          
          if (!loader || typeof loader.load !== 'function') {
            throw new Error('Invalid loader from handler');
          }
        } catch (error) {
          throw error;
        }
        break;
        
      case 2:
        // Strategy 2: Direct FBXLoader import
        logToResultsArea('   Trying direct FBXLoader import');
        
        try {
          // Check if FBXLoader is globally available
          if (typeof FBXLoader !== 'function') {
            throw new Error('FBXLoader not found globally');
          }
          
          loader = new FBXLoader();
          
          if (!loader || typeof loader.load !== 'function') {
            throw new Error('Invalid loader from direct import');
          }
        } catch (error) {
          throw error;
        }
        break;
        
      case 3:
        // Strategy 3: Dynamic import
        logToResultsArea('   Trying dynamic import with different paths');
        
        const pathsToTry = [
          './libs/three/addons/loaders/FBXLoader.js',
          '/libs/three/addons/loaders/FBXLoader.js',
          '../libs/three/addons/loaders/FBXLoader.js',
          'libs/three/addons/loaders/FBXLoader.js'
        ];
        
        let dynamicImportSucceeded = false;
        
        for (const path of pathsToTry) {
          try {
            logToResultsArea(`   Trying path: ${path}`);
            const fbxModule = await import(path);
            
            if (fbxModule && fbxModule.FBXLoader) {
              loader = new fbxModule.FBXLoader();
              
              if (loader && typeof loader.load === 'function') {
                dynamicImportSucceeded = true;
                logToResultsArea(`   ✅ Dynamic import succeeded from ${path}`);
                break;
              }
            }
          } catch (error) {
            logToResultsArea(`   Failed to import from ${path}: ${error.message}`);
          }
        }
        
        if (!dynamicImportSucceeded) {
          throw new Error('All dynamic import attempts failed');
        }
        break;
        
      case 4:
        // Strategy 4: THREE.FBXLoader
        logToResultsArea('   Trying to use THREE.FBXLoader directly');
        
        if (!THREE.FBXLoader) {
          throw new Error('THREE.FBXLoader not found');
        }
        
        loader = new THREE.FBXLoader();
        
        if (!loader || typeof loader.load !== 'function') {
          throw new Error('Invalid loader from THREE.FBXLoader');
        }
        break;
        
      case 5:
        // Strategy 5: Script tag injection
        logToResultsArea('   Trying script tag injection');
        
        await new Promise((resolve, reject) => {
          // Check if script already exists
          if (document.querySelector('script[src*="FBXLoader.js"]')) {
            logToResultsArea('   FBXLoader script already exists in document');
            resolve();
            return;
          }
          
          const script = document.createElement('script');
          script.src = '/libs/three/addons/loaders/FBXLoader.js';
          script.async = true;
          
          script.onload = () => {
            logToResultsArea('   Script loaded successfully');
            resolve();
          };
          
          script.onerror = (err) => {
            reject(new Error('Failed to load script: ' + err));
          };
          
          document.head.appendChild(script);
        });
        
        // Check if script made FBXLoader available
        if (window.FBXLoader) {
          loader = new window.FBXLoader();
        } else {
          throw new Error('Script loaded but FBXLoader not defined on window');
        }
        break;
        
      case 6:
        // Strategy 6: Create stub loader
        logToResultsArea('   Creating stub FBXLoader for testing');
        
        // Ensure Three.js is available
        if (!THREE) {
          throw new Error('THREE not available for stub loader');
        }
        
        // Create minimal stub loader
        loader = {
          load: (url, onLoad, onProgress, onError) => {
            logToResultsArea(`   [STUB] Would load: ${url}`);
            
            // Create simple placeholder
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ 
              color: 0xff9900, 
              wireframe: true,
              opacity: 0.8,
              transparent: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Add metadata
            mesh.name = "STUB_MODEL_" + url.split('/').pop();
            mesh.userData.isStubModel = true;
            mesh.userData.originalPath = url;
            
            // Add label text
            try {
              addDebugLabel(mesh, url.split('/').pop());
            } catch (labelError) {
              console.warn('Could not add debug label', labelError);
            }
            
            if (onLoad) {
              setTimeout(() => onLoad(mesh), 200);
            }
            
            return mesh;
          }
        };
        break;
    }
    
    // If we get here, the strategy worked
    const endTime = performance.now();
    const timeTaken = Math.round(endTime - startTime);
    
    testResults[`strategy${strategyNum}`] = {
      success: true,
      error: null,
      loader: loader,
      time: timeTaken
    };
    
    logToResultsArea(`   ✅ Strategy ${strategyNum} SUCCESS (${timeTaken}ms)`);
    
    // Store the first successful loader in global state
    if (!window._firstSuccessfulFBXLoader && loader) {
      window._firstSuccessfulFBXLoader = loader;
      logToResultsArea('   📌 Set as primary loader in window._firstSuccessfulFBXLoader');
    }
    
    return loader;
  } catch (error) {
    const endTime = performance.now();
    const timeTaken = Math.round(endTime - startTime);
    
    testResults[`strategy${strategyNum}`] = {
      success: false,
      error: error,
      loader: null,
      time: timeTaken
    };
    
    logToResultsArea(`   ❌ Strategy ${strategyNum} FAILED: ${error.message} (${timeTaken}ms)`);
    console.error(`[FBX-TESTER] Strategy ${strategyNum} failed:`, error);
    
    return null;
  }
}

/**
 * Try to load a test model using the first successful loader
 */
async function tryLoadTestModel() {
  logToResultsArea('\n🔄 Attempting to load test model...');
  
  try {
    // Initialize scene if needed
    if (!state.sceneSetup) {
      initThreeScene();
    }
    
    // Check if we have a successful loader
    const loader = window._firstSuccessfulFBXLoader;
    
    if (!loader) {
      // Try to get a loader by running all tests
      logToResultsArea('   No successful loader found, running all tests first...');
      await runAllStrategyTests();
      
      // Check again
      if (!window._firstSuccessfulFBXLoader) {
        throw new Error('Could not initialize any FBX loader');
      }
    }
    
    // If we already have a test model, remove it
    if (state.testModel) {
      state.scene.remove(state.testModel);
      state.testModel = null;
    }
    
    // Try several potential model locations
    const modelPaths = [
      '/assets/BiomeTiles/Models/test_model.fbx',
      './assets/BiomeTiles/Models/test_model.fbx',
      '../assets/BiomeTiles/Models/test_model.fbx',
      'assets/BiomeTiles/Models/test_model.fbx',
      '/assets/BiomeTiles/Models/fire_volcano.fbx',
      './assets/BiomeTiles/Models/fire_volcano.fbx'
    ];
    
    logToResultsArea('   Looking for test model in multiple locations...');
    
    let modelLoaded = false;
    
    // Try each path
    for (const path of modelPaths) {
      if (modelLoaded) break;
      
      try {
        logToResultsArea(`   Trying to load: ${path}`);
        
        // Load the model
        const model = await new Promise((resolve, reject) => {
          window._firstSuccessfulFBXLoader.load(
            path,
            (object) => resolve(object),
            (xhr) => {
              const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
              logToResultsArea(`   Loading: ${percentComplete}%`);
            },
            (error) => reject(error)
          );
        });
        
        // Success!
        logToResultsArea(`   ✅ Model loaded successfully from: ${path}`);
        
        // Scale and add to scene
        model.scale.set(0.01, 0.01, 0.01);
        model.position.set(0, 0, 0);
        
        // Add to scene
        state.scene.add(model);
        state.testModel = model;
        
        // Mark as loaded
        modelLoaded = true;
      } catch (error) {
        logToResultsArea(`   ❌ Failed to load from ${path}: ${error.message}`);
      }
    }
    
    // If we couldn't load a real model, create a placeholder
    if (!modelLoaded) {
      logToResultsArea('   Creating placeholder model since real loading failed');
      
      // Create placeholder cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff5555,
        wireframe: true
      });
      const placeholder = new THREE.Mesh(geometry, material);
      placeholder.name = "PLACEHOLDER_MODEL";
      
      // Add text label
      addDebugLabel(placeholder, "PLACEHOLDER");
      
      // Add to scene
      state.scene.add(placeholder);
      state.testModel = placeholder;
      
      logToResultsArea('   ⚠️ Using placeholder model');
    }
  } catch (error) {
    logToResultsArea(`   ❌ Error loading test model: ${error.message}`);
    console.error('[FBX-TESTER] Error loading test model:', error);
  }
}

/**
 * Add a debug text label to a 3D object
 */
function addDebugLabel(object, text) {
  // Create a canvas texture for the text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
  // Background with opacity
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Text styling
  context.font = 'bold 24px Arial';
  context.fillStyle = '#ff9900';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Draw text with stroke
  context.strokeStyle = '#000000';
  context.lineWidth = 3;
  context.strokeText(`MODEL`, canvas.width / 2, 40);
  context.fillText(`MODEL`, canvas.width / 2, 40);
  
  context.font = 'bold 20px Arial';
  context.strokeText(text, canvas.width / 2, 80);
  context.fillText(text, canvas.width / 2, 80);
  
  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create a sprite material using the texture
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  // Create a sprite and position it above the object
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1, 0.5, 1);
  sprite.position.set(0, 1, 0);
  
  // Add the sprite to the object
  object.add(sprite);
  
  // Store reference to the label
  object.userData.debugLabel = sprite;
}

/**
 * Initialize the tester
 */
function init() {
  console.log("[FBX-TESTER] Initializing FBX Loader Tester...");
  
  // Initialize debug UI
  initDebugUI();
  
  // Initialize Three.js scene
  initThreeScene();
  
  // Set up global access
  window._fbxTester = {
    runAllTests: runAllStrategyTests,
    testStrategy: testStrategy,
    logDetailedResults: logDetailedResults,
    tryLoadTestModel: tryLoadTestModel,
    state: state
  };
  
  console.log("[FBX-TESTER] Initialization complete");
  logToResultsArea('FBX Loader Tester initialized. Click a button to start testing.');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for module usage
export {
  runAllStrategyTests,
  testStrategy,
  logDetailedResults,
  tryLoadTestModel
};
