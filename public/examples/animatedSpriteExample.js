/**
 * Animated Sprite Example
 * Shows how to use the AnimatedSprite system in the Beast-Tactics-3D project
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

// Debug settings
const DEBUG = {
    logEvents: true,
    showControls: true
};

/**
 * Main example class
 */
class AnimatedSpriteExample {
    /**
     * Initialize the example
     */
    constructor() {
        console.log('Initializing AnimatedSpriteExample');
        
        // Create container
        this.container = document.createElement('div');
        this.container.style.width = '100vw';
        this.container.style.height = '100vh';
        this.container.style.position = 'relative';
        document.body.appendChild(this.container);
        
        // Initialize demo
        this.demo = new AnimatedSpriteDemo(this.container);
        
        // Add controls if enabled
        if (DEBUG.showControls) {
            this._createControls();
        }
        
        // Load example sprites
        this._loadExampleSprites();
        
        console.log('AnimatedSpriteExample initialized successfully');
    }
    
    /**
     * Create control panel
     * @private
     */
    _createControls() {
        console.log('Creating control panel');
        
        // Create control container
        this.controlPanel = document.createElement('div');
        this.controlPanel.style.position = 'absolute';
        this.controlPanel.style.bottom = '20px';
        this.controlPanel.style.right = '20px';
        this.controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.controlPanel.style.color = 'white';
        this.controlPanel.style.padding = '15px';
        this.controlPanel.style.borderRadius = '5px';
        this.controlPanel.style.fontFamily = 'Arial, sans-serif';
        this.controlPanel.style.zIndex = '1000';
        
        // Add title
        const title = document.createElement('h3');
        title.textContent = 'Animated Sprite Controls';
        title.style.margin = '0 0 10px 0';
        this.controlPanel.appendChild(title);
        
        // Create form for adding new sprites
        const form = document.createElement('div');
        
        // GIF URL input
        const urlLabel = document.createElement('label');
        urlLabel.textContent = 'GIF URL:';
        urlLabel.style.display = 'block';
        urlLabel.style.marginBottom = '5px';
        form.appendChild(urlLabel);
        
        this.urlInput = document.createElement('input');
        this.urlInput.type = 'text';
        this.urlInput.value = 'assets/Beasts/Fire.gif'; // Default example
        this.urlInput.style.width = '100%';
        this.urlInput.style.padding = '5px';
        this.urlInput.style.marginBottom = '10px';
        form.appendChild(this.urlInput);
        
        // Scale input
        const scaleLabel = document.createElement('label');
        scaleLabel.textContent = 'Scale:';
        scaleLabel.style.display = 'block';
        scaleLabel.style.marginBottom = '5px';
        form.appendChild(scaleLabel);
        
        this.scaleInput = document.createElement('input');
        this.scaleInput.type = 'number';
        this.scaleInput.value = '1';
        this.scaleInput.min = '0.1';
        this.scaleInput.step = '0.1';
        this.scaleInput.style.width = '100%';
        this.scaleInput.style.padding = '5px';
        this.scaleInput.style.marginBottom = '10px';
        form.appendChild(this.scaleInput);
        
        // Position inputs
        const posLabel = document.createElement('label');
        posLabel.textContent = 'Position (X, Y):';
        posLabel.style.display = 'block';
        posLabel.style.marginBottom = '5px';
        form.appendChild(posLabel);
        
        const posContainer = document.createElement('div');
        posContainer.style.display = 'flex';
        posContainer.style.gap = '5px';
        posContainer.style.marginBottom = '10px';
        
        this.posXInput = document.createElement('input');
        this.posXInput.type = 'number';
        this.posXInput.value = '0';
        this.posXInput.style.flex = '1';
        this.posXInput.style.padding = '5px';
        posContainer.appendChild(this.posXInput);
        
        this.posYInput = document.createElement('input');
        this.posYInput.type = 'number';
        this.posYInput.value = '0';
        this.posYInput.style.flex = '1';
        this.posYInput.style.padding = '5px';
        posContainer.appendChild(this.posYInput);
        
        form.appendChild(posContainer);
        
        // Loop checkbox
        const loopContainer = document.createElement('div');
        loopContainer.style.marginBottom = '15px';
        
        this.loopCheckbox = document.createElement('input');
        this.loopCheckbox.type = 'checkbox';
        this.loopCheckbox.id = 'loop-checkbox';
        this.loopCheckbox.checked = true;
        loopContainer.appendChild(this.loopCheckbox);
        
        const loopLabel = document.createElement('label');
        loopLabel.textContent = 'Loop animation';
        loopLabel.htmlFor = 'loop-checkbox';
        loopLabel.style.marginLeft = '5px';
        loopContainer.appendChild(loopLabel);
        
        form.appendChild(loopContainer);
        
        // Add sprite button
        const addButton = document.createElement('button');
        addButton.textContent = 'Add Sprite';
        addButton.style.width = '100%';
        addButton.style.padding = '8px';
        addButton.style.backgroundColor = '#4CAF50';
        addButton.style.color = 'white';
        addButton.style.border = 'none';
        addButton.style.borderRadius = '4px';
        addButton.style.cursor = 'pointer';
        addButton.style.marginBottom = '15px';
        
        addButton.addEventListener('click', () => {
            this._addNewSprite();
        });
        
        form.appendChild(addButton);
        
        // Add form to control panel
        this.controlPanel.appendChild(form);
        
        // Add control panel to container
        this.container.appendChild(this.controlPanel);
        
        console.log('Control panel created successfully');
    }
    
    /**
     * Load example sprites
     * @private
     */
    _loadExampleSprites() {
        console.log('Loading example sprites');
        
        // Example GIF URLs - replace with your own
        const exampleGifs = [
            {
                url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
                position: { x: -200, y: 0, z: 0 },
                scale: 1.5,
                loop: true
            }
        ];
        
        // Load each example GIF
        exampleGifs.forEach(gif => {
            this._addSprite(gif.url, gif.position, gif.scale, gif.loop);
        });
    }
    
    /**
     * Add a new sprite from the control panel inputs
     * @private
     */
    _addNewSprite() {
        const url = this.urlInput.value;
        const scale = parseFloat(this.scaleInput.value);
        const position = {
            x: parseFloat(this.posXInput.value),
            y: parseFloat(this.posYInput.value),
            z: 0
        };
        const loop = this.loopCheckbox.checked;
        
        this._addSprite(url, position, scale, loop);
    }
    
    /**
     * Add a sprite to the scene
     * @param {string} url - URL to the GIF file
     * @param {Object} position - Position coordinates
     * @param {number} scale - Scale factor
     * @param {boolean} loop - Whether to loop the animation
     * @private
     */
    _addSprite(url, position, scale, loop) {
        console.log('Adding sprite:', {
            url,
            position,
            scale,
            loop
        });
        
        // Create loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.textContent = 'Loading sprite...';
        loadingEl.style.position = 'absolute';
        loadingEl.style.top = '50%';
        loadingEl.style.left = '50%';
        loadingEl.style.transform = 'translate(-50%, -50%)';
        loadingEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingEl.style.color = 'white';
        loadingEl.style.padding = '10px 20px';
        loadingEl.style.borderRadius = '5px';
        loadingEl.style.zIndex = '2000';
        this.container.appendChild(loadingEl);
        
        // Add the sprite
        this.demo.addAnimatedSprite(url, {
            position,
            scale,
            loop,
            onLoad: (sprite) => {
                console.log('Sprite loaded successfully');
                this.container.removeChild(loadingEl);
                
                if (DEBUG.logEvents) {
                    console.log('Sprite details:', {
                        frameCount: sprite.frameCount,
                        isPlaying: sprite.isPlaying,
                        currentFrame: sprite.currentFrame
                    });
                }
            },
            onComplete: () => {
                if (DEBUG.logEvents) {
                    console.log('Animation completed');
                }
            },
            onError: (error) => {
                console.error('Failed to load sprite:', error);
                loadingEl.textContent = 'Error loading sprite';
                loadingEl.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                
                // Remove error message after 3 seconds
                setTimeout(() => {
                    if (this.container.contains(loadingEl)) {
                        this.container.removeChild(loadingEl);
                    }
                }, 3000);
            }
        }).catch(error => {
            console.error('Error in addAnimatedSprite:', error);
        });
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.log('Disposing AnimatedSpriteExample resources');
        
        // Dispose demo
        if (this.demo) {
            this.demo.dispose();
        }
        
        // Remove control panel
        if (this.controlPanel && this.container.contains(this.controlPanel)) {
            this.container.removeChild(this.controlPanel);
        }
        
        // Remove container
        if (this.container && document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
    }
}

// Initialize the example when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting example');
    window.animatedSpriteExample = new AnimatedSpriteExample();
});

// Expose the example to the global scope for debugging
window.AnimatedSpriteExample = AnimatedSpriteExample;
