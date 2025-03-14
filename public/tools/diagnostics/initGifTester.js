
/**
 * initGifTester.js - Initialize the GIF animation tester
 */

import { GifAnimationTester } from './GifAnimationTester.js';

// Create GIF tester instance
const gifTester = new GifAnimationTester();

// Make it available globally
window.gifTester = gifTester;

console.log("[GIF-TESTER] GIF animation tester initialized and available as window.gifTester");
console.log("[GIF-TESTER] Use window.gifTester.show() to open the tester");

// Add tester button to debug menu if it exists
function addTesterButtonToDebugMenu() {
  // Check if debug menu exists
  if (window.gameDebugMenu && window.gameDebugMenu.addToolButton) {
    window.gameDebugMenu.addToolButton(
      "Test GIF Animations", 
      () => window.gifTester.show()
    );
    console.log("[GIF-TESTER] Button added to debug menu");
  } else {
    console.log("[GIF-TESTER] Debug menu not found, button not added");
    
    // Try again in 2 seconds
    setTimeout(addTesterButtonToDebugMenu, 2000);
  }
}

// Try to add button to debug menu
addTesterButtonToDebugMenu();
/**
 * initGifTester.js - Initialize the GIF animation test tool
 */

console.log('[GIF-TESTER] Initializing GIF animation test tool');

// Create GIF tester UI and tools
const createGifTester = () => {
  // Create UI
  const testerDiv = document.createElement('div');
  testerDiv.id = 'gif-tester';
  testerDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    font-family: monospace;
    padding: 15px;
    border-radius: 5px;
    z-index: 1002;
    display: none;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.innerHTML = '<h3 style="margin-top: 0">GIF Animation Tester</h3>';
  testerDiv.appendChild(header);
  
  // URL input
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'Enter GIF URL (e.g., /assets/Beasts/Fire.gif)';
  urlInput.style.width = '100%';
  urlInput.style.marginBottom = '10px';
  urlInput.style.padding = '5px';
  testerDiv.appendChild(urlInput);
  
  // Test button
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Animation';
  testButton.style.margin = '5px';
  testButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert('Please enter a GIF URL');
      return;
    }
    
    // Load and test the GIF
    testGifAnimation(url);
  });
  testerDiv.appendChild(testButton);
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.margin = '5px';
  closeButton.addEventListener('click', () => {
    testerDiv.style.display = 'none';
  });
  testerDiv.appendChild(closeButton);
  
  // Results area
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'gif-test-results';
  resultsDiv.style.marginTop = '15px';
  resultsDiv.style.height = '200px';
  resultsDiv.style.overflow = 'auto';
  resultsDiv.style.border = '1px solid #555';
  resultsDiv.style.padding = '5px';
  testerDiv.appendChild(resultsDiv);
  
  // Preview area
  const previewDiv = document.createElement('div');
  previewDiv.id = 'gif-preview';
  previewDiv.style.marginTop = '15px';
  previewDiv.style.textAlign = 'center';
  testerDiv.appendChild(previewDiv);
  
  // Add to document
  document.body.appendChild(testerDiv);
  
  console.log('[GIF-TESTER] Test UI created');
  
  // Function to test GIF animation
  const testGifAnimation = (url) => {
    const resultsDiv = document.getElementById('gif-test-results');
    const previewDiv = document.getElementById('gif-preview');
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    previewDiv.innerHTML = '';
    
    // Log start
    logResult(`Testing GIF animation: ${url}`);
    
    // Create loader indicator
    logResult('Loading GIF...');
    
    // Load the GIF
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
        }
        logResult(`Successfully fetched GIF from ${url}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        logResult(`GIF data received: ${buffer.byteLength} bytes`);
        
        // Display preview image
        const blob = new Blob([buffer], { type: 'image/gif' });
        const imgUrl = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        img.style.border = '1px solid #555';
        previewDiv.appendChild(img);
        
        logResult('Preview image created');
        
        // Try to parse with gifuct-js if available
        import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.js')
          .then(module => {
            const gifuct = module.default || module;
            
            try {
              logResult('Parsing GIF with gifuct-js...');
              
              // Parse GIF
              const gif = gifuct.parseGIF(new Uint8Array(buffer));
              logResult(`GIF parsed successfully: ${gif.frames.length} frames`);
              
              // Extract dimensions
              const width = gif.lsd.width;
              const height = gif.lsd.height;
              logResult(`GIF dimensions: ${width}x${height} pixels`);
              
              // Decompress frames
              const frames = gifuct.decompressFrames(gif, true);
              logResult(`Decompressed ${frames.length} frames`);
              
              // Log frame details
              frames.forEach((frame, i) => {
                if (i < 5) { // Only log the first few frames
                  logResult(`Frame ${i}: ${frame.dims.width}x${frame.dims.height}, delay: ${frame.delay}ms`);
                }
              });
              
              // Success message
              logResult('GIF parsing and decompression successful ✅');
            } catch (error) {
              logResult(`Error parsing GIF: ${error.message} ❌`);
              console.error('Error parsing GIF:', error);
            }
          })
          .catch(error => {
            logResult(`Failed to load gifuct-js: ${error.message} ❌`);
            console.error('Failed to load gifuct-js:', error);
          });
      })
      .catch(error => {
        logResult(`Error loading GIF: ${error.message} ❌`);
        console.error('Error loading GIF:', error);
      });
  };
  
  // Helper to log results
  const logResult = (message) => {
    const resultsDiv = document.getElementById('gif-test-results');
    if (!resultsDiv) return;
    
    const logLine = document.createElement('div');
    logLine.textContent = message;
    resultsDiv.appendChild(logLine);
    
    // Auto-scroll to bottom
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
    
    // Also log to console
    console.log(`[GIF-TESTER] ${message}`);
  };
  
  // Return API
  return {
    show: () => {
      document.getElementById('gif-tester').style.display = 'block';
    },
    hide: () => {
      document.getElementById('gif-tester').style.display = 'none';
    },
    test: testGifAnimation
  };
};

// Initialize tester when DOM is ready
const gifTester = createGifTester();

// Make available globally
window.gifTester = gifTester;

console.log('[GIF-TESTER] GIF animation tester initialized and available as window.gifTester');
console.log('[GIF-TESTER] Use window.gifTester.show() to open the tester');

// Try to add button to debug menu if available
const addToDebugMenu = () => {
  if (window.gameDebugMenu) {
    // Button already added by the debug menu
    return true;
  }
  console.log('[GIF-TESTER] Debug menu not found, button not added');
  return false;
};

// Check periodically for debug menu
const checkInterval = setInterval(() => {
  if (addToDebugMenu()) {
    clearInterval(checkInterval);
  }
}, 1000);

// Try once immediately
addToDebugMenu();
