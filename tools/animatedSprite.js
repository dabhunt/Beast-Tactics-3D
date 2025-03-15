/**
 * Animated Sprite for Three.js
 * Creates a sprite that animates by swapping textures from a GIF
 */

import * as THREE from 'three';
import { extractFramesFromGif } from './gifToFrames.js';

/**
 * Class that handles animated sprites by swapping textures
 */
export class AnimatedSprite {
    /**
     * Create an animated sprite
     * @param {Object} options - Configuration options
     * @param {string} options.gifUrl - URL to the GIF file
     * @param {number} options.scale - Scale of the sprite (default: 1)
     * @param {boolean} options.autoPlay - Whether to start playing immediately (default: true)
     * @param {boolean} options.loop - Whether to loop the animation (default: true)
     * @param {Function} options.onLoad - Callback when sprite is loaded
     * @param {Function} options.onComplete - Callback when animation completes (non-looping)
     * @param {Function} options.onError - Callback for error handling
     */
    constructor(options) {
        console.log('Initializing AnimatedSprite with options:', options);
        
        // Default options
        this.options = Object.assign({
            scale: 1,
            autoPlay: true,
            loop: true,
            onLoad: null,
            onComplete: null,
            onError: null
        }, options);
        
        if (!this.options.gifUrl) {
            const error = new Error('GIF URL is required');
            console.error(error);
            if (this.options.onError) this.options.onError(error);
            return;
        }
        
        // Initialize properties
        this.isLoaded = false;
        this.isPlaying = false;
        this.currentFrame = 0;
        this.elapsedTime = 0;
        this.textures = [];
        this.frameDelays = [];
        this.sprite = null;
        this.material = null;
        
        // Load the GIF and extract frames
        this._loadGif();
    }
    
    /**
     * Load the GIF and extract frames
     * @private
     */
    _loadGif() {
        console.log('Loading GIF:', this.options.gifUrl);
        
        extractFramesFromGif(
            this.options.gifUrl,
            (result) => {
                console.log('GIF frames extracted successfully:', {
                    frameCount: result.frameCount,
                    dimensions: `${result.width}x${result.height}`
                });
                
                this.textures = result.textures;
                this.frameDelays = result.frameDelays;
                this.frameCount = result.frameCount;
                
                // Create sprite material with the first frame
                this.material = new THREE.SpriteMaterial({
                    map: this.textures[0],
                    transparent: true
                });
                
                // Create the sprite
                this.sprite = new THREE.Sprite(this.material);
                this.sprite.scale.set(
                    result.width * this.options.scale / 100,
                    result.height * this.options.scale / 100,
                    1
                );
                
                this.isLoaded = true;
                
                // Start playing if autoPlay is enabled
                if (this.options.autoPlay) {
                    this.play();
                }
                
                // Call onLoad callback if provided
                if (this.options.onLoad) {
                    this.options.onLoad(this);
                }
                
            },
            (progress) => {
                console.log('Loading progress:', progress);
            },
            (error) => {
                console.error('Error loading GIF:', error);
                if (this.options.onError) this.options.onError(error);
            }
        );
    }
    
    /**
     * Update the animation
     * @param {number} delta - Time delta in seconds
     */
    update(delta) {
        if (!this.isLoaded || !this.isPlaying) return;
        
        // Accumulate elapsed time
        this.elapsedTime += delta * 1000; // Convert to milliseconds
        
        // Get current frame delay (in milliseconds)
        const frameDelay = this.frameDelays[this.currentFrame] * 10; // Convert from 1/100th sec to ms
        
        // Check if it's time to advance to the next frame
        if (this.elapsedTime >= frameDelay) {
            // Reset elapsed time, but keep remainder for smoother animation
            this.elapsedTime -= frameDelay;
            
            // Move to next frame
            this.currentFrame++;
            
            // Handle loop or completion
            if (this.currentFrame >= this.frameCount) {
                if (this.options.loop) {
                    // Loop back to the beginning
                    this.currentFrame = 0;
                    console.log('Animation loop completed, restarting');
                } else {
                    // Stop at the last frame
                    this.currentFrame = this.frameCount - 1;
                    this.isPlaying = false;
                    console.log('Animation completed');
                    
                    // Call onComplete callback if provided
                    if (this.options.onComplete) {
                        this.options.onComplete(this);
                    }
                }
            }
            
            // Update the texture
            this._updateTexture();
        }
    }
    
    /**
     * Update the sprite's texture to the current frame
     * @private
     */
    _updateTexture() {
        if (!this.isLoaded) return;
        
        try {
            // Update the material's map to the current frame's texture
            this.material.map = this.textures[this.currentFrame];
            this.material.needsUpdate = true;
            
            console.debug('Updated to frame:', {
                frame: this.currentFrame + 1,
                total: this.frameCount,
                delay: this.frameDelays[this.currentFrame] * 10 + 'ms'
            });
        } catch (err) {
            console.error('Error updating texture:', err, {
                currentFrame: this.currentFrame,
                texturesLength: this.textures.length
            });
        }
    }
    
    /**
     * Start playing the animation
     */
    play() {
        if (!this.isLoaded) {
            console.warn('Cannot play: Sprite not loaded yet');
            return;
        }
        
        console.log('Playing animation');
        this.isPlaying = true;
    }
    
    /**
     * Pause the animation
     */
    pause() {
        if (!this.isLoaded) return;
        
        console.log('Pausing animation at frame:', this.currentFrame + 1);
        this.isPlaying = false;
    }
    
    /**
     * Stop the animation and reset to the first frame
     */
    stop() {
        if (!this.isLoaded) return;
        
        console.log('Stopping animation');
        this.isPlaying = false;
        this.currentFrame = 0;
        this.elapsedTime = 0;
        this._updateTexture();
    }
    
    /**
     * Set a specific frame
     * @param {number} frameIndex - Index of the frame to display (0-based)
     */
    setFrame(frameIndex) {
        if (!this.isLoaded) {
            console.warn('Cannot set frame: Sprite not loaded yet');
            return;
        }
        
        if (frameIndex < 0 || frameIndex >= this.frameCount) {
            console.error('Invalid frame index:', frameIndex, 'Valid range: 0-' + (this.frameCount - 1));
            return;
        }
        
        console.log('Setting to frame:', frameIndex + 1);
        this.currentFrame = frameIndex;
        this._updateTexture();
    }
    
    /**
     * Get the Three.js sprite object
     * @returns {THREE.Sprite|null} The sprite object or null if not loaded
     */
    getSprite() {
        return this.sprite;
    }
    
    /**
     * Set the sprite's position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     */
    setPosition(x, y, z) {
        if (!this.sprite) {
            console.warn('Cannot set position: Sprite not loaded yet');
            return;
        }
        
        this.sprite.position.set(x, y, z);
    }
    
    /**
     * Set the sprite's scale
     * @param {number} scale - Uniform scale factor
     */
    setScale(scale) {
        if (!this.sprite || !this.isLoaded) {
            console.warn('Cannot set scale: Sprite not loaded yet');
            return;
        }
        
        const width = this.textures[0].image.width * scale / 100;
        const height = this.textures[0].image.height * scale / 100;
        
        this.sprite.scale.set(width, height, 1);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.log('Disposing AnimatedSprite resources');
        
        // Dispose textures
        this.textures.forEach(texture => {
            texture.dispose();
        });
        
        // Dispose material
        if (this.material) {
            this.material.dispose();
        }
        
        // Clear references
        this.textures = [];
        this.frameDelays = [];
        this.sprite = null;
        this.material = null;
        this.isLoaded = false;
        this.isPlaying = false;
    }
}
