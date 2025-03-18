/**
 * biome-model-diagnostics.js
 * 
 * This script performs targeted diagnostics on biome models to verify 
 * that our fflate dependency fix has resolved the loading issue.
 */

// Debug logging control
const DEBUG_LOG = true;

/**
 * Logger function with timestamp and consistent formatting
 * @param {string} message - Message to log
 * @param {Object} data - Optional data to include 
 */
function log(message, data = null) {
    if (!DEBUG_LOG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = `[BIOME-DIAG ${timestamp}]`;
    
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Error logger with detailed diagnostics
 * @param {string} context - Error context description
 * @param {Error} error - Error object
 */
function logError(context, error) {
    if (!DEBUG_LOG) return;
    
    console.error(`[BIOME-DIAG] Error in ${context}:`, error);
    console.error(`Stack trace:`, error.stack);
}

/**
 * Check if critical dependencies are available in the global scope
 * @returns {boolean} - True if all required dependencies are available
 */
function checkDependencies() {
    log('Checking FBX dependencies in global scope');
    
    const dependencies = [
        { name: 'fflate', required: true },
        { name: 'NURBSCurve', required: false }, // Optional
        { name: 'FBXLoader', required: true }
    ];
    
    const results = dependencies.map(dep => {
        const available = typeof window[dep.name] !== 'undefined';
        
        log(`Dependency ${dep.name}: ${available ? 'AVAILABLE' : 'MISSING'}`, {
            type: available ? typeof window[dep.name] : 'undefined',
            keys: available && typeof window[dep.name] === 'object' ? 
                  Object.keys(window[dep.name]) : 'N/A'
        });
        
        return { name: dep.name, available, required: dep.required };
    });
    
    const missingRequired = results.filter(r => r.required && !r.available);
    
    if (missingRequired.length > 0) {
        log('WARNING: Missing required dependencies', { missing: missingRequired });
        return false;
    }
    
    log('All required dependencies available');
    return true;
}

/**
 * Attempt to load the specified biome model
 * @param {string} biomeName - Name of the biome to load
 * @returns {Promise<boolean>} - True if loading succeeded
 */
async function testBiomeModelLoading(biomeName) {
    log(`Testing model loading for biome: ${biomeName}`);
    
    // Verify dependencies first
    if (!checkDependencies()) {
        log('Cannot test biome loading - dependencies missing');
        return false;
    }
    
    // Create FBXLoader instance
    let loader;
    try {
        loader = new window.FBXLoader();
        log('Successfully created FBXLoader instance');
    } catch (error) {
        logError('fbx-loader-creation', error);
        return false;
    }
    
    // Construct model path based on biomeName
    const modelPath = `/models/biomes/${biomeName}.fbx`;
    log(`Loading model from path: ${modelPath}`);
    
    // Attempt to load the model
    return new Promise((resolve) => {
        try {
            loader.load(
                modelPath,
                // Success callback
                (model) => {
                    log(`Successfully loaded model for ${biomeName}`, {
                        modelType: model.type,
                        childCount: model.children ? model.children.length : 0
                    });
                    resolve(true);
                },
                // Progress callback
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        log(`Loading progress: ${Math.round(percentComplete)}%`);
                    }
                },
                // Error callback
                (error) => {
                    logError(`model-loading-${biomeName}`, error);
                    resolve(false);
                }
            );
        } catch (error) {
            logError(`model-load-attempt-${biomeName}`, error);
            resolve(false);
        }
    });
}

/**
 * Run diagnostics on all biome models that were failing
 */
async function runBiomeDiagnostics() {
    log('Starting biome model diagnostic tests');
    
    // Check global dependencies first
    const dependenciesAvailable = checkDependencies();
    
    if (!dependenciesAvailable) {
        log('WARNING: Dependencies check failed, tests may not succeed');
    }
    
    // List of biomes to test (including the Light_Desert that was failing)
    const biomesToTest = [
        'Light_Desert',
        'Forest',
        'Dark_Forest',
        'Mountain'
    ];
    
    log(`Will test ${biomesToTest.length} biome models`, { biomes: biomesToTest });
    
    // Run tests sequentially
    const results = [];
    
    for (const biome of biomesToTest) {
        log(`------ Testing biome: ${biome} ------`);
        const success = await testBiomeModelLoading(biome);
        results.push({ biome, success });
    }
    
    // Log overall results
    const successCount = results.filter(r => r.success).length;
    log(`Biome testing complete. ${successCount}/${results.length} biomes loaded successfully`, {
        detailedResults: results
    });
    
    return results;
}

// Expose functions to window for console testing
window.biomeDiagnostics = {
    run: runBiomeDiagnostics,
    testBiome: testBiomeModelLoading,
    checkDependencies
};

// Auto-run diagnostics when loaded
log('Biome model diagnostics loaded - Call window.biomeDiagnostics.run() to execute tests');

// Return the API for external use
export default {
    runDiagnostics: runBiomeDiagnostics,
    testBiome: testBiomeModelLoading,
    checkDependencies
};
