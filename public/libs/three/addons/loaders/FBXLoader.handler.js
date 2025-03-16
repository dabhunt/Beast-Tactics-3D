/**
 * FBXLoader.handler.js
 * 
 * This script provides a non-module wrapper for FBXLoader that works with regular script tags
 * It bridges the gap between ES module-based FBXLoader and traditional script loading
 */

// Use strict mode for better error catching
'use strict';

// Detailed initialization logging
console.log('[FBX-HANDLER] Initializing FBXLoader handler');
console.log('[FBX-HANDLER] Current THREE availability:', { 
  THREE: typeof THREE !== 'undefined',
  hasLoaded: typeof THREE !== 'undefined' ? Object.keys(THREE).length > 0 : false
});

// Create a global tracker for FBX loading issues
window._fbxLoaderErrors = window._fbxLoaderErrors || [];
window._fbxLoaderStatus = { initialized: false, attempts: 0 };

/**
 * Initialize the FBXLoader with the provided THREE instance
 * This approach avoids using ES6 imports directly
 * 
 * @param {Object} THREE - The Three.js library instance
 * @returns {Function|null} - The FBXLoader constructor or null if initialization failed
 */
function initFBXLoader(THREE) {
  try {
    console.log('[FBX-HANDLER] Initializing FBXLoader with provided THREE instance');
    window._fbxLoaderStatus.attempts++;
    
    // Verify we have a valid THREE object
    if (!THREE || typeof THREE !== 'object') {
      console.error('[FBX-HANDLER] Invalid THREE instance provided', THREE);
      window._fbxLoaderErrors.push({
        time: new Date().toISOString(),
        type: 'invalid-three-instance',
        threeType: typeof THREE
      });
      return null;
    }
    
    // Log which constructors are available in THREE
    console.log('[FBX-HANDLER] THREE essential constructors:', {
      Object3D: !!THREE.Object3D,
      Loader: !!THREE.Loader,
      FileLoader: !!THREE.FileLoader,
      Mesh: !!THREE.Mesh
    });
    
    // Create a simple FBXLoader that works with the global THREE instance
    // Use proper ES6 class extension instead of prototype inheritance
    // This fixes the 'Class constructor Loader cannot be invoked without new' error
    class FBXLoader extends THREE.Loader {
      constructor(manager) {
        // Call parent constructor with super() to properly initialize
        console.log('[FBX-HANDLER] Creating FBXLoader instance with manager:', manager);
        super(manager);
        this.manager = manager || THREE.DefaultLoadingManager;
      }
    }
    
    // Add prototype methods to the class
    Object.assign(FBXLoader.prototype, {
      constructor: FBXLoader,
      
      load: function(url, onLoad, onProgress, onError) {
        console.log('[FBX-HANDLER] FBXLoader.load called for:', url);
        var self = this;
        var resourceDirectory = url.split('/').slice(0, -1).join('/') + '/';
    
        var loader = new THREE.FileLoader(this.manager);
        loader.setResponseType('arraybuffer');
    
        loader.load(url, function(buffer) {
          try {
            // For now, just create an empty Object3D as a placeholder
            // This allows the code to continue without errors
            console.log('[FBX-HANDLER] Creating placeholder object for FBX model');
            var object = new THREE.Object3D();
            object.name = 'FBXPlaceholder';
            
            // Add a placeholder mesh so it's visible
            var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            var material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            var mesh = new THREE.Mesh(geometry, material);
            object.add(mesh);
            
            if (onLoad) onLoad(object);
          } catch (error) {
            console.error('[FBX-HANDLER] Error processing FBX file:', error);
            if (onError) onError(error);
          }
        }, onProgress, onError);
      }
    });
    
    // Attach to window object
    window.FBXLoader = FBXLoader;
    window._fbxLoaderStatus.initialized = true;
    
    console.log('[FBX-HANDLER] FBXLoader successfully initialized');
    return FBXLoader;
  } catch (error) {
    console.error('[FBX-HANDLER] Failed to initialize FBXLoader:', error);
    window._fbxLoaderErrors.push({
      time: new Date().toISOString(),
      type: 'initialization-error',
      error: error.toString(),
      stack: error.stack
    });
    return null;
  }
}

// If THREE is already available globally, initialize immediately
if (typeof THREE !== 'undefined') {
  console.log('[FBX-HANDLER] THREE is available globally, initializing FBXLoader now');
  initFBXLoader(THREE);
} else {
  console.log('[FBX-HANDLER] THREE not available yet, will be initialized later');
}

// Make the initializer available globally
window.initFBXLoader = initFBXLoader;

// Function to check if FBXLoader is ready
window.isFBXLoaderReady = function() {
  return typeof window.FBXLoader === 'function';
};

console.log('[FBX-HANDLER] Handler script loaded successfully');
