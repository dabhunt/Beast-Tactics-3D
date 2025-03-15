/**
 * Animated Sprite Demo
 * Demonstrates how to use the AnimatedSprite class with a GIF in Three.js
 */

import * as THREE from 'three';
import { AnimatedSprite } from './animatedSprite.js';

// Debug configuration
const DEBUG = {
    showFPS: true,
    showFrameInfo: true,
    logLevel: 'debug' // 'debug', 'info', 'warn', 'error'
};

/**
 * Main demo class for animated sprites
 */
export class AnimatedSpriteDemo {
    /**
     * Initialize the demo
     * @param {HTMLElement} container - DOM element to render into
     */
    constructor(container) {
        console.log('Initializing AnimatedSpriteDemo');
        
        this.container = container || document.body;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.animatedSprites = [];
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        // Initialize debug UI
        this._initDebugUI();
        
        // Initialize Three.js scene
        this._initScene();
        
        // Start animation loop
        this._animate();
        
        // Handle window resize
        window.addEventListener('resize', this._onWindowResize.bind(this));
        
        console.log('AnimatedSpriteDemo initialized successfully', {
            containerSize: `${this.width}x${this.height}`,
            debug: DEBUG
        });
    }
    
    /**
     * Initialize the Three.js scene
     * @private
     */
    _initScene() {
        console.log('Initializing Three.js scene');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        // Create camera
        this.camera = new THREE.OrthographicCamera(
            this.width / -2, this.width / 2,
            this.height / 2, this.height / -2,
            0.1, 1000
        );
        this.camera.position.z = 10;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        console.log('Scene initialized with camera and renderer');
    }
    
    /**
     * Initialize debug UI elements
     * @private
     */
    _initDebugUI() {
        if (!DEBUG.showFPS && !DEBUG.showFrameInfo) return;
        
        console.log('Initializing debug UI');
        
        // Create debug container
        this.debugContainer = document.createElement('div');
        this.debugContainer.style.position = 'absolute';
        this.debugContainer.style.top = '10px';
        this.debugContainer.style.left = '10px';
        this.debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugContainer.style.color = 'white';
        this.debugContainer.style.padding = '10px';
        this.debugContainer.style.fontFamily = 'monospace';
        this.debugContainer.style.fontSize = '12px';
        this.debugContainer.style.borderRadius = '5px';
        this.debugContainer.style.zIndex = '1000';
        
        // Create FPS counter
        if (DEBUG.showFPS) {
            this.fpsCounter = document.createElement('div');
            this.fpsCounter.textContent = 'FPS: 0';
            this.debugContainer.appendChild(this.fpsCounter);
        }
        
        // Create frame info display
        if (DEBUG.showFrameInfo) {
            this.frameInfo = document.createElement('div');
            this.frameInfo.textContent = 'Frame: 0/0';
            this.debugContainer.appendChild(this.frameInfo);
        }
        
        // Create control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '10px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        
        const playButton = this._createButton('Play', () => {
            this.animatedSprites.forEach(sprite => sprite.play());
        });
        
        const pauseButton = this._createButton('Pause', () => {
            this.animatedSprites.forEach(sprite => sprite.pause());
        });
        
        const stopButton = this._createButton('Stop', () => {
            this.animatedSprites.forEach(sprite => sprite.stop());
        });
        
        buttonContainer.appendChild(playButton);
        buttonContainer.appendChild(pauseButton);
        buttonContainer.appendChild(stopButton);
        this.debugContainer.appendChild(buttonContainer);
        
        // Add debug container to the document
        this.container.appendChild(this.debugContainer);
    }
    
    /**
     * Helper to create a button element
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     * @returns {HTMLButtonElement} The created button
     * @private
     */
    _createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '5px 10px';
        button.style.backgroundColor = '#555';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClick);
        return button;
    }
    
    /**
     * Add an animated sprite from a GIF URL
     * @param {string} gifUrl - URL to the GIF file
     * @param {Object} options - Additional options for the sprite
     * @returns {Promise<AnimatedSprite>} Promise resolving to the created sprite
     */
    addAnimatedSprite(gifUrl, options = {}) {
        console.log('Adding animated sprite:', gifUrl);
        
        return new Promise((resolve, reject) => {
            try {
                // Create animated sprite
                const sprite = new AnimatedSprite({
                    gifUrl: gifUrl,
                    scale: options.scale || 1,
                    autoPlay: options.autoPlay !== undefined ? options.autoPlay : true,
                    loop: options.loop !== undefined ? options.loop : true,
                    onLoad: (animatedSprite) => {
                        console.log('Animated sprite loaded successfully');
                        
                        // Set position if provided
                        if (options.position) {
                            animatedSprite.setPosition(
                                options.position.x || 0,
                                options.position.y || 0,
                                options.position.z || 0
                            );
                        }
                        
                        // Add to scene
                        this.scene.add(animatedSprite.getSprite());
                        
                        // Add to sprites array
                        this.animatedSprites.push(animatedSprite);
                        
                        // Resolve promise
                        resolve(animatedSprite);
                        
                        if (options.onLoad) {
                            options.onLoad(animatedSprite);
                        }
                    },
                    onComplete: options.onComplete,
                    onError: (error) => {
                        console.error('Failed to load animated sprite:', error);
                        reject(error);
                        
                        if (options.onError) {
                            options.onError(error);
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating animated sprite:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Animation loop
     * @private
     */
    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        
        const delta = this.clock.getDelta();
        this.frameCount++;
        
        // Update FPS counter every second
        if (DEBUG.showFPS) {
            const elapsed = this.clock.elapsedTime;
            if (elapsed - this.lastFpsUpdate >= 1) {
                this.fps = Math.round(this.frameCount / (elapsed - this.lastFpsUpdate));
                this.fpsCounter.textContent = `FPS: ${this.fps}`;
                this.lastFpsUpdate = elapsed;
                this.frameCount = 0;
            }
        }
        
        // Update all animated sprites
        this.animatedSprites.forEach(sprite => {
            sprite.update(delta);
            
            // Update frame info for the first sprite
            if (DEBUG.showFrameInfo && this.animatedSprites.length > 0) {
                const firstSprite = this.animatedSprites[0];
                this.frameInfo.textContent = `Frame: ${firstSprite.currentFrame + 1}/${firstSprite.frameCount}`;
            }
        });
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     * @private
     */
    _onWindowResize() {
        console.log('Window resized');
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // Update camera
        this.camera.left = this.width / -2;
        this.camera.right = this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = this.height / -2;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(this.width, this.height);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.log('Disposing AnimatedSpriteDemo resources');
        
        // Dispose animated sprites
        this.animatedSprites.forEach(sprite => {
            sprite.dispose();
        });
        
        // Remove event listeners
        window.removeEventListener('resize', this._onWindowResize.bind(this));
        
        // Remove renderer from DOM
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Remove debug UI
        if (this.debugContainer) {
            this.container.removeChild(this.debugContainer);
        }
        
        // Dispose Three.js resources
        this.renderer.dispose();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}
