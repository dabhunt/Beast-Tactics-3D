/**
 * debugLoader.js - Utility for loading debug tools in the proper sequence
 * 
 * This module handles the loading of various debugging tools while ensuring
 * proper dependency management.
 */

/**
 * Helper function for debug logging
 * @param {string} message - Message to log
 */
function debugLog(message) {
  console.log(`[DEBUG-LOADER] ${message}`);
}

/**
 * Load all debug tools in the proper order
 */
export async function loadDebugTools() {
  try {
    debugLog('Starting debug tools initialization');

    // Load dependencies first
    debugLog('Loading DebugMenu...');
    const DebugMenuModule = await import('./DebugMenu.js');
    const DebugMenu = DebugMenuModule.DebugMenu;

    // Create debug menu instance if not already created
    if (!window.gameDebugMenu) {
      window.gameDebugMenu = new DebugMenu();
      debugLog('Debug menu created');
    } else {
      debugLog('Using existing debug menu');
    }

    // GIF animation tools (load before other GIF-dependent tools)
    debugLog('Loading GIF animation tools...');
    await import('./initGIFTools.js')
      .catch(err => {
        console.error('[DEBUG-LOADER] Failed to load GIF tools:', err);
      });

    // GIF tester (after GIF tools are loaded)
    debugLog('Loading GIF animation tester...');
    await import('./initGifTester.js')
      .catch(err => {
        console.error('[DEBUG-LOADER] Failed to load GIF tester:', err);
      });

    debugLog('All debug tools loaded successfully');

    return window.gameDebugMenu;
  } catch (err) {
    console.error('[DEBUG-LOADER] Error loading debug tools:', err);
    throw err;
  }
}

// Auto-initialize debug tools when loaded
try {
  loadDebugTools().catch(err => {
    console.error('[DEBUG-LOADER] Failed to auto-initialize debug tools:', err);
  });
} catch (err) {
  console.error('[DEBUG-LOADER] Failed to start debug tools initialization:', err);
}