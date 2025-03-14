
/**
 * debugLoader.js - Single entry point for loading all debug tools
 * 
 * This script coordinates loading all debug tools in the correct order
 * to avoid duplicate declarations and initialization problems.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

console.log("[DEBUG-LOADER] Starting debug tools initialization");

// Track loading state
const loadingState = {
  debugMenu: false,
  gifTools: false,
  arrowDebugger: false,
  completed: false
};

/**
 * Load the specified debug modules in sequence
 */
async function loadDebugTools() {
  try {
    // 1. First load the central debug menu
    console.log("[DEBUG-LOADER] Loading DebugMenu...");
    const debugMenuModule = await import('./DebugMenu.js');
    window.gameDebugMenu = debugMenuModule.default;
    loadingState.debugMenu = true;
    console.log("[DEBUG-LOADER] DebugMenu loaded successfully");
    
    // 2. Load GIF tools
    console.log("[DEBUG-LOADER] Loading GIF tools...");
    try {
      const gifLoaderModule = await import('../AnimatedGIFLoader.js');
      window.gifLoader = gifLoaderModule.default;
      loadingState.gifTools = true;
      console.log("[DEBUG-LOADER] GIF tools loaded successfully");
    } catch (err) {
      console.error("[DEBUG-LOADER] Failed to load GIF tools:", err);
    }
    
    // 3. Initialize GIF tester
    console.log("[DEBUG-LOADER] Loading GIF tester...");
    try {
      const gifTesterModule = await import('./initGifTester.js');
      loadingState.gifTester = true;
      console.log("[DEBUG-LOADER] GIF tester loaded successfully");
    } catch (err) {
      console.error("[DEBUG-LOADER] Failed to load GIF tester:", err);
    }
    
    // Mark loading as complete
    loadingState.completed = true;
    console.log("[DEBUG-LOADER] All debug tools loaded successfully");
    
    // Fire an event to notify other scripts
    const event = new CustomEvent('debug-tools-loaded', { detail: loadingState });
    window.dispatchEvent(event);
    
  } catch (err) {
    console.error("[DEBUG-LOADER] Error loading debug tools:", err);
  }
}

// Start loading
loadDebugTools();

// Export loading state for other modules to check
export const debugLoadingState = loadingState;
export default loadingState;
