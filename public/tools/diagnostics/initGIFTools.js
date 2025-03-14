
/**
 * initGIFTools.js - Initialize GIF animation and debugging tools
 * 
 * This script ensures the required libraries are loaded in the correct order
 * and makes them available for use in the application.
 */

// Log initialization
console.log("[GIF-TOOLS] Initializing GIF animation tools");

/**
 * Load a script asynchronously
 * @param {string} src - Script URL
 * @returns {Promise} Promise that resolves when the script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    console.log(`[GIF-TOOLS] Loading script: ${src}`);
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      console.log(`[GIF-TOOLS] Script loaded: ${src}`);
      resolve();
    };
    
    script.onerror = (err) => {
      console.error(`[GIF-TOOLS] Failed to load script: ${src}`, err);
      reject(err);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Initialize all GIF tools
 */
async function initGIFTools() {
  try {
    // First check if omggif is already available as a module
    let omggifAvailable = false;
    
    try {
      if (typeof window.omggif !== 'undefined') {
        console.log("[GIF-TOOLS] omggif already available globally");
        omggifAvailable = true;
      } else if (typeof require === 'function') {
        try {
          window.omggif = require('omggif');
          console.log("[GIF-TOOLS] omggif loaded via require()");
          omggifAvailable = true;
        } catch (err) {
          console.log("[GIF-TOOLS] omggif not available via require:", err.message);
        }
      }
    } catch (err) {
      console.log("[GIF-TOOLS] Error checking for omggif:", err.message);
    }
    
    // If not available, load via CDN
    if (!omggifAvailable) {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js');
        console.log("[GIF-TOOLS] omggif loaded from CDN");
      } catch (err) {
        console.error("[GIF-TOOLS] Failed to load omggif from CDN:", err);
        // Try loading again from unpkg as a fallback
        await loadScript('https://unpkg.com/omggif@1.0.10/omggif.min.js');
      }
    }
    
    // Now load the debugger tools and loader
    await import('./GifDebugger.js')
      .then(() => console.log("[GIF-TOOLS] GifDebugger module loaded"))
      .catch(err => console.error("[GIF-TOOLS] Failed to load GifDebugger:", err));
      
    await import('../../tools/AnimatedGIFLoader.js')
      .then(module => {
        // Make it available globally
        window.AnimatedGIFLoader = module.AnimatedGIFLoader;
        console.log("[GIF-TOOLS] AnimatedGIFLoader module loaded");
      })
      .catch(err => console.error("[GIF-TOOLS] Failed to load AnimatedGIFLoader:", err));
      
    console.log("[GIF-TOOLS] GIF tools initialization complete");
    
    // Initialize debug UI
    if (window.GifDebugger) {
      window.gifDebugger = new window.GifDebugger();
    }
    
  } catch (err) {
    console.error("[GIF-TOOLS] Error during GIF tools initialization:", err);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', initGIFTools);

// Make initialization function available globally
window.initGIFTools = initGIFTools;

console.log("[GIF-TOOLS] Initialization script loaded");
/**
 * initGIFTools.js - Initialize tools for GIF animation debugging
 */

console.log('[GIF-TOOLS] Initializing GIF animation tools');

// Load omggif from CDN
const loadScript = (url) => {
  console.log(`[GIF-TOOLS] Loading script: ${url}`);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      console.log(`[GIF-TOOLS] Script loaded: ${url}`);
      resolve();
    };
    script.onerror = (err) => {
      console.error(`[GIF-TOOLS] Failed to load script: ${url}`, err);
      reject(err);
    };
    document.body.appendChild(script);
  });
};

// Load required libraries
Promise.all([
  loadScript('https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js')
])
.then(() => {
  console.log('[GIF-TOOLS] omggif loaded from CDN');
  return import('./GifDebugger.js');
})
.then(() => {
  console.log('[GIF-TOOLS] GifDebugger module loaded');
  return import('../../tools/AnimatedGIFLoader.js');
})
.then(() => {
  console.log('[GIF-TOOLS] AnimatedGIFLoader module loaded');
  console.log('[GIF-TOOLS] GIF tools initialization complete');
})
.catch(error => {
  console.error('[GIF-TOOLS] Error initializing GIF tools:', error);
});

console.log('[GIF-TOOLS] Initialization script loaded');
