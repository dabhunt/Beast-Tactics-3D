
/**
 * AnimatedGIFLoader.js - Enhanced GIF loader for THREE.js
 * 
 * A utility for loading animated GIFs as textures in THREE.js
 * using gifuct-js for GIF parsing.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

/**
 * Debug log function to track GIF loading and animation
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

// Store animations references to prevent garbage collection
const animationStore = {
  textures: [],
  canvases: [],
  callbacks: {},
  fps: 10, // Default FPS
  
  // Register a new animation
  register(texture, canvas, callback) {
    const id = this.textures.length;
    this.textures.push(texture);
    this.canvases.push(canvas);
    if (callback) {
      this.callbacks[id] = callback;
    }
    return id;
  },
  
  // Remove an animation
  remove(id) {
    if (id >= 0 && id < this.textures.length) {
      this.textures[id] = null;
      this.canvases[id] = null;
      delete this.callbacks[id];
    }
  },
  
  // Set global FPS
  setFPS(fps) {
    this.fps = fps;
    debugLog(`Animation FPS set to ${fps}`);
  }
};

/**
 * Load and parse a GIF, returning an animated texture
 * @param {string} url - URL of the GIF file
 * @param {function} onLoad - Callback when loaded successfully
 * @param {function} onError - Callback when error occurs
 */
const loadGIF = function(url, onLoad, onError) {
  debugLog(`Loading GIF from: ${url}`);
  
  // Load the GIF file
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(buffer => {
      // Import gifuct-js dynamically
      import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.js')
        .then(module => {
          try {
            const gifuct = module.default || module;
            
            // Parse the GIF
            const gif = gifuct.parseGIF(new Uint8Array(buffer));
            debugLog(`GIF parsed, frames: ${gif.frames.length}`);
            
            // Decompress frames
            const frames = gifuct.decompressFrames(gif, true);
            
            if (frames.length === 0) {
              throw new Error('No frames found in GIF');
            }
            
            // Create canvas for drawing frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to GIF dimensions
            canvas.width = gif.lsd.width;
            canvas.height = gif.lsd.height;
            
            debugLog(`Canvas created: ${canvas.width}x${canvas.height}`);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            // Animation state
            let frameIndex = 0;
            let lastFrameTime = Date.now();
            
            // Store animation data
            texture.animationData = {
              frames: frames,
              frameIndex: 0,
              lastFrameTime: Date.now(),
              isPlaying: true,
              canvas: canvas,
              ctx: ctx
            };
            
            // Function to update canvas with current frame
            const updateFrame = () => {
              if (!texture.animationData.isPlaying) return;
              
              const frame = frames[texture.animationData.frameIndex];
              
              // Create ImageData from patch
              const imageData = new ImageData(
                new Uint8ClampedArray(frame.patch),
                frame.dims.width,
                frame.dims.height
              );
              
              // Clear canvas (optional depending on disposal method)
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw patch to canvas
              ctx.putImageData(
                imageData,
                frame.dims.left,
                frame.dims.top
              );
              
              // Mark texture for update
              texture.needsUpdate = true;
            };
            
            // Initial frame draw
            updateFrame();
            
            // Register animation update function
            const animationId = animationStore.register(texture, canvas, updateFrame);
            texture.animationId = animationId;
            
            // Animation control functions
            texture.play = function() {
              this.animationData.isPlaying = true;
              debugLog(`Playing animation ${animationId}`);
            };
            
            texture.pause = function() {
              this.animationData.isPlaying = false;
              debugLog(`Paused animation ${animationId}`);
            };
            
            texture.dispose = function() {
              animationStore.remove(this.animationId);
              THREE.Texture.prototype.dispose.call(this);
              debugLog(`Disposed animation ${animationId}`);
            };
            
            // Call success callback
            if (onLoad) {
              onLoad(texture);
            }
            
            debugLog(`GIF loaded successfully: ${frames.length} frames`);
          } catch (error) {
            console.error(`Error parsing GIF:`, error);
            if (onError) {
              onError(error);
            }
          }
        })
        .catch(error => {
          console.error(`Failed to load gifuct-js:`, error);
          if (onError) {
            onError(error);
          }
        });
    })
    .catch(error => {
      console.error(`Failed to fetch GIF:`, error);
      if (onError) {
        onError(error);
      }
    });
};

// Animation loop function
const animate = () => {
  requestAnimationFrame(animate);
  
  const now = Date.now();
  const frameTime = 1000 / animationStore.fps;
  
  // Update all registered animations
  animationStore.textures.forEach((texture, id) => {
    if (!texture || !texture.animationData || !texture.animationData.isPlaying) return;
    
    const elapsed = now - texture.animationData.lastFrameTime;
    
    if (elapsed > frameTime) {
      // Get current frame
      const frames = texture.animationData.frames;
      
      // Advance to next frame
      texture.animationData.frameIndex = 
        (texture.animationData.frameIndex + 1) % frames.length;
      
      // Update frame
      if (animationStore.callbacks[id]) {
        animationStore.callbacks[id]();
      }
      
      // Update last frame time
      texture.animationData.lastFrameTime = now;
    }
  });
  
  // Report animation status for debugging
  if (Math.random() < 0.01) { // Only log occasionally to avoid spam
    const activeCount = animationStore.textures.filter(t => t && t.animationData && t.animationData.isPlaying).length;
    console.log(`[ANIM-DEBUG] Animation cycle check - active: ${activeCount > 0}, textures: ${activeCount}`);
  }
};

// Start animation loop
animate();

// Export the GIF loader
export const gifLoader = {
  load: loadGIF,
  setFPS: (fps) => animationStore.setFPS(fps),
  dispose: (texture) => {
    if (texture && texture.dispose) {
      texture.dispose();
    }
  }
};
