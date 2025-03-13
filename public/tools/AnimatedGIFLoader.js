
/**
 * AnimatedGIFLoader.js - Utility for loading and animating GIF textures in THREE.js
 * 
 * This module handles extracting frames from GIFs and updating textures to animate them
 * in THREE.js materials, which doesn't natively support GIF animation.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug flag
const DEBUG = true;

/**
 * Log debugging information
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[GIF-LOADER] ${message}`, data);
  } else {
    console.log(`[GIF-LOADER] ${message}`);
  }
}

/**
 * Animated GIF loader class to handle loading and animating GIFs in THREE.js
 */
class AnimatedGIFLoader {
  constructor() {
    debugLog("Initializing AnimatedGIFLoader");
    
    // List of all animated textures being managed
    this.animatedTextures = [];
    
    // Last timestamp for animation update
    this.lastUpdateTime = 0;
    
    // Animation speed control (ms per frame)
    this.frameDelay = 100; // Default: 10fps
  }
  
  /**
   * Load an animated GIF and prepare it for use with THREE.js
   * 
   * @param {string} url - URL of the GIF file
   * @param {Function} onComplete - Callback when loading completes with the texture
   * @param {Function} onError - Callback if loading fails
   */
  load(url, onComplete, onError) {
    debugLog(`Loading GIF from: ${url}`);
    
    // Create canvas to process GIF frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an image element to hold the GIF
    const img = document.createElement('img');
    
    // Track loading state
    let isLoaded = false;
    let hasError = false;
    
    // Function to handle successful load
    const handleImageLoad = () => {
      if (isLoaded || hasError) return;
      
      debugLog(`GIF loaded: ${url}`, {
        width: img.width,
        height: img.height
      });
      
      try {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the first frame
        ctx.drawImage(img, 0, 0);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Configure for pixel art
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        
        // Store animation data with the texture
        const animationData = {
          texture: texture,
          canvas: canvas,
          ctx: ctx,
          img: img,
          frameTime: 0,
          isAnimated: true,
          url: url
        };
        
        // Add to the list of textures to animate
        this.animatedTextures.push(animationData);
        
        debugLog(`GIF prepared for animation: ${url}`);
        
        // Mark as loaded to prevent duplicate processing
        isLoaded = true;
        
        // Start animation loop if this is the first texture
        if (this.animatedTextures.length === 1) {
          this._startAnimationLoop();
        }
        
        // Return the texture via callback
        if (onComplete) {
          onComplete(texture);
        }
      } catch (err) {
        debugLog(`Error processing GIF: ${err.message}`);
        if (onError) {
          onError(err);
        }
      }
    };
    
    // Set up event handlers
    img.onload = handleImageLoad;
    
    img.onerror = (err) => {
      hasError = true;
      debugLog(`Failed to load GIF: ${url}`, err);
      if (onError) {
        onError(err);
      }
    };
    
    // Start loading
    debugLog(`Starting GIF load: ${url}`);
    img.crossOrigin = "Anonymous"; // Enable CORS support
    img.src = url;
  }
  
  /**
   * Start the animation loop
   * @private
   */
  _startAnimationLoop() {
    debugLog("Starting GIF animation loop");
    
    // Use requestAnimationFrame for smooth animation
    const animate = (timestamp) => {
      // Calculate delta time since last update
      const deltaTime = timestamp - this.lastUpdateTime;
      
      // Only update frames if enough time has passed
      if (deltaTime >= this.frameDelay) {
        this.lastUpdateTime = timestamp;
        
        // Update each animated texture
        this.animatedTextures.forEach(item => {
          if (item.isAnimated) {
            // Force GIF to render a new frame by redrawing
            item.ctx.drawImage(item.img, 0, 0);
            
            // Mark texture for update
            item.texture.needsUpdate = true;
          }
        });
      }
      
      // Continue animation loop
      requestAnimationFrame(animate);
    };
    
    // Start the animation loop
    this.lastUpdateTime = performance.now();
    requestAnimationFrame(animate);
    debugLog("GIF animation loop started");
  }
  
  /**
   * Set the animation speed (frames per second)
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    if (fps <= 0) {
      debugLog("Invalid FPS value, must be greater than 0");
      return;
    }
    
    this.frameDelay = 1000 / fps;
    debugLog(`Animation speed set to ${fps} FPS (${this.frameDelay.toFixed(2)}ms per frame)`);
  }
  
  /**
   * Clean up resources for a specific texture
   * @param {THREE.Texture} texture - The texture to dispose
   */
  dispose(texture) {
    const index = this.animatedTextures.findIndex(item => item.texture === texture);
    
    if (index !== -1) {
      const item = this.animatedTextures[index];
      debugLog(`Disposing animated texture: ${item.url}`);
      
      // Remove from animation list
      this.animatedTextures.splice(index, 1);
      
      // Dispose texture
      item.texture.dispose();
      
      // Clean up DOM elements
      if (item.canvas.parentNode) {
        item.canvas.parentNode.removeChild(item.canvas);
      }
    }
  }
  
  /**
   * Clean up all resources
   */
  disposeAll() {
    debugLog(`Disposing all ${this.animatedTextures.length} animated textures`);
    
    this.animatedTextures.forEach(item => {
      item.texture.dispose();
      
      if (item.canvas.parentNode) {
        item.canvas.parentNode.removeChild(item.canvas);
      }
    });
    
    this.animatedTextures = [];
  }
}

// Create a singleton instance of the loader
export const gifLoader = new AnimatedGIFLoader();
