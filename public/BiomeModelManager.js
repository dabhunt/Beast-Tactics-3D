/**
 * BiomeModelManager.js
 * Responsible for loading and managing 3D models for biome tiles
 * Models are loaded from public/assets/BiomeTiles/Models
 * Following the naming convention: {element}_{biomename}.fbx for models
 * and {element}_{biomename}_Texture.png for textures
 */

// Import enhanced FBXLoader handler
import { getFBXLoader, isFBXLoaderReady } from "./libs/three/addons/loaders/FBXLoader.handler.js";

// Import FBXLoader directly as fallback when handler fails
import { FBXLoader } from "./libs/three/addons/loaders/FBXLoader.js";

// Debug flag for verbose logging
const DEBUG = true;

// Create a global variable to track errors during loading
window._biomeModelErrors = window._biomeModelErrors || [];

/**
 * Enhanced logging function that only logs in debug mode
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[BIOME] ${message}`, data);
  } else {
    console.log(`[BIOME] ${message}`);
  }
}

/**
 * Log error with detailed diagnostics
 * @param {string} context - Error context description 
 * @param {Error} error - The error object
 */
function logError(context, error) {
  console.error(`[BIOME] Error in ${context}:`, error);
  
  // Track errors for diagnostics
  window._biomeModelErrors.push({
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: error.stack,
  });
}

/**
 * BiomeModelManager class
 * Handles loading and placement of 3D models for biome tiles
 */
export class BiomeModelManager {
  /**
   * Create a new biome model manager
   * @param {Object} scene - THREE.js scene to add models to
   * @param {Object} THREE - THREE.js library reference
   * @param {Object} config - Configuration for biome models
   */
  constructor(scene, THREE, config = {}) {
    console.log("[BIOME] Initializing Biome Model Manager...");
    
    this.scene = scene;
    this.THREE = THREE;
    
    // Default configuration parameters
    this.config = {
      modelBasePath: "./assets/BiomeTiles/Models/",
      modelHeightOffset: 0.3, // Height above the hexagon
      modelScaleFactor: 0.01, // Size of the model
      ...config                // Override defaults with provided config
    };
    
    // Add diagnostic info to window for debugging
    window._biomeModelManager = this;
    
    this.fbxLoader = null;
    this.textureLoader = null;
    
    // Track initialization state for loaders
    this._initializingLoader = false;
    
    // Class-level promise for tracking loader initialization
    this._fbxLoaderPromise = null;
    this._fbxLoaderSuccess = false;
    
    // Map to store element-biome mappings (once discovered)
    this.biomeMappings = {};
    
    // Map to store loaded models and textures to avoid reloading
    this.loadedModels = {};
    this.loadedTextures = {};
    
    // Active biome models for tracking/cleanup
    this.activeBiomeModels = [];
    
    // List of potential model base paths to check
    this.potentialBasePaths = [
      './assets/BiomeTiles/Models/',
      '/assets/BiomeTiles/Models/',
      'assets/BiomeTiles/Models/',
      '../assets/BiomeTiles/Models/',
      this.config.modelBasePath
    ];
    
    // Deduplicate base paths
    this.potentialBasePaths = [...new Set(this.potentialBasePaths)];
    
    debugLog("Biome Model Manager initialized with config:", this.config);
    debugLog("Potential base paths to check:", this.potentialBasePaths);
    
    // Initialize texture loader
    this.initializeTextureLoader();
    
    // Validate config paths
    this.validatePaths();
    
    // Initialize the FBX loader
    this.initializeFBXLoader().then(success => {
      debugLog(`FBX loader initialization ${success ? 'succeeded' : 'failed'}`);
    });
  }
  
  /**
   * Validate the model and texture paths by checking for the existence of sample files
   */
  async validatePaths() {
    debugLog("Validating model and texture paths...");
    
    const testModels = [
      "Fire_Volcano.fbx",
      "Earth_Mountain.fbx",
      "Light_Desert.fbx"
    ];
    
    // Test each potential base path with each test model
    for (const basePath of this.potentialBasePaths) {
      debugLog(`Testing base path: ${basePath}`);
      let foundFiles = false;
      
      for (const modelFile of testModels) {
        const testPath = `${basePath}${modelFile}`;
        try {
          const exists = await this.checkFileExists(testPath);
          if (exists) {
            debugLog(`\u2705 Found model at: ${testPath}`);
            foundFiles = true;
            
            // Update the config base path if we found a working one
            if (basePath !== this.config.modelBasePath) {
              debugLog(`Updating model base path from ${this.config.modelBasePath} to ${basePath}`);
              this.config.modelBasePath = basePath;
            }
            
            break;
          }
        } catch (error) {
          logError(`Error checking path: ${testPath}`, error);
        }
      }
      
      if (foundFiles) {
        break;
      }
    }
    
    debugLog(`Path validation complete, using base path: ${this.config.modelBasePath}`);
  }
  
  /**
   * Initialize the texture loader
   */
  initializeTextureLoader() {
    this.textureLoader = new this.THREE.TextureLoader();
    debugLog("Texture loader initialized");
  }
  
  /**
   * Initialize the FBX loader if it doesn't exist
   * Uses multiple approaches for reliable loading
   *
   * @returns {Promise<boolean>} - Returns true if loader was initialized successfully
   */
  async initializeFBXLoader() {
    // Start with detailed debug logging
    debugLog("Starting FBX loader initialization", {
      alreadyInitializing: this._initializingLoader,
      alreadyLoaded: this.fbxLoader !== null
    });
    
    // If we already have the cached promise, reuse it
    if (this._fbxLoaderPromise) {
      debugLog("Reusing existing FBX loader promise");
      try {
        await this._fbxLoaderPromise;
        return this._fbxLoaderSuccess;
      } catch (error) {
        logError("Error from cached FBX loader promise", error);
        return false;
      }
    }
    
    // Prevent multiple initializations by tracking state
    if (this._initializingLoader) {
      debugLog("Another initialization already in progress, waiting for it to complete");
      
      // Wait for the current initialization to complete before returning
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this._initializingLoader) {
            clearInterval(checkInterval);
            debugLog("Previous initialization completed, continuing");
            resolve();
          }
        }, 100);
      });
      
      // Return the result of the previous initialization
      const result = this.fbxLoader !== null;
      debugLog("Using result from previous initialization", { successful: result });
      return result;
    }
    
    // Set flag to prevent concurrent initializations
    this._initializingLoader = true;
    debugLog("Starting new initialization process");

    // If we already have a loader, verify it has the load method before returning success
    if (this.fbxLoader && typeof this.fbxLoader.load === 'function') {
      debugLog("FBX loader already initialized and has load method");
      this._initializingLoader = false;
      this._fbxLoaderSuccess = true;
      return true;
    } else if (this.fbxLoader) {
      debugLog("WARNING: FBX loader exists but doesn't have load method, reinitializing", { 
        type: typeof this.fbxLoader,
        methods: this.fbxLoader ? Object.keys(this.fbxLoader) : 'null'
      });
      this.fbxLoader = null; // Reset invalid loader
    }

    // Create initialization promise that can be reused
    this._fbxLoaderPromise = (async () => {
      try {
        // Attempt multiple loader initialization strategies
        let loaderInitialized = false;
        
        // Strategy 1: Use the handler's getFBXLoader method
        try {
          debugLog("Strategy 1: Using FBXLoader.handler.js");
          const isReady = isFBXLoaderReady();
          debugLog(`Handler reports FBXLoader ready: ${isReady}`);
          
          if (isReady) {
            const LoaderClass = await getFBXLoader();
            this.fbxLoader = new LoaderClass();
            if (this.fbxLoader && typeof this.fbxLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized FBXLoader via handler");
            } else {
              debugLog("❌ Handler getFBXLoader returned an invalid loader", this.fbxLoader);
              this.fbxLoader = null;
            }
          } else {
            debugLog("Handler reports FBXLoader not ready, waiting...");
            const LoaderClass = await getFBXLoader(5000); // Wait up to 5 seconds
            this.fbxLoader = new LoaderClass();
            if (this.fbxLoader && typeof this.fbxLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized FBXLoader via handler after waiting");
            } else {
              debugLog("❌ Handler getFBXLoader (after waiting) returned an invalid loader", this.fbxLoader);
              this.fbxLoader = null;
            }
          }
        } catch (handlerError) {
          logError("Strategy 1 failed: Handler-based FBXLoader initialization", handlerError);
          debugLog("FBXLoader.handler.js strategy failed, trying direct import");
        }
        
        // Strategy 2: Use direct FBXLoader import as fallback
        if (!loaderInitialized) {
          try {
            debugLog("Strategy 2: Using direct FBXLoader import");
            this.fbxLoader = new FBXLoader();
            if (this.fbxLoader && typeof this.fbxLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized FBXLoader via direct import");
            } else {
              debugLog("❌ Direct import returned an invalid loader", this.fbxLoader);
              this.fbxLoader = null;
            }
          } catch (directError) {
            logError("Strategy 2 failed: Direct FBXLoader import", directError);
          }
        }
        
        // Strategy 3: Try dynamic imports with different paths
        if (!loaderInitialized) {
          const pathsToTry = [
            './libs/three/addons/loaders/FBXLoader.js',
            '/libs/three/addons/loaders/FBXLoader.js',
            '../libs/three/addons/loaders/FBXLoader.js',
            'libs/three/addons/loaders/FBXLoader.js'
          ];
          
          for (const path of pathsToTry) {
            if (loaderInitialized) break;
            
            try {
              debugLog(`Strategy 3: Using dynamic import with path: ${path}`);
              const fbxModule = await import(path);
              this.fbxLoader = new fbxModule.FBXLoader();
              
              if (this.fbxLoader && typeof this.fbxLoader.load === 'function') {
                loaderInitialized = true;
                debugLog(`✅ Successfully initialized FBXLoader via dynamic import from ${path}`);
                break;
              } else {
                debugLog(`❌ Dynamic import from ${path} returned an invalid loader`, this.fbxLoader);
                this.fbxLoader = null;
              }
            } catch (dynamicError) {
              logError(`Strategy 3 failed: Dynamic import from ${path}`, dynamicError);
            }
          }
        }
        
        // Final result check
        this._initializingLoader = false;
        this._fbxLoaderSuccess = loaderInitialized;
        
        if (loaderInitialized) {
          // Validate the loader by checking its methods
          const methods = Object.keys(this.fbxLoader);
          const hasRequiredMethods = methods.includes('load') && typeof this.fbxLoader.load === 'function';
          
          debugLog("FBX loader initialization status:", {
            status: loaderInitialized ? 'SUCCESS' : 'FAILED',
            loaderType: typeof this.fbxLoader,
            methods: methods.join(', '),
            hasRequiredMethods
          });
          
          return true;
        } else {
          debugLog("❌ All FBX loader initialization strategies failed");
          return false;
        }
      } catch (error) {
        logError("Unexpected error during FBX loader initialization", error);
        this._initializingLoader = false;
        return false;
      }
    })();
    
    try {
      // Wait for the promise to resolve
      const result = await this._fbxLoaderPromise;
      this._initializingLoader = false;
      return result;
    } catch (error) {
      logError("Error resolving FBX loader promise", error);
      this._initializingLoader = false;
      return false;
    }
  }
  
  /**
   * Extract biome name from file name
   * @param {string} filename - File name in format {element}_{biomename}.fbx
   * @returns {Object} Object with element and biomeName properties
   */
  extractBiomeInfo(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.(fbx|png)$/, "");
    
    // Check if it's a texture filename
    const isTexture = nameWithoutExt.toLowerCase().endsWith("_texture");
    
    // Remove _texture suffix if present
    const baseName = isTexture 
      ? nameWithoutExt.replace(/_texture$/i, "") 
      : nameWithoutExt;
    
    // Split by underscore (first part is element, rest is biome name)
    const parts = baseName.split("_");
    
    if (parts.length < 2) {
      debugLog(`Unable to extract biome info from filename: ${filename}`);
      return { element: "Unknown", biomeName: "Unknown" };
    }
    
    const element = parts[0];
    const biomeName = parts.slice(1).join("_");
    
    return { element, biomeName };
  }
  
  /**
   * Check if biome model files actually exist at the expected path
   * @param {string} modelPath - Path to the model file
   * @returns {Promise<boolean>} - True if the file exists
   */
  async checkFileExists(filePath) {
    try {
      debugLog(`Checking if file exists: ${filePath}`);      
      
      // First try the HEAD method (faster, doesn't download content)
      try {
        const response = await fetch(filePath, {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (response.status === 200) {
          debugLog(`✅ File exists (HEAD method): ${filePath}`);
          return true;
        }
        
        debugLog(`HEAD check failed for ${filePath} with status ${response.status}`);
      } catch (headError) {
        debugLog(`HEAD request failed for ${filePath}, trying GET instead: ${headError.message}`);
      }
      
      // If HEAD fails, try GET as fallback (some servers don't support HEAD)
      try {
        const getResponse = await fetch(filePath, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0' // Just request the first byte to minimize data
          }
        });
        
        if (getResponse.status === 200 || getResponse.status === 206) {
          debugLog(`✅ File exists (GET method): ${filePath}`);
          return true;
        }
        
        debugLog(`❌ File not found (GET method): ${filePath}, status: ${getResponse.status}`);
        return false;
      } catch (getError) {
        debugLog(`❌ GET request also failed for ${filePath}: ${getError.message}`);
        return false;
      }
    } catch (error) {
      logError(`Complete file check failure for ${filePath}`, error);
      return false;
    }
  }

  /**
   * Attempt to load a biome model for a hexagon based on its element type
   * @param {Object} hex - The hexagon to add a biome model to
   * @returns {Promise<boolean>} - True if model was loaded, false otherwise
   */
  async loadBiomeModel(hex) {
    try {
      if (!hex || !hex.userData || !hex.userData.element) {
        debugLog("Invalid hex or missing element data", { hex: hex?.uuid });
        return false;
      }
      
      // Extract element type from hex
      const element = hex.userData.element;
      debugLog(`Attempting to load biome model for element: ${element}`, { hex: hex?.uuid });
      
      // Check if we already have the biome mapping for this element
      if (!this.biomeMappings[element]) {
        // Try to discover the biome mapping
        const biomeMapping = await this.discoverBiomeMapping(element);
        if (!biomeMapping) {
          debugLog(`No biome model found for element: ${element}`);
          return false;
        }
      }
      
      // Get the biome name for this element
      const biomeInfo = this.biomeMappings[element];
      if (!biomeInfo) {
        debugLog(`No biome mapping found for element: ${element}`);
        return false;
      }
      
      const { biomeName, modelFile, textureFile } = biomeInfo;
      
      // Store biome name in hex userData for future reference
      hex.userData.biomeName = biomeName;
      
      // Initialize the FBX loader if it doesn't exist
      if (!this.fbxLoader) {
        const loaderInitialized = await this.initializeFBXLoader();
        if (!loaderInitialized) {
          debugLog(`Failed to initialize FBX loader for ${element} biome`);
          return false;
        }
      }
      
      // Generate unique key for caching
      const modelKey = `${element}_${biomeName}`;
      
      // Check if we've already loaded this model
      if (this.loadedModels[modelKey]) {
        debugLog(`Using cached model for ${modelKey}`);
        this.placeCachedBiomeModel(hex, modelKey);
        return true;
      }
      
      // Full paths for model and texture
      const modelPath = `${this.config.modelBasePath}${modelFile}`;
      const texturePath = `${this.config.modelBasePath}${textureFile}`;
      
      // Log all path details for debugging
      debugLog('Model loading details:', {
        baseConfig: this.config.modelBasePath,
        modelFile,
        textureFile,
        fullModelPath: modelPath,
        fullTexturePath: texturePath
      });
      
      // Check if files actually exist before attempting to load
      const modelExists = await this.checkFileExists(modelPath);
      if (!modelExists) {
        debugLog(`Model file does not exist at path: ${modelPath}`);
        return false;
      }
      
      debugLog(`Loading model: ${modelPath}`);
      debugLog(`Loading texture: ${texturePath}`);
      
      // Load the texture first
      let texture = null;
      try {
        texture = await this.loadTexture(texturePath);
        debugLog(`Texture loaded successfully for ${modelKey}`);
      } catch (error) {
        logError(`Failed to load texture for ${modelKey}`, error);
        // Continue without texture
      }
      
      // Load the model
      return new Promise((resolve) => {
        try {
          this.fbxLoader.load(
            modelPath,
            // onLoad callback
            (fbx) => {
              debugLog(`FBX model loaded successfully for ${modelKey}`, {
                childCount: fbx?.children?.length || 0
              });
              
              try {
                // Apply texture if available
                if (texture) {
                  fbx.traverse((child) => {
                    if (child.isMesh) {
                      debugLog(`Applying texture to mesh: ${child.name}`);
                      
                      // Create a material with the texture
                      const material = new this.THREE.MeshPhongMaterial({
                        map: texture,
                        shininess: 30,
                        specular: 0xffffff,
                        emissive: 0x111111,
                        emissiveIntensity: 0.2,
                      });
                      
                      // Apply the material
                      child.material = material;
                    }
                  });
                }
                
                // Scale the model
                fbx.scale.set(
                  this.config.modelScaleFactor,
                  this.config.modelScaleFactor,
                  this.config.modelScaleFactor
                );
                
                // Position the model above the hexagon
                fbx.position.set(
                  hex.position.x,
                  hex.position.y + this.config.modelHeightOffset,
                  hex.position.z
                );
                
                // Rotate to match hexagon orientation (30 degrees)
                fbx.rotation.y = Math.PI / 6;
                
                // Add to the scene and associate with the hex
                this.scene.add(fbx);
                hex.userData.biomeModel = fbx;
                
                // Cache the model for reuse
                this.loadedModels[modelKey] = {
                  fbx: fbx.clone(),
                  texture: texture
                };
                
                // Track the active model
                this.activeBiomeModels.push(fbx);
                
                debugLog(`Biome model successfully placed for ${modelKey}`);
                resolve(true);
              } catch (error) {
                logError(`Error processing loaded biome model for ${modelKey}`, error);
                resolve(false);
              }
            },
            // onProgress callback
            (xhr) => {
              if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                debugLog(`Loading ${modelKey}: ${Math.round(percentComplete)}% complete`);
              }
            },
            // onError callback
            (error) => {
              logError(`Error loading biome model for ${modelKey}`, error);
              resolve(false);
            }
          );
        } catch (error) {
          logError(`Exception during biome model loading for ${modelKey}`, error);
          resolve(false);
        }
      });
    } catch (error) {
      logError("Unexpected error in loadBiomeModel", error);
      return false;
    }
  }
  
  /**
   * Load a texture and return a promise
   * @param {string} texturePath - Path to the texture
   * @returns {Promise<THREE.Texture>} - Promise that resolves with the loaded texture
   */
  loadTexture(texturePath) {
    return new Promise((resolve, reject) => {
      // Check if we've already loaded this texture
      if (this.loadedTextures[texturePath]) {
        resolve(this.loadedTextures[texturePath]);
        return;
      }
      
      // Load the texture
      this.textureLoader.load(
        texturePath,
        (texture) => {
          this.loadedTextures[texturePath] = texture;
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  /**
   * Place a cached biome model on a hexagon
   * @param {Object} hex - The hexagon to place the model on
   * @param {string} modelKey - The key for the cached model
   */
  placeCachedBiomeModel(hex, modelKey) {
    try {
      const cachedModel = this.loadedModels[modelKey];
      if (!cachedModel) {
        debugLog(`No cached model found for ${modelKey}`);
        return false;
      }
      
      // Clone the model
      const modelClone = cachedModel.fbx.clone();
      
      // Position the model above the hexagon
      modelClone.position.set(
        hex.position.x,
        hex.position.y + this.config.modelHeightOffset,
        hex.position.z
      );
      
      // Add to the scene and associate with the hex
      this.scene.add(modelClone);
      hex.userData.biomeModel = modelClone;
      
      // Track the active model
      this.activeBiomeModels.push(modelClone);
      
      debugLog(`Cached biome model successfully placed for ${modelKey}`);
      return true;
    } catch (error) {
      logError(`Error placing cached biome model for ${modelKey}`, error);
      return false;
    }
  }
  
  /**
   * Discover available biome mappings for an element
   * @param {string} element - The element to find biome mappings for
   * @returns {Promise<Object|null>} - Promise that resolves with the biome mapping or null
   */
  async discoverBiomeMapping(element) {
    debugLog(`Discovering biome mapping for element: ${element}`);
    
    // Define known biome mappings with file naming pattern
    const knownMappings = {
      "Combat": { 
        biomeName: "Arena", 
        modelFile: "Combat_Arena.fbx", 
        textureFile: "Combat_Arena_Texture.png" 
      },
      "Dark": { 
        biomeName: "Cave", 
        modelFile: "Dark_Cave.fbx", 
        textureFile: "Dark_Cave_Texture.png" 
      },
      "Earth": { 
        biomeName: "Mountain", 
        modelFile: "Earth_Mountain.fbx", 
        textureFile: "Earth_Mountain_Texture.png" 
      },
      "Fire": { 
        biomeName: "Volcano", 
        modelFile: "Fire_Volcano.fbx", 
        textureFile: "Fire_Volcano_Texture.png" 
      },
      "Light": { 
        biomeName: "Desert", 
        modelFile: "Light_Desert.fbx", 
        textureFile: "Light_Desert_Texture.png" 
      },
      "Metal": { 
        biomeName: "Mineshaft", 
        modelFile: "Metal_Mineshaft.fbx", 
        textureFile: "Metal_Mineshaft_Texture.png" 
      },
      "Plant": { 
        biomeName: "Jungle", 
        modelFile: "Plant_Jungle.fbx", 
        textureFile: "Plant_Jungle_Texture.png" 
      },
      "Spirit": { 
        biomeName: "Temple", 
        modelFile: "Spirit_Temple.fbx", 
        textureFile: "Spirit_Temple_Texture.png" 
      }
    };
    
    // List of potential base paths to try (in order of preference)
    const potentialPaths = [
      this.config.modelBasePath,
      'assets/BiomeTiles/Models/',
      '/assets/BiomeTiles/Models/',
      './assets/BiomeTiles/Models/',
      '../assets/BiomeTiles/Models/'
    ];
    
    debugLog(`Testing model paths for ${element}, current base path: ${this.config.modelBasePath}`);
    
    // Check if we have a known mapping for this element
    if (knownMappings[element]) {
      const mapping = knownMappings[element];
      debugLog(`Found potential mapping for ${element}:`, mapping);
      
      // Try to verify this mapping exists by checking if the model file exists at any of our paths
      for (const basePath of potentialPaths) {
        const testPath = `${basePath}${mapping.modelFile}`;
        debugLog(`Testing path: ${testPath}`);
        
        try {
          const exists = await this.checkFileExists(testPath);
          if (exists) {
            debugLog(`✅ Verified model exists at: ${testPath}`);
            
            // If we found a working path that's different from config, update it
            if (basePath !== this.config.modelBasePath) {
              debugLog(`Updating base path from ${this.config.modelBasePath} to ${basePath}`);
              this.config.modelBasePath = basePath;
            }
            
            // Store the mapping for future use
            this.biomeMappings[element] = mapping;
            return mapping;
          }
          debugLog(`❌ Model not found at: ${testPath}`);
        } catch (error) {
          logError(`Error checking path ${testPath}`, error);
        }
      }
      
      // If we got here, we couldn't verify the model exists, but let's still return the mapping
      // as a best effort - maybe the file check just failed
      debugLog(`Could not verify model exists for ${element}, returning mapping as best effort`);
      this.biomeMappings[element] = mapping;
      return mapping;
    }
    
    debugLog(`No known mapping found for element: ${element}`);
    return null;
  }
}

// Export the class for external use
export default BiomeModelManager;
