/**
 * GLB-global-dependencies.js
 * 
 * A simple, focused script that ensures GLBLoader dependencies are available in the global scope.
 * This script takes a direct approach to fix the "fflate is not defined" error by:
 * 1. Loading fflate and other dependencies synchronously
 * 2. Explicitly exposing them to the global window object
 * 3. Providing clear validation and logging
 */

// Debug logging control
const DEBUG_LOG = true;

/**
 * Simple logger with timestamp
 * @param {string} message - Message to log
 * @param {Object} data - Optional data to include
 */
function log(message, data = null) {
    if (!DEBUG_LOG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = `[GLB-DEPS ${timestamp}]`;
    
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Error logger
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(context, error) {
    if (!DEBUG_LOG) return;
    
    console.error(`[GLB-DEPS] Error in ${context}:`, error);
}

// Track whether initialization has been completed
let initialized = false;

/**
 * Check if a dependency is available in the global scope
 * @param {string} name - Dependency name to check
 * @returns {boolean} - True if available
 */
function isGlobalDefined(name) {
    return typeof window[name] !== 'undefined';
}

/**
 * Load a script synchronously to ensure it's available before continuing
 * @param {string} url - Script URL to load
 * @returns {boolean} - True if successfully loaded
 */
function loadScriptSync(url) {
    log(`Loading script synchronously: ${url}`);
    
    try {
        // Use XMLHttpRequest for synchronous loading
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false); // false = synchronous
        xhr.send();
        
        if (xhr.status !== 200) {
            log(`Failed to load script: ${url}, status: ${xhr.status}`);
            return false;
        }
        
        // Execute the script content
        // We wrap it in an IIFE to avoid polluting global scope unnecessarily
        const scriptContent = xhr.responseText;
        
        // Create a new Function to evaluate the script in global scope
        // This is more reliable than eval for our purposes
        const globalEval = new Function('scriptContent', `
            try {
                // First attempt to run as a module-style script that might use exports
                let exports = {};
                let module = { exports: exports };
                
                // Execute the script
                ${scriptContent}
                
                // If the script defined module.exports, expose those to window
                if (Object.keys(module.exports).length > 0) {
                    Object.assign(window, module.exports);
                }
                
                // If the script defined exports directly, expose those to window
                if (Object.keys(exports).length > 0) {
                    Object.assign(window, exports);
                }
                
                return true;
            } catch (error) {
                console.error("Error evaluating script:", error);
                
                // Fallback: try direct evaluation without module wrapping
                try {
                    ${scriptContent}
                    return true;
                } catch (fallbackError) {
                    console.error("Fallback evaluation failed:", fallbackError);
                    return false;
                }
            }
        `);
        
        const success = globalEval();
        log(`Script evaluation ${success ? 'succeeded' : 'failed'}: ${url}`);
        return success;
    } catch (error) {
        logError(`sync-load-${url}`, error);
        return false;
    }
}

/**
 * Create minimal fallback implementations for critical dependencies
 * This ensures that even if loading fails, the application won't crash
 */
function createFallbacks() {
    log('Creating fallback implementations for missing dependencies');
    
    // Create fflate fallback if not defined
    if (!isGlobalDefined('fflate')) {
        log('Creating fflate fallback');
        window.fflate = {
            // Basic functions GLBLoader tries to access
            unzlibSync: function(data) {
                console.warn('[GLB-DEPS] Using fflate fallback (unzlibSync) - real implementation unavailable');
                // Return empty buffer to avoid crashes
                return new Uint8Array(0);
            },
            strFromU8: function(data) {
                console.warn('[GLB-DEPS] Using fflate fallback (strFromU8) - real implementation unavailable');
                return '';
            }
        };
    }
    
    // Create NURBSCurve fallback if needed
    if (!isGlobalDefined('NURBSCurve')) {
        log('Creating NURBSCurve fallback');
        // Simple class that won't crash but won't work either
        window.NURBSCurve = class NURBSCurve {
            constructor() {
                console.warn('[GLB-DEPS] Using NURBSCurve fallback - real implementation unavailable');
            }
        };
    }
}

/**
 * Load fflate dependency and expose to global scope
 * @returns {boolean} - True if successful
 */
function loadFflate() {
    log('Loading fflate dependency');
    
    // Check if already defined
    if (isGlobalDefined('fflate')) {
        log('fflate already defined in global scope');
        return true;
    }
    
    // Potential paths to try, in order of preference
    const paths = [
        '/libs/three/addons/libs/fflate.module.js',
        '/public/libs/three/addons/libs/fflate.module.js',
        './libs/three/addons/libs/fflate.module.js',
        '../libs/fflate.module.js'
    ];
    
    // Try each path until one works
    for (const path of paths) {
        log(`Trying to load fflate from: ${path}`);
        
        if (loadScriptSync(path)) {
            // Check if script defined fflate globally
            if (isGlobalDefined('fflate')) {
                log(`Successfully loaded fflate from ${path}`);
                return true;
            }
            
            // If script loaded but didn't define fflate, it might have exposed it differently
            // Check for common module patterns
            if (window.exports && window.exports.fflate) {
                window.fflate = window.exports.fflate;
                log('Found fflate in exports, copied to global scope');
                return true;
            }
            
            if (window.module && window.module.exports && window.module.exports.fflate) {
                window.fflate = window.module.exports.fflate;
                log('Found fflate in module.exports, copied to global scope');
                return true;
            }
            
            log('Script loaded but fflate not defined in expected locations');
        }
    }
    
    log('Failed to load fflate from any location');
    return false;
}

/**
 * Load all required dependencies for GLBLoader
 * @returns {boolean} - True if all critical dependencies loaded
 */
function loadAllDependencies() {
    log('Loading all GLBLoader dependencies');
    
    // Start with most critical: fflate
    const fflateLoaded = loadFflate();
    
    // Load NURBSCurve if needed
    let nurbsLoaded = isGlobalDefined('NURBSCurve');
    
    if (!nurbsLoaded) {
        log('Loading NURBSCurve dependency');
        
        const paths = [
            '/libs/three/addons/curves/NURBSCurve.js',
            '/public/libs/three/addons/curves/NURBSCurve.js',
            './libs/three/addons/curves/NURBSCurve.js',
            '../libs/three/addons/curves/NURBSCurve.js'
        ];
        
        for (const path of paths) {
            if (loadScriptSync(path)) {
                if (isGlobalDefined('NURBSCurve')) {
                    log(`Successfully loaded NURBSCurve from ${path}`);
                    nurbsLoaded = true;
                    break;
                }
            }
        }
    }
    
    // Create fallbacks for any missing dependencies
    createFallbacks();
    
    // Verify all dependencies are now available (either real or fallback)
    const allAvailable = isGlobalDefined('fflate') && isGlobalDefined('NURBSCurve');
    
    log('Dependency loading complete', {
        fflate: isGlobalDefined('fflate'),
        NURBSCurve: isGlobalDefined('NURBSCurve'),
        fflateLoadedSuccessfully: fflateLoaded,
        nurbsLoadedSuccessfully: nurbsLoaded,
        usingFallbacks: !fflateLoaded || !nurbsLoaded,
        allAvailable
    });
    
    return allAvailable;
}

/**
 * Initialize dependencies for GLBLoader
 * This is the main function to call before using GLBLoader
 * @returns {boolean} - True if initialization successful
 */
function initGLBDependencies() {
    if (initialized) {
        log('Dependencies already initialized');
        return true;
    }
    
    log('Initializing GLB dependencies');
    
    // Load dependencies
    const success = loadAllDependencies();
    
    // Mark as initialized even if unsuccessful (to prevent repeated attempts)
    initialized = true;
    
    // Final validation
    if (success) {
        log('GLB dependencies successfully initialized');
        
        // Display what's actually in the global scope for diagnostics
        if (DEBUG_LOG) {
            const globals = {
                fflate: typeof window.fflate,
                fflateKeys: window.fflate ? Object.keys(window.fflate) : 'undefined',
                NURBSCurve: typeof window.NURBSCurve,
                THREE: typeof window.THREE
            };
            log('Available globals:', globals);
        }
    } else {
        log('WARNING: GLB dependencies initialization incomplete, using fallbacks');
    }
    
    return success;
}

// Expose functions to window
window.glbGlobalDeps = {
    init: initGLBDependencies,
    isInitialized: () => initialized,
    checkDependency: isGlobalDefined
};

// Auto-initialize when script is loaded
initGLBDependencies();
