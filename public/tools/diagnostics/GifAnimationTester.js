
/**
 * GifAnimationTester.js - Test tool for SimpleGIFAnimator
 * 
 * Creates a visual testing tool to verify GIF animations are working properly.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { SimpleGIFAnimator } from "../SimpleGIFAnimator.js";

export class GifAnimationTester {
  constructor() {
    console.log("[GIF-TESTER] Initializing GIF animation test tool");
    
    this.isInitialized = false;
    this.animators = [];
    
    // Create UI panel
    this._createUI();
  }
  
  /**
   * Create the test UI panel
   */
  _createUI() {
    // Create the panel container
    this.panel = document.createElement('div');
    this.panel.id = 'gif-animation-tester';
    this.panel.style.position = 'fixed';
    this.panel.style.top = '10px';
    this.panel.style.left = '10px';
    this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.panel.style.color = 'white';
    this.panel.style.padding = '10px';
    this.panel.style.borderRadius = '5px';
    this.panel.style.fontFamily = 'monospace';
    this.panel.style.fontSize = '12px';
    this.panel.style.zIndex = '1000';
    this.panel.style.maxWidth = '400px';
    this.panel.style.maxHeight = '80vh';
    this.panel.style.overflowY = 'auto';
    
    // Create header
    const header = document.createElement('h3');
    header.textContent = 'GIF Animation Tester';
    header.style.marginTop = '0';
    this.panel.appendChild(header);
    
    // Create test controls
    const controls = document.createElement('div');
    controls.style.marginBottom = '10px';
    
    // Add test URL input
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'GIF URL: ';
    controls.appendChild(urlLabel);
    
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'text';
    this.urlInput.value = '/assets/Beasts/Fire.gif';
    this.urlInput.style.width = '200px';
    this.urlInput.style.marginRight = '5px';
    controls.appendChild(this.urlInput);
    
    // Add test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test GIF';
    testButton.onclick = () => this.testGif();
    controls.appendChild(testButton);
    
    this.panel.appendChild(controls);
    
    // Create status area
    this.statusArea = document.createElement('div');
    this.statusArea.style.marginBottom = '10px';
    this.statusArea.innerHTML = '<i>No tests run yet</i>';
    this.panel.appendChild(this.statusArea);
    
    // Create animation stats area
    this.statsArea = document.createElement('div');
    this.statsArea.style.marginBottom = '10px';
    this.panel.appendChild(this.statsArea);
    
    // Create test scene area (viewport)
    this.viewport = document.createElement('div');
    this.viewport.style.width = '300px';
    this.viewport.style.height = '150px';
    this.viewport.style.backgroundColor = '#333';
    this.viewport.style.marginBottom = '10px';
    this.viewport.style.position = 'relative';
    this.panel.appendChild(this.viewport);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => this.close();
    this.panel.appendChild(closeButton);
    
    // Hide panel by default (will be shown later)
    this.panel.style.display = 'none';
    
    // Add to document
    document.body.appendChild(this.panel);
    
    console.log("[GIF-TESTER] Test UI created");
  }
  
  /**
   * Initialize THREE.js scene for testing
   */
  _initTestScene() {
    if (this.isInitialized) return;
    
    console.log("[GIF-TESTER] Initializing test scene");
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(300, 150);
    this.viewport.appendChild(this.renderer.domElement);
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(50, 300/150, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    // Start animation loop
    this._animate();
    
    this.isInitialized = true;
    console.log("[GIF-TESTER] Test scene initialized");
  }
  
  /**
   * Animation loop
   */
  _animate() {
    // Set up animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update all GIF animators
      this.animators.forEach(animator => {
        animator.update();
      });
      
      // Update stats if we have animators
      if (this.animators.length > 0) {
        this._updateStats();
      }
      
      // Render scene
      this.renderer.render(this.scene, this.camera);
    };
    
    // Start animation
    animate();
    console.log("[GIF-TESTER] Animation loop started");
  }
  
  /**
   * Update animation stats in UI
   */
  _updateStats() {
    if (this.animators.length === 0) {
      this.statsArea.innerHTML = '<i>No active animations</i>';
      return;
    }
    
    // Get stats from first animator
    const stats = this.animators[0].getStats();
    
    // Update stats display
    this.statsArea.innerHTML = `
      <strong>Animation Stats:</strong><br>
      Frame: ${stats.currentFrame + 1}/${stats.totalFrames}<br>
      Loops: ${stats.loops}<br>
      Playing: ${stats.isPlaying ? 'Yes' : 'No'}<br>
      Draw Time: ${stats.frameDrawTime.toFixed(2)}ms<br>
      Frames Rendered: ${stats.framesRendered}<br>
    `;
  }
  
  /**
   * Test a GIF animation
   */
  testGif() {
    const url = this.urlInput.value.trim();
    
    if (!url) {
      this.statusArea.innerHTML = '<span style="color: #ff6666">Please enter a GIF URL</span>';
      return;
    }
    
    // Initialize scene if not already done
    this._initTestScene();
    
    // Update status
    this.statusArea.innerHTML = `<span style="color: #66ff66">Testing GIF: ${url}...</span>`;
    
    // Clear previous animators
    this.animators.forEach(animator => {
      animator.dispose();
    });
    this.animators = [];
    
    // Create new GIF animator
    console.log("[GIF-TESTER] Testing GIF:", url);
    
    const animator = new SimpleGIFAnimator(
      url, 
      this.scene, 
      { x: 0, y: 0, z: 0 }, 
      2,
      // Success callback
      (animator) => {
        this.statusArea.innerHTML = `
          <span style="color: #66ff66">
            GIF loaded successfully!<br>
            Size: ${animator.canvas.width}x${animator.canvas.height}<br>
            Frames: ${animator.frames.length}<br>
            Load Time: ${animator.stats.loadTime.toFixed(0)}ms
          </span>
        `;
      },
      // Error callback
      (error) => {
        this.statusArea.innerHTML = `
          <span style="color: #ff6666">
            Error loading GIF:<br>
            ${error.message}
          </span>
        `;
      }
    );
    
    this.animators.push(animator);
  }
  
  /**
   * Show the tester panel
   */
  show() {
    this.panel.style.display = 'block';
    console.log("[GIF-TESTER] Panel shown");
  }
  
  /**
   * Hide the tester panel
   */
  close() {
    this.panel.style.display = 'none';
    console.log("[GIF-TESTER] Panel hidden");
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up animators
    this.animators.forEach(animator => {
      animator.dispose();
    });
    
    // Clean up THREE.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Remove panel from document
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    console.log("[GIF-TESTER] Resources disposed");
  }
}

// Make it globally available for console debugging
window.GifAnimationTester = GifAnimationTester;
