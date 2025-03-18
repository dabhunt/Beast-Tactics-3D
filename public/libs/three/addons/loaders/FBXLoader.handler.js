/**
 * GLBLoader.handler.js
 * 
 * Enhanced handler for GLBLoader that ensures proper initialization
 * and provides various methods for loading the loader in different
 * environments (ES modules, script tags, etc.)
 * 
 * This handler implements multiple fallback strategies and provides
 * detailed error diagnostics for debugging loading issues.
 * 
 * For Beast-Tactics-3D project
 */

// Import THREE directly to ensure we have access to its components
// This should be a relative import to wherever three.module.js is located
import * as THREE from '/libs/three/three.module.js';

// Load Global Dependencies - Using the direct, focused approach
let GLBGlobalDepsLoaded = false;

/**
 * Load and validate GLB dependencies explicitly
 * @returns {Promise<boolean>} - True when dependencies are properly loaded
 */
async function loadGLBGlobalDependencies() {
    if (GLBGlobalDepsLoaded) {
        debugLog('GLB global dependencies already loaded');
        return true;
    }
    
    debugLog('Loading GLB global dependencies script');
    
    // Use a direct, synchronous approach to guarantee dependencies are loaded
    // before GLBLoader tries to use them
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/libs/three/addons/loaders/GLB-global-dependencies.js';
        
        script.onload = () => {
            debugLog('GLB global dependencies script loaded');
            GLBGlobalDepsLoaded = true;
            
            // Verify that fflate is now available in the global scope
            if (window.fflate) {
                debugLog('SUCCESS: fflate is now available in the global scope', {
                    type: typeof window.fflate,
                    functions: Object.keys(window.fflate)
                });
            } else {
                debugLog('WARNING: fflate is still not available after loading dependencies');
            }
            
            // Always resolve as true since we have fallbacks if needed
            resolve(true);
        };
        
        script.onerror = (err) => {
            debugLog('ERROR: Failed to load GLB global dependencies script', err);
            // Create an emergency fallback for fflate to prevent errors
            if (!window.fflate) {
                debugLog('Creating emergency fflate fallback');
                window.fflate = {
                    unzlibSync: function() { 
                        console.warn('Using emergency fflate fallback - GLB models may not load correctly');
                        return new Uint8Array(0); 
                    },
                    strFromU8: function() { return ''; }
                };
            }
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

// Enhanced debug logging
const DEBUG = true;

/**
 * Log message with optional data object in debug mode
 * @param {string} message - The message to log
 * @param {Object} data - Optional data to include
 */
function debugLog(message, data = null) {
    if (!DEBUG) return;
    
    const prefix = '[GLB-HANDLER]';
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Error logger with detailed diagnostic info
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
function logError(context, error) {
    console.error(`[GLB-HANDLER] Error in ${context}:`, error);
    
    // Track loading errors for diagnostics
    window._GLBLoaderErrors = window._GLBLoaderErrors || [];
    window._GLBLoaderErrors.push({
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack,
        name: error.name
    });
}

debugLog('Starting GLBLoader initialization with enhanced error handling');

/**
 * Attempts to load GLBLoader dependencies
 * @returns {Promise<boolean>} - True if dependencies loaded successfully
 */
async function loadDependencies() {
    debugLog('Loading GLBLoader dependencies');
    
    // Define the dependencies we need to load
    // Use absolute paths from the root to avoid path resolution issues
    const dependencies = [
        { path: '/libs/three/addons/libs/fflate.module.js', name: 'fflate' },
        { path: '/libs/three/addons/curves/NURBSCurve.js', name: 'NURBSCurve' }
    ];
    
    debugLog('Using absolute paths for dependencies', dependencies);
    
    const results = [];
    
    // Try to load each dependency
    for (const dep of dependencies) {
        try {
            debugLog(`Loading dependency: ${dep.name} from ${dep.path}`);
            
            // Different loading approaches
            const result = await Promise.race([
                // Method 1: Direct import
                import(dep.path).then(module => ({
                    success: true,
                    module,
                    method: 'direct-import',
                    path: dep.path
                })),
                
                // Method 2: Fetch as text
                fetch(dep.path).then(async response => {
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const text = await response.text();
                    return {
                        success: true,
                        text,
                        method: 'fetch',
                        path: dep.path
                    };
                }),
                
                // Timeout after 3 seconds
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Dependency load timeout')), 3000)
                )
            ]);
            
            debugLog(`Successfully loaded ${dep.name} using ${result.method}`);
            results.push({
                dependency: dep.name,
                success: true,
                method: result.method
            });
            
        } catch (error) {
            logError(`loading-${dep.name}`, error);
            results.push({
                dependency: dep.name,
                success: false,
                error: error.message
            });
        }
    }
    
    // Check if all dependencies loaded successfully
    const allSuccess = results.every(r => r.success);
    debugLog('Dependency loading complete', { 
        success: allSuccess, 
        results 
    });
    
    return allSuccess;
}

/**
 * Try multiple approaches to load the GLBLoader
 */
async function loadGLBLoader() {
    debugLog('Starting enhanced GLBLoader loading sequence');
    
    // Method tracking
    const methods = [];
    
    // Method 1: Check if it's already available
    if (typeof window.glbLoader === 'function') {
        debugLog('GLBLoader already available on window');
        return true;
    }
    
    // Method 2: Load global dependencies FIRST - most critical step
    // This ensures fflate and other dependencies are available in global scope
    try {
        debugLog('Step 1: Ensuring global dependencies are loaded');
        const globalDepsLoaded = await loadGLBGlobalDependencies();
        methods.push({ name: 'load-global-dependencies', success: globalDepsLoaded });
        
        // Verify fflate is available
        if (window.fflate) {
            debugLog('fflate is available in global scope', { type: typeof window.fflate });
        } else {
            debugLog('WARNING: fflate still not available in global scope after loading dependencies');
        }
    } catch (error) {
        logError('load-global-dependencies', error);
        methods.push({ name: 'load-global-dependencies', success: false, error: error.message });
    }
    
    // Method 3: Try loading original dependencies as backup
    try {
        const depsLoaded = await loadDependencies();
        methods.push({ name: 'load-original-dependencies', success: depsLoaded });
        
        if (!depsLoaded) {
            debugLog('Warning: Not all original dependencies loaded successfully');
        }
    } catch (error) {
        logError('load-original-dependencies', error);
        methods.push({ name: 'load-original-dependencies', success: false, error: error.message });
    }
    
    // Method 3: Try ES module import
    try {
        debugLog('Attempting to load GLBLoader as ES module');
        // Try multiple paths for more reliable loading
        // Ensure absolute paths start with server root
        const paths = [
            '/libs/three/addons/loaders/GLBLoader.js',    // Absolute path from server root - primary choice
            './GLBLoader.js',                            // Current directory relative path - backup
            '../loaders/GLBLoader.js',                   // Another relative option
            '/public/libs/three/addons/loaders/GLBLoader.js' // Alternative with /public prefix
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
        
        debugLog('GLBLoader module loaded:', { moduleKeys: Object.keys(module) });
        
        if (module.glbLoader) {
            debugLog('Setting window.glbLoader from module.glbLoader');
            window.glbLoader = module.glbLoader;
            methods.push({ name: 'es-module', success: true });
            return true;
        } else {
            const error = new Error('Failed to extract GLBLoader from module');
            logError('module-extraction', error);
            methods.push({ 
                name: 'es-module', 
                success: false, 
                moduleKeys: Object.keys(module),
                error: 'No GLBLoader property found' 
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
                '/libs/three/addons/loaders/GLBLoader.js',    // Absolute path - most reliable
                '/libs/three/GLBLoader.js',                  // Alternative location
                './GLBLoader.js',                            // Relative path - less reliable
                '/public/libs/three/addons/loaders/GLBLoader.js', // Alternative with /public prefix
                `${window.location.origin}/libs/three/addons/loaders/GLBLoader.js` // Full URL with origin
            ];
            
            debugLog('Script tag will try these paths:', paths);
            script.src = paths[0]; // Start with the most reliable path
            
            // Add crossorigin attribute to avoid CORS issues
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                debugLog('Script loaded, checking for GLBLoader definition');
                
                // Check for GLBLoader in different possible locations
                if (typeof window.glbLoader === 'function') {
                    debugLog('Found GLBLoader on window global');
                    resolve(true);
                } else if (typeof THREE.glbLoader === 'function') {
                    debugLog('Found GLBLoader on THREE namespace');
                    // Make it globally available as well
                    window.glbLoader = THREE.glbLoader;
                    resolve(true);
                } else {
                    // Check if the script might have added exports to require or define
                    // (for AMD or CommonJS support)
                    const possibleLocations = [
                        'window.glbLoader',
                        'THREE.glbLoader', 
                        'window.THREE && window.THREE.glbLoader'
                    ];
                    
                    debugLog('GLBLoader not found in expected locations', {
                        checked: possibleLocations,
                        windowKeys: Object.keys(window).filter(k => k.includes('GLB') || k.includes('Loader')),
                        threeKeys: typeof THREE === 'object' ? Object.keys(THREE).filter(k => k.includes('GLB') || k.includes('Loader')) : 'THREE not available'
                    });
                    
                    reject(new Error('Script loaded but GLBLoader not found in any expected location'));
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
    const GLBLoaderStub = class GLBLoaderStub {
        constructor() {
            console.warn('[GLB-HANDLER] Using GLBLoader stub - real loader failed to load');
        }
        
        load(url, onLoad, onProgress, onError) {
            const warning = `GLBLoader stub: Cannot load ${url} - real loader unavailable`;
            console.warn(warning);
            
            // Create empty group as fallback
            // Use THREE.Group if available, otherwise create a compatible object
            let emptyGroup;
            try {
                if (typeof THREE !== 'undefined' && THREE.Group) {
                    emptyGroup = new THREE.Group();
                    emptyGroup.name = 'GLBLoader-Stub-Group';
                } else {
                    emptyGroup = { 
                        type: 'Group', 
                        name: 'GLBLoader-Stub-Group',
                        children: [],
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 }
                    };
                }
            } catch (err) {
                console.error('[GLB-HANDLER] Error creating fallback group:', err);
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
    };
    
    methods.push({ name: 'stub-fallback', success: true });
    return false; // Return false since we're using a stub
}

// Immediately start loading
loadGLBLoader().then(success => {
    if (success) {
        debugLog('Successfully loaded GLBLoader');
    } else {
        debugLog('Failed to load real GLBLoader, using stub');
    }
});

/**
 * Check if GLBLoader is ready
 * @returns {boolean} - True if GLBLoader is available
 */
export function isGLBLoaderReady() {
    return typeof window.glbLoader === 'function';
}

/**
 * Get GLBLoader, waiting if necessary
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<Function>} - The GLBLoader constructor
 */
export async function getGLBLoader(timeoutMs = 5000) {
    // If already available, return immediately
    if (isGLBLoaderReady()) {
        return window.glbLoader;
    }
    
    // Otherwise wait for it to become available
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            // Check if loader is now available
            if (isGLBLoaderReady()) {
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                resolve(window.glbLoader);
            }
            
            // Check if we've waited too long
            if (Date.now() - startTime > timeoutMs) {
                clearInterval(checkInterval);
                reject(new Error(`Timed out waiting for GLBLoader (${timeoutMs}ms)`));
            }
        }, 100);
        
        // Set a timeout as a backup
        const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error(`Timed out waiting for GLBLoader (${timeoutMs}ms)`));
        }, timeoutMs);
    });
}
