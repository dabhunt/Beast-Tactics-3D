/**
 * crystal-fbx-diagnostic.js
 * Advanced diagnostics tool for investigating FBX loading issues with crystals
 * This script performs detailed checks and tests to pinpoint the exact cause of loading failures
 */

// Debug flag to control logging
const DEBUG_LOG = true;

/**
 * Detailed diagnostic logger
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function diagnosticLog(message, data = null) {
    if (!DEBUG_LOG) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
    const prefix = `[CRYSTAL-FBX-DIAG ${timestamp}]`;
    
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Error logger with detailed context information
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
function logDiagnosticError(context, error) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[CRYSTAL-FBX-DIAG ${timestamp}] Error in ${context}:`, error);
    
    // Add to diagnostic error history
    window._crystalFbxDiagnosticErrors = window._crystalFbxDiagnosticErrors || [];
    window._crystalFbxDiagnosticErrors.push({
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack,
        name: error.name
    });
}

/**
 * Check if a file exists by making a HEAD request
 * @param {string} url - File URL to check
 * @returns {Promise<Object>} - Result object with existence and detailed info
 */
async function checkFileExists(url) {
    try {
        diagnosticLog(`Checking if file exists: ${url}`);
        const startTime = performance.now();
        const response = await fetch(url, { method: 'HEAD' });
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        const result = {
            exists: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()]),
            responseTimeMs: responseTime.toFixed(2)
        };
        
        if (result.exists) {
            diagnosticLog(`✅ File exists: ${url}`, {
                status: result.status,
                responseTime: `${result.responseTimeMs}ms`
            });
            
            // Add content type info if available
            if (response.headers.has('content-type')) {
                result.contentType = response.headers.get('content-type');
            }
            
            // Add content length if available
            if (response.headers.has('content-length')) {
                result.contentLength = response.headers.get('content-length');
                result.sizeKB = (parseInt(result.contentLength) / 1024).toFixed(2) + ' KB';
            }
        } else {
            diagnosticLog(`❌ File does not exist: ${url}`, {
                status: result.status,
                statusText: result.statusText,
                responseTime: `${result.responseTimeMs}ms`
            });
        }
        
        return result;
    } catch (error) {
        logDiagnosticError(`file-exists-check-${url}`, error);
        return {
            exists: false,
            error: error.message,
            errorType: error.name,
            errorStack: error.stack
        };
    }
}

/**
 * Check file content to verify it's actually the expected type
 * @param {string} url - File URL to check
 * @param {string} type - Expected file type ('js', 'fbx', etc.)
 * @returns {Promise<Object>} - Validation results
 */
async function validateFileContent(url, type) {
    try {
        diagnosticLog(`Validating content of ${url} as ${type}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            return {
                valid: false,
                reason: `HTTP error: ${response.status} ${response.statusText}`,
                type: 'http-error'
            };
        }
        
        // Get first chunk of the file for validation
        const blob = await response.blob();
        const fileSize = blob.size;
        
        // Create a smaller blob for content check (first 512 bytes or the whole file)
        const checkSize = Math.min(512, fileSize);
        const checkBlob = blob.slice(0, checkSize);
        const buffer = await checkBlob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // Basic file type validation based on magic numbers or content
        let valid = false;
        let reason = '';
        let details = {};
        
        switch (type.toLowerCase()) {
            case 'js':
                // Check for JS file by looking for common JS keywords/syntax
                const jsText = new TextDecoder().decode(bytes);
                const jsKeywords = ['function', 'const', 'var', 'let', 'import', 'export', 'class'];
                valid = jsKeywords.some(keyword => jsText.includes(keyword));
                details = { 
                    firstBytes: jsText.substring(0, 100).replace(/\n/g, ' '),
                    containsJsKeywords: valid
                };
                reason = valid ? 'Contains JS keywords' : 'No JS keywords found';
                break;
                
            case 'fbx':
                // FBX files typically start with 'Kaydara FBX Binary' or have a specific binary header
                // Binary FBX starts with 'Kaydara FBX Binary'
                const textSignature = new TextDecoder().decode(bytes.slice(0, 20));
                const binarySignature = bytes.length >= 2 && bytes[0] === 0x4B && bytes[1] === 0x61; // 'Ka'
                
                valid = textSignature.includes('Kaydara') || binarySignature;
                reason = valid ? 'Valid FBX signature found' : 'FBX signature not found';
                details = { 
                    textSignature: textSignature.substring(0, 20),
                    firstBytesHex: Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
                    fileSize: fileSize
                };
                break;
                
            default:
                valid = true; // Default to true for unknown types
                reason = 'No validation for this file type';
        }
        
        diagnosticLog(`Content validation for ${url}: ${valid ? '✅ VALID' : '❌ INVALID'}`, {
            reason,
            fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
            ...details
        });
        
        return {
            valid,
            reason,
            details,
            fileSize
        };
    } catch (error) {
        logDiagnosticError(`content-validation-${url}`, error);
        return {
            valid: false,
            reason: `Error: ${error.message}`,
            type: 'validation-error',
            error: error.message
        };
    }
}

/**
 * Verify all dependencies required for FBXLoader
 * @returns {Promise<Object>} - Results of dependency checks
 */
async function verifyDependencies() {
    diagnosticLog('Verifying FBXLoader dependencies');
    
    // Extended dependencies check - more paths and more detailed information
    const dependencies = [
        {
            name: 'THREE Core Library',
            paths: [
                '/libs/three/three.module.js',
                '/public/libs/three/three.module.js',
                './libs/three/three.module.js',
                '../libs/three/three.module.js'
            ],
            required: true,
            description: 'Main Three.js library - without this nothing works'
        },
        {
            name: 'fflate',
            paths: [
                '/libs/three/addons/libs/fflate.module.js',
                '/public/libs/three/addons/libs/fflate.module.js',
                './libs/three/addons/libs/fflate.module.js',
                '../libs/three/addons/libs/fflate.module.js'
            ],
            required: true,
            description: 'Compression library required by FBXLoader for parsing FBX files'
        },
        {
            name: 'NURBSCurve', 
            paths: [
                '/libs/three/addons/curves/NURBSCurve.js',
                '/public/libs/three/addons/curves/NURBSCurve.js',
                './libs/three/addons/curves/NURBSCurve.js',
                '../libs/three/addons/curves/NURBSCurve.js'
            ],
            required: true,
            description: 'NURBS curves implementation required by FBXLoader for handling curved elements'
        },
        {
            name: 'FBXLoader',
            paths: [
                '/libs/three/addons/loaders/FBXLoader.js',
                '/public/libs/three/addons/loaders/FBXLoader.js',
                './libs/three/addons/loaders/FBXLoader.js',
                '../libs/three/addons/loaders/FBXLoader.js',
                'libs/three/addons/loaders/FBXLoader.js'
            ],
            required: true,
            description: 'The main FBXLoader class for loading FBX format models'
        },
        {
            name: 'Crystal FBX Model',
            paths: [
                '/assets/Purple_Crystal_Shard.fbx', 
                './assets/Purple_Crystal_Shard.fbx',
                '../assets/Purple_Crystal_Shard.fbx',
                '/public/assets/Purple_Crystal_Shard.fbx',
                'assets/Purple_Crystal_Shard.fbx'
            ],
            required: true,
            description: 'The actual FBX model file for the crystal'
        }
    ];
    
    const results = {};
    const contentValidationResults = {};
    let foundInvalidContent = false;
    
    // Check each dependency with enhanced validation
    for (const dep of dependencies) {
        diagnosticLog(`Checking dependency: ${dep.name}`, {
            required: dep.required,
            description: dep.description
        });
        
        results[dep.name] = {
            required: dep.required,
            description: dep.description,
            paths: dep.paths,
            existsResults: [],
            contentResults: [],
            anyExists: false,
            contentValid: false
        };
        
        // Check each possible path with detailed results
        for (const path of dep.paths) {
            // Check file existence with detailed response
            const existsResult = await checkFileExists(path);
            const existsData = {
                path, 
                exists: existsResult.exists,
                status: existsResult.status,
                responseTime: existsResult.responseTimeMs,
                headers: existsResult.headers
            };
            
            results[dep.name].existsResults.push(existsData);
            
            if (existsResult.exists) {
                // If file exists, validate its content
                const fileType = path.split('.').pop().toLowerCase();
                const contentResult = await validateFileContent(path, fileType);
                
                const contentData = {
                    path,
                    valid: contentResult.valid,
                    reason: contentResult.reason,
                    fileSize: contentResult.fileSize,
                    details: contentResult.details
                };
                
                results[dep.name].contentResults.push(contentData);
                
                // Update file status based on content validation
                if (contentResult.valid) {
                    results[dep.name].anyExists = true;
                    results[dep.name].contentValid = true;
                    results[dep.name].bestWorkingPath = path;
                    results[dep.name].fileSize = contentResult.fileSize;
                    
                    // Once we find a valid file, we can break out of the loop
                    diagnosticLog(`✅ Found valid ${dep.name} at ${path}`, {
                        fileSize: contentResult.fileSize ? `${(contentResult.fileSize/1024).toFixed(2)} KB` : 'unknown',
                        reason: contentResult.reason
                    });
                    break;
                } else {
                    // File exists but content validation failed
                    foundInvalidContent = true;
                    results[dep.name].anyExists = true; // File exists but may not be valid
                    
                    diagnosticLog(`⚠️ ${dep.name} found at ${path} but content validation failed`, {
                        reason: contentResult.reason,
                        details: contentResult.details
                    });
                }
            }
        }
        
        // Detailed diagnostic message based on combined results
        if (!results[dep.name].anyExists) {
            // File not found in any location
            diagnosticLog(`❌ ${dep.required ? 'REQUIRED' : 'OPTIONAL'} dependency ${dep.name} not found in any location`, {
                triedPaths: dep.paths
            });
        } else if (!results[dep.name].contentValid) {
            // File found but content is invalid
            diagnosticLog(`⚠️ ${dep.name} files found, but content validation failed for all of them`, {
                foundAt: results[dep.name].existsResults
                    .filter(r => r.exists)
                    .map(r => r.path)
            });
        }
    }
    
    // Check if any required dependencies are missing or invalid
    const missingDependencies = Object.entries(results)
        .filter(([_, info]) => info.required && !info.anyExists)
        .map(([name]) => name);
        
    const invalidContentDependencies = Object.entries(results)
        .filter(([_, info]) => info.required && info.anyExists && !info.contentValid)
        .map(([name]) => name);
    
    if (missingDependencies.length > 0) {
        diagnosticLog('❌ CRITICAL: Missing required dependencies', { missingDependencies });
    } else if (invalidContentDependencies.length > 0) {
        diagnosticLog('⚠️ CRITICAL: Some dependencies have invalid content', { invalidContentDependencies });
    } else {
        diagnosticLog('✅ All required dependencies found with valid content');
    }
    
    // Analyze common patterns in working paths
    const pathAnalysis = analyzePathPatterns(results);
    
    return {
        results,
        missingDependencies,
        invalidContentDependencies,
        allDependenciesFound: missingDependencies.length === 0,
        allContentValid: invalidContentDependencies.length === 0,
        foundInvalidContent,
        pathAnalysis
    };
}

/**
 * Analyze path patterns to identify potential issues
 * @param {Object} results - Dependency check results
 * @returns {Object} Path analysis results
 */
function analyzePathPatterns(results) {
    diagnosticLog('Analyzing path resolution patterns');
    
    const workingPaths = [];
    const failingPaths = [];
    
    // Extract working and failing paths
    for (const [depName, info] of Object.entries(results)) {
        if (info.bestWorkingPath) {
            workingPaths.push(info.bestWorkingPath);
        }
        
        for (const result of info.existsResults) {
            if (!result.exists) {
                failingPaths.push(result.path);
            }
        }
    }
    
    // Analyze path patterns
    const prefixCounts = {};
    const pathFormats = { relative: 0, absolute: 0, publicPrefix: 0, noPublicPrefix: 0 };
    
    workingPaths.forEach(path => {
        // Extract prefix
        const prefix = path.match(/^(\/[^\/]+|\.\.[^\/]+|\.\/)/) || [''];
        prefixCounts[prefix[0]] = (prefixCounts[prefix[0]] || 0) + 1;
        
        // Count path formats
        if (path.startsWith('./') || path.startsWith('../')) pathFormats.relative++;
        if (path.startsWith('/')) pathFormats.absolute++;
        if (path.includes('/public/')) pathFormats.publicPrefix++;
        if (!path.includes('/public/')) pathFormats.noPublicPrefix++;
    });
    
    // Find most common prefix
    let mostCommonPrefix = '';
    let maxCount = 0;
    for (const [prefix, count] of Object.entries(prefixCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonPrefix = prefix;
        }
    }
    
    // Identify potential issues
    const potentialIssues = [];
    
    if (pathFormats.relative > 0 && pathFormats.absolute > 0) {
        potentialIssues.push({
            type: 'mixed_path_styles',
            description: 'Mixed absolute and relative paths might cause loading inconsistencies',
            counts: { relative: pathFormats.relative, absolute: pathFormats.absolute }
        });
    }
    
    if (pathFormats.publicPrefix > 0 && pathFormats.noPublicPrefix > 0) {
        potentialIssues.push({
            type: 'inconsistent_public_prefix',
            description: 'Some paths use /public/ prefix while others do not',
            counts: { withPublic: pathFormats.publicPrefix, withoutPublic: pathFormats.noPublicPrefix }
        });
    }
    
    // Log potential issues
    if (potentialIssues.length > 0) {
        diagnosticLog('⚠️ Potential path resolution issues detected:', { issues: potentialIssues });
    } else {
        diagnosticLog('✅ No path resolution issues detected');
    }
    
    return {
        workingPaths,
        failingPaths,
        mostCommonPrefix,
        prefixCounts,
        pathFormats,
        potentialIssues,
        recommendation: potentialIssues.length > 0 ? 
            'Standardize path resolution approach across all dependencies' : 
            'Path resolution approach appears consistent'
    };
}

/**
 * Test FBXLoader functionality directly
 * @returns {Promise<Object>} - Test results
 */
async function testFBXLoader() {
    diagnosticLog('Testing FBXLoader functionality');
    
    const results = {
        steps: [],
        errors: [],
        success: false,
        modelLoaded: false
    };
    
    try {
        // Step 1: Check if THREE is available
        results.steps.push({ step: 'check-three', status: 'started' });
        
        if (typeof THREE !== 'object') {
            throw new Error('THREE is not defined');
        }
        
        results.steps[0].status = 'success';
        results.steps[0].details = { 
            threeVersion: THREE.REVISION,
            hasLoaders: typeof THREE.Loader === 'function'
        };
        
        // Step 2: Try to directly import FBXLoader
        results.steps.push({ step: 'import-fbxloader', status: 'started' });
        
        let FBXLoaderClass = null;
        
        try {
            diagnosticLog('Trying direct import of FBXLoader');
            const module = await import('/libs/three/addons/loaders/FBXLoader.js');
            
            if (module && module.FBXLoader) {
                FBXLoaderClass = module.FBXLoader;
                results.steps[1].status = 'success';
                results.steps[1].details = { 
                    method: 'direct-import',
                    moduleKeys: Object.keys(module)
                };
            } else {
                throw new Error('Module loaded but FBXLoader not found in module');
            }
        } catch (directImportError) {
            diagnosticLog('Direct import failed, trying fallback methods', { error: directImportError.message });
            
            // Try alternative methods
            if (typeof window.FBXLoader === 'function') {
                diagnosticLog('Found FBXLoader on window');
                FBXLoaderClass = window.FBXLoader;
                results.steps[1].status = 'success-fallback';
                results.steps[1].details = { method: 'window-global' };
            } else if (typeof THREE.FBXLoader === 'function') {
                diagnosticLog('Found FBXLoader on THREE namespace');
                FBXLoaderClass = THREE.FBXLoader;
                results.steps[1].status = 'success-fallback';
                results.steps[1].details = { method: 'three-namespace' };
            } else {
                // Try handler module
                try {
                    diagnosticLog('Trying handler module');
                    const { getFBXLoader, isFBXLoaderReady } = await import('/libs/three/addons/loaders/FBXLoader.handler.js');
                    
                    if (isFBXLoaderReady()) {
                        FBXLoaderClass = await getFBXLoader();
                        results.steps[1].status = 'success-handler';
                        results.steps[1].details = { method: 'handler-module' };
                    } else {
                        throw new Error('Handler module loaded but FBXLoader not ready');
                    }
                } catch (handlerError) {
                    logDiagnosticError('handler-import', handlerError);
                    results.steps[1].status = 'failure';
                    results.steps[1].error = handlerError.message;
                    throw new Error(`Failed to load FBXLoader: ${handlerError.message}`);
                }
            }
        }
        
        // Step 3: Create instance and test loading
        results.steps.push({ step: 'create-loader-instance', status: 'started' });
        
        if (!FBXLoaderClass) {
            throw new Error('FBXLoader class not available after all attempts');
        }
        
        const loader = new FBXLoaderClass();
        results.steps[2].status = 'success';
        results.steps[2].details = {
            loaderType: typeof loader,
            hasLoadMethod: typeof loader.load === 'function',
            loaderMethods: Object.keys(loader)
        };
        
        // Step 4: Attempt to load the actual crystal model
        results.steps.push({ step: 'load-crystal-model', status: 'started' });
        
        // Try multiple paths for the crystal model
        const modelPaths = [
            '/assets/Purple_Crystal_Shard.fbx',
            './assets/Purple_Crystal_Shard.fbx',
            '/public/assets/Purple_Crystal_Shard.fbx'
        ];
        
        let loadSuccess = false;
        let loadError = null;
        let modelResult = null;
        
        for (const path of modelPaths) {
            try {
                diagnosticLog(`Attempting to load crystal model from: ${path}`);
                
                modelResult = await new Promise((resolve, reject) => {
                    loader.load(
                        path,
                        (fbx) => {
                            diagnosticLog('FBX loaded successfully', {
                                type: typeof fbx,
                                isObject: fbx !== null && typeof fbx === 'object',
                                hasChildren: fbx && Array.isArray(fbx.children),
                                childCount: fbx && fbx.children ? fbx.children.length : 'N/A'
                            });
                            resolve({ success: true, fbx });
                        },
                        (progress) => {
                            diagnosticLog('Loading progress', {
                                loaded: progress.loaded,
                                total: progress.total,
                                percent: progress.total ? Math.round((progress.loaded / progress.total) * 100) : 'unknown'
                            });
                        },
                        (error) => {
                            logDiagnosticError(`model-load-${path}`, error);
                            reject(error);
                        }
                    );
                });
                
                loadSuccess = true;
                break; // Successfully loaded, exit the loop
            } catch (error) {
                loadError = error;
                diagnosticLog(`Failed to load from ${path}, trying next path`, { error: error.message });
            }
        }
        
        if (loadSuccess && modelResult) {
            results.steps[3].status = 'success';
            results.steps[3].details = {
                path: modelPaths.find((_, i) => i === modelPaths.length - 1), // The path that worked
                modelType: typeof modelResult.fbx,
                isObject: modelResult.fbx !== null && typeof modelResult.fbx === 'object',
                childCount: modelResult.fbx && modelResult.fbx.children ? modelResult.fbx.children.length : 'N/A',
                isGroup: modelResult.fbx && modelResult.fbx.type === 'Group',
                isStub: modelResult.fbx && modelResult.fbx.name === 'FBXLoader-Stub-Group'
            };
            
            // Detect if we got a stub model back
            if (modelResult.fbx && modelResult.fbx.name === 'FBXLoader-Stub-Group') {
                results.steps[3].status = 'stub-returned';
                diagnosticLog('WARNING: Stub model was returned instead of real FBX model', results.steps[3].details);
            } else {
                results.modelLoaded = true;
            }
        } else {
            results.steps[3].status = 'failure';
            results.steps[3].error = loadError ? loadError.message : 'Unknown error loading model';
            throw new Error(`Failed to load crystal model: ${loadError ? loadError.message : 'Unknown error'}`);
        }
        
        // Final status
        results.success = results.steps.every(step => 
            step.status === 'success' || step.status === 'success-fallback' || step.status === 'success-handler'
        );
        diagnosticLog('FBXLoader test complete', { success: results.success, modelLoaded: results.modelLoaded });
        
    } catch (error) {
        logDiagnosticError('fbx-loader-test', error);
        results.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        results.success = false;
    }
    
    return results;
}

/**
 * Run a complete diagnostic check on crystal FBX loading
 * @returns {Promise<Object>} - Complete diagnostic results
 */
async function runCrystalFBXDiagnostic() {
    diagnosticLog('Starting comprehensive Crystal FBX diagnostic');
    
    const startTime = Date.now();
    const results = {
        timestamp: new Date().toISOString(),
        browser: {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            platform: navigator.platform
        },
        tests: {}
    };
    
    try {
        // Test 1: Verify dependencies
        diagnosticLog('Running dependency verification test');
        results.tests.dependencies = await verifyDependencies();
        
        // Test 2: Test FBXLoader functionality
        diagnosticLog('Running FBXLoader functionality test');
        results.tests.fbxLoader = await testFBXLoader();
        
        // Test 3: Check for existing errors in global variables
        results.tests.existingErrors = {
            crystalShardErrors: window._crystalShardErrors || [],
            fbxLoaderErrors: window._fbxLoaderErrors || [],
            diagnosticErrors: window._crystalFbxDiagnosticErrors || []
        };
        
        // Calculate overall state
        results.overallSuccess = results.tests.dependencies.allDependenciesFound && 
                                 results.tests.fbxLoader.success && 
                                 results.tests.fbxLoader.modelLoaded;
        
        // Add timing information
        results.executionTimeMs = Date.now() - startTime;
        
        diagnosticLog('Diagnostic completed', {
            success: results.overallSuccess,
            executionTimeMs: results.executionTimeMs
        });
        
    } catch (error) {
        logDiagnosticError('diagnostic-execution', error);
        results.criticalError = {
            message: error.message,
            stack: error.stack
        };
        results.overallSuccess = false;
    }
    
    // Save results globally for inspection
    window._crystalFbxDiagnosticResults = results;
    
    // Also log results to console in a readable format
    console.log('%c Crystal FBX Diagnostic Results ', 'background: #4b0082; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
    console.log({
        success: results.overallSuccess ? '✅ SUCCESS' : '❌ FAILURE',
        dependencies: results.tests.dependencies ? 
            (results.tests.dependencies.allDependenciesFound ? '✅ All found' : `❌ Missing: ${results.tests.dependencies.missingDependencies.join(', ')}`) : 
            '❌ Not tested',
        fbxLoader: results.tests.fbxLoader ? 
            (results.tests.fbxLoader.success ? '✅ Working' : '❌ Failed') : 
            '❌ Not tested',
        modelLoading: results.tests.fbxLoader && results.tests.fbxLoader.modelLoaded ? 
            '✅ Model loaded' : 
            '❌ Model not loaded',
        errorCount: (
            (results.tests.existingErrors?.crystalShardErrors?.length || 0) + 
            (results.tests.existingErrors?.fbxLoaderErrors?.length || 0) + 
            (results.tests.existingErrors?.diagnosticErrors?.length || 0)
        )
    });
    
    return results;
}

// Create a simple DOM interface to trigger the diagnostic
function createDiagnosticUI() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(75, 0, 130, 0.85)'; // Deep purple
    container.style.color = 'white';
    container.style.padding = '15px';
    container.style.borderRadius = '5px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '10000';
    container.style.maxWidth = '350px';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    const header = document.createElement('div');
    header.textContent = 'Crystal FBX Diagnostic Tools';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    header.style.fontSize = '14px';
    container.appendChild(header);
    
    const runButton = document.createElement('button');
    runButton.textContent = '🔍 Run Full Diagnostic';
    runButton.style.padding = '8px';
    runButton.style.margin = '5px 0';
    runButton.style.backgroundColor = '#8a2be2';
    runButton.style.color = 'white';
    runButton.style.border = 'none';
    runButton.style.borderRadius = '4px';
    runButton.style.cursor = 'pointer';
    runButton.style.width = '100%';
    
    runButton.onclick = async () => {
        runButton.disabled = true;
        runButton.textContent = '⏳ Running Diagnostic...';
        statusDiv.textContent = 'Test running, please wait...';
        
        try {
            const results = await runCrystalFBXDiagnostic();
            
            if (results.overallSuccess) {
                statusDiv.textContent = '✅ All tests passed! FBX loading should work.';
                statusDiv.style.color = '#4ade80'; // Green
            } else {
                const failureReasons = [];
                
                if (results.tests.dependencies && !results.tests.dependencies.allDependenciesFound) {
                    failureReasons.push(`Missing dependencies: ${results.tests.dependencies.missingDependencies.join(', ')}`);
                }
                
                if (results.tests.fbxLoader && !results.tests.fbxLoader.success) {
                    failureReasons.push('FBXLoader initialization failed');
                }
                
                if (results.tests.fbxLoader && !results.tests.fbxLoader.modelLoaded) {
                    failureReasons.push('Crystal model loading failed');
                }
                
                statusDiv.textContent = `❌ Tests failed. Issues: ${failureReasons.join('; ')}`;
                statusDiv.style.color = '#f87171'; // Red
            }
        } catch (error) {
            console.error('Error running diagnostic:', error);
            statusDiv.textContent = `💥 Error during diagnosis: ${error.message}`;
            statusDiv.style.color = '#f87171'; // Red
        } finally {
            runButton.disabled = false;
            runButton.textContent = '🔍 Run Full Diagnostic';
        }
    };
    
    container.appendChild(runButton);
    
    const statusDiv = document.createElement('div');
    statusDiv.textContent = 'Ready to run diagnostic';
    statusDiv.style.fontSize = '12px';
    statusDiv.style.marginTop = '10px';
    container.appendChild(statusDiv);
    
    const infoDiv = document.createElement('div');
    infoDiv.textContent = 'Results will be stored in window._crystalFbxDiagnosticResults';
    infoDiv.style.fontSize = '10px';
    infoDiv.style.marginTop = '10px';
    infoDiv.style.opacity = '0.8';
    container.appendChild(infoDiv);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✖';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(container);
    container.appendChild(closeButton);
    
    document.body.appendChild(container);
}

// Expose functions to window for console access
window.crystalFbxDiagnostic = {
    runDiagnostic: runCrystalFBXDiagnostic,
    verifyDependencies,
    testFBXLoader,
    showUI: createDiagnosticUI
};

// Auto-initialize UI when script is loaded
setTimeout(createDiagnosticUI, 1000);
