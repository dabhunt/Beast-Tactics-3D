/**
 * BiomeModelManager.js
 * Responsible for loading and managing 3D models for biome tiles
 * Models are loaded from public/assets/BiomeTiles/Models
 * Following the naming convention: {element}_{biomename}.fbx for models
 * and {element}_{biomename}_Texture.png for textures
 */

// Import enhanced FBXLoader handler
import { getFBXLoader, isFBXLoaderReady } from "./libs/three/addons/loaders/FBXLoader.handler.js";

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
    
    debugLog("Biome Model Manager initialized with config:", this.config);
    
    // Initialize texture loader
    this.initializeTextureLoader();
    
    // Initialize the FBX loader
    this.initializeFBXLoader().then(success => {
      debugLog(`FBX loader initialization ${success ? 'succeeded' : 'failed'}`);
    });
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
   * Uses the enhanced FBXLoader.handler.js to manage loading
   *
   * @returns {Promise<boolean>} - Returns true if loader was initialized successfully
   */
  async initializeFBXLoader() {
    // Start with detailed debug logging
    debugLog("Starting FBX loader initialization", {
      alreadyInitializing: this._initializingLoader,
      alreadyLoaded: this.fbxLoader !== null
    });
    
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
      return true;
    } else if (this.fbxLoader) {
      debugLog("WARNING: FBX loader exists but doesn't have load method, reinitializing", { 
        type: typeof this.fbxLoader,
        methods: this.fbxLoader ? Object.keys(this.fbxLoader) : 'null'
      });
      this.fbxLoader = null; // Reset invalid loader
    }

    try {
      // Check if FBXLoader is already ready
      debugLog("Checking if FBXLoader is ready via handler");
      
      if (isFBXLoaderReady()) {
        debugLog("FBXLoader is already ready, retrieving instance");
        
        try {
          // Get the loader class from our handler
          const LoaderClass = await getFBXLoader();
          
          // Instantiate it - getFBXLoader returns the constructor, not an instance
          debugLog("Instantiating FBXLoader from constructor");
          this.fbxLoader = new LoaderClass();
          this._fbxLoaderSuccess = true;
          
          debugLog("Successfully obtained FBXLoader immediately", {
            loader: this.fbxLoader ? "valid" : "null"
          });
          
          this._initializingLoader = false;
          return true;
        } catch (immediateError) {
          logError("Getting FBXLoader despite ready status", immediateError);
        }
      }
      
      // Wait for handler to initialize loader
      debugLog("FBXLoader not immediately ready, setting up wait process");
      
      // Create new promise only if we don't already have one
      if (!this._fbxLoaderPromise) {
        debugLog("Creating new loader wait promise");
        
        this._fbxLoaderPromise = new Promise(async (resolve) => {
          try {
            // Try to get the FBX loader 
            debugLog("Attempting to get FBX loader from handler...");
            const LoaderClass = await getFBXLoader();
            
            // Create an instance
            this.fbxLoader = new LoaderClass();
            this._fbxLoaderSuccess = true;
            
            debugLog("Successfully created FBX loader instance");
            resolve(true);
          } catch (error) {
            logError("Failed to initialize FBX loader", error);
            resolve(false);
          } finally {
            this._initializingLoader = false;
          }
        });
      }
      
      // Wait for the promise to resolve
      const result = await this._fbxLoaderPromise;
      debugLog("FBX loader initialization complete", { success: result });
      return result;
    } catch (error) {
      logError("Unexpected error during FBX loader initialization", error);
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
      
      // Check if we've already loaded this model
      const modelKey = `${element}_${biomeName}`;
      
      if (this.loadedModels[modelKey]) {
        debugLog(`Using cached model for ${modelKey}`);
        this.placeCachedBiomeModel(hex, modelKey);
        return true;
      }
      
      // Load the model
      const modelPath = `${this.config.modelBasePath}${modelFile}`;
      const texturePath = `${this.config.modelBasePath}${textureFile}`;
      
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
    
    // For simplicity in this implementation, we'll hardcode the mappings
    // based on the files we saw in the directory listing
    // In a real implementation, you might want to fetch this from the server
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
        textureFile: "Fire_Volcano_texture.png" 
      },
      "Light": { 
        biomeName: "Desert", 
        modelFile: "Light_Desert.fbx", 
        // No texture for Light_Desert
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
    
    if (knownMappings[element]) {
      this.biomeMappings[element] = knownMappings[element];
      debugLog(`Found biome mapping for ${element}: ${knownMappings[element].biomeName}`);
      return knownMappings[element];
    }
    
    debugLog(`No biome mapping found for element: ${element}`);
    return null;
  }
}

// Export the class for external use
export default BiomeModelManager;
