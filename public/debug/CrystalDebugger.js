/**
 * CrystalDebugger.js
 * Debug utility for diagnosing and fixing crystal shard loading issues
 * Provides tools to verify GLB loader functionality and crystal spawn logic
 */

// Crystal debug config
const DEBUG_CONFIG = {
  forceLoadModel: true,         // Force model loading attempts
  overrideSpawnChance: 0.8,     // Higher spawn chance for testing (80%)
  logModelLoadAttempts: true,   // Log detailed model loading attempts
  logGLBLoaderState: true,      // Output GLB loader state
  checkFilePaths: true,         // Verify file paths exist
  forceFallback: false          // Force fallback crystals for testing
};

/**
 * Initializes the crystal debugger and patches the CrystalShardManager
 * @param {Object} scene - The THREE.js scene
 * @param {Object} THREE - THREE.js library
 * @param {Object} crystalShardManager - Instance of CrystalShardManager to debug
 */
export function initCrystalDebugger(scene, THREE, crystalShardManager) {
  console.log('[CRYSTAL-DEBUG] Initializing crystal debugger with detailed logging');
  
  if (!crystalShardManager) {
    console.error('[CRYSTAL-DEBUG] No crystal shard manager provided');
    return;
  }
  
  // Log current state and configuration
  console.log('[CRYSTAL-DEBUG] Current crystal configuration:', {
    modelPath: crystalShardManager.config.crystalModelPath,
    texturePath: crystalShardManager.config.crystalTexturePath, 
    spawnChance: crystalShardManager.config.crystalSpawnChance,
    maxCrystals: crystalShardManager.config.maxCrystals || 'unlimited',
    loaderInitialized: crystalShardManager._loaderInitialized,
    loaderSource: crystalShardManager._crystalLoaderSource
  });
  
  // Create debug UI panel
  createDebugPanel(crystalShardManager);
  
  // Apply debug patches
  applyDebugPatches(crystalShardManager);
  
  console.log('[CRYSTAL-DEBUG] Crystal debugger initialized, use window.crystalDebug for direct access');
  
  // Expose the debug functions globally for console testing
  window.crystalDebug = {
    forceModelLoad: () => forceModelLoad(crystalShardManager),
    listCrystals: () => listCrystals(crystalShardManager),
    verifyAssetPaths: () => verifyAssetPaths(crystalShardManager),
    resetLoaders: () => resetAndReinitializeLoaders(crystalShardManager),
    testFallbackCrystal: (x, y, z) => testFallbackCrystal(crystalShardManager, scene, THREE, x, y, z),
    spawnCrystalAt: (x, y, z) => spawnCrystalAt(crystalShardManager, scene, x, y, z),
    diagnostics: () => runDiagnostics(crystalShardManager)
  };
  
  return window.crystalDebug;
}

/**
 * Creates a debug panel for interacting with crystal functionality
 * @param {Object} crystalShardManager - The CrystalShardManager instance
 */
function createDebugPanel(crystalShardManager) {
  // Only create if we have the document available (browser environment)
  if (typeof document === 'undefined') return;
  
  const panel = document.createElement('div');
  panel.id = 'crystal-debug-panel';
  panel.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:5px;z-index:1000;';
  
  panel.innerHTML = `
    <h3 style="margin:0 0 10px 0;color:#9966ff">Crystal Debug Panel</h3>
    <button id="crystal-force-load">Force Load Model</button>
    <button id="crystal-verify-paths">Verify Asset Paths</button>
    <button id="crystal-spawn-test">Test Spawn 10 Crystals</button>
    <button id="crystal-reset-loader">Reset Loaders</button>
    <button id="crystal-run-diag">Run Diagnostics</button>
    <div id="crystal-debug-status" style="margin-top:10px;padding:5px;background:rgba(0,0,0,0.3);max-height:100px;overflow:auto;">
      Ready
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('crystal-force-load').addEventListener('click', () => {
    forceModelLoad(crystalShardManager);
    updateDebugStatus('Forced model load attempt');
  });
  
  document.getElementById('crystal-verify-paths').addEventListener('click', () => {
    verifyAssetPaths(crystalShardManager);
    updateDebugStatus('Verifying asset paths...');
  });
  
  document.getElementById('crystal-spawn-test').addEventListener('click', () => {
    testMultipleCrystalSpawns(crystalShardManager, 10);
    updateDebugStatus('Testing multiple crystal spawns');
  });
  
  document.getElementById('crystal-reset-loader').addEventListener('click', () => {
    resetAndReinitializeLoaders(crystalShardManager);
    updateDebugStatus('Loaders reset and reinitialized');
  });
  
  document.getElementById('crystal-run-diag').addEventListener('click', () => {
    runDiagnostics(crystalShardManager);
    updateDebugStatus('Running full diagnostics');
  });
}

/**
 * Updates the status display in the debug panel
 * @param {string} message - Status message to display
 */
function updateDebugStatus(message) {
  const statusElement = document.getElementById('crystal-debug-status');
  if (statusElement) {
    statusElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  }
}

/**
 * Applies patches to the CrystalShardManager for debugging
 * @param {Object} manager - The CrystalShardManager instance
 */
function applyDebugPatches(manager) {
  console.log('[CRYSTAL-DEBUG] Applying debug patches to CrystalShardManager');
  
  // Store original methods for later reference
  const originalTrySpawn = manager.trySpawnCrystalShard;
  const originalLoadModel = manager.loadCrystalModel;
  const originalInitLoader = manager.initializeGLBLoader;
  
  // Override the trySpawnCrystalShard method
  manager.trySpawnCrystalShard = async function(hex) {
    console.log('[CRYSTAL-DEBUG] Enhanced trySpawnCrystalShard called for hex:', {
      hexId: hex?.userData?.id || 'unknown',
      position: hex?.position ? [hex.position.x, hex.position.y, hex.position.z] : 'undefined',
      type: hex?.userData?.type || 'unknown',
      probability: DEBUG_CONFIG.overrideSpawnChance || this.config.crystalSpawnChance,
    });
    
    // Use higher spawn probability for debugging if configured
    if (DEBUG_CONFIG.overrideSpawnChance) {
      const originalProb = this.config.crystalSpawnChance;
      this.config.crystalSpawnChance = DEBUG_CONFIG.overrideSpawnChance;
      console.log(`[CRYSTAL-DEBUG] Overriding spawn chance: ${originalProb} → ${DEBUG_CONFIG.overrideSpawnChance}`);
      
      try {
        return await originalTrySpawn.call(this, hex);
      } finally {
        // Restore original probability
        this.config.crystalSpawnChance = originalProb;
      }
    } else {
      return await originalTrySpawn.call(this, hex);
    }
  };
  
  // Override the loadCrystalModel method
  manager.loadCrystalModel = function(hex) {
    console.log('[CRYSTAL-DEBUG] Enhanced loadCrystalModel called:', {
      hexPos: hex?.position ? [hex.position.x, hex.position.y, hex.position.z] : 'no position',
      modelPath: this.config.crystalModelPath,
      forceFallback: DEBUG_CONFIG.forceFallback,
      loaderInitialized: this._loaderInitialized,
      hasLoader: !!this.crystalLoader
    });
    
    // Force fallback if debug option is enabled
    if (DEBUG_CONFIG.forceFallback) {
      console.log('[CRYSTAL-DEBUG] Forcing fallback crystal due to debug configuration');
      this.createFallbackCrystal(hex);
      return;
    }
    
    return originalLoadModel.call(this, hex);
  };
  
  // Override the initializeGLBLoader method
  manager.initializeGLBLoader = async function() {
    console.log('[CRYSTAL-DEBUG] Enhanced initializeGLBLoader called with debugging');
    
    // Check if GLBLoader exists in global scope before attempting initialization
    console.log('[CRYSTAL-DEBUG] GLBLoader availability check:', {
      windowGLBLoader: typeof window.glbLoader,
      threeGLBLoader: typeof this.THREE?.glbLoader,
      globalGLBLoader: typeof GLBLoader
    });
    
    return await originalInitLoader.call(this);
  };
  
  // Add a special debug method
  manager.debugForceLoadModel = function(modelPath) {
    const path = modelPath || this.config.crystalModelPath;
    console.log(`[CRYSTAL-DEBUG] Forcing model load from: ${path}`);
    
    if (!this.crystalLoader) {
      console.error('[CRYSTAL-DEBUG] No crystal loader available for forced load');
      return false;
    }
    
    try {
      this.crystalLoader.load(
        path,
        (GLB) => {
          console.log('[CRYSTAL-DEBUG] Model loaded successfully:', {
            children: GLB?.children?.length || 0,
            type: typeof GLB
          });
          return true;
        },
        (progress) => {
          console.log('[CRYSTAL-DEBUG] Loading progress:', {
            loaded: progress.loaded,
            total: progress.total,
            percent: progress.total > 0 ? (progress.loaded / progress.total * 100).toFixed(1) + '%' : 'unknown'
          });
        },
        (error) => {
          console.error('[CRYSTAL-DEBUG] Error loading model in debug mode:', error);
          return false;
        }
      );
    } catch (err) {
      console.error('[CRYSTAL-DEBUG] Exception during debug model load:', err);
      return false;
    }
  };
}

/**
 * Forces a model load attempt for debugging
 * @param {Object} manager - The CrystalShardManager instance 
 */
async function forceModelLoad(manager) {
  console.log('[CRYSTAL-DEBUG] Forcing model load attempt');
  
  // Ensure loader is initialized
  if (!manager._loaderInitialized) {
    console.log('[CRYSTAL-DEBUG] Loader not initialized, attempting initialization');
    await manager.initializeGLBLoader();
  }
  
  if (!manager.crystalLoader) {
    console.error('[CRYSTAL-DEBUG] No crystal loader available after initialization attempt');
    return false;
  }
  
  return manager.debugForceLoadModel();
}

/**
 * Logs information about all active crystals
 * @param {Object} manager - The CrystalShardManager instance
 */
function listCrystals(manager) {
  const crystals = manager.crystals || [];
  
  console.log(`[CRYSTAL-DEBUG] Current crystal count: ${crystals.length}`);
  
  crystals.forEach((crystal, index) => {
    console.log(`[CRYSTAL-DEBUG] Crystal #${index + 1}:`, {
      position: crystal.position ? [crystal.position.x, crystal.position.y, crystal.position.z] : 'unknown',
      type: crystal.isFallback ? 'fallback' : 'model',
      hexId: crystal.hexId || 'unknown'
    });
  });
  
  return crystals.length;
}

/**
 * Verifies that asset paths exist and are accessible
 * @param {Object} manager - The CrystalShardManager instance
 */
function verifyAssetPaths(manager) {
  console.log('[CRYSTAL-DEBUG] Verifying asset paths');
  
  const paths = [
    { type: 'Model', path: manager.config.crystalModelPath },
    { type: 'Texture', path: manager.config.crystalTexturePath }
  ];
  
  paths.forEach(item => {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', item.path, true);
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`[CRYSTAL-DEBUG] ${item.type} file exists:`, item.path);
      } else {
        console.error(`[CRYSTAL-DEBUG] ${item.type} file NOT FOUND (${xhr.status}):`, item.path);
      }
    };
    
    xhr.onerror = function() {
      console.error(`[CRYSTAL-DEBUG] Error checking ${item.type} file:`, item.path);
    };
    
    xhr.send();
  });
}

/**
 * Tests fallback crystal creation at specific coordinates
 * @param {Object} manager - The CrystalShardManager instance
 * @param {Object} scene - The THREE.js scene
 * @param {Object} THREE - THREE.js library
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate 
 * @param {number} z - Z coordinate
 */
function testFallbackCrystal(manager, scene, THREE, x = 0, y = 0, z = 0) {
  console.log('[CRYSTAL-DEBUG] Testing fallback crystal creation at:', { x, y, z });
  
  // Create a mock hex with position
  const mockHex = {
    position: new THREE.Vector3(x, y, z),
    userData: {
      q: 0,
      r: 0,
      type: 'unknown'
    }
  };
  
  // Create the fallback crystal
  const crystal = manager.createFallbackCrystal(mockHex);
  
  if (crystal) {
    console.log('[CRYSTAL-DEBUG] Fallback crystal created successfully');
    return true;
  } else {
    console.error('[CRYSTAL-DEBUG] Failed to create fallback crystal');
    return false;
  }
}

/**
 * Resets and reinitializes all loaders
 * @param {Object} manager - The CrystalShardManager instance
 */
async function resetAndReinitializeLoaders(manager) {
  console.log('[CRYSTAL-DEBUG] Resetting and reinitializing loaders');
  
  // Reset loader state
  manager._loaderInitialized = false;
  manager._initializingLoader = false;
  manager.crystalLoader = null;
  
  // Force reload texture
  manager.crystalTextureLoaded = false;
  manager.crystalTexture = null;
  
  // Reinitialize everything
  try {
    const result = await manager.initializeGLBLoader();
    console.log('[CRYSTAL-DEBUG] Loader reinitialization result:', result);
    
    // Check result
    if (manager.crystalLoader) {
      console.log('[CRYSTAL-DEBUG] Loader successfully reinitialized');
      
      // Reload texture
      manager.loadCrystalTexture();
      
      return true;
    } else {
      console.error('[CRYSTAL-DEBUG] Loader reinitialization failed');
      return false;
    }
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error during loader reinitialization:', error);
    return false;
  }
}

/**
 * Tests spawning multiple crystals for debugging
 * @param {Object} manager - The CrystalShardManager instance
 * @param {number} count - Number of crystals to spawn
 */
function testMultipleCrystalSpawns(manager, count = 5) {
  console.log(`[CRYSTAL-DEBUG] Testing spawning of ${count} crystals`);
  
  // Count before we start
  const beforeCount = manager.crystals.length;
  
  // Create mock hexes in a grid pattern
  for (let i = 0; i < count; i++) {
    const x = (i % 3) * 2; // Grid layout with 3 columns
    const z = Math.floor(i / 3) * 2;
    
    spawnCrystalAt(manager, null, x, 0, z);
  }
  
  // Count after spawning
  setTimeout(() => {
    const afterCount = manager.crystals.length;
    console.log(`[CRYSTAL-DEBUG] Crystal count: ${beforeCount} → ${afterCount}, added ${afterCount - beforeCount}`);
  }, 1000); // Wait a bit for async operations
}

/**
 * Spawns a crystal at specific coordinates
 * @param {Object} manager - The CrystalShardManager instance
 * @param {Object} scene - The THREE.js scene
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 */
function spawnCrystalAt(manager, scene, x = 0, y = 0, z = 0) {
  console.log('[CRYSTAL-DEBUG] Spawning crystal at:', { x, y, z });
  
  // Create a mock hex with position
  const mockHex = {
    position: new THREE.Vector3(x, y, z),
    userData: {
      q: Math.round(x),
      r: Math.round(z),
      type: 'debug',
      crystal: false
    }
  };
  
  // Force spawn by temporarily setting probability to 1
  const originalProb = manager.config.crystalSpawnChance;
  manager.config.crystalSpawnChance = 1.0;
  
  try {
    // Try to spawn
    manager.trySpawnCrystalShard(mockHex);
    return true;
  } catch (error) {
    console.error('[CRYSTAL-DEBUG] Error spawning crystal at coordinates:', error);
    return false;
  } finally {
    // Restore original probability
    manager.config.crystalSpawnChance = originalProb;
  }
}

/**
 * Runs a comprehensive diagnostic check on the crystal system
 * @param {Object} manager - The CrystalShardManager instance
 */
function runDiagnostics(manager) {
  console.log('[CRYSTAL-DEBUG] Running comprehensive crystal system diagnostics');
  
  // Check manager state
  console.log('[CRYSTAL-DEBUG] Manager state:', {
    initialized: !!manager,
    hasScene: !!manager.scene,
    hasTHREE: !!manager.THREE,
    crystalCount: manager.crystals?.length || 0,
    loaderInitialized: manager._loaderInitialized,
    loaderSource: manager._crystalLoaderSource,
    hasTexture: !!manager.crystalTexture
  });
  
  // Check loader availability
  console.log('[CRYSTAL-DEBUG] Loader availability check:', {
    crystalLoader: !!manager.crystalLoader,
    loaderType: manager.crystalLoader ? typeof manager.crystalLoader : 'none',
    hasLoadMethod: manager.crystalLoader && typeof manager.crystalLoader.load === 'function',
    globalGLBLoader: typeof window.glbLoader,
    threeGLBLoader: typeof manager.THREE?.glbLoader
  });
  
  // Check configuration
  console.log('[CRYSTAL-DEBUG] Configuration check:', {
    spawnChance: manager.config.crystalSpawnChance,
    modelPath: manager.config.crystalModelPath,
    texturePath: manager.config.crystalTexturePath,
    heightOffset: manager.config.crystalHeightOffset,
    scaleFactor: manager.config.crystalScaleFactor,
    enableParticles: manager.config.enableParticles
  });
  
  // List existing crystals
  listCrystals(manager);
  
  // Check asset paths
  verifyAssetPaths(manager);
  
  // Recommend fixes
  console.log('[CRYSTAL-DEBUG] DIAGNOSTIC RECOMMENDATIONS:');
  
  if (!manager._loaderInitialized || !manager.crystalLoader) {
    console.log('[CRYSTAL-DEBUG] 💡 Try reinitializing the GLB loader: crystalDebug.resetLoaders()');
  }
  
  console.log('[CRYSTAL-DEBUG] 💡 Try spawning test crystals: crystalDebug.spawnCrystalAt(0, 0, 0)');
  console.log('[CRYSTAL-DEBUG] 💡 Verify asset paths: crystalDebug.verifyAssetPaths()');
  console.log('[CRYSTAL-DEBUG] 💡 Force model loading: crystalDebug.forceModelLoad()');
  
  return true;
}
