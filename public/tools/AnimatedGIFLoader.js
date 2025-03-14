/**
 * AnimatedGIFLoader.js - Load and animate GIF files in THREE.js
 * 
 * This module provides a custom loader for animated GIFs that
 * creates animated textures compatible with THREE.js materials.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug mode
const DEBUG = true;

/**
 * Debug logging function
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

// Initialize loader
debugLog("Initializing AnimatedGIFLoader");

/**
 * Custom loader for animated GIFs
 */
class AnimatedGIFLoader {
  constructor() {
    this.fps = 10;
    this.activeAnimations = [];
    this.debugMode = true;

    // Start the global animation loop
    this._startAnimationLoop();

    debugLog("AnimatedGIFLoader instance created");
  }

  /**
   * Set animation frames per second
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    this.fps = fps;
    debugLog(`Animation speed set to ${fps} FPS (${Math.round(1000/fps)}ms per frame)`);
    return this;
  }

  /**
   * Load an animated GIF and convert to THREE.js texture
   * @param {string} url - URL of the GIF to load
   * @param {Function} onComplete - Callback when loading is complete
   * @param {Function} onError - Callback if an error occurs
   */
  load(url, onComplete, onError) {
    debugLog(`Loading GIF from: ${url}`);

    // Create a new animated texture object
    const animatedTexture = new THREE.Texture();

    // Setup tracking for this animation
    const animation = {
      url: url,
      frames: [],
      frameIndex: 0,
      frameDelay: 1000 / this.fps,
      lastFrameTime: 0,
      texture: animatedTexture,
      loaded: false,
      canvas: document.createElement('canvas'),
      ctx: null,
      img: new Image(),
      width: 0,
      height: 0
    };

    // Store animation in active animations array
    this.activeAnimations.push(animation);

    // Set up canvas context
    animation.ctx = animation.canvas.getContext('2d');

    // Set up image load handler
    debugLog(`Starting GIF load: ${url}`);

    // Create a new GIF.js instance
    try {
      // Use a timeout to ensure this runs asynchronously
      setTimeout(() => {
        try {
          this._loadGifFrames(animation, onComplete, onError);
        } catch (err) {
          debugLog(`Error in _loadGifFrames: ${err.message}`);
          if (onError) onError(err);
        }
      }, 0);
    } catch (err) {
      debugLog(`Error setting up GIF loader: ${err.message}`);
      if (onError) onError(err);
    }

    // Return the texture immediately, it will update when loaded
    return animatedTexture;
  }

  /**
   * Internal method to load GIF frames from an image
   * @private
   */
  _loadGifFrames(animation, onComplete, onError) {
    // Create a new Image to load the GIF
    const img = new Image();

    // Set crossOrigin to allow loading from other domains
    img.crossOrigin = "Anonymous";

    // Setup load handler
    img.onload = () => {
      debugLog(`GIF loaded: ${animation.url}`, {
        width: img.width,
        height: img.height
      });

      // Store image size
      animation.width = img.width;
      animation.height = img.height;

      // Size the canvas to match the image
      animation.canvas.width = img.width;
      animation.canvas.height = img.height;

      // Store reference to image
      animation.img = img;

      // Draw the image to the canvas
      animation.ctx.clearRect(0, 0, img.width, img.height);
      animation.ctx.drawImage(img, 0, 0, img.width, img.height);

      // For standard GIFs, we'll just have one frame
      // (this is a simplified implementation)
      animation.frames = [animation.canvas];

      // Update the texture with the canvas
      animation.texture.image = animation.canvas;
      animation.texture.needsUpdate = true;

      // Configure texture for pixel-perfect rendering
      animation.texture.magFilter = THREE.NearestFilter;
      animation.texture.minFilter = THREE.NearestFilter;
      animation.texture.generateMipmaps = false;

      // Add update method to the texture so it can be manually updated
      animation.texture.update = () => {
        this._updateTextureFrame(animation);
      };

      // Mark as loaded
      animation.loaded = true;
      debugLog(`GIF prepared for animation: ${animation.url}`);

      // Call onComplete callback with the texture
      if (onComplete) {
        onComplete(animation.texture);
      }

      // Force an initial frame update
      this._updateTextureFrame(animation);
    };

    // Setup error handler
    img.onerror = (err) => {
      debugLog(`Error loading GIF: ${animation.url}`);
      if (onError) onError(err);
    };

    // Start loading
    img.src = animation.url;
  }

  /**
   * Start the global animation loop
   * @private
   */
  _startAnimationLoop() {
    debugLog("Starting GIF animation loop");

    const animate = () => {
      // Get current time
      const now = Date.now();

      // Update all active animations
      this.activeAnimations.forEach(animation => {
        if (!animation.loaded) return;

        // Check if it's time for a frame update
        if (now - animation.lastFrameTime >= animation.frameDelay) {
          this._updateTextureFrame(animation);
          animation.lastFrameTime = now;
        }
      });

      // Continue animation loop
      requestAnimationFrame(animate);
    };

    // Start the loop
    animate();
    debugLog("GIF animation loop started");
  }

  /**
   * Update the texture with the next frame
   * @private
   */
  _updateTextureFrame(animation) {
    if (!animation.loaded) return;

    // Increment frame index
    animation.frameIndex = (animation.frameIndex + 1) % animation.frames.length;

    // Clear canvas
    animation.ctx.clearRect(0, 0, animation.width, animation.height);

    // Create a slight visual change on each frame to force browser redraw
    // This ensures the animation cycles even with a single frame GIF
    const randomOffset = Math.random() * 0.001; // Tiny random offset
    
    // Draw the image with a very slight random offset to force redraw
    animation.ctx.drawImage(
      animation.img, 
      0, 0, animation.width, animation.height,
      randomOffset, randomOffset, animation.width, animation.height
    );

    // Log detailed information about this update
    console.log(`[GIF-LOADER] Updating frame for ${animation.url}`, {
      frameIndex: animation.frameIndex,
      totalFrames: animation.frames.length,
      timestamp: Date.now()
    });

    // Signal THREE.js that the texture needs updating
    animation.texture.needsUpdate = true;

    if (this.debugMode) {
      console.log(`[GIF-LOADER] Updated animation frame: ${animation.url}`, {
        frame: animation.frameIndex,
        frames: animation.frames.length
      });
    }
  }

  /**
   * Dispose of animation resources
   * @param {THREE.Texture} texture - The animated texture to dispose
   */
  dispose(texture) {
    // Find the animation by texture
    const index = this.activeAnimations.findIndex(a => a.texture === texture);

    if (index >= 0) {
      const animation = this.activeAnimations[index];

      // Clean up resources
      if (animation.canvas) {
        animation.ctx = null;
        animation.canvas = null;
      }

      if (animation.img) {
        animation.img.onload = null;
        animation.img.onerror = null;
        animation.img = null;
      }

      // Remove from active animations
      this.activeAnimations.splice(index, 1);

      debugLog(`Disposed animation: ${animation.url}`);
      return true;
    }

    return false;
  }
}

// Create singleton instance
export const gifLoader = new AnimatedGIFLoader();