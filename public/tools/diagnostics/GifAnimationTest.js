
/**
 * GifAnimationTest.js - Test tool for GIF animations
 * 
 * This simple utility creates a testing panel to verify the AnimatedGIFTexture 
 * class is working correctly with different beast GIFs.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { AnimatedGIFTexture } from "../AnimatedGIFTexture.js";

export class GifAnimationTest {
  constructor() {
    console.log("[GIF-TEST] Initializing GIF Animation Test Tool");
    
    // Create test panel
    this._createPanel();
    
    // Set up sample beast types
    this.beastTypes = [
      "Fire", "Water", "Earth", "Wind", "Electric", 
      "Plant", "Metal", "Light", "Dark", "Combat", 
      "Spirit", "Corrosion"
    ];
    
    // Keep track of active animators
    this.activeAnimators = [];
    
    // Initialize mini renderer
    this._initRenderer();
    
    // Add beast type buttons
    this._addBeastButtons();
    
    console.log("[GIF-TEST] GIF Animation Test Tool initialized");
  }
  
  /**
   * Create the test panel UI
   * @private
   */
  _createPanel() {
    // Create test panel
    this.panel = document.createElement('div');
    this.panel.style.position = 'fixed';
    this.panel.style.top = '10px';
    this.panel.style.left = '10px';
    this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.panel.style.color = '#fff';
    this.panel.style.padding = '10px';
    this.panel.style.borderRadius = '5px';
    this.panel.style.zIndex = '9999';
    this.panel.style.maxWidth = '500px';
    this.panel.style.maxHeight = '80vh';
    this.panel.style.overflowY = 'auto';
    this.panel.style.display = 'none'; // Hidden by default
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'GIF Animation Test Tool';
    title.style.marginTop = '0';
    this.panel.appendChild(title);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.addEventListener('click', () => this.close());
    this.panel.appendChild(closeButton);
    
    // Add content container
    this.content = document.createElement('div');
    this.panel.appendChild(this.content);
    
    // Add status area
    this.statusArea = document.createElement('div');
    this.statusArea.style.marginTop = '10px';
    this.statusArea.style.padding = '5px';
    this.statusArea.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.statusArea.style.borderRadius = '3px';
    this.statusArea.textContent = 'Select a beast type to test animation.';
    this.panel.appendChild(this.statusArea);
    
    // Add buttons container
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.style.marginTop = '10px';
    this.panel.appendChild(this.buttonsContainer);
    
    // Add canvas container for preview
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.marginTop = '10px';
    this.canvasContainer.style.width = '100%';
    this.canvasContainer.style.height = '200px';
    this.canvasContainer.style.backgroundColor = '#222';
    this.canvasContainer.style.borderRadius = '3px';
    this.canvasContainer.style.overflow = 'hidden';
    this.panel.appendChild(this.canvasContainer);
    
    // Add to document
    document.body.appendChild(this.panel);
  }
  
  /**
   * Initialize the ThreeJS renderer for preview
   * @private
   */
  _initRenderer() {
    // Create mini scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 1, 0.1, 1000
    );
    this.camera.position.z = 5;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(200, 200);
    this.renderer.setClearColor(0x000000, 0);
    this.canvasContainer.appendChild(this.renderer.domElement);
    
    // Add light
    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);
    
    // Start animation loop
    this._animate();
  }
  
  /**
   * Add beast type buttons
   * @private
   */
  _addBeastButtons() {
    // Create button for each beast type
    this.beastTypes.forEach(beastType => {
      const button = document.createElement('button');
      button.textContent = beastType;
      button.style.margin = '3px';
      button.style.padding = '5px 10px';
      button.addEventListener('click', () => this._testBeastType(beastType));
      this.buttonsContainer.appendChild(button);
    });
    
    // Add testing utilities
    const speedUpButton = document.createElement('button');
    speedUpButton.textContent = 'Speed Up';
    speedUpButton.style.margin = '3px';
    speedUpButton.style.padding = '5px 10px';
    speedUpButton.addEventListener('click', () => this._changeSpeed(2.0));
    this.buttonsContainer.appendChild(speedUpButton);
    
    const slowDownButton = document.createElement('button');
    slowDownButton.textContent = 'Slow Down';
    slowDownButton.style.margin = '3px';
    slowDownButton.style.padding = '5px 10px';
    slowDownButton.addEventListener('click', () => this._changeSpeed(0.5));
    this.buttonsContainer.appendChild(slowDownButton);
    
    const normalSpeedButton = document.createElement('button');
    normalSpeedButton.textContent = 'Normal Speed';
    normalSpeedButton.style.margin = '3px';
    normalSpeedButton.style.padding = '5px 10px';
    normalSpeedButton.addEventListener('click', () => this._changeSpeed(1.0));
    this.buttonsContainer.appendChild(normalSpeedButton);
    
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause/Play';
    pauseButton.style.margin = '3px';
    pauseButton.style.padding = '5px 10px';
    pauseButton.addEventListener('click', () => this._togglePlay());
    this.buttonsContainer.appendChild(pauseButton);
  }
  
  /**
   * Test animation for a specific beast type
   * @param {string} beastType - The beast type to test
   * @private
   */
  _testBeastType(beastType) {
    this.statusArea.textContent = `Loading ${beastType} beast animation...`;
    
    // Clear previous sprites
    this._clearScene();
    
    // Create URL for beast GIF
    const url = `/assets/Beasts/${beastType}.gif`;
    
    try {
      // Create new animated texture
      const animator = new AnimatedGIFTexture(
        url,
        // Success callback
        (gifTexture) => {
          this.statusArea.innerHTML = `
            <span style="color: #6f6">
              ${beastType} loaded successfully!<br>
              Size: ${gifTexture.canvas.width}x${gifTexture.canvas.height}<br>
              Frames: ${gifTexture.frames.length}<br>
              Load Time: ${gifTexture.stats.loadTime.toFixed(0)}ms
            </span>
          `;
          
          // Create sprite with texture
          const material = new THREE.SpriteMaterial({
            map: gifTexture.getTexture(),
            transparent: true,
          });
          
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(2, 2, 1);
          this.scene.add(sprite);
        },
        // Error callback
        (error) => {
          this.statusArea.innerHTML = `
            <span style="color: #f66">
              Error loading ${beastType}:<br>
              ${error.message}
            </span>
          `;
        }
      );
      
      // Store animator for update loop
      this.activeAnimators.push(animator);
      
    } catch (error) {
      console.error("[GIF-TEST] Error creating AnimatedGIFTexture:", error);
      this.statusArea.innerHTML = `
        <span style="color: #f66">
          Error creating AnimatedGIFTexture:<br>
          ${error.message}
        </span>
      `;
    }
  }
  
  /**
   * Clear the preview scene
   * @private
   */
  _clearScene() {
    // Dispose existing animators
    this.activeAnimators.forEach(animator => {
      if (animator && typeof animator.dispose === 'function') {
        animator.dispose();
      }
    });
    this.activeAnimators = [];
    
    // Remove all sprites
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      if (object instanceof THREE.Light) {
        // Skip lights
        this.scene.remove(object);
        this.scene.add(object);
      } else {
        if (object.material) {
          object.material.dispose();
        }
        if (object.geometry) {
          object.geometry.dispose();
        }
        this.scene.remove(object);
      }
    }
    
    // Add light back
    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);
  }
  
  /**
   * Change animation speed for all active animators
   * @param {number} speedFactor - Speed multiplier
   * @private
   */
  _changeSpeed(speedFactor) {
    this.activeAnimators.forEach(animator => {
      if (animator && typeof animator.setSpeed === 'function') {
        animator.setSpeed(speedFactor);
      }
    });
    
    this.statusArea.textContent = `Animation speed set to ${speedFactor}x`;
  }
  
  /**
   * Toggle play/pause for all active animators
   * @private
   */
  _togglePlay() {
    this.activeAnimators.forEach(animator => {
      if (!animator) return;
      
      if (animator.isPlaying && typeof animator.pause === 'function') {
        animator.pause();
      } else if (!animator.isPlaying && typeof animator.play === 'function') {
        animator.play();
      }
    });
    
    // Check status of first animator to determine message
    if (this.activeAnimators.length > 0) {
      const firstAnimator = this.activeAnimators[0];
      if (firstAnimator) {
        this.statusArea.textContent = firstAnimator.isPlaying 
          ? 'Animation playing' 
          : 'Animation paused';
      }
    }
  }
  
  /**
   * Animation loop
   * @private
   */
  _animate() {
    requestAnimationFrame(() => this._animate());
    
    // Update all active animators
    this.activeAnimators.forEach(animator => {
      if (animator && typeof animator.update === 'function') {
        animator.update();
      }
    });
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Show the test tool
   */
  show() {
    this.panel.style.display = 'block';
    console.log("[GIF-TEST] Test tool shown");
  }
  
  /**
   * Hide the test tool
   */
  close() {
    this.panel.style.display = 'none';
    console.log("[GIF-TEST] Test tool hidden");
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this._clearScene();
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    console.log("[GIF-TEST] Resources disposed");
  }
}

// Make available globally for console access
window.GifAnimationTest = GifAnimationTest;
