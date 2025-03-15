/**
 * GIF to Frames Utility
 * Extracts frames from a GIF file and prepares them for animation in Three.js
 */

import * as THREE from 'three';

/**
 * Extracts frames from a GIF and creates textures for animation
 * @param {string} gifUrl - URL to the GIF file
 * @param {Function} onComplete - Callback function that receives the array of textures and metadata
 * @param {Function} onProgress - Optional callback for loading progress
 * @param {Function} onError - Optional callback for error handling
 */
export function extractFramesFromGif(gifUrl, onComplete, onProgress = null, onError = null) {
    console.log('Starting GIF extraction process:', { gifUrl });
    
    // Create a hidden image element to load the GIF
    const img = document.createElement('img');
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.style.top = '-9999px';
    document.body.appendChild(img);
    
    // Create a hidden canvas to extract frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Array to store extracted textures
    const textures = [];
    let frameCount = 0;
    let frameDelays = [];
    let isLoading = true;
    let loadError = null;
    
    // Load the GIF using a GIF parsing library
    // Note: We'll use SuperGif library for this purpose
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/libgif/0.3.0/libgif.js', () => {
        console.log('GIF library loaded successfully');
        
        try {
            // Create a SuperGif instance
            const gifInstance = new SuperGif({ 
                gif: img,
                auto_play: false 
            });
            
            // Handle loading
            gifInstance.load(() => {
                console.log('GIF loaded successfully, extracting frames...');
                
                try {
                    // Get the total number of frames
                    frameCount = gifInstance.get_length();
                    console.log('Total frames detected:', frameCount);
                    
                    // Set canvas dimensions based on GIF
                    canvas.width = gifInstance.get_canvas().width;
                    canvas.height = gifInstance.get_canvas().height;
                    
                    // Extract each frame
                    for (let i = 0; i < frameCount; i++) {
                        // Move to specific frame
                        gifInstance.move_to(i);
                        
                        // Get frame delay (in 1/100th of a second)
                        frameDelays.push(gifInstance.get_delay_for_frame(i));
                        
                        // Draw the current frame to our canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(gifInstance.get_canvas(), 0, 0);
                        
                        // Create a texture from the canvas
                        const frameTexture = new THREE.Texture(canvas);
                        frameTexture.needsUpdate = true;
                        textures.push(frameTexture);
                        
                        if (onProgress) {
                            onProgress({
                                frame: i + 1,
                                total: frameCount,
                                percentage: Math.round(((i + 1) / frameCount) * 100)
                            });
                        }
                    }
                    
                    console.log('Frame extraction complete:', {
                        extractedFrames: textures.length,
                        dimensions: `${canvas.width}x${canvas.height}`
                    });
                    
                    // Cleanup
                    document.body.removeChild(img);
                    
                    // Return the extracted textures and metadata
                    onComplete({
                        textures: textures,
                        frameCount: frameCount,
                        frameDelays: frameDelays,
                        width: canvas.width,
                        height: canvas.height
                    });
                    
                } catch (err) {
                    console.error('Error during frame extraction:', err);
                    loadError = err;
                    if (onError) onError(err);
                }
            }, (e) => {
                console.error('Error loading GIF:', e);
                loadError = e;
                if (onError) onError(e);
            });
            
        } catch (err) {
            console.error('Failed to initialize GIF parser:', err);
            loadError = err;
            if (onError) onError(err);
        }
    }, (err) => {
        console.error('Failed to load GIF library:', err);
        loadError = err;
        if (onError) onError(err);
    });
    
    /**
     * Helper function to dynamically load external scripts
     * @param {string} url - URL of the script to load
     * @param {Function} onLoad - Callback when script loads successfully
     * @param {Function} onError - Callback when script fails to load
     */
    function loadScript(url, onLoad, onError) {
        console.log('Loading external script:', url);
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
            console.log('Script loaded successfully:', url);
            onLoad();
        };
        
        script.onerror = (e) => {
            console.error('Script loading failed:', url, e);
            onError(e);
        };
        
        document.head.appendChild(script);
    }
}
