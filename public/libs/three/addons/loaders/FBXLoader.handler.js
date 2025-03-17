/**
 * FBXLoader.handler.js
 * 
 * Enhanced handler for FBXLoader that ensures proper initialization
 * and provides various methods for loading the loader in different
 * environments (ES modules, script tags, etc.)
 * 
 * For Beast-Tactics-3D project
 */

// Enhanced debug logging
const DEBUG = true;

/**
 * Log message with optional data object in debug mode
 * @param {string} message - The message to log
 * @param {Object} data - Optional data to include
 */
function debugLog(message, data = null) {
    if (!DEBUG) return;
    
    const prefix = '[FBX-HANDLER]';
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
    console.error(`[FBX-HANDLER] Error in ${context}:`, error);
    
    // Track loading errors for diagnostics
    window._fbxLoaderErrors = window._fbxLoaderErrors || [];
    window._fbxLoaderErrors.push({
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack,
        name: error.name
    });
}

debugLog('Starting FBXLoader initialization with enhanced error handling');

/**
 * Attempts to load FBXLoader dependencies
 * @returns {Promise<boolean>} - True if dependencies loaded successfully
 */
async function loadDependencies() {
    debugLog('Loading FBXLoader dependencies');
    
    // Define the dependencies we need to load
    const dependencies = [
        { path: '../libs/fflate.module.js', name: 'fflate' },
        { path: '../curves/NURBSCurve.js', name: 'NURBSCurve' }
    ];
    
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
 * Try multiple approaches to load the FBXLoader
 */
async function loadFBXLoader() {
    debugLog('Starting multi-approach FBXLoader loading');
    
    // Method tracking
    const methods = [];
    
    // Method 1: Check if it's already available
    if (typeof window.FBXLoader === 'function') {
        debugLog('FBXLoader already available on window');
        return true;
    }
    
    // Method 2: Try loading dependencies first
    try {
        const depsLoaded = await loadDependencies();
        methods.push({ name: 'load-dependencies', success: depsLoaded });
        
        if (!depsLoaded) {
            debugLog('Warning: Not all dependencies loaded successfully');
        }
    } catch (error) {
        logError('load-dependencies', error);
        methods.push({ name: 'load-dependencies', success: false, error: error.message });
    }
    
    // Method 3: Try ES module import
    try {
        debugLog('Attempting to load FBXLoader as ES module');
        const module = await import('./FBXLoader.js');
        
        debugLog('FBXLoader module loaded:', { moduleKeys: Object.keys(module) });
        
        if (module.FBXLoader) {
            debugLog('Setting window.FBXLoader from module.FBXLoader');
            window.FBXLoader = module.FBXLoader;
            methods.push({ name: 'es-module', success: true });
            return true;
        } else {
            const error = new Error('Failed to extract FBXLoader from module');
            logError('module-extraction', error);
            methods.push({ 
                name: 'es-module', 
                success: false, 
                moduleKeys: Object.keys(module),
                error: 'No FBXLoader property found' 
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
            script.src = './FBXLoader.js';
            script.onload = () => {
                if (typeof window.FBXLoader === 'function') {
                    resolve(true);
                } else {
                    reject(new Error('Script loaded but FBXLoader not found'));
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
    
    // Create a warning stub that won't break the application
    window.FBXLoader = class FBXLoaderStub {
        constructor() {
            console.warn('[FBX-HANDLER] Using FBXLoader stub - real loader failed to load');
        }
        
        load(url, onLoad, onProgress, onError) {
            const warning = `FBXLoader stub: Cannot load ${url} - real loader unavailable`;
            console.warn(warning);
            
            // Create empty group as fallback
            const emptyGroup = typeof THREE !== 'undefined' && THREE.Group ? 
                new THREE.Group() : { type: 'Group', children: [] };
                
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
loadFBXLoader().then(success => {
    if (success) {
        debugLog('Successfully loaded FBXLoader');
    } else {
        debugLog('Failed to load real FBXLoader, using stub');
    }
});

/**
 * Check if FBXLoader is ready
 * @returns {boolean} - True if FBXLoader is available
 */
export function isFBXLoaderReady() {
    return typeof window.FBXLoader === 'function';
}

/**
 * Get FBXLoader, waiting if necessary
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<Function>} - The FBXLoader constructor
 */
export async function getFBXLoader(timeoutMs = 5000) {
    // If already available, return immediately
    if (isFBXLoaderReady()) {
        return window.FBXLoader;
    }
    
    // Otherwise wait for it to become available
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            // Check if loader is now available
            if (isFBXLoaderReady()) {
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                resolve(window.FBXLoader);
            }
            
            // Check if we've waited too long
            if (Date.now() - startTime > timeoutMs) {
                clearInterval(checkInterval);
                reject(new Error(`Timed out waiting for FBXLoader (${timeoutMs}ms)`));
            }
        }, 100);
        
        // Set a timeout as a backup
        const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error(`Timed out waiting for FBXLoader (${timeoutMs}ms)`));
        }, timeoutMs);
    });
}
