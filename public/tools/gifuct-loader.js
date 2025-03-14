
/**
 * gifuct-loader.js - Loads and initializes the gifuct-js library for GIF parsing
 */

console.log("[GIFUCT] Initializing GIF parser loader");

// Create a promise to track when the library is fully loaded
window.gifuctLoaded = new Promise((resolve, reject) => {
  try {
    // Load the gifuct-js library from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gifuct-js@1.0.0/dist/gifuct-js.min.js';
    script.async = true;
    
    script.onload = () => {
      console.log("[GIFUCT] Successfully loaded gifuct-js library");
      
      // Check if the expected functions are available in the global scope
      if (window.parseGIF && window.decompressFrames) {
        console.log("[GIFUCT] GIF parser functions verified and ready to use");
        
        // Make them available as named exports
        window.gifuct = {
          parseGIF: window.parseGIF,
          decompressFrames: window.decompressFrames
        };
        
        // Resolve the promise to signal the library is ready
        resolve(window.gifuct);
      } else {
        console.error("[GIFUCT] Library loaded but functions not found in global scope");
        reject(new Error("GIF parser functions not found"));
      }
    };
    
    script.onerror = (err) => {
      console.error("[GIFUCT] Failed to load gifuct-js library:", err);
      reject(err);
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    console.log("[GIFUCT] Added gifuct-js script to document");
  } catch (err) {
    console.error("[GIFUCT] Error initializing GIF parser loader:", err);
    reject(err);
  }
});

// Export functions that will be available after the library loads
export async function parseGIF(arrayBuffer) {
  const gifuct = await window.gifuctLoaded;
  return gifuct.parseGIF(arrayBuffer);
}

export async function decompressFrames(gif, buildImagePatches) {
  const gifuct = await window.gifuctLoaded;
  return gifuct.decompressFrames(gif, buildImagePatches);
}

console.log("[GIFUCT] GIF parser loader initialized");
