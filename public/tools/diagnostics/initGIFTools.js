/**
 * initGIFTools.js - Initialize GIF animation tools and utilities
 * 
 * This script loads and initializes all the necessary GIF animation
 * related tools and makes them available globally.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

console.log("[GIF-TOOLS] Initializing GIF animation tools");

// Track initialization state
let initialized = false;

/**
 * Load a script from URL with error handling
 * @param {string} url - Script URL to load
 * @returns {Promise} - Promise resolving when script is loaded
 */
async function loadScript(url) {
  console.log(`[GIF-TOOLS] Loading script: ${url}`);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      console.log(`[GIF-TOOLS] Script loaded: ${url}`);
      resolve();
    };

    script.onerror = (err) => {
      console.error(`[GIF-TOOLS] Failed to load script: ${url}`, err);
      reject(err);
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize all GIF animation tools
 */
async function initializeGIFTools() {
  if (initialized) {
    console.log("[GIF-TOOLS] GIF tools already initialized");
    return;
  }

  try {
    console.log("[GIF-TOOLS] Initialization script loaded");

    // Load additional dependencies
    await loadScript("https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js");
    console.log("[GIF-TOOLS] omggif loaded from CDN");

    // Import GifDebugger module
    try {
      const gifDebuggerModule = await import('../diagnostics/DebugMenu.js');
      window.GIFDebugger = gifDebuggerModule.GIFDebugger;
      console.log("[GIF-TOOLS] GifDebugger module loaded");
    } catch (err) {
      console.error("[GIF-TOOLS] Failed to load GifDebugger module:", err);
    }

    // Import AnimatedGIFLoader module
    try {
      const loaderModule = await import('../AnimatedGIFLoader.js');
      window.gifLoader = loaderModule.gifLoader;
      console.log("[GIF-TOOLS] AnimatedGIFLoader module loaded");
    } catch (err) {
      console.error("[GIF-TOOLS] Failed to load AnimatedGIFLoader module:", err);
    }

    // Mark as initialized
    initialized = true;
    console.log("[GIF-TOOLS] GIF tools initialization complete");

  } catch (err) {
    console.error("[GIF-TOOLS] Failed to initialize GIF tools:", err);
  }
}

// Start initialization
initializeGIFTools();