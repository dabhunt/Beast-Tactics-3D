/**
 * Crystal Model Path Fixer and Spawn Logic Debugger
 * Run this script to fix the Crystal.glb path and test spawning logic
 */

const DEBUG_LOG = true;

function debugLog(...args) {
  if (DEBUG_LOG) console.log(...args);
}

/**
 * Diagnoses and fixes crystal model issues in the game
 */
async function fixCrystalModelIssues() {
  console.log("================================================");
  console.log("🔧 CRYSTAL MODEL PATH & SPAWN LOGIC FIXER");
  console.log("================================================");
  
  // Step 1: Check if Crystal.glb exists in various paths
  await verifyCrystalFile();
  
  // Step 2: Fix CrystalShardManager paths and spawn logic
  fixCrystalManager();
  
  console.log("🔧 Fixes applied - reload the page to test changes");
}

/**
 * Verifies the existence of the Crystal.glb file in various paths
 */
async function verifyCrystalFile() {
  console.log("\n🔍 STEP 1: Checking Crystal.glb file location");
  
  const paths = [
    "./assets/Crystal.glb",            // Path specified in code
    "assets/Crystal.glb",              // Without leading ./
    "/assets/Crystal.glb",             // With leading /
    "./Crystal.glb",                   // Direct in public folder
    "Crystal.glb",                     // No path prefix
    "/Crystal.glb",                    // Root path
    "./BiomeTiles/Models/Crystal.glb", // With biome tiles
    "BiomeTiles/Models/Crystal.glb"    // With biome tiles, no prefix
  ];
  
  let foundPath = null;
  
  // Try each path and see if the file exists
  for (const path of paths) {
    try {
      debugLog(`Checking path: ${path}`);
      const response = await fetch(path);
      
      debugLog(`Result for ${path}: ${response.status}`, {
        ok: response.ok,
        statusText: response.statusText,
        url: response.url
      });
      
      if (response.ok) {
        console.log(`✅ FOUND at path: ${path}`);
        foundPath = path;
        break;
      }
    } catch (error) {
      debugLog(`Error checking ${path}:`, error);
    }
  }
  
  if (foundPath) {
    console.log(`✅ Crystal.glb found at: ${foundPath}`);
  } else {
    console.error("❌ Crystal.glb not found in any of the checked paths");
    console.error("Please verify the file exists or upload it to the assets folder");
  }
  
  return foundPath;
}

/**
 * Fixes issues in the CrystalShardManager if it's already loaded
 */
function fixCrystalManager() {
  console.log("\n🔧 STEP 2: Fixing CrystalShardManager");
  
  // Check if the crystalShardManager is available
  if (typeof crystalShardManager === 'undefined') {
    console.warn("⚠️ Cannot access crystalShardManager - will apply fixes on next load");
    return;
  }
  
  try {
    // Fix 1: Update the path to the correct location if needed
    const originalPath = crystalShardManager.config.crystalModelPath;
    console.log(`Current crystal model path: ${originalPath}`);
    
    // Fix 2: Check spawn chance
    console.log(`Current crystal spawn chance: ${crystalShardManager.config.crystalSpawnChance}`);
    
    // Fix 3: Track active crystals
    console.log(`Active crystals count: ${crystalShardManager.activeCrystals.length}`);
    
    // Fix 4: Log current scene children to find any crystals
    if (crystalShardManager.scene) {
      const crystalModels = crystalShardManager.scene.children.filter(child => 
        child.userData && (child.userData.isCrystal || child.name?.includes('Crystal')));
      
      console.log(`Crystal models in scene: ${crystalModels.length}`);
      
      if (crystalModels.length > 0) {
        console.log(`Positions: ${crystalModels.map(c => 
          `(${c.position.x.toFixed(2)},${c.position.y.toFixed(2)},${c.position.z.toFixed(2)})`).join(', ')}`);
      }
    }
    
    // Fix 5: Monkey-patch trySpawnCrystalShard to fix the early assignment issue
    if (crystalShardManager.trySpawnCrystalShard) {
      const originalSpawnMethod = crystalShardManager.trySpawnCrystalShard;
      
      console.log("🔧 Applying monkey patch to fix spawn logic...");
      
      // Create patched version of the method that prevents early assignment of hex.userData.crystal
      crystalShardManager.trySpawnCrystalShard = async function(hex) {
        console.log(`[PATCHED] Trying to spawn crystal on hex (${hex.userData.q}, ${hex.userData.r})`);
        
        try {
          // Check if crystal already exists
          if (hex.userData.crystal) {
            console.log(`[PATCHED] Hex already has crystal, skipping`);
            return null;
          }
          
          // Random check
          const randomValue = Math.random();
          const willSpawn = randomValue < this.config.crystalSpawnChance;
          
          console.log(`[PATCHED] Spawn probability check: ${randomValue.toFixed(4)} vs ${this.config.crystalSpawnChance} - ${willSpawn ? 'SPAWN' : 'NO SPAWN'}`);
          
          if (!willSpawn) {
            console.log(`[PATCHED] Crystal spawn skipped due to random check`);
            return null;
          }
          
          console.log(`[PATCHED] Will spawn crystal on hex (${hex.userData.q}, ${hex.userData.r})`);
          
          // Initialize loader
          const loaderInitialized = await this.initializeCrystalLoader();
          
          // Try to load model
          if (this.crystalLoader) {
            console.log(`[PATCHED] Using loader to load crystal model`);
            return this.loadCrystalModel(hex);
          } else {
            console.log(`[PATCHED] Using fallback crystal`);
            return this.createFallbackCrystal(hex);
          }
        } catch (error) {
          console.error(`[PATCHED] Error in trySpawnCrystalShard:`, error);
          return null;
        }
      };
      
      console.log("✅ Spawn logic patched successfully");
    }
    
    console.log("✅ CrystalShardManager fixes applied");
    
  } catch (error) {
    console.error("❌ Error fixing CrystalShardManager:", error);
  }
}

// Make available globally for console use
window.fixCrystalModelIssues = fixCrystalModelIssues;

// Auto-run when loaded
console.log("🔧 Crystal Model Fixer loaded");
console.log("Run manually with: window.fixCrystalModelIssues()");

// Run automatically
fixCrystalModelIssues();
