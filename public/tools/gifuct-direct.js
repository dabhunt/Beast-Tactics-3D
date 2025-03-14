
/**
 * gifuct-direct.js - Direct import of gifuct-js from CDN as a fallback
 */

console.log("[GIFUCT-DIRECT] Initializing alternative GIF parser loader");

// Import gifuct-js directly from CDN
const GIFUCT_CDN_URL = "https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js";

// Create a promise to track when the library is fully loaded
const loadGifuctFromCDN = async () => {
  console.log("[GIFUCT-DIRECT] Loading gifuct-js directly from CDN");
  
  return new Promise((resolve, reject) => {
    // Load the script dynamically
    const script = document.createElement('script');
    script.src = GIFUCT_CDN_URL;
    script.async = true;
    
    script.onload = () => {
      console.log("[GIFUCT-DIRECT] Successfully loaded gifuct-js from CDN");
      
      // Create a wrapper object for the library functions
      const gifuct = {
        parseGIF: (buffer) => {
          if (typeof window.parseGIF === 'function') {
            return window.parseGIF(buffer);
          } else {
            throw new Error("parseGIF function not found in global scope after loading from CDN");
          }
        },
        decompressFrames: (gif, buildPatch) => {
          if (typeof window.decompressFrames === 'function') {
            return window.decompressFrames(gif, buildPatch);
          } else {
            throw new Error("decompressFrames function not found in global scope after loading from CDN");
          }
        }
      };
      
      resolve(gifuct);
    };
    
    script.onerror = (err) => {
      console.error("[GIFUCT-DIRECT] Failed to load gifuct-js from CDN:", err);
      reject(err);
    };
    
    // Add the script to the document
    document.head.appendChild(script);
  });
};

// Define the functions that will be exported
let cachedGifuct = null;

// Get or initialize the gifuct library
async function getGifuct() {
  if (cachedGifuct) {
    return cachedGifuct;
  }
  
  try {
    cachedGifuct = await loadGifuctFromCDN();
    return cachedGifuct;
  } catch (err) {
    console.error("[GIFUCT-DIRECT] Failed to load gifuct-js library:", err);
    throw err;
  }
}

// Export the parsing functions
export async function parseGIF(arrayBuffer) {
  console.log("[GIFUCT-DIRECT] Parsing GIF", { bufferSize: arrayBuffer.byteLength });
  const gifuct = await getGifuct();
  return gifuct.parseGIF(arrayBuffer);
}

export async function decompressFrames(gif, buildImagePatches) {
  console.log("[GIFUCT-DIRECT] Decompressing frames");
  const gifuct = await getGifuct();
  return gifuct.decompressFrames(gif, buildImagePatches);
}

console.log("[GIFUCT-DIRECT] Alternative GIF parser loader initialized");
