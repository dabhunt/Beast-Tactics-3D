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
 * Debug logging function that's module-scoped to avoid global conflicts
 * @param {string} message - Log message 
 * @param {Object} data - Optional data to log
 */
function logMessage(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[GIF-LOADER] ${message}`, data);
  } else {
    console.log(`[GIF-LOADER] ${message}`);
  }
}

/**
 * Animated GIF Loader for THREE.js
 */
class AnimatedGIFLoader {
  constructor() {
    this.fps = 10;
    this.activeAnimations = [];
    this.debugMode = true;

    // Start the global animation loop
    this._startAnimationLoop();

    logMessage("AnimatedGIFLoader instance created");
  }

  /**
   * Set animation frames per second
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    this.fps = fps;
    logMessage(`Animation speed set to ${fps} FPS (${Math.round(1000 / fps)}ms per frame)`);
    return this;
  }

  /**
   * Load an animated GIF and convert to THREE.js texture
   * @param {string} url - URL of the GIF to load
   * @param {Function} onComplete - Callback when loading is complete
   * @param {Function} onError - Callback if an error occurs
   */
  load(url, onComplete, onError) {
    logMessage(`Loading GIF from: ${url}`);

    const animatedTexture = new THREE.Texture();

    const animation = {
      url,
      frames: [],
      frameIndex: 0,
      frameDelays: [], // Store individual frame delays from GIF
      lastFrameTime: 0,
      texture: animatedTexture,
      loaded: false,
      canvas: document.createElement('canvas'),
      ctx: null,
      img: new Image(),
      width: 0,
      height: 0
    };

    this.activeAnimations.push(animation);
    animation.ctx = animation.canvas.getContext('2d');

    logMessage(`Starting GIF load: ${url}`);

    animation.img.crossOrigin = "Anonymous";
    animation.img.onload = () => this._loadGifFrames(animation, onComplete, onError);
    animation.img.onerror = (err) => {
      logMessage(`Error loading GIF: ${url}`, err);
      if (onError) onError(err);
    };
    animation.img.src = url;

    return animatedTexture;
  }

  /**
   * Internal method to load GIF frames using omggif
   * @private
   */
  _loadGifFrames(animation, onComplete, onError) {
    logMessage(`Processing GIF frames from: ${animation.url}`);

    const img = animation.img;
    animation.width = img.width;
    animation.height = img.height;
    animation.canvas.width = img.width;
    animation.canvas.height = img.height;

    try {
      // Use omggif from the imported package
      const fetchGif = async () => {
        try {
          let arrayBuffer;
          if (img.src.startsWith('data:image/gif;base64,')) {
            // Handle base64 encoded data
            const base64Data = img.src.replace(/^data:image\/gif;base64,/, "");
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          } else {
            // Handle URL
            const response = await fetch(img.src);
            arrayBuffer = await response.arrayBuffer();
          }

          // Create GIF reader
          const gifReader = new window.omggif.GifReader(new Uint8Array(arrayBuffer));
          logMessage(`GIF loaded: ${gifReader.numFrames()} frames found`);

          animation.frames = [];
          animation.frameDelays = [];

          // Extract each frame
          for (let i = 0; i < gifReader.numFrames(); i++) {
            const frameInfo = gifReader.frameInfo(i);

            // Create a canvas for this frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = animation.width;
            frameCanvas.height = animation.height;
            const frameCtx = frameCanvas.getContext('2d');

            // Create image data to get frame pixels
            const imageData = frameCtx.createImageData(animation.width, animation.height);

            // Render frame to the ImageData
            gifReader.decodeAndBlitFrameRGBA(i, imageData.data);

            // Put the image data on the canvas
            frameCtx.putImageData(imageData, 0, 0);

            // Save the frame
            animation.frames.push(frameCanvas);

            // Save the frame delay in milliseconds (convert from 1/100 seconds)
            animation.frameDelays.push((frameInfo.delay || 10) * 10);

            logMessage(`Frame ${i} processed with delay: ${animation.frameDelays[i]}ms`);
          }

          // Mark as loaded
          animation.loaded = true;

          // Set first frame on the texture
          if (animation.frames.length > 0) {
            animation.texture.image = animation.frames[0];
            animation.texture.needsUpdate = true;
          }

          logMessage(`GIF animation loaded with ${animation.frames.length} frames`);

          if (onComplete) {
            onComplete(animation.texture);
          }
        } catch (err) {
          logMessage(`Error processing GIF: ${err.message}`, err);
          console.error(err);
          if (onError) onError(err);
        }
      };

      fetchGif();
    } catch (err) {
      logMessage(`Error in _loadGifFrames: ${err.message}`, err);
      console.error(err);
      if (onError) onError(err);
    }
  }

  /**
   * Start the global animation loop to update all GIF textures
   * @private
   */
  _startAnimationLoop() {
    const updateAnimations = () => {
      const now = performance.now();

      // Update each animation
      for (const animation of this.activeAnimations) {
        if (!animation.loaded || animation.frames.length === 0) {
          continue;
        }

        // Check if we need to advance to the next frame
        const currentFrameDelay = animation.frameDelays[animation.frameIndex] || 100;
        if (now - animation.lastFrameTime > currentFrameDelay) {
          // Update to next frame
          animation.frameIndex = (animation.frameIndex + 1) % animation.frames.length;
          animation.texture.image = animation.frames[animation.frameIndex];
          animation.texture.needsUpdate = true;
          animation.lastFrameTime = now;

          // Only log every 10th frame update to reduce console spam
          if (animation.frameIndex % 10 === 0) {
            logMessage(`Updated animation to frame ${animation.frameIndex}/${animation.frames.length-1}`);
          }
        }
      }

      // Continue the animation loop
      requestAnimationFrame(updateAnimations);
    };

    // Start the animation loop
    requestAnimationFrame(updateAnimations);
    logMessage("Animation loop started");
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

      logMessage(`Disposing animation resources for: ${animation.url}`);
      
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
      
      // Clean up frames
      if (animation.frames) {
        animation.frames.length = 0;
      }

      // Remove from active animations
      this.activeAnimations.splice(index, 1);

      logMessage(`Successfully disposed animation: ${animation.url}`);
      return true;
    }

    console.warn(`[GIF-LOADER] Could not find texture to dispose`);
    return false;
  }
  
  /**
   * Get stats about loaded GIFs
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      activeAnimations: this.activeAnimations.length,
      totalGifsLoaded: this.totalGifsLoaded,
      totalFramesLoaded: this.totalFramesLoaded,
      loadErrors: this.loadErrors,
      fps: this.fps
    };
  }
  
  /**
   * Manual update function to advance all animations one frame
   * Useful for debugging or when animations seem stuck
   */
  update() {
    logMessage(`Manual update triggered for ${this.activeAnimations.length} animations`);
    this.activeAnimations.forEach(animation => {
      if (animation.loaded) {
        this._updateTextureFrame(animation);
      }
    });
  }
  _updateTextureFrame(animation) {
    if (!animation.loaded || animation.frames.length === 0) {
      return;
    }

    // Move to next frame with wrap-around
    animation.frameIndex = (animation.frameIndex + 1) % animation.frames.length;
    
    // Get the current frame
    const currentFrame = animation.frames[animation.frameIndex];

    // Clear canvas and draw the current frame
    animation.ctx.clearRect(0, 0, animation.width, animation.height);
    animation.ctx.drawImage(currentFrame, 0, 0);

    // Update the texture
    animation.texture.needsUpdate = true;

    if (this.debugMode && animation.frameIndex === 0) {
      logMessage(`Animation loop complete: ${animation.url}`, {
        frame: animation.frameIndex,
        frames: animation.frames.length,
        delay: animation.frameDelays[animation.frameIndex]
      });
    }
  }
}

// Create and export a singleton instance
const gifLoader = new AnimatedGIFLoader();
export { gifLoader, AnimatedGIFLoader };