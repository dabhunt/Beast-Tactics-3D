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
    // Try multiple CDN sources
    const cdnUrls = [
      'https://unpkg.com/gifuct-js@2.1.2/dist/gifuct.min.js',
      'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct.min.js',
      '/node_modules/gifuct-js/dist/gifuct.min.js'
    ];

    console.log("[GIFUCT-DIRECT] Attempting to load from multiple sources");

    let loadAttempt = 0;
    function tryNextCDN() {
      if (loadAttempt >= cdnUrls.length) {
        reject(new Error('Failed to load gifuct-js from all sources'));
        return;
      }

      const script = document.createElement('script');
      script.src = cdnUrls[loadAttempt];
      script.async = true;

      script.onload = () => {
        console.log(`[GIFUCT-DIRECT] Successfully loaded gifuct-js from ${cdnUrls[loadAttempt]}`);
        const gifuct = {
          parseGIF: window.parseGIF,
          decompressFrames: window.decompressFrames
        };
        resolve(gifuct);
      };

      script.onerror = (err) => {
        console.error(`[GIFUCT-DIRECT] Failed to load gifuct-js from ${cdnUrls[loadAttempt]}:`, err);
        loadAttempt++;
        tryNextCDN();
      };

      document.head.appendChild(script);
    }

    tryNextCDN();
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