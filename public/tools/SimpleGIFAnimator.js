
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

/**
 * Debug log function to track GIF loading and animation
 * @param {string} message - Log message 
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[SIMPLE-GIF] ${message}`, data);
  } else {
    console.log(`[SIMPLE-GIF] ${message}`);
  }
}

/**
 * SimpleGIFAnimator - Loads and displays animated GIFs in THREE.js
 */
export class SimpleGIFAnimator {
  /**
   * Create a new GIF animator
   * @param {string} url - URL of the GIF file
   * @param {THREE.Scene} scene - THREE.js scene to add the sprite to
   * @param {Object} position - Position {x,y,z} for the sprite
   * @param {number} scale - Scale factor for the sprite
   * @param {Function} onSuccess - Callback when GIF loads successfully
   * @param {Function} onError - Callback when GIF fails to load
   */
  constructor(url, scene, position, scale = 1, onSuccess = null, onError = null) {
    debugLog(`Creating GIF animator for ${url}`, { position, scale });
    
    // Store parameters
    this.url = url;
    this.scene = scene;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.scale = scale;
    this.onSuccess = onSuccess;
    this.onError = onError;
    
    // Animation state
    this.frames = [];
    this.frameCount = 0;
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.frameDelay = 100; // Default 10 FPS
    this.isPlaying = true;
    this.isLoaded = false;
    
    // Create canvas for drawing GIF frames
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Default size - will be updated when GIF loads
    this.canvas.width = 64;
    this.canvas.height = 64;
    
    // Create texture from canvas
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    
    // Create sprite material
    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.1
    });
    
    // Create sprite
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.set(this.position.x, this.position.y, this.position.z);
    
    // Add sprite to scene
    debugLog('Creating default sprite');
    this.scene.add(this.sprite);
    debugLog('Default sprite created and added to scene');
    
    // Load the GIF
    this.loadGIF();
  }
  
  /**
   * Load and parse the GIF file
   */
  loadGIF() {
    debugLog(`Loading GIF from: ${this.url}`);
    
    // Try to dynamically import gifuct-js
    debugLog('Importing gifuct-js from CDN');
    
    // First, try to fetch the GIF file
    fetch(this.url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        debugLog('GIF file fetched successfully, parsing response');
        return response.arrayBuffer();
      })
      .then(buffer => {
        debugLog('GIF buffer loaded, size: ' + buffer.byteLength + ' bytes');
        
        // Dynamically import the gifuct-js library
        import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.js')
          .then(module => {
            try {
              const gifuct = module.default || module;
              debugLog('gifuct-js imported successfully', { library: !!gifuct });
              
              // Parse GIF data
              const gif = gifuct.parseGIF(new Uint8Array(buffer));
              debugLog('GIF parsed', { 
                dimensions: `${gif.lsd.width}x${gif.lsd.height}`,
                frames: gif.frames.length
              });
              
              // Decode frames
              this.frames = gifuct.decompressFrames(gif, true);
              debugLog('Frames decompressed', { count: this.frames.length });
              
              if (this.frames.length === 0) {
                throw new Error('No frames found in GIF');
              }
              
              // Set canvas size to match GIF
              const firstFrame = this.frames[0];
              this.canvas.width = firstFrame.dims.width;
              this.canvas.height = firstFrame.dims.height;
              debugLog('Canvas resized', { 
                width: this.canvas.width, 
                height: this.canvas.height 
              });
              
              // Update frame count and delay
              this.frameCount = this.frames.length;
              this.frameDelay = firstFrame.delay || 100;
              
              // Draw first frame
              this.drawFrame(0);
              
              // Mark as loaded
              this.isLoaded = true;
              
              // Call success callback if provided
              if (this.onSuccess) {
                this.onSuccess(this);
              }
              
              debugLog('GIF loaded successfully', { 
                frames: this.frameCount,
                size: `${this.canvas.width}x${this.canvas.height}`,
                delay: this.frameDelay
              });
            } catch (err) {
              console.error('Error parsing GIF:', err);
              this.handleError(err);
            }
          })
          .catch(err => {
            console.error('Failed to import gifuct-js:', err);
            this.handleError(new Error('Failed to load GIF parser: ' + err.message));
          });
      })
      .catch(err => {
        console.error('Failed to fetch GIF:', err);
        this.handleError(err);
      });
  }
  
  /**
   * Handle GIF loading errors
   * @param {Error} error - The error that occurred
   */
  handleError(error) {
    debugLog(`Error loading GIF: ${error.message}`);
    
    // Create a colored fallback
    this.drawFallbackImage();
    
    // Call error callback if provided
    if (this.onError) {
      this.onError(error);
    }
  }
  
  /**
   * Draw a fallback colored image when GIF loading fails
   */
  drawFallbackImage() {
    debugLog('Drawing fallback image');
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw a colored square with an X
    this.ctx.fillStyle = '#FF4500';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.moveTo(this.canvas.width, 0);
    this.ctx.lineTo(0, this.canvas.height);
    this.ctx.stroke();
    
    // Update texture
    this.texture.needsUpdate = true;
  }
  
  /**
   * Draw a specific frame from the GIF
   * @param {number} frameIndex - Index of the frame to draw
   */
  drawFrame(frameIndex) {
    if (!this.frames || !this.frames[frameIndex]) return;
    
    const frame = this.frames[frameIndex];
    
    // Create ImageData from patch
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height
    );
    
    // Clear canvas (optional depending on disposal method)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw imageData to canvas
    this.ctx.putImageData(
      imageData,
      frame.dims.left,
      frame.dims.top
    );
    
    // Update texture
    this.texture.needsUpdate = true;
  }
  
  /**
   * Update animation - should be called in render loop
   */
  update() {
    if (!this.isLoaded || !this.isPlaying || this.frameCount <= 1) return;
    
    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    
    // Check if it's time for next frame
    if (elapsed > this.frameDelay) {
      // Advance to next frame
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      
      // Draw the frame
      this.drawFrame(this.currentFrame);
      
      // Update last frame time
      this.lastFrameTime = now;
    }
  }
  
  /**
   * Set animation speed in FPS
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    this.frameDelay = 1000 / fps;
    debugLog(`Setting animation speed: ${fps} FPS (${this.frameDelay}ms delay)`);
  }
  
  /**
   * Play the animation
   */
  play() {
    this.isPlaying = true;
    this.lastFrameTime = Date.now();
    debugLog('Animation resumed');
  }
  
  /**
   * Pause the animation
   */
  pause() {
    this.isPlaying = false;
    debugLog('Animation paused');
  }
  
  /**
   * Update position of the sprite
   * @param {Object} position - New position {x,y,z}
   */
  setPosition(position) {
    this.position = position;
    this.sprite.position.set(position.x, position.y, position.z);
  }
  
  /**
   * Update scale of the sprite
   * @param {number} scale - New scale value
   */
  setScale(scale) {
    this.scale = scale;
    this.sprite.scale.set(scale, scale, 1);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    debugLog('Disposing GIF animator');
    
    // Remove sprite from scene
    if (this.sprite && this.scene) {
      this.scene.remove(this.sprite);
    }
    
    // Dispose material and texture
    if (this.material) {
      this.material.dispose();
    }
    
    if (this.texture) {
      this.texture.dispose();
    }
    
    // Clear references
    this.frames = null;
    this.canvas = null;
    this.ctx = null;
  }
}
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
