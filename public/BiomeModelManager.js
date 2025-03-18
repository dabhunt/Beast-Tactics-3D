/**
 * BiomeModelManager.js
 * Responsible for loading and managing 3D models for biome tiles
 * Models are loaded from public/assets/BiomeTiles/Models
 * Following the naming convention: {element}_{biomename}.glb for models
 */

// Import enhanced GLTFLoader handler
import { getGLTFLoader, isGLTFLoaderReady } from "./libs/three/addons/loaders/GLTFLoader.handler.js";

// Import GLTFLoader directly as fallback when handler fails
import { GLTFLoader } from "./libs/three/addons/loaders/GLTFLoader.js";

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
      modelScaleFactor: 0.5, // Size of the model (increased from 0.01 which was too small)
      ...config                // Override defaults with provided config
    };
    
    console.log("[BIOME] Configured with scale factor:", this.config.modelScaleFactor);
    
    // Add diagnostic info to window for debugging
    window._biomeModelManager = this;
    
    this.glbLoader = null;
    
    // Track initialization state for loaders
    this._initializingLoader = false;
    
    // Class-level promise for tracking loader initialization
    this._glbLoaderPromise = null;
    this._glbLoaderSuccess = false;
    
    // Map to store element-biome mappings (once discovered)
    this.biomeMappings = {};
    
    // Map to store loaded models to avoid reloading
    this.loadedModels = {};
    
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
    
    // Initialize the manager
    this.initialize();
  }
  
  /**
   * Initialize the biome model manager
   * This method handles initialization of paths and the GLTF loader
   * @returns {Promise<void>}
   */
  async initialize() {
    debugLog("Starting BiomeModelManager initialization...");
    
    try {
      // Step 1: Validate paths
      await this.validatePaths();
      
      // Step 2: Initialize the GLB loader
      debugLog("About to initialize GLB loader via initializeGLBLoader method");
      const success = await this.initializeGLBLoader();
      debugLog(`GLB loader initialization ${success ? 'succeeded' : 'failed'}`);
      
      debugLog("BiomeModelManager initialization complete");
    } catch (error) {
      logError("BiomeModelManager initialization failed", error);
    }
  }
  
  /**
   * Validate the model paths by checking for the existence of sample files
   */
  async validatePaths() {
    debugLog("Validating model paths...");
    
    const testModels = [
      "Fire_Volcano.glb",
      "Earth_Mountain.glb",
      "Light_Desert.glb"
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
   * Initialize the GLB loader if it doesn't exist
   * Uses multiple approaches for reliable loading
   * @returns {Promise<boolean>} - Returns true if loader was initialized successfully
   */
  async initializeGLBLoader() {
    debugLog("Starting GLB loader initialization", {
      alreadyInitializing: this._initializingLoader,
      alreadyLoaded: this.glbLoader !== null
    });
    
    if (this._glbLoaderPromise) {
      debugLog("Reusing existing GLB loader promise");
      try {
        await this._glbLoaderPromise;
        return this._glbLoaderSuccess;
      } catch (error) {
        logError("Error from cached GLB loader promise", error);
        return false;
      }
    }
    
    if (this._initializingLoader) {
      debugLog("Another initialization already in progress, waiting for it to complete");
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this._initializingLoader) {
            clearInterval(checkInterval);
            debugLog("Previous initialization completed, continuing");
            resolve();
          }
        }, 100);
      });
      const result = this.glbLoader !== null;
      debugLog("Using result from previous initialization", { successful: result });
      return result;
    }
    
    this._initializingLoader = true;
    debugLog("Starting new initialization process");

    if (this.glbLoader && typeof this.glbLoader.load === 'function') {
      debugLog("GLB loader already initialized and has load method");
      this._initializingLoader = false;
      this._glbLoaderSuccess = true;
      return true;
    } else if (this.glbLoader) {
      debugLog("WARNING: GLB loader exists but doesn't have load method, reinitializing", { 
        type: typeof this.glbLoader,
        methods: this.glbLoader ? Object.keys(this.glbLoader) : 'null'
      });
      this.glbLoader = null;
    }

    this._glbLoaderPromise = (async () => {
      try {
        let loaderInitialized = false;
        
        try {
          debugLog("Strategy 1: Using GLTFLoader.handler.js");
          const isReady = isGLTFLoaderReady();
          debugLog(`Handler reports GLTFLoader ready: ${isReady}`);
          
          if (isReady) {
            const LoaderClass = await getGLTFLoader();
            this.glbLoader = new LoaderClass();
            if (this.glbLoader && typeof this.glbLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized GLTFLoader via handler");
            } else {
              debugLog("❌ Handler getGLTFLoader returned an invalid loader", this.glbLoader);
              this.glbLoader = null;
            }
          } else {
            debugLog("Handler reports GLTFLoader not ready, waiting...");
            const LoaderClass = await getGLTFLoader(5000);
            this.glbLoader = new LoaderClass();
            if (this.glbLoader && typeof this.glbLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized GLTFLoader via handler after waiting");
            } else {
              debugLog("❌ Handler getGLTFLoader (after waiting) returned an invalid loader", this.glbLoader);
              this.glbLoader = null;
            }
          }
        } catch (handlerError) {
          logError("Strategy 1 failed: Handler-based GLTFLoader initialization", handlerError);
          debugLog("GLTFLoader.handler.js strategy failed, trying direct import");
        }
        
        if (!loaderInitialized) {
          try {
            debugLog("Strategy 2: Using direct GLTFLoader import");
            this.glbLoader = new GLTFLoader();
            if (this.glbLoader && typeof this.glbLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized GLTFLoader via direct import");
            } else {
              debugLog("❌ Direct import returned an invalid loader", this.glbLoader);
              this.glbLoader = null;
            }
          } catch (directError) {
            logError("Strategy 2 failed: Direct GLTFLoader import", directError);
          }
        }
        
        if (!loaderInitialized) {
          const pathsToTry = [
            './libs/three/addons/loaders/GLTFLoader.js',
            '/libs/three/addons/loaders/GLTFLoader.js',
            '../libs/three/addons/loaders/GLTFLoader.js',
            'libs/three/addons/loaders/GLTFLoader.js'
          ];
          
          for (const path of pathsToTry) {
            if (loaderInitialized) break;
            
            try {
              debugLog(`Strategy 3: Using dynamic import with path: ${path}`);
              const gltfModule = await import(path);
              this.glbLoader = new gltfModule.GLTFLoader();
              
              if (this.glbLoader && typeof this.glbLoader.load === 'function') {
                loaderInitialized = true;
                debugLog(`✅ Successfully initialized GLTFLoader via dynamic import from ${path}`);
                break;
              } else {
                debugLog(`❌ Dynamic import from ${path} returned an invalid loader`, this.glbLoader);
                this.glbLoader = null;
              }
            } catch (dynamicError) {
              logError(`Strategy 3 failed: Dynamic import from ${path}`, dynamicError);
            }
          }
        }
        
        if (!loaderInitialized && this.THREE.GLTFLoader) {
          try {
            debugLog("Strategy 4: Using THREE.GLTFLoader directly from THREE instance");
            this.glbLoader = new this.THREE.GLTFLoader();
            
            if (this.glbLoader && typeof this.glbLoader.load === 'function') {
              loaderInitialized = true;
              debugLog("✅ Successfully initialized GLTFLoader from THREE instance");
            } else {
              debugLog("❌ THREE.GLTFLoader instance is invalid", this.glbLoader);
              this.glbLoader = null;
            }
          } catch (threeError) {
            logError("Strategy 4 failed: Direct THREE.GLTFLoader access", threeError);
            window._biomeModelErrors.push(threeError);
          }
        }

        if (!loaderInitialized) {
          try {
            debugLog("Strategy 5: Loading GLTFLoader via script tag");
            
            await new Promise((resolve, reject) => {
              if (document.querySelector('script[src*="GLTFLoader.js"]')) {
                debugLog("GLTFLoader script already exists in document");
                resolve();
                return;
              }
              
              const script = document.createElement('script');
              script.src = '/libs/three/addons/loaders/GLTFLoader.js';
              script.async = true;
              
              script.onload = () => {
                debugLog("GLTFLoader script loaded successfully");
                resolve();
              };
              
              script.onerror = (err) => {
                debugLog("GLTFLoader script failed to load", err);
                reject(new Error("Failed to load GLTFLoader script"));
              };
              
              document.head.appendChild(script);
            });
            
            if (window.GLTFLoader) {
              this.glbLoader = new window.GLTFLoader();
              if (this.glbLoader && typeof this.glbLoader.load === 'function') {
                loaderInitialized = true;
                debugLog("✅ Successfully initialized GLTFLoader via script tag");
              } else {
                debugLog("❌ Script loaded but invalid GLTFLoader", this.glbLoader);
                this.glbLoader = null;
              }
            } else {
              debugLog("❌ Script loaded but GLTFLoader not defined on window");
            }
          } catch (scriptError) {
            logError("Strategy 5 failed: Script tag loading", scriptError);
            window._biomeModelErrors.push(scriptError);
          }
        }
        
        if (!loaderInitialized) {
          try {
            debugLog("Strategy 6: Creating stub GLTFLoader for testing");
            
            this.glbLoader = {
              load: (url, onLoad, onProgress, onError) => {
                console.warn(`[BIOME] Using STUB GLTFLoader for: ${url}`);
                
                const geometry = new this.THREE.BoxGeometry(1, 1, 1);
                const material = new this.THREE.MeshBasicMaterial({ 
                  color: 0xff9900, 
                  wireframe: true,
                  opacity: 0.8,
                  transparent: true
                });
                const mesh = new this.THREE.Mesh(geometry, material);
                
                mesh.name = "STUB_MODEL_" + url.split('/').pop();
                mesh.userData.isStubModel = true;
                mesh.userData.originalPath = url;
                
                const fileName = url.split('/').pop();
                try {
                  this.addDebugLabel(mesh, fileName);
                } catch (labelError) {
                  console.warn("[BIOME] Could not add debug label to stub model", labelError);
                }
                
                if (onLoad) {
                  setTimeout(() => {
                    onLoad({ scene: mesh });
                  }, 200);
                }
                
                return { scene: mesh };
              }
            };
            
            loaderInitialized = true;
            window._usingStubGLTFLoader = true;
            console.warn("[BIOME] Using STUB GLTFLoader as fallback - models will be placeholders");
            debugLog("✅ Created stub GLTFLoader for testing");
          } catch (stubError) {
            logError("Strategy 6 failed: Creating stub loader", stubError);
            window._biomeModelErrors.push(stubError);
          }
        }

        this._initializingLoader = false;
        this._glbLoaderSuccess = loaderInitialized;
        
        if (loaderInitialized) {
          const methods = Object.keys(this.glbLoader);
          const hasRequiredMethods = methods.includes('load') && typeof this.glbLoader.load === 'function';
          
          debugLog("GLB loader initialization status:", {
            status: loaderInitialized ? 'SUCCESS' : 'FAILED',
            loaderType: typeof this.glbLoader,
            methods: methods.join(', '),
            hasRequiredMethods,
            isStub: window._usingStubGLTFLoader || false
          });
          
          return true;
        } else {
          debugLog("❌ All GLB loader initialization strategies failed");
          return false;
        }
      } catch (error) {
        logError("Unexpected error during GLB loader initialization", error);
        this._initializingLoader = false;
        return false;
      }
    })();
    
    try {
      const result = await this._glbLoaderPromise;
      this._initializingLoader = false;
      return result;
    } catch (error) {
      logError("Error resolving GLB loader promise", error);
      this._initializingLoader = false;
      return false;
    }
  }
  
  /**
   * Extract biome name from file name
   * @param {string} filename - File name in format {element}_{biomename}.glb
   * @returns {Object} Object with element and biomeName properties
   */
  extractBiomeInfo(filename) {
    // Remove .glb extension
    const nameWithoutExt = filename.replace(/\.glb$/, "");
    
    // Split by underscore (first part is element, rest is biome name)
    const parts = nameWithoutExt.split("_");
    
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
      
      try {
        const getResponse = await fetch(filePath, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-0' }
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
      
      const element = hex.userData.element;
      debugLog(`Attempting to load biome model for element: ${element}`, { hex: hex?.uuid });
      
      if (!this.biomeMappings[element]) {
        const biomeMapping = await this.discoverBiomeMapping(element);
        if (!biomeMapping) {
          debugLog(`No biome model found for element: ${element}`);
          return false;
        }
      }
      
      const { biomeName, modelFile } = this.biomeMappings[element];
      if (!biomeName || !modelFile) {
        debugLog(`No biome mapping found for element: ${element}`);
        return false;
      }
      
      hex.userData.biomeName = biomeName;
      
      if (!this.glbLoader) {
        const loaderInitialized = await this.initializeGLBLoader();
        if (!loaderInitialized) {
          debugLog(`Failed to initialize GLB loader for ${element} biome`);
          return false;
        }
      }
      
      const modelKey = `${element}_${biomeName}`;
      
      if (this.loadedModels[modelKey]) {
        debugLog(`Using cached model for ${modelKey}`);
        this.placeCachedBiomeModel(hex, modelKey);
        return true;
      }
      
      const modelPath = `${this.config.modelBasePath}${modelFile}`;
      
      debugLog('Model loading details:', {
        baseConfig: this.config.modelBasePath,
        modelFile,
        fullModelPath: modelPath
      });
      
      const modelExists = await this.checkFileExists(modelPath);
      if (!modelExists) {
        debugLog(`Model file does not exist at path: ${modelPath}`);
        return false;
      }
      
      debugLog(`Loading model: ${modelPath}`);
      
      return new Promise((resolve) => {
        try {
          this.glbLoader.load(
            modelPath,
            (glb) => {
              debugLog(`GLB model loaded successfully for ${modelKey}`, {
                childCount: glb.scene.children.length
              });
              
              try {
                const model = glb.scene;
                
                model.scale.set(
                  this.config.modelScaleFactor,
                  this.config.modelScaleFactor,
                  this.config.modelScaleFactor
                );
                
                model.position.set(
                  hex.position.x,
                  hex.position.y + this.config.modelHeightOffset,
                  hex.position.z
                );
                
                model.rotation.y = Math.PI / 6;
                
                // Add logging for scale and position
                debugLog(`Model placed for ${modelKey}`, {
                  scale: {
                    x: model.scale.x,
                    y: model.scale.y,
                    z: model.scale.z
                  },
                  position: {
                    x: model.position.x,
                    y: model.position.y,
                    z: model.position.z
                  },
                  hexPosition: {
                    x: hex.position.x,
                    y: hex.position.y,
                    z: hex.position.z
                  },
                  visible: model.visible,
                  childCount: model.children.length
                });
                
                this.scene.add(model);
                hex.userData.biomeModel = model;
                
                this.loadedModels[modelKey] = { model: model.clone() };
                this.activeBiomeModels.push(model);
                
                debugLog(`Biome model successfully placed for ${modelKey}`);
                resolve(true);
              } catch (error) {
                logError(`Error processing loaded biome model for ${modelKey}`, error);
                resolve(false);
              }
            },
            (xhr) => {
              if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                debugLog(`Loading ${modelKey}: ${Math.round(percentComplete)}% complete`);
              }
            },
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
      
      const modelClone = cachedModel.model.clone();
      
      modelClone.position.set(
        hex.position.x,
        hex.position.y + this.config.modelHeightOffset,
        hex.position.z
      );
      
      // Add logging for cached model
      debugLog(`Cached model placed for ${modelKey}`, {
        scale: {
          x: modelClone.scale.x,
          y: modelClone.scale.y,
          z: modelClone.scale.z
        },
        position: {
          x: modelClone.position.x,
          y: modelClone.position.y,
          z: modelClone.position.z
        },
        hexPosition: {
          x: hex.position.x,
          y: hex.position.y,
          z: hex.position.z
        },
        visible: modelClone.visible,
        childCount: modelClone.children.length
      });
      
      this.scene.add(modelClone);
      hex.userData.biomeModel = modelClone;
      
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
    
    const knownMappings = {
      "Combat": { biomeName: "Arena", modelFile: "Combat_Arena.glb" },
      "Dark": { biomeName: "Cave", modelFile: "Dark_Cave.glb" },
      "Earth": { biomeName: "Mountain", modelFile: "Earth_Mountain.glb" },
      "Fire": { biomeName: "Volcano", modelFile: "Fire_Volcano.glb" },
      "Light": { biomeName: "Desert", modelFile: "Light_Desert.glb" },
      "Metal": { biomeName: "Mine", modelFile: "Metal_Mine.glb" },
      "Plant": { biomeName: "Jungle", modelFile: "Plant_Jungle.glb" },
      "Spirit": { biomeName: "Temple", modelFile: "Spirit_Temple.glb" }
    };
    
    const potentialPaths = [
      this.config.modelBasePath,
      'assets/BiomeTiles/Models/',
      '/assets/BiomeTiles/Models/',
      './assets/BiomeTiles/Models/',
      '../assets/BiomeTiles/Models/'
    ];
    
    debugLog(`Testing model paths for ${element}, current base path: ${this.config.modelBasePath}`);
    
    if (knownMappings[element]) {
      const mapping = knownMappings[element];
      debugLog(`Found potential mapping for ${element}:`, mapping);
      
      for (const basePath of potentialPaths) {
        const testPath = `${basePath}${mapping.modelFile}`;
        debugLog(`Testing path: ${testPath}`);
        
        try {
          const exists = await this.checkFileExists(testPath);
          if (exists) {
            debugLog(`✅ Verified model exists at: ${testPath}`);
            
            if (basePath !== this.config.modelBasePath) {
              debugLog(`Updating base path from ${this.config.modelBasePath} to ${basePath}`);
              this.config.modelBasePath = basePath;
            }
            
            this.biomeMappings[element] = mapping;
            return mapping;
          }
          debugLog(`❌ Model not found at: ${testPath}`);
        } catch (error) {
          logError(`Error checking path ${testPath}`, error);
        }
      }
      
      debugLog(`Could not verify model exists for ${element}, returning mapping as best effort`);
      this.biomeMappings[element] = mapping;
      return mapping;
    }
    
    debugLog(`No known mapping found for element: ${element}`);
    return null;
  }
  
  /**
   * Add a debug text label to a 3D object
   * @param {THREE.Object3D} object - The object to add a label to
   * @param {string} text - The text to display
   */
  addDebugLabel(object, text) {
    debugLog(`Adding debug label to model: ${text}`);
    
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = 'bold 24px Arial';
      context.fillStyle = '#ff9900';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      context.strokeStyle = '#000000';
      context.lineWidth = 3;
      context.strokeText(`STUB MODEL`, canvas.width / 2, 40);
      context.fillText(`STUB MODEL`, canvas.width / 2, 40);
      
      context.font = 'bold 20px Arial';
      context.strokeText(text, canvas.width / 2, 80);
      context.fillText(text, canvas.width / 2, 80);
      
      const texture = new this.THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      const material = new this.THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      });
      
      const sprite = new this.THREE.Sprite(material);
      sprite.scale.set(1, 0.5, 1);
      sprite.position.set(0, 1, 0);
      
      object.add(sprite);
      object.userData.debugLabel = sprite;
      
      debugLog("Debug label added successfully");
    } catch (error) {
      logError("Error creating debug label", error);
    }
  }
}

export default BiomeModelManager;