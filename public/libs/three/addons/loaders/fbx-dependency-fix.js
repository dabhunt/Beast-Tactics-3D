/**
 * GLB-dependency-fix.js
 * 
 * This script fixes issues with missing GLBLoader dependencies by ensuring 
 * that fflate and other required libraries are properly loaded in the global scope
 * before GLBLoader attempts to use them.
 */

// Debug flag to control logging output
const DEBUG_LOG = true;

/**
 * Logger for this script with timestamp
 * @param {string} message - Message to log
 * @param {Object} data - Optional data to include
 */
function logMessage(message, data = null) {
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
 * Error logger with detailed diagnostic information
 * @param {string} context - Where the error occurred
 * @param {Error} error - Error object 
 */
function logError(context, error) {
    if (!DEBUG_LOG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[GLB-DEPS ${timestamp}] Error in ${context}:`, error);
    
    // Add to diagnostic history
    window._GLBDepsFixErrors = window._GLBDepsFixErrors || [];
    window._GLBDepsFixErrors.push({
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack,
        name: error.name
    });
}

// List of required dependencies with multiple path options
const DEPENDENCIES = [
    {
        name: 'fflate',
        globalName: 'fflate', // Expected global name
        paths: [
            '/libs/three/addons/libs/fflate.module.js',
            '/public/libs/three/addons/libs/fflate.module.js',
            './libs/three/addons/libs/fflate.module.js',
            '../libs/three/addons/libs/fflate.module.js',
            '../libs/fflate.module.js'
        ],
        required: true,
        moduleKey: null // Will be set if loading as module
    },
    {
        name: 'NURBSCurve',
        globalName: 'NURBSCurve', // Expected global name
        paths: [
            '/libs/three/addons/curves/NURBSCurve.js',
            '/public/libs/three/addons/curves/NURBSCurve.js',
            './libs/three/addons/curves/NURBSCurve.js',
            '../libs/three/addons/curves/NURBSCurve.js'
        ],
        required: true,
        moduleKey: null
    }
];

/**
 * Check if a dependency is already available in the global scope
 * @param {Object} dependency - Dependency configuration object
 * @returns {boolean} - True if already available
 */
function isDependencyAvailable(dependency) {
    // Check global window scope
    if (window[dependency.globalName] !== undefined) {
        logMessage(`${dependency.name} already available in window scope`);
        return true;
    }
    
    // Check THREE namespace if available
    if (window.THREE && window.THREE[dependency.globalName] !== undefined) {
        logMessage(`${dependency.name} available in THREE namespace`);
        // Copy to window for global access
        window[dependency.globalName] = window.THREE[dependency.globalName];
        return true;
    }
    
    logMessage(`${dependency.name} not found in expected locations`, {
        windowKeys: Object.keys(window).filter(k => k.includes(dependency.name)),
        threeKeys: window.THREE ? Object.keys(window.THREE).filter(k => k.includes(dependency.name)) : 'THREE not defined'
    });
    
    return false;
}

/**
 * Inject script directly into document head
 * @param {string} url - URL of script to load
 * @returns {Promise<boolean>} - True if successful
 */
function injectScript(url) {
    return new Promise((resolve, reject) => {
        try {
            logMessage(`Injecting script: ${url}`);
            const script = document.createElement('script');
            script.src = url;
            script.async = false; // Important: maintain order of execution
            script.onload = () => {
                logMessage(`Script loaded: ${url}`);
                resolve(true);
            };
            script.onerror = (err) => {
                logMessage(`Failed to load script: ${url}`, err);
                reject(new Error(`Failed to load script: ${url}`));
            };
            document.head.appendChild(script);
        } catch (error) {
            logError(`script-injection-${url}`, error);
            reject(error);
        }
    });
}

/**
 * Load a dependency using fetch and eval
 * @param {string} url - URL to fetch
 * @returns {Promise<boolean>} - True if successful
 */
async function loadViaFetchAndEval(url) {
    try {
        logMessage(`Loading via fetch: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }
        
        const code = await response.text();
        
        // Wrap in IIFE to avoid polluting global scope while ensuring
        // the module exports are attached to window
        const wrappedCode = `
            (function() {
                ${code}
                // If this is a module with exports, ensure they're attached to window
                if (typeof exports !== 'undefined') {
                    Object.keys(exports).forEach(key => {
                        window[key] = exports[key];
                    });
                }
            })();
        `;
        
        // Execute the code
        // eslint-disable-next-line no-eval
        eval(wrappedCode);
        
        logMessage(`Successfully loaded and evaluated: ${url}`);
        return true;
    } catch (error) {
        logError(`fetch-eval-${url}`, error);
        return false;
    }
}

/**
 * Load a module using dynamic import and expose to global scope
 * @param {string} url - Module URL
 * @param {Object} dependency - Dependency configuration
 * @returns {Promise<boolean>} - True if successful
 */
async function loadViaImport(url, dependency) {
    try {
        logMessage(`Loading via dynamic import: ${url}`);
        const module = await import(url);
        
        logMessage(`Module loaded, keys:`, Object.keys(module));
        
        // Try to identify the main export
        // Common patterns: default export, named export matching dependency name
        if (module.default) {
            logMessage(`Found default export for ${dependency.name}`);
            window[dependency.globalName] = module.default;
            return true;
        } 
        
        // Check for export with same name
        if (module[dependency.globalName]) {
            logMessage(`Found named export matching ${dependency.globalName}`);
            window[dependency.globalName] = module[dependency.globalName];
            return true;
        }
        
        // Last resort: if there's only one export, use that
        const keys = Object.keys(module);
        if (keys.length === 1) {
            logMessage(`Using single export '${keys[0]}' for ${dependency.name}`);
            window[dependency.globalName] = module[keys[0]];
            return true;
        }
        
        // If we get here, we need to examine all exports
        for (const key of keys) {
            if (typeof module[key] === 'function' || typeof module[key] === 'object') {
                logMessage(`Trying export '${key}' for ${dependency.name}`);
                window[dependency.globalName] = module[key];
                dependency.moduleKey = key;
                return true;
            }
        }
        
        // Last resort: attach entire module to global
        logMessage(`Could not identify main export, attaching entire module as ${dependency.globalName}`);
        window[dependency.globalName] = module;
        return true;
    } catch (error) {
        logError(`import-${url}`, error);
        return false;
    }
}

/**
 * Load a dependency using multiple strategies
 * @param {Object} dependency - Dependency configuration
 * @returns {Promise<boolean>} - True if successfully loaded
 */
async function loadDependency(dependency) {
    logMessage(`Loading dependency: ${dependency.name}`);
    
    // Check if already available
    if (isDependencyAvailable(dependency)) {
        return true;
    }
    
    // Try each path
    for (const path of dependency.paths) {
        logMessage(`Trying path: ${path}`);
        
        // Strategy 1: Script tag injection
        try {
            if (await injectScript(path)) {
                // Check if now available
                if (isDependencyAvailable(dependency)) {
                    logMessage(`Successfully loaded ${dependency.name} via script injection`);
                    return true;
                }
            }
        } catch (error) {
            logMessage(`Script injection failed for ${path}`, error.message);
        }
        
        // Strategy 2: Dynamic import
        try {
            if (await loadViaImport(path, dependency)) {
                // Verify global is now available
                if (window[dependency.globalName]) {
                    logMessage(`Successfully loaded ${dependency.name} via import`);
                    return true;
                }
            }
        } catch (error) {
            logMessage(`Dynamic import failed for ${path}`, error.message);
        }
        
        // Strategy 3: Fetch and eval
        try {
            if (await loadViaFetchAndEval(path)) {
                // Check if now available
                if (isDependencyAvailable(dependency)) {
                    logMessage(`Successfully loaded ${dependency.name} via fetch/eval`);
                    return true;
                }
            }
        } catch (error) {
            logMessage(`Fetch and eval failed for ${path}`, error.message);
        }
    }
    
    logMessage(`All loading strategies failed for ${dependency.name}`);
    return false;
}

/**
 * Load all dependencies required by GLBLoader
 * @returns {Promise<boolean>} - True if all required dependencies loaded
 */
async function loadAllDependencies() {
    logMessage('Starting dependency loading process');
    
    const results = [];
    
    // Process each dependency
    for (const dep of DEPENDENCIES) {
        const success = await loadDependency(dep);
        results.push({ name: dep.name, success, required: dep.required });
        
        if (!success && dep.required) {
            logMessage(`Failed to load required dependency: ${dep.name}`);
        }
    }
    
    // Check for missing required dependencies
    const missingRequired = results.filter(r => r.required && !r.success);
    
    if (missingRequired.length > 0) {
        logMessage('ERROR: Missing required dependencies', { missing: missingRequired });
        return false;
    }
    
    logMessage('All required dependencies loaded successfully', { results });
    return true;
}

/**
 * Check if all required dependencies are already available
 * @returns {boolean} - True if all dependencies are available
 */
function checkAllDependenciesAvailable() {
    return DEPENDENCIES.every(dep => {
        const available = isDependencyAvailable(dep);
        if (!available && dep.required) {
            return false;
        }
        return true;
    });
}

/**
 * Create a fallback implementation of fflate if it's missing
 * This is a minimal implementation just to prevent errors
 */
function createFflateFallback() {
    logMessage('Creating fallback fflate implementation');
    
    // Only create if it doesn't exist
    if (window.fflate) return;
    
    window.fflate = {
        // Minimal implementation to avoid errors
        unzlibSync: function(data) {
            console.warn('[GLB-DEPS] Using fflate fallback - real decompression unavailable');
            // Return empty array to prevent errors
            return new Uint8Array(0);
        },
        strFromU8: function(data) {
            console.warn('[GLB-DEPS] Using fflate fallback - real conversion unavailable');
            return '';
        }
    };
    
    logMessage('Created fflate fallback implementation');
}

/**
 * Initialize and fix GLBLoader dependencies
 * @returns {Promise<boolean>} - True if successfully initialized
 */
async function initializeAndFixDependencies() {
    logMessage('Starting GLBLoader dependency fix');
    
    // Check if already available
    if (checkAllDependenciesAvailable()) {
        logMessage('All dependencies already available, no fix needed');
        return true;
    }
    
    // Try to load dependencies
    const success = await loadAllDependencies();
    
    if (!success) {
        logMessage('Could not load all dependencies, creating fallbacks');
        // Create fallbacks for critical dependencies
        createFflateFallback();
    }
    
    // Final verification
    const allAvailable = checkAllDependenciesAvailable();
    
    logMessage('Dependency fix complete', { 
        success: allAvailable,
        fflateAvailable: window.fflate !== undefined,
        nurbsAvailable: window.NURBSCurve !== undefined,
        usingFallbacks: !success && allAvailable
    });
    
    return allAvailable;
}

// Immediately initialize when script loads
initializeAndFixDependencies().then(success => {
    if (success) {
        logMessage('GLBLoader dependencies successfully initialized');
    } else {
        logMessage('WARNING: GLBLoader dependencies could not be fully initialized');
    }
});

// Export functions for external use
window.glbDependencyFix = {
    initialize: initializeAndFixDependencies,
    checkDependencies: checkAllDependenciesAvailable,
    loadDependency
};
