/**
 * GLTFLoader.handler.js
 * Enhanced handler for GLTFLoader to improve reliability and diagnostics
 * 
 * This handler provides:
 * 1. Consistent access to GLTFLoader regardless of how THREE.js is loaded
 * 2. Detailed error diagnostics and logging
 * 3. Multiple loading strategies for maximum reliability
 */

// Import THREE directly to ensure we have access to its components
// This should be a relative import to wherever three.module.js is located
import * as THREE from '/libs/three/three.module.js';

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Enhanced debug logging with timestamp and context
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = `[GLTF-HANDLER ${timestamp}]`;
    
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Error logger with detailed diagnostic information
 * @param {string} context - Where the error occurred
 * @param {Error} error - Error object 
 */
function logError(context, error) {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[GLTF-HANDLER ${timestamp}] Error in ${context}:`, error);
    
    // Add to global diagnostic history
    window._gltfLoaderErrors = window._gltfLoaderErrors || [];
    window._gltfLoaderErrors.push({
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack
    });
}

/**
 * Check if the GLTFLoader is ready to use
 * @returns {boolean} - True if GLTFLoader is available
 */
export function isGLTFLoaderReady() {
    // Check all possible locations
    const locations = [
        typeof GLTFLoader === 'function',                   // Global variable
        typeof window.GLTFLoader === 'function',            // Window property
        typeof THREE.GLTFLoader === 'function',             // THREE namespace
    ];
    
    // If any location has the loader, it's ready
    return locations.some(location => location === true);
}

/**
 * Get the GLTFLoader constructor
 * Will attempt to load it if not already available
 * 
 * @returns {Promise<Function>} - The GLTFLoader constructor
 */
export async function getGLTFLoader() {
    debugLog('Retrieving GLTFLoader...');
    
    // Check if already available
    if (isGLTFLoaderReady()) {
        debugLog('GLTFLoader already available');
        
        // Return from the first location where it's found
        if (typeof GLTFLoader === 'function') return GLTFLoader;
        if (typeof window.GLTFLoader === 'function') return window.GLTFLoader;
        if (typeof THREE.GLTFLoader === 'function') return THREE.GLTFLoader;
    }
    
    // If not available, load it
    debugLog('GLTFLoader not found, attempting to load...');
    const loaded = await loadGLTFLoader();
    
    if (!loaded) {
        throw new Error('Failed to load GLTFLoader after multiple attempts');
    }
    
    // Now it should be available
    if (typeof window.GLTFLoader === 'function') {
        debugLog('Successfully loaded GLTFLoader, returning constructor');
        return window.GLTFLoader;
    }
    
    throw new Error('GLTFLoader not available after loading attempts');
}

/**
 * Load required dependencies
 * @returns {Promise<boolean>} - True if dependencies loaded successfully
 */
async function loadDependencies() {
    debugLog('Loading GLTFLoader dependencies');
    
    const dependencies = [
        { path: '/libs/three/addons/utils/BufferGeometryUtils.js', name: 'BufferGeometryUtils' }
    ];
    
    const results = await Promise.all(dependencies.map(async dep => {
        try {
            // Try dynamic import for ES modules
            debugLog(`Loading dependency: ${dep.name} from ${dep.path}`);
            
            // Method 1: Try using dynamic import
            try {
                const module = await import(dep.path);
                debugLog(`✅ Successfully loaded ${dep.name} via dynamic import`);
                return { name: dep.name, success: true, method: 'dynamic-import' };
            } catch (importError) {
                debugLog(`Dynamic import failed for ${dep.name}:`, importError);
                
                // Method 2: Try fetch and eval as a fallback
                try {
                    const response = await fetch(dep.path);
                    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                    
                    const code = await response.text();
                    // Execute the code in the global scope
                    const scriptFn = new Function(code);
                    scriptFn();
                    
                    debugLog(`✅ Successfully loaded ${dep.name} via fetch and eval`);
                    return { name: dep.name, success: true, method: 'fetch-eval' };
                } catch (fetchError) {
                    debugLog(`Fetch method failed for ${dep.name}:`, fetchError);
                    
                    // Method 3: Inject script tag as final fallback
                    return new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = dep.path;
                        script.async = true;
                        
                        script.onload = () => {
                            debugLog(`✅ Successfully loaded ${dep.name} via script tag`);
                            resolve({ name: dep.name, success: true, method: 'script-tag' });
                        };
                        
                        script.onerror = (err) => {
                            logError(`Failed to load ${dep.name} via script tag`, err);
                            resolve({ name: dep.name, success: false, method: 'script-tag', error: err });
                        };
                        
                        document.head.appendChild(script);
                    });
                }
            }
        } catch (error) {
            logError(`All methods failed to load dependency: ${dep.name}`, error);
            return { name: dep.name, success: false, error };
        }
    }));
    
    // Check if all dependencies were loaded successfully
    const allSuccess = results.every(r => r.success);
    
    debugLog('Dependency loading complete', { 
        success: allSuccess, 
        results 
    });
    
    return allSuccess;
}

/**
 * Try multiple approaches to load the GLTFLoader
 */
async function loadGLTFLoader() {
    debugLog('Starting enhanced GLTFLoader loading sequence');
    
    // Method tracking
    const methods = [];
    
    // Method 1: Check if it's already available
    if (typeof window.GLTFLoader === 'function') {
        debugLog('GLTFLoader already available on window');
        return true;
    }
    
    // Method 2: Load any dependencies first
    try {
        debugLog('Ensuring dependencies are loaded');
        const depsLoaded = await loadDependencies();
        methods.push({ name: 'load-dependencies', success: depsLoaded });
    } catch (error) {
        logError('load-dependencies', error);
        methods.push({ name: 'load-dependencies', success: false, error: error.message });
    }
    
    // Method 3: Try ES module import
    try {
        debugLog('Attempting to load GLTFLoader as ES module');
        // Try multiple paths for more reliable loading
        const paths = [
            '/libs/three/addons/loaders/GLTFLoader.js',    // Absolute path from server root
            './GLTFLoader.js',                             // Current directory relative path
            '../loaders/GLTFLoader.js',                    // Another relative option
            '/public/libs/three/addons/loaders/GLTFLoader.js' // Alternative with /public prefix
        ];
        
        debugLog('Attempting ES module import with paths:', paths);
        
        // Try each path until one works
        let moduleLoaded = null;
        let lastError = null;
        
        for (const path of paths) {
            try {
                debugLog(`Trying ES module import from: ${path}`);
                const module = await import(path);
                moduleLoaded = module;
                debugLog(`Successfully loaded from ${path}`);
                break;
            } catch (err) {
                debugLog(`Failed to load from ${path}:`, err.message);
                lastError = err;
            }
        }
        
        if (!moduleLoaded) {
            throw lastError || new Error('All ES module import paths failed');
        }
        
        const module = moduleLoaded;
        
        debugLog('GLTFLoader module loaded:', { moduleKeys: Object.keys(module) });
        
        if (module.GLTFLoader) {
            debugLog('Setting window.GLTFLoader from module.GLTFLoader');
            window.GLTFLoader = module.GLTFLoader;
            methods.push({ name: 'es-module', success: true });
            return true;
        } else {
            const error = new Error('Failed to extract GLTFLoader from module');
            logError('module-extraction', error);
            methods.push({ 
                name: 'es-module', 
                success: false, 
                moduleKeys: Object.keys(module),
                error: 'No GLTFLoader property found' 
            });
        }
    } catch (error) {
        logError('es-module-load', error);
        methods.push({ name: 'es-module', success: false, error: error.message });
    }
    
    // Method 4: Try script tag approach
    try {
        debugLog('Attempting script tag approach');
        
        const scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Try multiple paths for script loading to increase success chances
            const paths = [
                '/libs/three/addons/loaders/GLTFLoader.js',     // Absolute path
                '/libs/three/GLTFLoader.js',                    // Alternative location
                './GLTFLoader.js',                              // Relative path
                '/public/libs/three/addons/loaders/GLTFLoader.js', // Alternative with /public prefix
                `${window.location.origin}/libs/three/addons/loaders/GLTFLoader.js` // Full URL with origin
            ];
            
            debugLog('Script tag will try these paths:', paths);
            script.src = paths[0]; // Start with the most reliable path
            
            // Add crossorigin attribute to avoid CORS issues
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                debugLog('Script loaded, checking for GLTFLoader definition');
                
                // Check for GLTFLoader in different possible locations
                if (typeof window.GLTFLoader === 'function') {
                    debugLog('Found GLTFLoader on window global');
                    resolve(true);
                } else if (typeof THREE.GLTFLoader === 'function') {
                    debugLog('Found GLTFLoader on THREE namespace');
                    // Make it globally available as well
                    window.GLTFLoader = THREE.GLTFLoader;
                    resolve(true);
                } else {
                    // Check if the script might have added exports to require or define
                    // (for AMD or CommonJS support)
                    const possibleLocations = [
                        'window.GLTFLoader',
                        'THREE.GLTFLoader', 
                        'window.THREE && window.THREE.GLTFLoader'
                    ];
                    
                    debugLog('GLTFLoader not found in expected locations', {
                        checked: possibleLocations,
                        windowKeys: Object.keys(window).filter(k => k.includes('GLTF') || k.includes('Loader')),
                        threeKeys: typeof THREE === 'object' ? Object.keys(THREE).filter(k => k.includes('GLTF') || k.includes('Loader')) : 'THREE not available'
                    });
                    
                    reject(new Error('Script loaded but GLTFLoader not found in any expected location'));
                }
            };
            script.onerror = () => reject(new Error('Script load error'));
            document.head.appendChild(script);
        });
        
        const scriptResult = await scriptPromise;
        methods.push({ name: 'script-tag', success: true });
        return true;
    } catch (error) {
        logError('script-tag-load', error);
        methods.push({ name: 'script-tag', success: false, error: error.message });
    }
    
    // Method 5: Create stub as last resort
    debugLog('All loading methods failed, creating stub implementation', { methodsAttempted: methods });
    
    // Make sure THREE is defined before creating stub
    const THREE = window.THREE || {};
    
    // Create a warning stub that won't break the application
    const GLTFLoaderStub = class GLTFLoaderStub {
        constructor() {
            console.warn('[GLTF-HANDLER] Using GLTFLoader stub - real loader failed to load');
        }
        
        load(url, onLoad, onProgress, onError) {
            const warning = `GLTFLoader stub: Cannot load ${url} - real loader unavailable`;
            console.warn(warning);
            
            // Create empty group as fallback
            // Use THREE.Group if available, otherwise create a compatible object
            let emptyGroup;
            try {
                if (typeof THREE !== 'undefined' && THREE.Group) {
                    emptyGroup = new THREE.Group();
                    emptyGroup.name = 'GLTFLoader-Stub-Group';
                } else {
                    emptyGroup = { 
                        type: 'Group', 
                        name: 'GLTFLoader-Stub-Group',
                        children: [],
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 }
                    };
                }
            } catch (err) {
                console.error('[GLTF-HANDLER] Error creating fallback group:', err);
                emptyGroup = { type: 'Group', children: [] };
            }
                
            // Call error callback if provided, otherwise call load with empty group
            if (typeof onError === 'function') {
                onError(new Error(warning));
            } else if (typeof onLoad === 'function') {
                debugLog('Calling onLoad with empty group fallback');
                onLoad(emptyGroup);
            }
            
            return emptyGroup;
        }

        parse(data, path, onLoad, onError) {
            const warning = 'GLTFLoader stub: Cannot parse data - real loader unavailable';
            console.warn(warning);

            // Create empty group as fallback
            let emptyGroup;
            try {
                if (typeof THREE !== 'undefined' && THREE.Group) {
                    emptyGroup = new THREE.Group();
                    emptyGroup.name = 'GLTFLoader-Stub-Group';
                } else {
                    emptyGroup = { 
                        type: 'Group', 
                        name: 'GLTFLoader-Stub-Group',
                        children: []
                    };
                }
            } catch (err) {
                console.error('[GLTF-HANDLER] Error creating fallback group:', err);
                emptyGroup = { type: 'Group', children: [] };
            }

            // Call appropriate callback
            if (typeof onError === 'function') {
                onError(new Error(warning));
            } else if (typeof onLoad === 'function') {
                onLoad(emptyGroup);
            }
            
            return emptyGroup;
        }
    };
    
    // Set the stub as the global loader
    window.GLTFLoader = GLTFLoaderStub;
    
    methods.push({ name: 'stub-fallback', success: true });
    return false; // Return false since we're using a stub
}

// Immediately start loading
loadGLTFLoader().then(success => {
    if (success) {
        debugLog('Successfully loaded GLTFLoader');
    } else {
        debugLog('Failed to load real GLTFLoader, using stub');
    }
});

/**
 * Check if GLTFLoader is ready
 * @returns {boolean} - True if GLTFLoader is available
 */
export function checkGLTFLoaderAvailable() {
    if (typeof window.GLTFLoader === 'function') {
        return true;
    }
    
    if (window.THREE && typeof window.THREE.GLTFLoader === 'function') {
        // Copy to window for easier access
        window.GLTFLoader = window.THREE.GLTFLoader;
        return true;
    }
    
    return false;
}

/**
 * Create a new instance of GLTFLoader
 * @returns {Object} - A new GLTFLoader instance
 */
export function createGLTFLoader() {
    debugLog('Creating new GLTFLoader instance');
    
    if (checkGLTFLoaderAvailable()) {
        try {
            const loader = new window.GLTFLoader();
            debugLog('Successfully created GLTFLoader instance');
            return loader;
        } catch (error) {
            logError('create-loader-instance', error);
        }
    }
    
    debugLog('GLTFLoader not available, returning fallback stub');
    // Return a stub that won't break the application
    return {
        load: function(url, onLoad, onProgress, onError) {
            const warning = `GLTFLoader stub: Cannot load ${url} - loader unavailable`;
            console.warn(warning);
            
            if (typeof onError === 'function') {
                onError(new Error(warning));
            }
            
            return { type: 'Group', children: [] };
        }
    };
}

// Export utility functions for external use
export default {
    getGLTFLoader,
    isGLTFLoaderReady,
    createGLTFLoader
};
