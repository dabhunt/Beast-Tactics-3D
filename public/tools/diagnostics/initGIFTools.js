
/**
 * initGIFTools.js - Initializes GIF animation debugging tools
 * 
 * This module loads required dependencies and initializes GIF-related 
 * debugging tools.
 */

console.log('[GIF-TOOLS] Initializing GIF animation tools');

// Track loaded status
let omggifLoaded = false;
let gifuctLoaded = false;

/**
 * Load external script dynamically
 * @param {string} url - Script URL to load
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadScriptAsync(url) {
  return new Promise((resolve, reject) => {
    console.log(`[GIF-TOOLS] Loading script: ${url}`);
    
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      console.log(`[GIF-TOOLS] Script already loaded: ${url}`);
      return resolve(existingScript);
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    // Setup event handlers
    script.onload = () => {
      console.log(`[GIF-TOOLS] Script loaded: ${url}`);
      resolve(script);
    };
    
    script.onerror = (error) => {
      console.error(`[GIF-TOOLS] Error loading script: ${url}`, error);
      reject(error);
    };
    
    // Append to document head
    document.head.appendChild(script);
  });
}

// Load omggif library if needed
async function loadOMGGif() {
  if (window.OMGGIF) {
    console.log('[GIF-TOOLS] omggif already loaded');
    omggifLoaded = true;
    return;
  }
  
  try {
    await loadScriptAsync('https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js');
    console.log('[GIF-TOOLS] omggif loaded from CDN');
    omggifLoaded = true;
  } catch (error) {
    console.error('[GIF-TOOLS] Failed to load omggif:', error);
    throw error;
  }
}

// Load necessary modules
async function loadGIFModules() {
  try {
    // Load omggif first
    await loadOMGGif();
    
    // Load GIF parsing and animation modules
    const { GifDebugger } = await import('../SimpleGIFAnimator.js');
    console.log('[GIF-TOOLS] GifDebugger module loaded');
    
    const { AnimatedGIFLoader } = await import('../AnimatedGIFLoader.js');
    console.log('[GIF-TOOLS] AnimatedGIFLoader module loaded');
    
    // Add to window for debugging
    window.GifDebugger = GifDebugger;
    window.AnimatedGIFLoader = AnimatedGIFLoader;
    
    console.log('[GIF-TOOLS] GIF tools initialization complete');
  } catch (error) {
    console.error('[GIF-TOOLS] Error loading GIF modules:', error);
    throw error;
  }
}

// Load GIF modules
loadGIFModules();

console.log('[GIF-TOOLS] Initialization script loaded');
