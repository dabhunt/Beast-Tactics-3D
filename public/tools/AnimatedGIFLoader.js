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
/**
 * Animated GIF Loader for THREE.js
 * 
 * This module handles loading and animating GIF files as THREE.js textures.
 * It provides a global gifLoader instance that can be used throughout the application.
 */

// Helper for logging
function debugLog(message, data = null) {
  if (data) {
    console.log(`[GIF-LOADER] ${message}`, data);
  } else {
    console.log(`[GIF-LOADER] ${message}`);
  }
}

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
    console.log(`[GIF-LOADER] Starting to load frames from: ${animation.url}`);
    
    // Create a new Image to load the GIF
    const img = new Image();

    // Set crossOrigin to allow loading from other domains
    img.crossOrigin = "Anonymous";

    // Setup load handler
    img.onload = () => {
      console.log(`[GIF-LOADER] GIF loaded: ${animation.url}`, {
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

      // For GIF animation, we need to simulate multiple frames
      // Create 8 artificial frames by slightly adjusting the canvas 
      // to ensure the browser redraws it
      animation.frames = [];
      for (let i = 0; i < 8; i++) {
        // Create a copy of the canvas for each frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = img.width;
        frameCanvas.height = img.height;
        const frameCtx = frameCanvas.getContext('2d');
        
        // Draw the image with a slight offset
        // This forces browser to recognize it as a different frame
        const offset = i * 0.001; // Very tiny offset
        frameCtx.drawImage(img, offset, offset, img.width, img.height);
        
        // Add to frames array
        animation.frames.push(frameCanvas);
      }
      
      console.log(`[GIF-LOADER] Created ${animation.frames.length} virtual frames for animation`);

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
    
    // Get the current frame canvas
    const currentFrame = animation.frames[animation.frameIndex];

    // Clear canvas
    animation.ctx.clearRect(0, 0, animation.width, animation.height);
    
    // Draw the current frame to the animation canvas
    animation.ctx.drawImage(currentFrame, 0, 0);
    
    // Apply an additional random offset to ensure the browser sees changes
    // This helps prevent the browser from caching the image
    const jitterX = (Math.random() - 0.5) * 0.002;
    const jitterY = (Math.random() - 0.5) * 0.002;
    
    // Add a tiny extra element with jitter to force redraw
    animation.ctx.fillStyle = 'rgba(255,255,255,0.01)'; // Almost invisible
    animation.ctx.fillRect(
      animation.width - 2 + jitterX, 
      animation.height - 2 + jitterY, 
      1, 1
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
  
  /**
   * Manual update function to advance all animations one frame
   * Useful for debugging or when animations seem stuck
   */
  update() {
    console.log(`[GIF-LOADER] Manual update triggered for ${this.activeAnimations.length} animations`);
    this.activeAnimations.forEach(animation => {
      if (animation.loaded) {
        this._updateTextureFrame(animation);
      }
    });
  }
}

// Create and export a singleton instance
const gifLoader = new AnimatedGIFLoader();
export { gifLoader, AnimatedGIFLoader };

// Create singleton instance
export const gifLoader = new AnimatedGIFLoader();
/**
 * AnimatedGIFLoader.js - Load and animate GIF files in THREE.js
 * 
 * This module provides a custom loader for animated GIFs that
 * creates animated textures compatible with THREE.js materials.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug flag
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

/**
 * Animated GIF Loader for THREE.js
 */
class AnimatedGIFLoader {
  constructor() {
    debugLog("Initializing AnimatedGIFLoader instance");
    this.fps = 10;
    this.activeAnimations = [];
    this.debugMode = true;
    
    // Tracking variables for diagnostics
    this.totalFramesLoaded = 0;
    this.totalGifsLoaded = 0;
    this.loadErrors = 0;

    // Start the global animation loop
    this._startAnimationLoop();

    debugLog("AnimatedGIFLoader instance created and ready");
  }

  /**
   * Set animation frames per second (global rate)
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    this.fps = Math.max(1, Math.min(60, fps)); // Clamp between 1-60 FPS
    debugLog(`Animation global speed set to ${this.fps} FPS (${Math.round(1000 / this.fps)}ms per frame)`);
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

    // Create texture that will be updated with GIF frames
    const animatedTexture = new THREE.Texture();

    // Set up animation state tracking
    const animation = {
      url,
      frames: [],
      frameIndex: 0,
      frameDelays: [],   // Store individual frame delays from GIF
      defaultDelay: 100, // Default delay if we can't parse from GIF (100ms)
      lastFrameTime: 0,
      texture: animatedTexture,
      loaded: false,
      canvas: document.createElement('canvas'),
      ctx: null,
      img: new Image(),
      width: 0,
      height: 0,
      loadStartTime: Date.now()
    };
    
    // Add to active animations list
    this.activeAnimations.push(animation);
    
    // Set up canvas context
    animation.ctx = animation.canvas.getContext('2d');

    debugLog(`Created canvas and context for GIF: ${url}`);

    // Set up image loading
    animation.img.crossOrigin = "Anonymous";
    
    // Set up onload handler
    animation.img.onload = () => {
      debugLog(`Image loaded, dimensions: ${animation.img.width}x${animation.img.height}`);
      
      try {
        // First try using the GIF parser
        this._parseGifWithLibrary(animation, onComplete, onError);
      } catch (err) {
        // Fall back to basic frame extraction if modern method fails
        console.warn(`[GIF-LOADER] GIF parsing failed, falling back to basic method:`, err);
        this._fallbackGifParsing(animation, onComplete, onError);
      }
    };
    
    // Set up error handler
    animation.img.onerror = (err) => {
      this.loadErrors++;
      const errMsg = `Error loading GIF: ${url}`;
      console.error(`[GIF-LOADER] ${errMsg}`, err);
      debugLog(`GIF load failed after ${Date.now() - animation.loadStartTime}ms`);
      
      if (onError) onError(new Error(errMsg));
    };
    
    // Start loading the image
    debugLog(`Starting image load: ${url}`);
    animation.img.src = url;

    return animatedTexture;
  }

  /**
   * Parse GIF using the omggif library (dynamically loaded)
   * @private
   */
  async _parseGifWithLibrary(animation, onComplete, onError) {
    debugLog(`Attempting to parse GIF with omggif: ${animation.url}`);
    
    try {
      // Dynamically import omggif
      const omggifModule = await import("https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js");
      const GifReader = omggifModule.default || omggifModule;
      
      debugLog(`Successfully imported omggif library`);
      
      // Get GIF data as ArrayBuffer
      const response = await fetch(animation.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      debugLog(`Fetched GIF data: ${arrayBuffer.byteLength} bytes`);
      
      // Parse the GIF data
      const gifData = new Uint8Array(arrayBuffer);
      const gifReader = new GifReader(gifData);
      
      debugLog(`GIF parsed successfully: ${gifReader.numFrames()} frames`);
      
      // Set up the canvas to the GIF dimensions
      const img = animation.img;
      animation.width = img.width;
      animation.height = img.height;
      animation.canvas.width = img.width;
      animation.canvas.height = img.height;
      
      // Extract frames
      animation.frames = [];
      animation.frameDelays = [];
      
      // Process all frames
      for (let i = 0; i < gifReader.numFrames(); i++) {
        // Get frame info (includes delay)
        const frameInfo = gifReader.frameInfo(i);
        
        // Convert delay from centiseconds to milliseconds (multiply by 10)
        const delay = frameInfo.delay * 10;
        animation.frameDelays.push(delay > 0 ? delay : animation.defaultDelay);
        
        // Create canvas for this frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = img.width;
        frameCanvas.height = img.height;
        const frameCtx = frameCanvas.getContext('2d');
        
        // Decode frame to RGBA data
        const frameData = new Uint8ClampedArray(img.width * img.height * 4);
        gifReader.decodeAndBlitFrameRGBA(i, frameData);
        
        // Create ImageData and draw to the frame canvas
        const imageData = new ImageData(frameData, img.width, img.height);
        frameCtx.putImageData(imageData, 0, 0);
        
        // Store the frame canvas
        animation.frames.push(frameCanvas);
        
        this.totalFramesLoaded++;
        
        debugLog(`Extracted frame ${i+1}/${gifReader.numFrames()}, delay: ${delay}ms`);
      }
      
      // Complete the texture setup
      this._finishTextureSetup(animation, onComplete);
      
    } catch (err) {
      console.error(`[GIF-LOADER] Error parsing GIF with library:`, err);
      debugLog(`Library parsing failed, falling back to basic method`);
      
      // Fall back to basic frame extraction
      this._fallbackGifParsing(animation, onComplete, onError);
    }
  }
  
  /**
   * Fallback method for GIF parsing when omggif isn't available
   * @private
   */
  _fallbackGifParsing(animation, onComplete, onError) {
    debugLog(`Using fallback GIF parsing for: ${animation.url}`);
    
    const img = animation.img;
    animation.width = img.width;
    animation.height = img.height;
    animation.canvas.width = img.width;
    animation.canvas.height = img.height;
    
    // Since we can't properly extract frames, just use the whole image
    // as a single frame with a fixed delay
    animation.ctx.drawImage(img, 0, 0);
    animation.frames = [animation.canvas];
    animation.frameDelays = [1000 / this.fps]; // Fixed delay based on global FPS
    
    debugLog(`Created fallback frame with ${animation.frameDelays[0]}ms delay`);
    
    this._finishTextureSetup(animation, onComplete);
  }
  
  /**
   * Complete texture setup after frames are extracted
   * @private
   */
  _finishTextureSetup(animation, onComplete) {
    debugLog(`Setting up THREE.js texture for ${animation.frames.length} frames`);
    
    // Set the texture's image to our canvas
    animation.texture.image = animation.canvas;
    animation.texture.needsUpdate = true;
    
    // Configure for pixel-perfect rendering
    animation.texture.magFilter = THREE.NearestFilter;
    animation.texture.minFilter = THREE.NearestFilter;
    animation.texture.generateMipmaps = false;
    
    // Add update method to texture for easier handling
    animation.texture.update = () => this._updateTextureFrame(animation);
    
    // Mark as loaded
    animation.loaded = true;
    this.totalGifsLoaded++;
    
    debugLog(`GIF ready for animation: ${animation.url} (${animation.frames.length} frames)`);
    
    // Update with first frame
    this._updateTextureFrame(animation);
    
    // Call the complete callback
    if (onComplete) onComplete(animation.texture);
    
    // Log total load time
    const loadTime = Date.now() - animation.loadStartTime;
    debugLog(`Total GIF load time: ${loadTime}ms`);
  }

  /**
   * Start the global animation loop
   * @private
   */
  _startAnimationLoop() {
    debugLog("Starting GIF animation loop");

    const animate = () => {
      const now = Date.now();
      
      // Update each animation based on its frame delay
      this.activeAnimations.forEach(animation => {
        if (!animation.loaded) return;
        
        // Get the current frame's delay
        const currentDelay = animation.frameDelays[animation.frameIndex] || (1000 / this.fps);
        
        // Check if it's time to update this animation
        if (now - animation.lastFrameTime >= currentDelay) {
          this._updateTextureFrame(animation);
          animation.lastFrameTime = now;
        }
      });
      
      // Request next animation frame
      requestAnimationFrame(animate);
    };

    // Start the animation loop
    animate();
    debugLog("GIF animation loop started successfully");
  }

  /**
   * Update the texture with the next frame
   * @private
   */
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
      debugLog(`Animation loop complete: ${animation.url}`, {
        frame: animation.frameIndex,
        frames: animation.frames.length,
        delay: animation.frameDelays[animation.frameIndex]
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

      debugLog(`Disposing animation resources for: ${animation.url}`);
      
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

      debugLog(`Successfully disposed animation: ${animation.url}`);
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
    debugLog(`Manual update triggered for ${this.activeAnimations.length} animations`);
    this.activeAnimations.forEach(animation => {
      if (animation.loaded) {
        this._updateTextureFrame(animation);
      }
    });
  }
}

// Create and export a singleton instance
const gifLoader = new AnimatedGIFLoader();
export { gifLoader, AnimatedGIFLoader };
