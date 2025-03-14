/**
 * AnimatedGIFTexture - A class for handling animated GIF textures in THREE.js
 * 
 * This module loads and animates GIF files as textures for use in THREE.js materials.
 * It handles parsing GIF files, extracting frames, and advancing animation based on frame delays.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { parseGIF, decompressFrames } from './gifuct-loader.js';

// Debug flag
const DEBUG = true;

/**
 * Debug log function for AnimatedGIFTexture
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;

  if (data) {
    console.log(`[ANIM-GIF] ${message}`, data);
  } else {
    console.log(`[ANIM-GIF] ${message}`);
  }
}

/**
 * A class to handle animated GIF textures in THREE.js
 */
export class AnimatedGIFTexture {
  /**
   * Create a new animated GIF texture
   * @param {string} url - URL of the GIF file
   * @param {Function} onLoadCallback - Callback function when texture is ready
   * @param {Function} onErrorCallback - Callback function on error
   */
  constructor(url, onLoadCallback = null, onErrorCallback = null) {
    debugLog(`Creating new AnimatedGIFTexture for: ${url}`);

    // Store parameters
    this.url = url;
    this.onLoadCallback = onLoadCallback;
    this.onErrorCallback = onErrorCallback;

    // Initialize properties
    this.frames = [];
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.isPlaying = false;
    this.isLoaded = false;
    this.loop = true;
    this.playbackSpeed = 1.0;

    // Animation canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Create initial texture
    this.texture = new THREE.Texture(this.canvas);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;

    // Performance tracking
    this.stats = {
      loadStartTime: performance.now(),
      loadTime: 0,
      frameRenderTime: 0,
      lastFrameRenderTime: 0,
      totalFramesRendered: 0
    };

    // Load the GIF immediately
    this._loadGIF();
  }

  /**
   * Load and parse the GIF file
   * @private
   */
  async _loadGIF() {
    debugLog(`Loading GIF from: ${this.url}`);

    try {
      // Fetch the GIF data
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      debugLog(`GIF data fetched, size: ${arrayBuffer.byteLength} bytes`);

      // Parse the GIF using the imported functions
      const gif = await parseGIF(arrayBuffer);

      // Extract frames
      const frames = await decompressFrames(gif, true);

      // Set up canvas with dimensions from first frame
      if (frames.length > 0) {
        this.canvas.width = frames[0].dims.width;
        this.canvas.height = frames[0].dims.height;
        debugLog(`Canvas dimensions set to: ${this.canvas.width}x${this.canvas.height}`);
      }

      // Store frames and mark as loaded
      this.frames = frames;
      this.isLoaded = true;

      // Calculate load time
      this.stats.loadTime = performance.now() - this.stats.loadStartTime;

      debugLog(`GIF loaded successfully: ${frames.length} frames, load time: ${this.stats.loadTime.toFixed(2)}ms`);

      // Draw the first frame
      this._drawFrame(0);

      // Auto-start playback
      this.play();

      // Call the onLoad callback if provided
      if (this.onLoadCallback) {
        this.onLoadCallback(this);
      }

    } catch (error) {
      console.error(`Error loading or parsing GIF: ${error.message}`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  /**
   * Draw a specific frame on the canvas
   * @param {number} frameIndex - Index of the frame to draw
   * @private
   */
  _drawFrame(frameIndex) {
    const renderStart = performance.now();

    if (!this.isLoaded || this.frames.length === 0) {
      return;
    }

    // Get the frame data
    const frame = this.frames[frameIndex];

    if (!frame) {
      console.warn(`Frame index ${frameIndex} out of bounds (max: ${this.frames.length - 1})`);
      return;
    }

    // Clear canvas or prepare it based on frame disposal method
    if (frameIndex === 0 || frame.disposalType === 2) {
      // Clear the canvas for the first frame or if disposal method is "restore to background"
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Create ImageData from the pixel array
    const imageData = this.ctx.createImageData(
      frame.dims.width,
      frame.dims.height
    );

    // Fill the imageData with the frame pixels
    imageData.data.set(frame.patch);

    // Draw the imageData to the canvas at the frame position
    this.ctx.putImageData(
      imageData,
      frame.dims.left,
      frame.dims.top
    );

    // Update the texture
    this.texture.needsUpdate = true;

    // Update stats
    this.stats.lastFrameRenderTime = performance.now() - renderStart;
    this.stats.frameRenderTime += this.stats.lastFrameRenderTime;
    this.stats.totalFramesRendered++;

    // For extremely verbose debug mode
    if (DEBUG && frameIndex % 10 === 0) {
      debugLog(`Drew frame ${frameIndex} in ${this.stats.lastFrameRenderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Update the animation based on elapsed time
   * Should be called in the animation loop
   */
  update() {
    if (!this.isLoaded || !this.isPlaying || this.frames.length === 0) {
      return;
    }

    const now = performance.now();
    const currentFrame = this.frames[this.frameIndex];

    // Get the current frame's delay in ms
    // Default to 100ms if not specified (10 fps)
    const frameDelay = currentFrame.delay || 100;

    // Adjust delay based on playback speed
    const adjustedDelay = frameDelay / this.playbackSpeed;

    // Check if it's time to advance to the next frame
    if (now - this.lastFrameTime > adjustedDelay) {
      // Increment frame index
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;

      // If we've looped and loop is false, stop playback
      if (this.frameIndex === 0 && !this.loop) {
        this.isPlaying = false;
        return;
      }

      // Draw the next frame
      this._drawFrame(this.frameIndex);

      // Update the timestamp
      this.lastFrameTime = now;
    }
  }

  /**
   * Get the THREE.js texture for use in materials
   * @returns {THREE.Texture} The animated texture
   */
  getTexture() {
    return this.texture;
  }

  /**
   * Play the animation
   */
  play() {
    if (!this.isLoaded) {
      console.warn("Cannot play: GIF not yet loaded");
      return;
    }

    debugLog(`Playing animation with ${this.frames.length} frames`);
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
  }

  /**
   * Pause the animation
   */
  pause() {
    debugLog("Pausing animation");
    this.isPlaying = false;
  }

  /**
   * Set the playback speed
   * @param {number} speed - Playback speed multiplier (1.0 = normal speed)
   */
  setSpeed(speed) {
    debugLog(`Setting playback speed to ${speed}`);
    this.playbackSpeed = speed;
  }

  /**
   * Set whether the animation should loop
   * @param {boolean} loop - Whether to loop the animation
   */
  setLoop(loop) {
    debugLog(`Setting loop to ${loop}`);
    this.loop = loop;
  }

  /**
   * Jump to a specific frame
   * @param {number} frameIndex - Index of the frame to jump to
   */
  setFrame(frameIndex) {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      debugLog(`Jumping to frame ${frameIndex}`);
      this.frameIndex = frameIndex;
      this._drawFrame(frameIndex);
    } else {
      console.warn(`Invalid frame index: ${frameIndex}, valid range: 0-${this.frames.length - 1}`);
    }
  }

  /**
   * Get animation metrics and state
   * @returns {Object} Object containing animation metrics
   */
  getMetrics() {
    return {
      frameCount: this.frames.length,
      currentFrame: this.frameIndex,
      isPlaying: this.isPlaying,
      dimensions: {
        width: this.canvas.width,
        height: this.canvas.height
      },
      stats: {
        loadTime: this.stats.loadTime.toFixed(2) + 'ms',
        avgFrameRenderTime: this.stats.totalFramesRendered > 0 
          ? (this.stats.frameRenderTime / this.stats.totalFramesRendered).toFixed(2) + 'ms'
          : 'N/A',
        lastFrameRenderTime: this.stats.lastFrameRenderTime.toFixed(2) + 'ms',
        totalFramesRendered: this.stats.totalFramesRendered
      }
    };
  }

  /**
   * Dispose of resources to prevent memory leaks
   */
  dispose() {
    debugLog("Disposing AnimatedGIFTexture resources");

    // Stop animation
    this.isPlaying = false;

    // Dispose texture
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    // Clean up canvas
    if (this.canvas) {
      this.canvas.width = 1;
      this.canvas.height = 1;
      this.ctx = null;
      this.canvas = null;
    }

    // Clear frames to free memory
    this.frames = [];
    this.isLoaded = false;
  }
}