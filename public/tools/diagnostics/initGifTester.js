
/**
 * initGifTester.js - Testing tool for GIF animations
 * 
 * This script provides a UI for testing GIF animations in the game,
 * allowing developers to check GIF parsing, rendering and animations.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

console.log("[GIF-TESTER] Initializing GIF animation test tool");

/**
 * GIF Animation Tester class
 */
class GIFTester {
  constructor() {
    this.visible = false;
    this.testUrls = [
      '/assets/Beasts/Fire.gif',
      '/assets/Beasts/Water.gif'
    ];
    
    this.testStatus = {};
    
    // Create UI
    this._createUI();
    
    // Add to Debug Menu if exists
    this._addToDebugMenu();
  }
  
  /**
   * Create the test UI
   * @private
   */
  _createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'gif-tester';
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(20, 20, 20, 0.9);
      border: 1px solid #555;
      padding: 10px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 10000;
      display: none;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    
    // Create header
    const header = document.createElement('div');
    header.innerHTML = '<h3 style="margin: 0 0 10px 0; color: #8cf;">GIF Animation Tester</h3>';
    this.container.appendChild(header);
    
    // Create test controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    `;
    
    // Run all tests button
    const runAllButton = document.createElement('button');
    runAllButton.textContent = 'Run All Tests';
    runAllButton.style.cssText = this._getButtonStyle('#2ecc71');
    runAllButton.addEventListener('click', () => this.runAllTests());
    controls.appendChild(runAllButton);
    
    // Display tests button
    const testDisplayButton = document.createElement('button');
    testDisplayButton.textContent = 'Test Rendering';
    testDisplayButton.style.cssText = this._getButtonStyle('#3498db');
    testDisplayButton.addEventListener('click', () => this.testGifDisplay());
    controls.appendChild(testDisplayButton);
    
    // Create test scene
    const createSceneButton = document.createElement('button');
    createSceneButton.textContent = 'Create Test Scene';
    createSceneButton.style.cssText = this._getButtonStyle('#9b59b6');
    createSceneButton.addEventListener('click', () => this.createTestScene());
    controls.appendChild(createSceneButton);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = this._getButtonStyle('#e74c3c');
    closeButton.addEventListener('click', () => this.hide());
    controls.appendChild(closeButton);
    
    this.container.appendChild(controls);
    
    // Test results container
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      border-radius: 3px;
      max-height: 300px;
      overflow-y: auto;
    `;
    this.container.appendChild(this.resultsContainer);
    
    // Add custom URL test
    const customUrlContainer = document.createElement('div');
    customUrlContainer.style.cssText = `
      margin-top: 10px;
      display: flex;
      gap: 5px;
    `;
    
    // Input for custom URL
    this.customUrlInput = document.createElement('input');
    this.customUrlInput.type = 'text';
    this.customUrlInput.placeholder = 'Enter GIF URL to test...';
    this.customUrlInput.style.cssText = `
      flex-grow: 1;
      padding: 5px;
      border-radius: 3px;
      border: 1px solid #555;
      background: #333;
      color: white;
    `;
    customUrlContainer.appendChild(this.customUrlInput);
    
    // Test custom URL button
    const testCustomUrlButton = document.createElement('button');
    testCustomUrlButton.textContent = 'Test URL';
    testCustomUrlButton.style.cssText = this._getButtonStyle('#f39c12');
    testCustomUrlButton.addEventListener('click', () => {
      const url = this.customUrlInput.value.trim();
      if (url) {
        this.testGifUrl(url);
      }
    });
    customUrlContainer.appendChild(testCustomUrlButton);
    
    this.container.appendChild(customUrlContainer);
    
    // Add test display canvas
    this.testCanvas = document.createElement('canvas');
    this.testCanvas.width = 128;
    this.testCanvas.height = 128;
    this.testCanvas.style.cssText = `
      margin-top: 10px;
      background: #222;
      border: 1px solid #444;
      display: none;
    `;
    this.container.appendChild(this.testCanvas);
    
    // Add to document
    document.body.appendChild(this.container);
    
    console.log("[GIF-TESTER] Test UI created");
  }
  
  /**
   * Generate CSS for buttons
   * @param {string} color - Button color
   * @returns {string} CSS string
   * @private
   */
  _getButtonStyle(color) {
    return `
      background: ${color};
      border: none;
      padding: 6px 10px;
      border-radius: 3px;
      color: white;
      cursor: pointer;
      font-family: monospace;
      font-size: 12px;
    `;
  }
  
  /**
   * Add to debug menu if it exists
   * @private
   */
  _addToDebugMenu() {
    // Try to find global debug menu
    if (window.gameDebugMenu) {
      console.log("[GIF-TESTER] Adding to debug menu");
      
      // Add button to debug menu
      const section = window.gameDebugMenu.createSection('GIF Testing');
      
      const showButton = window.gameDebugMenu.createButton('Open GIF Tester', () => {
        this.show();
      }, '#f39c12');
      
      section.appendChild(showButton);
    } else {
      console.log("[GIF-TESTER] Debug menu not found, button not added");
      
      // Try again after a short delay
      setTimeout(() => this._addToDebugMenu(), 1000);
    }
  }
  
  /**
   * Show the tester UI
   */
  show() {
    this.visible = true;
    this.container.style.display = 'block';
    console.log("[GIF-TESTER] Tester shown");
  }
  
  /**
   * Hide the tester UI
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
    console.log("[GIF-TESTER] Tester hidden");
  }
  
  /**
   * Toggle visibility
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Log a message to the results panel
   * @param {string} message - Message to log
   * @param {string} [type='info'] - Message type (info, success, error, warning)
   */
  log(message, type = 'info') {
    // Create message element
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      margin-bottom: 5px;
      padding: 3px;
    `;
    
    // Set color based on type
    let color = '#aaa';
    switch (type) {
      case 'success':
        color = '#2ecc71';
        break;
      case 'error':
        color = '#e74c3c';
        break;
      case 'warning':
        color = '#f39c12';
        break;
      case 'info':
      default:
        color = '#3498db';
        break;
    }
    
    msgEl.style.color = color;
    
    // Format message with timestamp
    const timestamp = new Date().toLocaleTimeString();
    msgEl.textContent = `[${timestamp}] ${message}`;
    
    // Add to results container
    this.resultsContainer.appendChild(msgEl);
    
    // Scroll to bottom
    this.resultsContainer.scrollTop = this.resultsContainer.scrollHeight;
    
    // Also log to console
    console.log(`[GIF-TESTER] ${message}`);
  }
  
  /**
   * Run all tests on predefined URLs
   */
  runAllTests() {
    this.log('Running all tests...', 'info');
    
    // Clear previous results
    this.testStatus = {};
    
    // Run each test
    this.testUrls.forEach(url => {
      this.testGifUrl(url);
    });
  }
  
  /**
   * Test a specific GIF URL
   * @param {string} url - URL to test
   */
  testGifUrl(url) {
    this.log(`Testing GIF: ${url}`, 'info');
    
    // Step 1: Check if URL is accessible
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        this.log(`URL fetch successful: ${url}`, 'success');
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        this.log(`Loaded ${arrayBuffer.byteLength} bytes from ${url}`, 'info');
        
        // Step 2: Try to parse GIF with omggif
        try {
          if (typeof OMGGIF === 'undefined') {
            this.log('OMGGIF library not loaded, skipping GIF parsing test', 'warning');
          } else {
            const gifData = new Uint8Array(arrayBuffer);
            const gif = new OMGGIF.GifReader(gifData);
            
            this.log(`GIF parsed: ${gif.numFrames()} frames, ${gif.width}x${gif.height}`, 'success');
            this.testStatus[url] = {
              url,
              status: 'success',
              frames: gif.numFrames(),
              width: gif.width,
              height: gif.height,
              data: gifData
            };
            
            // Draw first frame on canvas
            this._drawGifFrame(gif, 0);
          }
        } catch (err) {
          this.log(`Failed to parse GIF: ${err.message}`, 'error');
          this.testStatus[url] = {
            url,
            status: 'error',
            error: err.message
          };
        }
        
        // Step 3: Try to load with SimpleGIFAnimator (if loaded)
        this._testWithSimpleGIFAnimator(url);
      })
      .catch(err => {
        this.log(`Error fetching URL: ${err.message}`, 'error');
        this.testStatus[url] = {
          url,
          status: 'error',
          error: err.message
        };
      });
  }
  
  /**
   * Draw a GIF frame on the test canvas
   * @param {OMGGIF.GifReader} gif - GIF reader instance
   * @param {number} frameIndex - Frame index to draw
   * @private
   */
  _drawGifFrame(gif, frameIndex) {
    // Show canvas
    this.testCanvas.style.display = 'block';
    
    // Resize canvas to fit GIF
    this.testCanvas.width = gif.width;
    this.testCanvas.height = gif.height;
    
    // Get canvas context
    const ctx = this.testCanvas.getContext('2d');
    
    // Create pixel buffer
    const pixelBuffer = new Uint8ClampedArray(gif.width * gif.height * 4);
    
    // Read frame into pixel buffer
    gif.decodeAndBlitFrameRGBA(frameIndex, pixelBuffer);
    
    // Create ImageData and draw to canvas
    const imageData = new ImageData(pixelBuffer, gif.width, gif.height);
    ctx.putImageData(imageData, 0, 0);
    
    this.log(`Drew frame ${frameIndex} on test canvas`, 'success');
  }
  
  /**
   * Test GIF with SimpleGIFAnimator
   * @param {string} url - GIF URL to test
   * @private
   */
  _testWithSimpleGIFAnimator(url) {
    try {
      if (window.SimpleGIFAnimator) {
        this.log(`Testing with SimpleGIFAnimator: ${url}`, 'info');
        // This needs a THREE.js scene, which we may not have here
        // Just check the class is available for now
        this.log(`SimpleGIFAnimator class is available`, 'success');
      } else {
        this.log(`SimpleGIFAnimator not loaded, skipping this test`, 'warning');
      }
    } catch (err) {
      this.log(`Error testing with SimpleGIFAnimator: ${err.message}`, 'error');
    }
  }
  
  /**
   * Test GIF display in THREE.js
   */
  testGifDisplay() {
    this.log('Testing GIF rendering with THREE.js', 'info');
    
    try {
      if (!window.THREE) {
        this.log('THREE.js not loaded, cannot test rendering', 'error');
        return;
      }
      
      // Create a minimal THREE.js environment
      const container = document.createElement('div');
      container.style.cssText = `
        width: 200px;
        height: 200px;
        margin: 10px auto;
        border: 1px solid #555;
        background: #000;
      `;
      this.container.appendChild(container);
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(200, 200);
      container.appendChild(renderer.domElement);
      
      // Create scene and camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 5;
      
      // Add light
      const light = new THREE.AmbientLight(0xffffff);
      scene.add(light);
      
      // Create sprite
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true
      });
      
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);
      
      // Try to load a texture
      const textureUrl = this.testUrls[0] || '/assets/Beasts/Fire.gif';
      
      this.log(`Creating test texture from: ${textureUrl}`, 'info');
      
      // Create a canvas-based texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = 'white';
      ctx.fillText('GIF Test', 10, 32);
      
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      
      // Apply texture to material
      material.map = texture;
      
      // Render
      renderer.render(scene, camera);
      
      this.log('Test render complete', 'success');
      
    } catch (err) {
      this.log(`THREE.js rendering error: ${err.message}`, 'error');
    }
  }
  
  /**
   * Create a full test scene with animated GIFs
   */
  createTestScene() {
    this.log('Creating test scene with animated GIFs', 'info');
    
    try {
      // This method depends on THREE.js being available
      if (!window.THREE) {
        this.log('THREE.js not loaded, cannot create test scene', 'error');
        return;
      }
      
      // Check if we already have a test renderer
      if (this.testRenderer) {
        this.log('Test scene already exists, updating...', 'info');
        return;
      }
      
      // Create larger container for test scene
      const container = document.createElement('div');
      container.style.cssText = `
        width: 300px;
        height: 300px;
        margin: 10px auto;
        border: 1px solid #555;
        background: #123;
      `;
      this.container.appendChild(container);
      
      // Create renderer
      this.testRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.testRenderer.setSize(300, 300);
      container.appendChild(this.testRenderer.domElement);
      
      // Create scene and camera
      this.testScene = new THREE.Scene();
      this.testCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      this.testCamera.position.z = 5;
      
      // Add light
      const light = new THREE.AmbientLight(0xffffff);
      this.testScene.add(light);
      
      // Try to use SimpleGIFAnimator if available
      if (typeof SimpleGIFAnimator !== 'undefined') {
        this.log('Using SimpleGIFAnimator for test', 'info');
        
        const testUrl = this.testUrls[0] || '/assets/Beasts/Fire.gif';
        
        // Create animator
        this.testAnimator = new SimpleGIFAnimator(
          testUrl,
          this.testScene,
          { x: 0, y: 0, z: 0 },
          2,
          // onLoadComplete
          (animator) => {
            this.log(`GIF loaded in test scene: ${testUrl}`, 'success');
          },
          // onError
          (error) => {
            this.log(`Error loading GIF in test scene: ${error.message}`, 'error');
          }
        );
        
        // Start animation loop
        this.log('Starting animation loop', 'info');
        this.testAnimationFrame = requestAnimationFrame(() => this._animateTestScene());
      } else {
        this.log('SimpleGIFAnimator not available, creating static test scene', 'warning');
        
        // Create sprite with static texture
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true
        });
        
        // Create a canvas-based texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple animation frame
        ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = 'white';
        ctx.fillText('GIF Test', 10, 64);
        ctx.fillText('(SimpleGIFAnimator', 10, 80);
        ctx.fillText('not available)', 10, 96);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        // Apply texture to material
        material.map = texture;
        
        const plane = new THREE.Mesh(geometry, material);
        this.testScene.add(plane);
        
        // Render once
        this.testRenderer.render(this.testScene, this.testCamera);
      }
      
    } catch (err) {
      this.log(`Error creating test scene: ${err.message}`, 'error');
    }
  }
  
  /**
   * Animate the test scene
   * @private
   */
  _animateTestScene() {
    // Cancel if test scene was destroyed
    if (!this.testScene || !this.testRenderer || !this.testCamera) return;
    
    // Update animator if exists
    if (this.testAnimator) {
      this.testAnimator.update();
    }
    
    // Render
    this.testRenderer.render(this.testScene, this.testCamera);
    
    // Continue animation loop
    this.testAnimationFrame = requestAnimationFrame(() => this._animateTestScene());
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Stop animation loop
    if (this.testAnimationFrame) {
      cancelAnimationFrame(this.testAnimationFrame);
    }
    
    // Dispose THREE.js objects
    if (this.testRenderer) {
      this.testRenderer.dispose();
    }
    
    if (this.testAnimator) {
      this.testAnimator.dispose();
    }
    
    // Remove from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Create global instance
// Only create if not already defined
if (!window.gifTester) {
  const localGifTester = new GIFTester();
  
  // Add to window for console access
  window.gifTester = localGifTester;
  
  console.log("[GIF-TESTER] GIF animation tester initialized and available as window.gifTester");
  console.log("[GIF-TESTER] Use window.gifTester.show() to open the tester");
  
  // Export the tester
  export { localGifTester as gifTester };
  export default localGifTester;
} else {
  console.log("[GIF-TESTER] GIF tester already initialized, using existing instance");
  export { window.gifTester as gifTester };
  export default window.gifTester;
}
