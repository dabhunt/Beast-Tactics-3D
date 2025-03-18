/**
 * glb-model-diagnostics.js
 * Diagnostic tool for testing GLB model loading and verifying dependencies
 * 
 * This script helps diagnose issues with loading GLB models by:
 * - Checking for proper GLTFLoader initialization
 * - Testing the loading of different model files
 * - Reporting detailed success/failure information
 * - Testing with both GLTFLoader and the enhanced handler
 */

// Set to true for verbose logging
const DEBUG_LOG = true;

// Store diagnostic information for analysis
const diagnosticResults = {
    loaderInitialization: [],
    gltfLoaderStatus: null,
    dependencyChecks: {},
    modelTestResults: [],
    timestamp: new Date().toISOString()
};

/**
 * Enhanced debug logging with diagnostic capture
 * @param {string} section - Diagnostic section
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(section, message, data = null) {
    if (!DEBUG_LOG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const logMessage = `[GLB-DIAG ${timestamp}] [${section}] ${message}`;
    
    if (data !== null) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
    
    // Store diagnostic information
    diagnosticResults.loaderInitialization.push({
        timestamp,
        section,
        message,
        data: typeof data === 'object' ? JSON.parse(JSON.stringify(data || {})) : data
    });
}

/**
 * Log errors with detailed diagnostic information
 * @param {string} section - Error section
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(section, context, error) {
    console.error(`[GLB-DIAG] [${section}] Error in ${context}:`, error);
    
    // Store error information
    diagnosticResults.loaderInitialization.push({
        timestamp: new Date().toISOString(),
        section,
        context,
        isError: true,
        message: error.message,
        stack: error.stack
    });
}

/**
 * Check if an object exists in the global scope
 * @param {string} objectName - Name of the object to check
 * @returns {boolean} - True if the object exists
 */
function checkGlobalObject(objectName) {
    try {
        const exists = typeof window[objectName] !== 'undefined';
        diagnosticResults.dependencyChecks[objectName] = exists;
        return exists;
    } catch (error) {
        logError('dependency-check', `Checking global object ${objectName}`, error);
        diagnosticResults.dependencyChecks[objectName] = false;
        return false;
    }
}

/**
 * Test loading a GLB model and report the result
 * @param {string} modelPath - Path to the model to test
 * @param {Object} loaderOptions - Options for the loader
 * @returns {Promise<Object>} - Results of the test
 */
async function testModelLoading(modelPath, loaderOptions = {}) {
    debugLog('model-test', `Starting test for ${modelPath}`, loaderOptions);
    
    const startTime = performance.now();
    const result = {
        modelPath,
        success: false,
        error: null,
        metadata: null,
        childCount: 0,
        meshCount: 0,
        materialCount: 0,
        duration: 0,
        loaderType: loaderOptions.loaderType || 'standard'
    };
    
    try {
        // Create loader based on options
        let loader;
        if (loaderOptions.loaderType === 'enhanced') {
            debugLog('model-test', 'Using enhanced GLTFLoader handler');
            const { getGLTFLoader } = await import('./libs/three/addons/loaders/GLTFLoader.handler.js');
            const GLTFLoader = await getGLTFLoader();
            loader = new GLTFLoader();
        } else {
            debugLog('model-test', 'Using standard GLTFLoader');
            // Try to get GLTFLoader from different possible sources
            const THREE = window.THREE;
            let GLTFLoaderConstructor;
            
            if (typeof THREE.GLTFLoader === 'function') {
                GLTFLoaderConstructor = THREE.GLTFLoader;
            } else if (typeof window.GLTFLoader === 'function') {
                GLTFLoaderConstructor = window.GLTFLoader;
            } else {
                // Try to import
                const module = await import('./libs/three/addons/loaders/GLTFLoader.js');
                GLTFLoaderConstructor = module.GLTFLoader;
            }
            
            loader = new GLTFLoaderConstructor();
        }
        
        debugLog('model-test', `Created loader for ${modelPath}`, { loaderType: loaderOptions.loaderType });
        
        // Load the model
        const model = await new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    resolve(gltf);
                },
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        debugLog('model-test', `Loading ${modelPath}: ${Math.round(percentComplete)}% complete`);
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });
        
        const endTime = performance.now();
        result.duration = endTime - startTime;
        result.success = true;
        
        // Count meshes and materials for reporting
        let meshCount = 0;
        let materialCount = 0;
        
        // Extract information about the model
        model.scene.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                if (child.material) {
                    materialCount += Array.isArray(child.material) ? child.material.length : 1;
                }
            }
        });
        
        // Add details to result
        result.childCount = model.scene.children.length;
        result.meshCount = meshCount;
        result.materialCount = materialCount;
        
        const sceneInfo = {
            children: model.scene.children.map(child => ({
                type: child.type,
                name: child.name,
                position: child.position ? [child.position.x, child.position.y, child.position.z] : 'No position',
                childCount: child.children ? child.children.length : 0
            }))
        };
        
        result.metadata = {
            hasScene: !!model.scene,
            hasCameras: Array.isArray(model.cameras) && model.cameras.length > 0,
            hasAnimations: Array.isArray(model.animations) && model.animations.length > 0,
            sceneInfo
        };
        
        debugLog('model-test', `Successfully loaded ${modelPath}`, result);
    } catch (error) {
        const endTime = performance.now();
        result.duration = endTime - startTime;
        result.success = false;
        result.error = {
            message: error.message,
            stack: error.stack
        };
        
        logError('model-test', `Failed to load ${modelPath}`, error);
    }
    
    diagnosticResults.modelTestResults.push(result);
    return result;
}

/**
 * Run comprehensive diagnostics on GLB loading
 */
async function runDiagnostics() {
    console.log('===================================================');
    console.log('       STARTING GLB MODEL LOADING DIAGNOSTICS      ');
    console.log('===================================================');
    
    debugLog('init', 'Starting GLB model diagnostics');
    
    try {
        // Step 1: Check for required global objects
        debugLog('dependency', 'Checking for required global objects');
        
        const dependencyChecks = {
            THREE: checkGlobalObject('THREE'),
            GLTFLoader: checkGlobalObject('GLTFLoader')
        };
        
        diagnosticResults.dependencyChecks = {
            ...diagnosticResults.dependencyChecks,
            ...dependencyChecks
        };
        
        debugLog('dependency', 'Dependency check results', dependencyChecks);
        
        // Step 2: Check GLTFLoader handler status
        debugLog('loader-check', 'Testing enhanced GLTFLoader handler');
        try {
            const { isGLTFLoaderReady } = await import('./libs/three/addons/loaders/GLTFLoader.handler.js');
            const ready = isGLTFLoaderReady();
            diagnosticResults.gltfLoaderStatus = {
                handlerAvailable: true,
                loaderReady: ready
            };
            debugLog('loader-check', `Enhanced GLTFLoader handler is ${ready ? 'ready' : 'not ready'}`);
        } catch (error) {
            logError('loader-check', 'Error loading GLTFLoader handler', error);
            diagnosticResults.gltfLoaderStatus = {
                handlerAvailable: false,
                error: error.message
            };
        }
        
        // Step 3: Test model loading
        // List of test models to try loading
        const testModels = [
            './assets/BiomeTiles/Models/Fire_Volcano.glb',
            './assets/BiomeTiles/Models/Earth_Mountain.glb',
            './assets/BiomeTiles/Models/Light_Desert.glb',
            // Test fallback paths as well
            '/assets/BiomeTiles/Models/Fire_Volcano.glb',
            '../assets/BiomeTiles/Models/Fire_Volcano.glb'
        ];
        
        debugLog('model-tests', `Testing ${testModels.length} model paths`);
        
        // Test each model with both standard and enhanced loaders
        for (const modelPath of testModels) {
            debugLog('model-tests', `Testing model at path: ${modelPath}`);
            
            // Try standard loader first
            try {
                const standardResult = await testModelLoading(modelPath, { loaderType: 'standard' });
                debugLog('model-tests', `Standard loader ${standardResult.success ? 'succeeded' : 'failed'} for ${modelPath}`);
            } catch (error) {
                logError('model-tests', `Error in standard loader test for ${modelPath}`, error);
            }
            
            // Try enhanced loader
            try {
                const enhancedResult = await testModelLoading(modelPath, { loaderType: 'enhanced' });
                debugLog('model-tests', `Enhanced loader ${enhancedResult.success ? 'succeeded' : 'failed'} for ${modelPath}`);
            } catch (error) {
                logError('model-tests', `Error in enhanced loader test for ${modelPath}`, error);
            }
        }
        
        // Step 4: Create consolidated report
        console.log('===================================================');
        console.log('       GLB MODEL LOADING DIAGNOSTICS REPORT        ');
        console.log('===================================================');
        
        // Report global dependency status
        console.log('\n[DEPENDENCIES]');
        for (const [dep, status] of Object.entries(diagnosticResults.dependencyChecks)) {
            console.log(`${dep}: ${status ? '✅ Available' : '❌ Missing'}`);
        }
        
        // Report loader status
        console.log('\n[LOADER STATUS]');
        if (diagnosticResults.gltfLoaderStatus) {
            console.log(`Handler Available: ${diagnosticResults.gltfLoaderStatus.handlerAvailable ? '✅ Yes' : '❌ No'}`);
            console.log(`Loader Ready: ${diagnosticResults.gltfLoaderStatus.loaderReady ? '✅ Yes' : '❌ No'}`);
            if (diagnosticResults.gltfLoaderStatus.error) {
                console.log(`Error: ${diagnosticResults.gltfLoaderStatus.error}`);
            }
        } else {
            console.log('❌ Loader status check failed');
        }
        
        // Report model test results
        console.log('\n[MODEL TESTS]');
        for (const result of diagnosticResults.modelTestResults) {
            console.log(`\nModel: ${result.modelPath}`);
            console.log(`Loader Type: ${result.loaderType}`);
            console.log(`Status: ${result.success ? '✅ Loaded successfully' : '❌ Failed to load'}`);
            console.log(`Load Time: ${result.duration.toFixed(2)}ms`);
            
            if (result.success) {
                console.log(`Child Count: ${result.childCount}`);
                console.log(`Mesh Count: ${result.meshCount}`);
                console.log(`Material Count: ${result.materialCount}`);
                
                if (result.metadata && result.metadata.sceneInfo) {
                    console.log('Scene Structure:');
                    result.metadata.sceneInfo.children.forEach((child, index) => {
                        console.log(`  ${index}: ${child.name || 'unnamed'} (${child.type}) - Children: ${child.childCount}`);
                    });
                }
            } else if (result.error) {
                console.log(`Error: ${result.error.message}`);
            }
        }
        
        // Overall summary
        const successCount = diagnosticResults.modelTestResults.filter(r => r.success).length;
        const totalTests = diagnosticResults.modelTestResults.length;
        
        console.log('\n[SUMMARY]');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${totalTests - successCount}`);
        console.log(`Success Rate: ${((successCount / totalTests) * 100).toFixed(2)}%`);
        
        console.log('\n===================================================');
        console.log('       END OF GLB MODEL LOADING DIAGNOSTICS       ');
        console.log('===================================================');
        
        // Save diagnostic results to window for inspection
        window._glbDiagnosticResults = diagnosticResults;
        
    } catch (error) {
        logError('main', 'Unexpected error in diagnostics', error);
        console.error('Diagnostics failed with error:', error);
        
        // Still save partial results
        window._glbDiagnosticResults = diagnosticResults;
    }
}

// Wait for the page to be fully loaded before running diagnostics
if (document.readyState === 'complete') {
    runDiagnostics();
} else {
    window.addEventListener('load', runDiagnostics);
}

// Export diagnostic functions for external use if needed
export {
    runDiagnostics,
    testModelLoading,
    diagnosticResults
};
