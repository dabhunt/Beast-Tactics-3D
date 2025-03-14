
/**
 * GifLoaderTest.js - Diagnostic tool for testing the GIF loader
 */

console.log("[GIF-TEST] Initializing GIF loader test tool");

class GifLoaderTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Creates a simple UI for testing GIF loading
   */
  createTestUI() {
    // Create test container
    const container = document.createElement('div');
    container.id = 'gif-test-container';
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 1000;
      max-height: 80vh;
      overflow-y: auto;
      width: 300px;
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'GIF Loader Test';
    title.style.margin = '0 0 10px 0';
    container.appendChild(title);
    
    // Add test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Run GIF Loading Test';
    testButton.style.cssText = `
      padding: 5px 10px;
      margin-bottom: 10px;
      background: #4CAF50;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 3px;
      width: 100%;
    `;
    testButton.onclick = () => this.runTest();
    container.appendChild(testButton);
    
    // Add status element
    this.statusElement = document.createElement('div');
    this.statusElement.id = 'gif-test-status';
    this.statusElement.textContent = 'Ready';
    this.statusElement.style.marginBottom = '10px';
    container.appendChild(this.statusElement);
    
    // Add test output container
    this.outputElement = document.createElement('div');
    this.outputElement.id = 'gif-test-output';
    this.outputElement.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      padding: 5px;
      border-radius: 3px;
      white-space: pre-wrap;
      font-size: 12px;
      height: 200px;
      overflow-y: auto;
    `;
    container.appendChild(this.outputElement);
    
    // Add preview container
    this.previewElement = document.createElement('div');
    this.previewElement.id = 'gif-test-preview';
    this.previewElement.style.cssText = `
      margin-top: 10px;
      text-align: center;
    `;
    container.appendChild(this.previewElement);
    
    // Add to document
    document.body.appendChild(container);
    console.log("[GIF-TEST] Test UI created");
  }
  
  /**
   * Logs a message to the test output
   */
  log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.textContent = message;
    
    switch (type) {
      case 'error':
        entry.style.color = '#ff6b6b';
        break;
      case 'success':
        entry.style.color = '#69db7c';
        break;
      case 'warning':
        entry.style.color = '#ffd43b';
        break;
      default:
        entry.style.color = '#a9d8ff';
    }
    
    this.outputElement.appendChild(entry);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
    console.log(`[GIF-TEST] ${message}`);
  }
  
  /**
   * Updates the status message
   */
  updateStatus(message) {
    this.statusElement.textContent = message;
    console.log(`[GIF-TEST] Status: ${message}`);
  }
  
  /**
   * Runs various tests on the GIF loader
   */
  async runTest() {
    if (this.isRunning) {
      this.log("Test already running", "warning");
      return;
    }
    
    this.isRunning = true;
    this.testResults = [];
    this.outputElement.innerHTML = '';
    this.previewElement.innerHTML = '';
    this.updateStatus("Running tests...");
    
    try {
      // Test 1: Check if gifuct modules are loaded
      this.log("Test 1: Checking if gifuct modules are available");
      
      if (window.gifuctLoaded) {
        this.log("✓ gifuctLoaded promise exists", "success");
      } else {
        this.log("✗ gifuctLoaded promise not found", "error");
        throw new Error("gifuctLoaded promise not found");
      }
      
      // Test 2: Try to resolve the gifuct promise
      this.log("Test 2: Resolving gifuct promise");
      
      try {
        const gifuct = await window.gifuctLoaded;
        if (gifuct) {
          this.log(`✓ gifuct resolved successfully: ${typeof gifuct}`, "success");
          this.log(`Available methods: ${Object.keys(gifuct).join(', ')}`);
        } else {
          this.log("✗ gifuct resolved to null/undefined", "error");
        }
      } catch (err) {
        this.log(`✗ Failed to resolve gifuct promise: ${err.message}`, "error");
        throw err;
      }
      
      // Test 3: Try loading a test GIF
      this.log("Test 3: Attempting to load a test GIF");
      
      // Test Fire Beast GIF
      await this.testLoadGif('/assets/Beasts/Fire.gif', 'Fire Beast');
      
      this.updateStatus("Tests completed");
    } catch (err) {
      this.log(`Test failed with error: ${err.message}`, "error");
      this.updateStatus("Tests failed");
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Tests loading a specific GIF file
   */
  async testLoadGif(url, name) {
    this.log(`Testing GIF: ${name} (${url})`);
    
    try {
      // Fetch the GIF file
      const response = await fetch(url);
      
      if (!response.ok) {
        this.log(`✗ Failed to fetch ${name} GIF: ${response.status} ${response.statusText}`, "error");
        return;
      }
      
      this.log(`✓ Fetched ${name} GIF successfully`, "success");
      
      // Get array buffer
      const arrayBuffer = await response.arrayBuffer();
      this.log(`✓ Got array buffer of size ${arrayBuffer.byteLength} bytes`, "success");
      
      // Import the parsing functions dynamically
      const { parseGIF, decompressFrames } = await import('../gifuct-loader.js');
      
      // Parse GIF
      this.log(`Parsing ${name} GIF...`);
      const gif = await parseGIF(arrayBuffer);
      
      if (!gif) {
        this.log(`✗ parseGIF returned null/undefined`, "error");
        return;
      }
      
      this.log(`✓ Parsed ${name} GIF: ${gif.frames?.length || 0} frames`, "success");
      
      // Decompress frames
      this.log(`Decompressing ${name} GIF frames...`);
      const frames = await decompressFrames(gif, true);
      
      if (!frames || !frames.length) {
        this.log(`✗ No frames decompressed`, "error");
        return;
      }
      
      this.log(`✓ Decompressed ${frames.length} frames`, "success");
      this.log(`First frame dimensions: ${frames[0].dims.width}x${frames[0].dims.height}`);
      
      // Display first frame as a preview
      this.log(`Creating preview of first frame...`);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const frame = frames[0];
      canvas.width = frame.dims.width;
      canvas.height = frame.dims.height;
      
      // Create ImageData from the patch
      const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(frame.patch);
      ctx.putImageData(imageData, 0, 0);
      
      this.previewElement.innerHTML = '';
      canvas.style.border = '1px solid white';
      canvas.style.maxWidth = '100%';
      this.previewElement.appendChild(canvas);
      
      this.log(`✓ Preview created`, "success");
      this.log(`Complete test for ${name} GIF successful`, "success");
      
    } catch (err) {
      this.log(`✗ Error testing ${name} GIF: ${err.message}`, "error");
      console.error(err);
    }
  }
  
  /**
   * Initialize the test tool and add it to the page
   */
  static init() {
    // Add button to debug menu if it exists
    const debugMenu = document.getElementById('debug-menu');
    
    if (debugMenu) {
      console.log("[GIF-TEST] Adding test button to debug menu");
      const button = document.createElement('button');
      button.textContent = 'Test GIF Loading';
      button.onclick = () => {
        const tester = new GifLoaderTest();
        tester.createTestUI();
        tester.runTest();
      };
      debugMenu.appendChild(button);
    } else {
      console.log("[GIF-TEST] Debug menu not found, creating standalone test");
      // Create standalone test instance
      const tester = new GifLoaderTest();
      tester.createTestUI();
    }
  }
}

// Initialize the test tool
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(GifLoaderTest.init, 1000); // Delay to ensure debug menu is loaded if it exists
});

// Make it globally available for console debugging
window.GifLoaderTest = GifLoaderTest;

console.log("[GIF-TEST] GIF loader test tool initialized");
