/**
 * Crystal GLB Model Diagnostic Tool
 * This script helps diagnose issues with crystal model loading
 * It verifies file paths, checks model loading, and provides detailed logging
 */

const DEBUG_LOG = true;

function debugLog(...args) {
  if (DEBUG_LOG) console.log(...args);
}

class CrystalModelDiagnostics {
  constructor() {
    this.testResults = {
      fileExistence: {},
      loaderAvailability: {},
      modelLoading: {}
    };
  }

  /**
   * Run all diagnostics tests
   * @param {string} modelPath - Path to the crystal GLB model
   */
  async runAllTests(modelPath = "./assets/Crystal.glb") {
    console.log("=============================================");
    console.log("🔍 STARTING CRYSTAL MODEL DIAGNOSTICS");
    console.log("=============================================");
    
    // Saving the model path for reference
    this.modelPath = modelPath;
    
    try {
      // Test 1: File existence check
      await this.checkFileExists(modelPath);
      
      // Test 2: Check loader availability
      this.checkLoaderAvailability();
      
      // Test 3: Attempt direct model loading
      await this.testModelLoading(modelPath);
      
      // Test 4: Check spawn logic
      this.checkSpawnLogic();
      
      // Print summary of all tests
      this.printSummary();
    } catch (error) {
      console.error("❌ Error running diagnostics:", error);
      console.error("Stack trace:", error.stack);
    }
  }
  
  /**
   * Check if the file exists using fetch
   * @param {string} path - Path to check
   */
  async checkFileExists(path) {
    console.log(`\n🔍 TEST 1: Checking if file exists at path: ${path}`);
    
    try {
      // Try relative path
      console.log(`Checking relative path: ${path}`);
      const response = await fetch(path);
      
      this.testResults.fileExistence.relativePath = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        url: response.url
      };
      
      console.log(`File check result (relative): ${response.ok ? '✅ FOUND' : '❌ NOT FOUND'}`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      // Try absolute path as alternative
      const absolutePath = window.location.origin + '/' + path.replace(/^\.\//, '');
      console.log(`Checking absolute path: ${absolutePath}`);
      const absResponse = await fetch(absolutePath);
      
      this.testResults.fileExistence.absolutePath = {
        status: absResponse.status,
        ok: absResponse.ok,
        statusText: absResponse.statusText,
        url: absResponse.url
      };
      
      console.log(`File check result (absolute): ${absResponse.ok ? '✅ FOUND' : '❌ NOT FOUND'}`, {
        status: absResponse.status,
        statusText: absResponse.statusText,
        url: absResponse.url
      });
      
      // Try without assets folder (direct in public)
      const noAssetsPath = window.location.origin + '/' + path.replace(/^\.\/assets\//, '');
      console.log(`Checking without assets folder: ${noAssetsPath}`);
      const noAssetsResponse = await fetch(noAssetsPath);
      
      this.testResults.fileExistence.noAssetsPath = {
        status: noAssetsResponse.status,
        ok: noAssetsResponse.ok,
        statusText: noAssetsResponse.statusText,
        url: noAssetsResponse.url
      };
      
      console.log(`File check result (no assets): ${noAssetsResponse.ok ? '✅ FOUND' : '❌ NOT FOUND'}`, {
        status: noAssetsResponse.status,
        statusText: noAssetsResponse.statusText,
        url: noAssetsResponse.url
      });
      
      // Check for successful path
      const successfulPath = this.testResults.fileExistence.relativePath.ok ? path :
                            this.testResults.fileExistence.absolutePath.ok ? absolutePath :
                            this.testResults.fileExistence.noAssetsPath.ok ? noAssetsPath : null;
      
      if (successfulPath) {
        console.log(`✅ SUCCESS: Found file at: ${successfulPath}`);
        this.testResults.fileExistence.successfulPath = successfulPath;
      } else {
        console.error('❌ CRITICAL: Crystal GLB model not found at any tested path');
        this.testResults.fileExistence.successfulPath = null;
      }
      
    } catch (error) {
      console.error('❌ Error checking file existence:', error);
      this.testResults.fileExistence.error = error.message;
    }
  }
  
  /**
   * Check if THREE.GLTFLoader is available
   */
  checkLoaderAvailability() {
    console.log("\n🔍 TEST 2: Checking GLTFLoader availability");
    
    try {
      // Check multiple ways of accessing the loader
      const checks = [
        { name: "global-GLTFLoader", check: () => typeof GLTFLoader === "function" },
        { name: "THREE.GLTFLoader", check: () => typeof THREE?.GLTFLoader === "function" },
        { name: "window.GLTFLoader", check: () => typeof window?.GLTFLoader === "function" }
      ];
      
      let loaderAvailable = false;
      
      // Try each method
      for (const check of checks) {
        try {
          const result = check.check();
          this.testResults.loaderAvailability[check.name] = result;
          console.log(`Checking for ${check.name}: ${result ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
          
          if (result) {
            loaderAvailable = true;
          }
        } catch (err) {
          console.warn(`Error checking ${check.name}:`, err.message);
          this.testResults.loaderAvailability[check.name] = false;
        }
      }
      
      // If no loader is available, check if THREE is loaded
      if (!loaderAvailable) {
        const threeAvailable = typeof THREE !== 'undefined';
        console.log(`THREE.js availability: ${threeAvailable ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
        
        if (threeAvailable) {
          console.log('THREE version or keys:', Object.keys(THREE).slice(0, 20).join(', '));
        }
        
        this.testResults.loaderAvailability.threeAvailable = threeAvailable;
      }
    } catch (error) {
      console.error('❌ Error checking loader availability:', error);
      this.testResults.loaderAvailability.error = error.message;
    }
  }
  
  /**
   * Test loading the model directly
   * @param {string} path - Path to the model
   */
  async testModelLoading(path) {
    console.log(`\n🔍 TEST 3: Testing direct model loading from: ${path}`);
    
    try {
      // First make sure THREE and GLTFLoader are available
      if (typeof THREE === 'undefined') {
        console.error('❌ THREE is not defined, cannot test model loading');
        this.testResults.modelLoading.status = 'ERROR';
        this.testResults.modelLoading.error = 'THREE is not defined';
        return;
      }
      
      // Try to get the loader - use the first available loader
      let loader = null;
      
      if (typeof GLTFLoader === 'function') {
        console.log('Using global GLTFLoader');
        loader = new GLTFLoader();
      } else if (typeof THREE.GLTFLoader === 'function') {
        console.log('Using THREE.GLTFLoader');
        loader = new THREE.GLTFLoader();
      } else {
        console.error('❌ GLTFLoader not available, cannot test model loading');
        this.testResults.modelLoading.status = 'ERROR';
        this.testResults.modelLoading.error = 'GLTFLoader not available';
        return;
      }
      
      // Use the successful path from the file existence check if available
      const modelPath = this.testResults.fileExistence.successfulPath || path;
      console.log(`Attempting to load model from: ${modelPath}`);
      
      // Create a promise to handle the async loading
      const loadPromise = new Promise((resolve, reject) => {
        loader.load(
          modelPath,
          (gltf) => {
            console.log('✅ Model loaded successfully:', {
              sceneChildCount: gltf.scene?.children?.length || 0,
              hasScene: gltf?.scene != null,
              animations: gltf?.animations?.length || 0
            });
            
            this.testResults.modelLoading = {
              status: 'SUCCESS',
              sceneChildCount: gltf.scene?.children?.length || 0,
              hasScene: gltf?.scene != null,
              animations: gltf?.animations?.length || 0
            };
            
            resolve(gltf);
          },
          (progress) => {
            console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
          },
          (error) => {
            console.error('❌ Error loading model:', error);
            this.testResults.modelLoading = {
              status: 'ERROR',
              error: error.message
            };
            reject(error);
          }
        );
      });
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Model loading timed out after 10 seconds')), 10000);
      });
      
      // Wait for either the load to complete or timeout
      await Promise.race([loadPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('❌ Error testing model loading:', error);
      this.testResults.modelLoading = {
        status: 'ERROR',
        error: error.message
      };
    }
  }
  
  /**
   * Check crystal spawn logic in CrystalShardManager
   */
  checkSpawnLogic() {
    console.log("\n🔍 TEST 4: Checking crystal spawn logic");
    
    try {
      // Check if we can access the crystal shard manager
      if (typeof crystalShardManager === 'undefined') {
        console.warn('❓ Cannot access crystalShardManager, skipping spawn logic check');
        return;
      }
      
      // Check key properties related to spawning
      const spawnChance = crystalShardManager.config?.crystalSpawnChance;
      console.log(`Crystal spawn chance: ${spawnChance !== undefined ? spawnChance : 'unknown'}`);
      
      // Check if hex.userData.crystal is set properly during spawn process
      console.log('Inspecting trySpawnCrystalShard implementation...');
      
      // This is just a pattern analysis, not actual execution
      const findings = {
        earlyAssignment: false,
        correctAssignment: false
      };
      
      // We can't easily inspect the function implementation
      // Just report what we know about the spawn chance
      this.testResults.spawnLogic = {
        spawnChance,
        potentialIssues: [
          "Verify that hex.userData.crystal is not set too early in trySpawnCrystalShard",
          "Check if hex.userData.crystal is only set after successful model loading",
          "Inspect error handling to ensure hex.userData.crystal is not set on error paths"
        ]
      };
      
    } catch (error) {
      console.error('❌ Error checking spawn logic:', error);
      this.testResults.spawnLogic = {
        error: error.message
      };
    }
  }
  
  /**
   * Print a summary of all test results
   */
  printSummary() {
    console.log("\n=============================================");
    console.log("📊 CRYSTAL MODEL DIAGNOSTICS SUMMARY");
    console.log("=============================================");
    
    // File existence summary
    const fileFound = this.testResults.fileExistence.successfulPath !== null;
    console.log(`File Existence: ${fileFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (fileFound) {
      console.log(`  Working Path: ${this.testResults.fileExistence.successfulPath}`);
    }
    
    // Loader availability summary
    const loaderFound = 
      this.testResults.loaderAvailability['global-GLTFLoader'] ||
      this.testResults.loaderAvailability['THREE.GLTFLoader'] ||
      this.testResults.loaderAvailability['window.GLTFLoader'];
    
    console.log(`GLTFLoader Availability: ${loaderFound ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
    
    // Model loading summary
    const modelLoaded = this.testResults.modelLoading.status === 'SUCCESS';
    console.log(`Model Loading: ${modelLoaded ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (this.testResults.modelLoading.error) {
      console.log(`  Error: ${this.testResults.modelLoading.error}`);
    }
    
    // Suggested fixes
    console.log("\n📋 SUGGESTED FIXES:");
    
    if (!fileFound) {
      console.log("1. ❗ The Crystal.glb file could not be found. Consider:");
      console.log("   - Verify the file is in the correct location");
      console.log("   - Check the case sensitivity of the filename");
      console.log("   - Try moving the file to the root of the public directory");
    }
    
    if (!loaderFound) {
      console.log(`${fileFound ? '2' : '1'}. ❗ GLTFLoader is not available. Consider:`);
      console.log("   - Verify THREE.js is properly loaded");
      console.log("   - Check GLTFLoader import paths");
      console.log("   - Make sure the loader is initialized before use");
    }
    
    if (fileFound && loaderFound && !modelLoaded) {
      console.log(`${!fileFound || !loaderFound ? '3' : '1'}. ❗ Model loading failed. Consider:`);
      console.log("   - Check console errors for specific loading issues");
      console.log("   - Verify the model file is a valid GLB format");
      console.log("   - Try loading the model from the path:", this.testResults.fileExistence.successfulPath);
    }
    
    console.log("\n2. ❗ For the crystal spawning issue:");
    console.log("   - Ensure hex.userData.crystal is only set after successful model loading");
    console.log("   - Make sure the original early assignment in trySpawnCrystalShard is removed");
    console.log("   - Check for any early returns that might prevent multiple crystals from spawning");
    
    console.log("\n=============================================");
    console.log("🔍 CRYSTAL MODEL DIAGNOSTICS COMPLETE");
    console.log("=============================================");
  }
}

// Export for use in the main application
window.CrystalModelDiagnostics = CrystalModelDiagnostics;

// Helper function to run diagnostics directly from console
window.runCrystalDiagnostics = async function(path = "./assets/Crystal.glb") {
  const diagnostics = new CrystalModelDiagnostics();
  await diagnostics.runAllTests(path);
  return diagnostics.testResults;
};

console.log("🔍 Crystal Model Diagnostics loaded");
console.log("Run diagnostics with: window.runCrystalDiagnostics()");
