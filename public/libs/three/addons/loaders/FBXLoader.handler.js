/**
 * FBXLoader.handler.js
 * 
 * This script properly exports the FBXLoader to the global scope
 * ensuring it's available for the application. It handles importing the 
 * main FBXLoader module and exposing it globally.
 */

// When this script is loaded, it will dynamically import the FBXLoader
// and make it available on the window object
console.log('[FBX-HANDLER] Starting FBXLoader initialization');

// Track loading errors for diagnostics
window._fbxLoaderErrors = window._fbxLoaderErrors || [];

// Try loading FBXLoader and make it globally available
import('./FBXLoader.js')
  .then(module => {
    console.log('[FBX-HANDLER] FBXLoader module loaded:', Object.keys(module));
    
    if (module.FBXLoader) {
      console.log('[FBX-HANDLER] Setting window.FBXLoader from module.FBXLoader');
      window.FBXLoader = module.FBXLoader;
    } else {
      console.error('[FBX-HANDLER] Failed to extract FBXLoader from module!', module);
      window._fbxLoaderErrors.push({
        type: 'handler-extraction-failed',
        moduleKeys: Object.keys(module)
      });
    }
  })
  .catch(error => {
    console.error('[FBX-HANDLER] Failed to load FBXLoader module:', error);
    window._fbxLoaderErrors.push({
      type: 'handler-import-failed',
      error: error.toString()
    });
  });

// Export a function to check if FBXLoader is ready
export function isFBXLoaderReady() {
  return typeof window.FBXLoader === 'function';
}
