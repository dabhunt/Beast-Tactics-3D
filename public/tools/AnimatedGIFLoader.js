/**
 * AnimatedGIFLoader.js - Simplified loader for animated GIFs in THREE.js
 * 
 * A wrapper around SimpleGIFAnimator for loading animated GIFs as textures
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { SimpleGIFAnimator } from './SimpleGIFAnimator.js';

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Enhanced logging function that only logs in debug mode
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
 * GIF loader for handling animated textures in THREE.js
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

/**
 * Helper function for debug logging
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (data) {
    console.log(`[GIF-LOADER] ${message}`, data);
  } else {
    console.log(`[GIF-LOADER] ${message}`);
  }
}

/**
 * Animated GIF loader for THREE.js
 */
class AnimatedGIFLoader {
  constructor() {
    debugLog('Initializing AnimatedGIFLoader');

    // Store references to active animators
    this.animators = new Map();

    // Animation settings
    this.settings = {
      fps: 10, // Default frame rate
      scale: 1,
      loop: 0  // 0 = infinite loop
    };
  }

  /**
   * Set the FPS for animations
   * @param {number} fps - Frames per second
   */
  setFPS(fps) {
    this.settings.fps = Math.max(1, Math.min(60, fps));
    debugLog(`Set animation FPS to ${this.settings.fps}`);
  }

  /**
   * Load a GIF file and return a texture
   * @param {string} url - URL of the GIF file
   * @param {Function} onLoad - Callback when the texture is loaded
   * @param {Function} onError - Callback if there's an error
   * @param {THREE.Scene} scene - Scene to add the sprite to (optional, can be provided in onLoad)
   * @returns {THREE.Texture} Placeholder texture that will be updated
   */
  load(url, onLoad, onError, scene = null) {
    debugLog(`Loading GIF from: ${url}`);

    // Generate a placeholder texture first
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#333';
    ctx.fillText('Loading...', 5, 32);

    // Create placeholder texture
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    // Store loading state on the texture
    texture.isLoading = true;
    texture.isAnimated = true;
    texture.sourceUrl = url;

    // Use SimpleGIFAnimator to create actual GIF sprite
    if (!scene) {
      // We need a scene for SimpleGIFAnimator to work
      debugLog(`No scene provided, returning placeholder texture`);
      return texture;
    }

    // Create animator for this texture
    debugLog(`Creating SimpleGIFAnimator for ${url}`);
    const animator = new SimpleGIFAnimator(
      url,
      scene,
      { x: 0, y: 0, z: 0 }, // Default position
      this.settings.scale,
      // onLoadComplete
      (animator) => {
        debugLog(`GIF loaded successfully: ${url}`);

        // Update the placeholder texture with the actual texture
        texture.image = animator.canvas;
        texture.needsUpdate = true;
        texture.isLoading = false;

        // Store additional animation data on the texture
        texture.frameCount = animator.frames.length;
        texture.setFrame = (frameIndex) => animator.setFrame(frameIndex);
        texture.play = () => animator.play();
        texture.pause = () => animator.pause();

        // Keep reference to the animator
        this.animators.set(texture, animator);

        // Call onLoad callback with the updated texture
        if (onLoad) {
          onLoad(texture);
        }
      },
      // onError
      (error) => {
        debugLog(`Error loading GIF: ${url}`, error);

        // Mark texture as failed
        texture.isLoading = false;
        texture.loadError = error;

        // Display error on texture
        ctx.fillStyle = 'rgba(255, 200, 200, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF0000';
        ctx.fillText('Error loading GIF', 5, 32);
        ctx.fillText(error.message.substring(0, 20), 5, 48);
        texture.needsUpdate = true;

        // Call error callback
        if (onError) {
          onError(error);
        }
      }
    );

    // Store animator reference
    this.animators.set(texture, animator);

    return texture;
  }

  /**
   * Update all animated textures
   * Called in the animation loop
   */
  update() {
    this.animators.forEach((animator) => {
      animator.update();
    });
  }

  /**
   * Dispose of a texture and its resources
   * @param {THREE.Texture} texture - The texture to dispose
   */
  dispose(texture) {
    debugLog(`Disposing texture: ${texture.sourceUrl}`);

    // Get the animator for this texture
    const animator = this.animators.get(texture);
    if (animator) {
      animator.dispose();
      this.animators.delete(texture);
    }

    // Dispose the texture
    texture.dispose();
  }

  /**
   * Dispose all textures and resources
   */
  disposeAll() {
    debugLog(`Disposing all textures`);

    this.animators.forEach((animator) => {
      animator.dispose();
    });

    this.animators.clear();
  }
}

// Create and export the loader
export const gifLoader = new AnimatedGIFLoader();
export default gifLoader;