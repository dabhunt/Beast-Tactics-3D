
/**
 * gifuct-loader.js - Loads and initializes the gifuct-js library for GIF parsing
 */

console.log("[GIFUCT] Initializing GIF parser loader");

// Create a promise to track when the library is fully loaded
window.gifuctLoaded = new Promise((resolve, reject) => {
  try {
    console.log("[GIFUCT] Loading gifuct-js library from npm package");
    
    // Load the gifuct-js library from npm package
    const script = document.createElement('script');
    script.src = '/node_modules/gifuct-js/dist/gifuct-js.js';
    script.async = true;
    
    script.onload = () => {
      console.log("[GIFUCT] Successfully loaded gifuct-js library");
      
      // Log what's available in window to help debug
      console.log("[GIFUCT-DEBUG] Available globals:", 
        Object.keys(window).filter(key => 
          key.toLowerCase().includes('gif') || 
          key.toLowerCase().includes('parse') || 
          key.toLowerCase().includes('decompress')
        )
      );
      
      // Check if library exposes itself as a global object
      if (window.gifuctJs) {
        console.log("[GIFUCT] Found gifuctJs global object");
        window.gifuct = window.gifuctJs;
        resolve(window.gifuct);
      }
      // Check if the expected functions are available in the global scope
      else if (window.parseGIF && window.decompressFrames) {
        console.log("[GIFUCT] GIF parser functions verified in global scope");
        
        // Make them available as named exports
        window.gifuct = {
          parseGIF: window.parseGIF,
          decompressFrames: window.decompressFrames
        };
        
        // Resolve the promise to signal the library is ready
        resolve(window.gifuct);
      } 
      // Try to find the functions in a module export format
      else if (typeof gifuctJs !== 'undefined') {
        console.log("[GIFUCT] Found gifuctJs as module export");
        window.gifuct = gifuctJs;
        resolve(window.gifuct);
      }
      else {
        console.error("[GIFUCT] Library loaded but functions not found in expected locations");
        console.debug("[GIFUCT] Attempting alternative approach with direct import");
        
        // Try an alternative approach by importing from the installed package
        import('/node_modules/gifuct-js/dist/gifuct-js.js')
          .then(module => {
            console.log("[GIFUCT] Successfully imported module:", module);
            window.gifuct = module;
            resolve(window.gifuct);
          })
          .catch(err => {
            console.error("[GIFUCT] Import failed:", err);
            reject(new Error("GIF parser functions not found after import attempt"));
          });
      }
    };
    
    script.onerror = (err) => {
      console.error("[GIFUCT] Failed to load gifuct-js library:", err);
      console.debug("[GIFUCT] Attempting alternative approach with direct import");
      
      // Try an alternative approach if loading fails
      import('/node_modules/gifuct-js/dist/gifuct-js.js')
        .then(module => {
          console.log("[GIFUCT] Successfully imported module after script error:", module);
          window.gifuct = module;
          resolve(window.gifuct);
        })
        .catch(importErr => {
          console.error("[GIFUCT] Both loading approaches failed:", { scriptError: err, importError: importErr });
          reject(importErr);
        });
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    console.log("[GIFUCT] Added gifuct-js script to document");
  } catch (err) {
    console.error("[GIFUCT] Error initializing GIF parser loader:", err);
    reject(err);
  }
});

// Expose GIF parser functions with better error handling
export async function parseGIF(arrayBuffer) {
  try {
    console.log("[GIFUCT] Attempting to parse GIF", { bufferLength: arrayBuffer.byteLength });
    const gifuct = await window.gifuctLoaded;
    
    if (!gifuct.parseGIF) {
      console.error("[GIFUCT] parseGIF function not found in loaded library", gifuct);
      throw new Error("parseGIF function not available");
    }
    
    const result = gifuct.parseGIF(arrayBuffer);
    console.log("[GIFUCT] Successfully parsed GIF", { 
      width: result?.lsd?.width, 
      height: result?.lsd?.height,
      frames: result?.frames?.length
    });
    return result;
  } catch (err) {
    console.error("[GIFUCT] Error parsing GIF:", err);
    throw err;
  }
}

export async function decompressFrames(gif, buildImagePatches) {
  try {
    console.log("[GIFUCT] Attempting to decompress frames");
    const gifuct = await window.gifuctLoaded;
    
    if (!gifuct.decompressFrames) {
      console.error("[GIFUCT] decompressFrames function not found in loaded library", gifuct);
      throw new Error("decompressFrames function not available");
    }
    
    const frames = gifuct.decompressFrames(gif, buildImagePatches);
    console.log("[GIFUCT] Successfully decompressed frames", { frameCount: frames.length });
    return frames;
  } catch (err) {
    console.error("[GIFUCT] Error decompressing frames:", err);
    throw err;
  }
}

console.log("[GIFUCT] GIF parser loader initialized");
