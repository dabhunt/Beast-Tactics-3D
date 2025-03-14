
/**
 * SimpleGIFAnimator.js - Minimal animated GIF loader for THREE.js sprites
 * 
 * A lightweight solution to load and animate GIFs as textures on THREE.js sprites.
 * Uses gifuct-js for GIF parsing.
 */

// Import THREE.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug logging
const DEBUG = true;
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[SIMPLE-GIF] ${message}`, data);
  } else {
    console.log(`[SIMPLE-GIF] ${message}`);
  }
}

/**
 * Class to handle a single animated GIF sprite in THREE.js
 */
export class SimpleGIFAnimator {
  /**
   * @param {string} url - URL of the GIF to load
   * @param {THREE.Scene} scene - The THREE.js scene
   * @param {Object} position - Position {x, y, z}
   * @param {number} scale - Sprite scale
   * @param {Function} onLoadComplete - Callback when loading completes
   * @param {Function} onError - Callback when loading fails
   */
  constructor(url, scene, position = { x: 0, y: 0.5, z: 0 }, scale = 1, onLoadComplete = null, onError = null) {
    debugLog(`Creating GIF animator for ${url}`, { position, scale });
    
    this.url = url;
    this.scene = scene;
    this.position = position;
    this.scale = scale;
    this.onLoadComplete = onLoadComplete;
    this.onError = onError;
    this.isLoaded = false;
    this.isLoading = false;
    this.hasError = false;
    this.errorMessage = null;

    // Animation state
    this.frames = [];
    this.frameDelays = [];
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.totalFrames = 0;
    this.loopCount = 0;
    this.totalLoops = 0; // 0 means infinite
    this.isPlaying = true;

    // THREE.js objects
    this.sprite = null;
    this.texture = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Stats for debugging
    this.stats = {
      frameDrawTime: 0,
      updateCalls: 0,
      framesRendered: 0,
      loadTime: 0
    };
    
    // Create a default material and sprite immediately
    // This allows attaching it to the scene even before the GIF loads
    this._createDefaultSprite();

    // Load the GIF and set up the sprite
    this._loadGIF();
  }

  /**
   * Create a default sprite with a placeholder texture
   * @private
   */
  _createDefaultSprite() {
    debugLog(`Creating default sprite`);
    
    // Set up a small default canvas
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    this.ctx.fillRect(0, 0, 64, 64);
    this.ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    this.ctx.fillText('Loading...', 5, 32);
    
    // Create texture from canvas
    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;

    // Create material with the texture
    const material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.1
    });

    // Create and position the sprite
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.set(this.position.x, this.position.y, this.position.z);
    
    // Add to scene
    this.scene.add(this.sprite);
    debugLog(`Default sprite created and added to scene`);
  }

  /**
   * Load and parse the GIF
   * @private
   */
  async _loadGIF() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = null;
    const startTime = performance.now();
    
    debugLog(`Loading GIF from: ${this.url}`);

    try {
      // Dynamically import gifuct-js from CDN
      debugLog(`Importing gifuct-js from CDN`);
      const gifuctModule = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js');
      const GIF = gifuctModule.default;
      
      if (!GIF) {
        throw new Error("Failed to load gifuct-js module");
      }
      
      debugLog(`Successfully imported gifuct-js, fetching GIF data`);
      
      // Fetch the GIF as an array buffer
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const gifData = new Uint8Array(arrayBuffer);
      
      debugLog(`GIF data fetched, parsing with gifuct-js (${gifData.length} bytes)`);

      // Parse the GIF using gifuct-js
      const gif = new GIF(gifData);
      
      debugLog(`GIF header parsed:`, { 
        width: gif.header.width, 
        height: gif.header.height,
        frames: gif.frames.length
      });
      
      // Decompress all frames
      debugLog(`Decompressing GIF frames...`);
      const frames = gif.decompressFrames(true);
      this.totalFrames = frames.length;
      
      debugLog(`GIF parsed with ${frames.length} frames`);

      // Set up canvas dimensions based on GIF size
      this.canvas.width = gif.header.width;
      this.canvas.height = gif.header.height;
      
      // Clear existing frames if any
      this.frames = [];
      this.frameDelays = [];

      // Process each frame
      debugLog(`Processing ${frames.length} GIF frames...`);
      frames.forEach((frame, index) => {
        // Create a canvas for this frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gif.header.width;
        frameCanvas.height = gif.header.height;
        const frameCtx = frameCanvas.getContext('2d');
        
        // If this isn't the first frame, and disposal is not 2 (restore to bg)
        // then we need to draw the previous canvas first
        if (index > 0 && frame.disposalType !== 2) {
          frameCtx.drawImage(this.frames[index - 1], 0, 0);
        }

        // Convert frame data to ImageData
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height
        );

        // Draw frame to its canvas, accounting for position
        frameCtx.putImageData(imageData, frame.dims.left, frame.dims.top);
        
        // Store the canvas and delay
        this.frames.push(frameCanvas);
        
        // Ensure a minimum delay to avoid super-fast animations
        const delay = Math.max(frame.delay || 100, 20);
        this.frameDelays.push(delay); 
        
        if (index % 10 === 0) {
          debugLog(`Processed ${index}/${frames.length} frames`);
        }
      });

      debugLog(`All ${frames.length} frames processed`);
      
      // Update the texture
      this.texture.dispose();
      this.texture = new THREE.Texture(this.canvas);
      this.texture.magFilter = THREE.NearestFilter; // Pixel-perfect rendering
      this.texture.minFilter = THREE.NearestFilter;
      this.texture.generateMipmaps = false;
      
      // Update sprite material
      if (this.sprite.material) {
        this.sprite.material.dispose();
      }
      
      this.sprite.material = new THREE.SpriteMaterial({
        map: this.texture,
        transparent: true,
        alphaTest: 0.1
      });

      // Update scale to match GIF dimensions better
      const aspectRatio = this.canvas.height / this.canvas.width;
      this.sprite.scale.set(this.scale, this.scale * aspectRatio, 1);
      
      // Draw the first frame immediately
      this._updateFrame();
      
      this.isLoaded = true;
      this.isLoading = false;
      this.stats.loadTime = performance.now() - startTime;
      
      debugLog(`GIF loaded successfully in ${this.stats.loadTime.toFixed(0)}ms`, {
        frames: this.frames.length,
        size: `${this.canvas.width}x${this.canvas.height}`,
        firstFrameDelay: this.frameDelays[0]
      });
      
      // Call the completion callback if provided
      if (this.onLoadComplete) {
        this.onLoadComplete(this);
      }
    } catch (err) {
      this.hasError = true;
      this.errorMessage = err.message;
      this.isLoading = false;
      
      console.error(`[SIMPLE-GIF] Failed to load GIF: ${this.url}`, err);
      
      // Draw error message on the canvas
      this.ctx.fillStyle = 'rgba(255, 200, 200, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillText('Error loading GIF', 5, 32);
      this.ctx.fillText(err.message.substring(0, 20), 5, 48);
      this.texture.needsUpdate = true;
      
      // Call the error callback if provided
      if (this.onError) {
        this.onError(err, this);
      }
    }
  }

  /**
   * Update the current frame
   * @private
   */
  _updateFrame() {
    if (this.frames.length === 0) return;
    
    const frameStart = performance.now();
    
    // Get the current frame
    const currentFrame = this.frames[this.frameIndex];
    
    // Clear canvas and draw the current frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(currentFrame, 0, 0);
    
    // Mark texture for update
    this.texture.needsUpdate = true;
    
    // Update stats
    this.stats.frameDrawTime = performance.now() - frameStart;
    this.stats.framesRendered++;
  }

  /**
   * Update method to be called in the game loop
   */
  update() {
    // Update stats
    this.stats.updateCalls++;
    
    // Skip update if not loaded or not playing
    if (!this.isLoaded || !this.isPlaying || this.frames.length === 0) return;

    const now = Date.now();
    const currentDelay = this.frameDelays[this.frameIndex];
    
    // Check if it's time to advance to the next frame
    if (now - this.lastFrameTime >= currentDelay) {
      // Increment frame index
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      
      // Track loop completion
      if (this.frameIndex === 0) {
        this.loopCount++;
        
        // Stop if we've reached the maximum number of loops
        if (this.totalLoops > 0 && this.loopCount >= this.totalLoops) {
          this.isPlaying = false;
          debugLog(`Animation stopped after ${this.loopCount} loops`);
          return;
        }
      }
      
      // Update the time for the next frame
      this.lastFrameTime = now;
      
      // Update the frame
      this._updateFrame();
    }
  }

  /**
   * Play the animation
   */
  play() {
    this.isPlaying = true;
    debugLog(`Animation playback started`);
  }

  /**
   * Pause the animation
   */
  pause() {
    this.isPlaying = false;
    debugLog(`Animation playback paused`);
  }

  /**
   * Set the maximum number of loops (0 = infinite)
   * @param {number} count - Number of loops to play
   */
  setLoopCount(count) {
    this.totalLoops = Math.max(0, count);
    debugLog(`Loop count set to ${this.totalLoops}`);
  }

  /**
   * Restart the animation from the beginning
   */
  restart() {
    this.frameIndex = 0;
    this.loopCount = 0;
    this.isPlaying = true;
    this.lastFrameTime = Date.now();
    this._updateFrame();
    debugLog(`Animation restarted`);
  }

  /**
   * Update the position of the sprite
   * @param {Object} position - New position {x, y, z}
   */
  setPosition(position) {
    this.position = position;
    if (this.sprite) {
      this.sprite.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Update the scale of the sprite
   * @param {number} scale - New scale
   */
  setScale(scale) {
    this.scale = scale;
    if (this.sprite && this.isLoaded) {
      const aspectRatio = this.canvas.height / this.canvas.width;
      this.sprite.scale.set(scale, scale * aspectRatio, 1);
    } else if (this.sprite) {
      this.sprite.scale.set(scale, scale, 1);
    }
  }

  /**
   * Get current animation stats
   * @returns {Object} Animation statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentFrame: this.frameIndex,
      totalFrames: this.frames.length,
      loops: this.loopCount,
      isPlaying: this.isPlaying,
      isLoaded: this.isLoaded,
      hasError: this.hasError,
      error: this.errorMessage
    };
  }

  /**
   * Reload the GIF
   */
  reload() {
    debugLog(`Reloading GIF from: ${this.url}`);
    this._loadGIF();
  }

  /**
   * Dispose of resources
   */
  dispose() {
    debugLog(`Disposing GIF sprite resources`);
    
    if (this.sprite) {
      this.scene.remove(this.sprite);
      if (this.sprite.material) {
        this.sprite.material.dispose();
      }
    }
    
    if (this.texture) {
      this.texture.dispose();
    }
    
    this.frames.forEach(canvas => {
      // No need to dispose of canvas elements, just clear the array
    });
    
    this.frames = [];
    this.frameDelays = [];
    this.canvas = null;
    this.ctx = null;
    this.isLoaded = false;
    
    debugLog(`GIF sprite disposed`);
  }
}

// Make it globally available for console debugging
window.SimpleGIFAnimator = SimpleGIFAnimator;
