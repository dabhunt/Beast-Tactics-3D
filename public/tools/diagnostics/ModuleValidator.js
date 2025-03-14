
/**
 * ModuleValidator.js
 * Diagnostic tool to validate module loading and imports
 */

console.log("[MODULE-VALIDATOR] Starting module validation checks...");

// Record start time for performance tracking
const startTime = performance.now();

// Check if running in module context
const isModule = typeof import.meta !== 'undefined';
console.log(`[MODULE-VALIDATOR] Running in ${isModule ? 'module' : 'non-module'} context`);

// Test THREE.js imports
try {
  const testImport = async () => {
    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js");
      console.log("[MODULE-VALIDATOR] Successfully imported THREE.js:", {
        version: THREE.REVISION,
        hasCamera: !!THREE.PerspectiveCamera,
        hasFontLoader: !!THREE.FontLoader
      });
      
      // Test specific modules
      try {
        const fontLoader = new THREE.FontLoader();
        console.log("[MODULE-VALIDATOR] FontLoader constructor works");
      } catch (err) {
        console.error("[MODULE-VALIDATOR] Error creating FontLoader:", err);
      }
      
      return THREE;
    } catch (err) {
      console.error("[MODULE-VALIDATOR] Error importing THREE.js:", err);
      throw err;
    }
  };
  
  testImport().then(THREE => {
    // Test THREE.FontLoader specifically
    if (THREE.FontLoader) {
      console.log("[MODULE-VALIDATOR] THREE.FontLoader is available");
    } else {
      console.warn("[MODULE-VALIDATOR] THREE.FontLoader is not available in THREE module");
    }
    
    // Report completion time
    const endTime = performance.now();
    console.log(`[MODULE-VALIDATOR] Module validation complete in ${(endTime - startTime).toFixed(2)}ms`);
  });
} catch (err) {
  console.error("[MODULE-VALIDATOR] Top-level error in validation:", err);
}

// Check all script tags in document
console.log("[MODULE-VALIDATOR] Checking script tags:");
document.querySelectorAll('script').forEach((script, index) => {
  console.log(`Script #${index + 1}:`, {
    src: script.src || "(inline)",
    type: script.type || "(default)",
    async: script.async,
    defer: script.defer,
    module: script.type === 'module'
  });
});
