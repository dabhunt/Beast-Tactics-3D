/**
 * CrystalShardManager.js
 * Responsible for managing crystal shard loading, placement, and visualization
 * Extracted from MapGeneration.js to improve modularity
 */

// Try to import FBXLoader if available
let FBXLoader;

// Different possible paths to try for loading FBXLoader
const FBXLOADER_PATHS = [
  "three/addons/loaders/FBXLoader.js",
  "./libs/three/addons/loaders/FBXLoader.js",
  "/libs/three/addons/loaders/FBXLoader.js",
];

// Paths to try with script tag loading approach
const FBXLOADER_SCRIPT_PATHS = ["/libs/three/addons/loaders/FBXLoader.js"];

// Track if we've successfully loaded the FBXLoader
let fbxLoaderPromise = null;
let fbxLoaderSuccess = false;
let fbxLoaderAttempts = 0;
let scriptLoadAttempts = 0;

// Create a global variable to track errors during loading
window._fbxLoaderErrors = window._fbxLoaderErrors || [];

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Enhanced logging function that only logs in debug mode
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[CRYSTAL] ${message}`, data);
  } else {
    console.log(`[CRYSTAL] ${message}`);
  }
}

/**
 * Try loading FBXLoader from different paths until successful using ES6 imports
 * @returns {Promise} - A promise that resolves when loader is found or all paths failed
 */
function attemptLoadFBXLoader() {
  console.log(
    `[CRYSTAL] Attempting to load FBXLoader via ES6 import (attempt ${fbxLoaderAttempts + 1}/${FBXLOADER_PATHS.length})`,
  );

  if (fbxLoaderAttempts >= FBXLOADER_PATHS.length) {
    console.warn(
      "[CRYSTAL] All FBXLoader ES6 import attempts failed, trying script tag approach",
    );
    return attemptLoadFBXLoaderViaScript();
  }

  const path = FBXLOADER_PATHS[fbxLoaderAttempts];
  console.log(`[CRYSTAL] Trying to import FBXLoader from: ${path}`);

  return import(path)
    .then((module) => {
      console.log(
        "[CRYSTAL] Import succeeded, module contents:",
        Object.keys(module),
      );
      // Check different ways the module might export FBXLoader
      if (module.FBXLoader) {
        FBXLoader = module.FBXLoader;
        console.log(
          "[CRYSTAL] FBXLoader imported successfully via module.FBXLoader",
        );
        window.FBXLoader = FBXLoader; // Make it available globally
        fbxLoaderSuccess = true;
        return true;
      } else if (module.default && module.default.FBXLoader) {
        FBXLoader = module.default.FBXLoader;
        console.log(
          "[CRYSTAL] FBXLoader imported successfully via module.default.FBXLoader",
        );
        window.FBXLoader = FBXLoader; // Make it available globally
        fbxLoaderSuccess = true;
        return true;
      } else if (module.default && typeof module.default === "function") {
        FBXLoader = module.default;
        console.log("[CRYSTAL] Using module.default as FBXLoader");
        window.FBXLoader = FBXLoader; // Make it available globally
        fbxLoaderSuccess = true;
        return true;
      } else {
        console.warn("[CRYSTAL] Module loaded but FBXLoader not found in:", module);
        window._fbxLoaderErrors.push({
          type: "module-structure",
          module: Object.keys(module),
        });
        fbxLoaderAttempts++;
        return attemptLoadFBXLoader(); // Try next path
      }
    })
    .catch((error) => {
      console.warn(`[CRYSTAL] Failed to import FBXLoader from ${path}:`, error);
      window._fbxLoaderErrors.push({
        type: "import-error",
        path,
        error: error.toString(),
      });
      fbxLoaderAttempts++;
      return attemptLoadFBXLoader(); // Try next path recursively
    });
}

/**
 * Try loading FBXLoader using script tags as a fallback approach
 * @returns {Promise} - A promise that resolves when loader is found or all paths failed
 */
function attemptLoadFBXLoaderViaScript() {
  if (scriptLoadAttempts >= FBXLOADER_SCRIPT_PATHS.length) {
    console.error("[CRYSTAL] All script loading attempts failed");
    window._fbxLoaderErrors.push({ type: "script-attempts-exhausted" });
    return Promise.resolve(false);
  }

  const scriptPath = FBXLOADER_SCRIPT_PATHS[scriptLoadAttempts];
  console.log(
    `[CRYSTAL] Attempting to load FBXLoader via script tag from: ${scriptPath}`,
  );

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = scriptPath;
    script.async = true;

    script.onload = () => {
      console.log(
        "[CRYSTAL] Script loaded successfully, checking for FBXLoader...",
      );

      // Check if the script exposed FBXLoader globally
      if (typeof window.FBXLoader === "function") {
        console.log("[CRYSTAL] FBXLoader available on window object");
        FBXLoader = window.FBXLoader;
        fbxLoaderSuccess = true;
        resolve(true);
      } else if (typeof THREE.FBXLoader === "function") {
        console.log("[CRYSTAL] FBXLoader available via THREE.FBXLoader");
        FBXLoader = THREE.FBXLoader;
        window.FBXLoader = FBXLoader; // Make it globally available
        fbxLoaderSuccess = true;
        resolve(true);
      } else {
        console.warn(
          "[CRYSTAL] Script loaded but FBXLoader not found on window or THREE",
        );
        window._fbxLoaderErrors.push({
          type: "script-no-fbxloader",
          windowKeys: Object.keys(window).filter(
            (k) => k.includes("FBX") || k.includes("Load"),
          ),
          threeKeys: THREE
            ? Object.keys(THREE).filter(
                (k) => k.includes("FBX") || k.includes("Load"),
              )
            : "THREE not available",
        });
        scriptLoadAttempts++;
        resolve(attemptLoadFBXLoaderViaScript()); // Try next path
      }
    };

    script.onerror = (error) => {
      console.warn(`[CRYSTAL] Error loading script from ${scriptPath}:`, error);
      window._fbxLoaderErrors.push({
        type: "script-error",
        path: scriptPath,
        error: error.toString(),
      });
      scriptLoadAttempts++;
      resolve(attemptLoadFBXLoaderViaScript()); // Try next path
    };

    document.head.appendChild(script);
  });
}

// Start the loading process
try {
  console.log(
    "[CRYSTAL] Starting FBXLoader loading process with enhanced diagnostics",
  );
  fbxLoaderPromise = attemptLoadFBXLoader();

  // Add a catch-all handler to help with debugging
  fbxLoaderPromise.catch((error) => {
    console.error("[CRYSTAL] Unhandled error in FBXLoader loading chain:", error);
    window._fbxLoaderErrors.push({
      type: "unhandled-promise-error",
      error: error.toString(),
    });
    return false;
  });
} catch (e) {
  console.warn("[CRYSTAL] Error setting up FBXLoader import:", e);
  window._fbxLoaderErrors.push({ type: "setup-error", error: e.toString() });
  fbxLoaderPromise = Promise.resolve(false);
}

/**
 * Crystal Shard Manager class
 * Handles all crystal shard related functionality including loading, placement, and visualization
 */
export class CrystalShardManager {
  /**
   * Create a new crystal shard manager
   * @param {Object} scene - THREE.js scene to add crystals to
   * @param {Object} THREE - THREE.js library reference
   * @param {Object} config - Configuration for crystal shards
   */
  constructor(scene, THREE, config = {}) {
    console.log("[CRYSTAL] Initializing Crystal Shard Manager...");
    
    this.scene = scene;
    this.THREE = THREE;
    
    // Default configuration parameters
    this.config = {
      crystalSpawnChance: 0.2, // 20% chance to spawn a crystal per hex
      crystalHeightOffset: 0.5, // Height above the hexagon
      crystalScaleFactor: 0.005, // Size of the crystal
      crystalModelPath: "/assets/Purple_Crystal_Shard.fbx",
      crystalTexturePath: "/assets/Purple_Crystal_Shard_texture.png",
      ...config // Override defaults with provided config
    };
    
    this.crystalLoader = null;
    this.crystalTexture = null;
    this.crystalTextureLoaded = false;
    
    // Track initialization state for crystalloaders
    this._crystalLoaderSource = "none";
    this._initializingLoader = false;
    
    debugLog("Crystal Shard Manager initialized with config:", this.config);
    
    // Load crystal texture
    this.loadCrystalTexture();
  }
  
  /**
   * Load crystal texture for use with models or fallbacks
   */
  loadCrystalTexture() {
    console.log("[CRYSTAL] Setting up crystal texture loading");
    this.crystalTexture = new this.THREE.TextureLoader().load(
      this.config.crystalTexturePath,
      (texture) => {
        console.log("[CRYSTAL] Crystal texture loaded successfully");
        this.crystalTextureLoaded = true;
      },
      undefined,
      (error) => {
        console.error("[CRYSTAL] Error loading crystal texture:", error);
      },
    );
  }
  
  /**
   * Try to spawn a crystal shard on a given hexagon based on probability
   * This method handles the entire crystal creation process, including:
   * - Random chance determination
   * - Model loading with fallbacks
   * - Texture application
   * - Positioning and scaling
   * - Error handling at multiple levels
   *
   * @param {Object} hex - The hexagon mesh to potentially spawn a crystal on
   */
  async trySpawnCrystalShard(hex) {
    try {
      // Log the evaluation process for debugging
      console.log(
        `[CRYSTAL] Evaluating crystal spawn for hex at (${hex.userData.q}, ${hex.userData.r})`,
      );

      // First validate the hex is a valid object with necessary properties
      if (!hex || !hex.userData || hex.userData.crystal) {
        console.log(
          `[CRYSTAL] Skipping crystal spawn - invalid hex or crystal already exists`,
        );
        return;
      }

      // OVERRIDE FOR DEBUGGING - Force crystal spawn on all hexes
      const debugForceSpawn = false;

      // Check if we should spawn a crystal based on probability
      if (!debugForceSpawn && Math.random() >= this.config.crystalSpawnChance) {
        console.log(
          `[CRYSTAL] Crystal spawn skipped for hex at (${hex.userData.q}, ${hex.userData.r}) - random check failed`,
        );
        return;
      }

      console.log(
        `[CRYSTAL] Spawning crystal shard on hex at (${hex.userData.q}, ${hex.userData.r})`,
      );

      // Initialize the crystal loader if it doesn't exist yet
      const loaderInitialized = await this.initializeCrystalLoader();
      console.log(
        `[CRYSTAL] Crystal loader initialization result: ${loaderInitialized ? "SUCCESS" : "FAILED"}`,
      );

      // If we have a crystal loader, use it to load the model
      if (this.crystalLoader) {
        console.log("[CRYSTAL] Using FBX loader to load crystal model");
        this.loadCrystalModel(hex);
      } else {
        // Otherwise use the fallback crystal method
        console.log(
          "[CRYSTAL] Using fallback crystal method as loader is not available",
        );
        this.createFallbackCrystal(hex);
      }
    } catch (error) {
      console.error("[CRYSTAL] Critical error in trySpawnCrystalShard:", error);
      console.error("[CRYSTAL] Error details:", error.message);
      console.error("[CRYSTAL] Stack trace:", error.stack);
      // Attempt to create a fallback crystal as a last resort
      try {
        this.createFallbackCrystal(hex);
      } catch (fallbackError) {
        console.error(
          "[CRYSTAL] Even fallback crystal creation failed:",
          fallbackError,
        );
      }
    }
  }
  
  /**
   * Initialize the crystal loader if it doesn't exist
   * Attempts to find a valid FBXLoader from multiple sources
   *
   * @returns {Promise<boolean>} - Returns true if loader was initialized successfully
   */
  async initializeCrystalLoader() {
    // Prevent multiple initializations with tracking
    if (this._initializingLoader) {
      console.log(
        "[CRYSTAL] Another initialization is already in progress, waiting...",
      );
      // Wait for the current initialization to complete before returning
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this._initializingLoader) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      console.log("[CRYSTAL] Previous initialization completed, reusing loader");
      return;
    }
    
    this._initializingLoader = true;

    // Cache the source of our crystal loader for diagnostics
    this._crystalLoaderSource = "none";

    if (this.crystalLoader) {
      console.log(
        "[CRYSTAL] Crystal loader already initialized from:",
        this._crystalLoaderSource,
      );
      this._initializingLoader = false;
      return true; // Already initialized
    }

    console.log(
      "[CRYSTAL] Crystal loader not initialized yet, checking available loaders",
    );

    try {
      // Wait for any pending FBXLoader import to complete
      if (fbxLoaderPromise && !fbxLoaderSuccess) {
        console.log("[CRYSTAL] Waiting for FBXLoader import to complete...");
        try {
          await fbxLoaderPromise;
          console.log(
            "[CRYSTAL] FBXLoader import completed, success status:",
            fbxLoaderSuccess,
          );
        } catch (err) {
          console.warn("[CRYSTAL] Error waiting for FBXLoader import:", err);
          window._fbxLoaderErrors.push({
            type: "await-error",
            error: err.toString(),
          });
        }
      }

      // Check if FBXLoader is available from global import
      if (typeof FBXLoader === "function") {
        console.log("[CRYSTAL] Using imported FBXLoader (global variable)");
        this.crystalLoader = new FBXLoader();
        this._crystalLoaderSource = "global-import";
        this._initializingLoader = false;
        return true;
      }

      // Check if it's available through THREE
      if (this.THREE && typeof this.THREE.FBXLoader === "function") {
        console.log("[CRYSTAL] Using THREE.FBXLoader");
        this.crystalLoader = new this.THREE.FBXLoader();
        this._crystalLoaderSource = "three-object";
        this._initializingLoader = false;
        return true;
      }

      // Try window global
      if (typeof window.FBXLoader === "function") {
        console.log("[CRYSTAL] Using window.FBXLoader");
        this.crystalLoader = new window.FBXLoader();
        this._crystalLoaderSource = "window-global";
        this._initializingLoader = false;
        return true;
      }

      // Try one more direct script loading as last resort
      console.log("[CRYSTAL] Last resort: Adding FBXLoader script directly...");
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "/libs/three/addons/loaders/FBXLoader.js";
        script.onload = () => {
          console.log(
            "[CRYSTAL] Direct script load succeeded, checking for FBXLoader...",
          );
          resolve();
        };
        script.onerror = (e) => {
          console.warn("[CRYSTAL] Direct script load failed:", e);
          window._fbxLoaderErrors.push({
            type: "direct-script-error",
            error: e.toString(),
          });
          resolve();
        };
        document.head.appendChild(script);
      });

      // Check after direct script loading
      if (typeof window.FBXLoader === "function") {
        console.log("[CRYSTAL] SUCCESS: Got FBXLoader after direct script load");
        this.crystalLoader = new window.FBXLoader();
        this._crystalLoaderSource = "direct-script";
        this._initializingLoader = false;
        return true;
      }

      // If we get here, no FBXLoader is available
      console.warn(
        "[CRYSTAL] No FBXLoader available after all attempts, will use fallback crystals",
      );
      this._initializingLoader = false;
      return false;
    } catch (error) {
      console.error("[CRYSTAL] Error initializing crystal loader:", error);
      this._initializingLoader = false;
      return false;
    }
  }
  
  /**
   * Load a crystal model for a specific hex using the FBXLoader
   * @param {Object} hex - The hexagon to place the crystal on
   */
  loadCrystalModel(hex) {
    // Ensure we have a loader
    if (!this.crystalLoader) {
      console.warn(
        "[CRYSTAL] No crystal loader available, using fallback crystal",
      );
      this.createFallbackCrystal(hex);
      return;
    }
    
    console.log(`[CRYSTAL] Loading crystal model for hex at (${hex.userData.q}, ${hex.userData.r})`);
    
    // Log our hex position for debugging
    const hexPosition = hex.position 
      ? [hex.position.x, hex.position.y, hex.position.z] 
      : "undefined position";
    debugLog(`Hex position:`, hexPosition);
    
    // Load the model
    this.crystalLoader.load(
      this.config.crystalModelPath,
      
      // onLoad callback
      (fbx) => {
        console.log(
          `[CRYSTAL] FBX model loaded successfully for hex (${hex.userData.q}, ${hex.userData.r})`,
          {
            childCount: fbx.children.length,
          }
        );
        
        try {
          // Apply crystal texture if available
          if (this.crystalTextureLoaded && this.crystalTexture) {
            fbx.traverse((child) => {
              if (child.isMesh) {
                console.log("[CRYSTAL] Applying texture to mesh:", child.name);
                
                // Create a material with the texture
                const material = new this.THREE.MeshPhongMaterial({
                  map: this.crystalTexture,
                  shininess: 100,
                  specular: 0xffffff,
                  emissive: 0x330066,
                  emissiveIntensity: 0.5,
                });
                
                // Apply the material
                child.material = material;
              }
            });
          }
          
          // Scale the crystal (FBX models are typically much larger)
          fbx.scale.set(
            this.config.crystalScaleFactor,
            this.config.crystalScaleFactor,
            this.config.crystalScaleFactor
          );
          
          // Position the crystal
          fbx.position.set(
            hex.position.x,
            hex.position.y + this.config.crystalHeightOffset,
            hex.position.z
          );
          
          // Add to the scene and associate with hex
          this.scene.add(fbx);
          hex.userData.crystal = fbx;
          
          console.log(
            `[CRYSTAL] Crystal successfully placed on hex (${hex.userData.q}, ${hex.userData.r})`,
            { modelType: "FBX" }
          );
        } catch (error) {
          console.error("[CRYSTAL] Error processing loaded FBX model:", error);
          // Try fallback if model processing fails
          this.createFallbackCrystal(hex);
        }
      },
      
      // onProgress callback - not used
      undefined,
      
      // onError callback
      (error) => {
        console.error("[CRYSTAL] Error loading FBX model:", error);
        // Create fallback crystal on error
        this.createFallbackCrystal(hex);
      }
    );
  }
  
  /**
   * Creates a fallback crystal when model loading fails
   * Uses advanced material properties to create a more realistic and shiny crystal
   *
   * @param {Object} hex - The hexagon object to place the crystal on
   * @returns {Object|null} - The created crystal mesh or null on failure
   */
  createFallbackCrystal(hex) {
    console.log("[CRYSTAL] Creating enhanced fallback crystal for hex:", {
      position: hex.position
        ? [hex.position.x, hex.position.y, hex.position.z]
        : "undefined",
      userData: hex.userData || "missing userData",
    });

    try {
      // Validate hex has required properties before proceeding
      if (!hex || !hex.position) {
        console.error(
          "[CRYSTAL] Invalid hex object provided to createFallbackCrystal:",
          hex,
        );
        return null;
      }

      // Create a more complex crystal geometry with more facets for better light reflection
      // Using a combined geometry approach for more interesting shape
      console.log("[CRYSTAL] Creating advanced crystal geometry");
      const geometryTop = new this.THREE.ConeGeometry(0.3, 0.5, 6);
      const geometryBottom = new this.THREE.ConeGeometry(0.2, 0.3, 6);

      // Merge geometries if BufferGeometryUtils is available
      let geometry;
      if (this.THREE.BufferGeometryUtils) {
        console.log(
          "[CRYSTAL] Using BufferGeometryUtils to create merged geometry",
        );
        geometryBottom.rotateX(Math.PI); // Flip the bottom cone
        geometryBottom.translate(0, -0.2, 0); // Position it below the top cone
        geometry = this.THREE.BufferGeometryUtils.mergeBufferGeometries([
          geometryTop,
          geometryBottom,
        ]);
      } else {
        console.log(
          "[CRYSTAL] BufferGeometryUtils not available, using simple geometry",
        );
        geometry = geometryTop;
      }

      // Create an enhanced material based on recommendations for realistic crystals
      // Try to use MeshPhysicalMaterial if available, otherwise fallback to MeshPhongMaterial
      let material;

      // Log our material creation attempt for debugging
      console.log("[CRYSTAL] Creating enhanced crystal material");

      // First try to use MeshPhysicalMaterial for more realistic rendering
      try {
        if (this.THREE.MeshPhysicalMaterial) {
          // Use advanced PBR material for better realism
          material = new this.THREE.MeshPhysicalMaterial({
            color: 0x9932cc, // Base purple color
            metalness: 0.5, // Partly metallic for shine
            roughness: 0.2, // Fairly smooth surface
            transmission: 0.6, // Partial transparency
            thickness: 0.5, // Material thickness for refraction
            ior: 1.8, // Index of refraction (diamonds ~2.4, glass ~1.5)
            clearcoat: 1.0, // Add clear coat layer
            clearcoatRoughness: 0.1, // Make clear coat glossy
            emissive: 0x330066, // Deep purple glow
            emissiveIntensity: 0.6, // Stronger glow
            transparent: true, // Enable transparency
            opacity: 0.8, // Set to 80% opacity (semi-translucent)
            reflectivity: 1.0, // Maximum reflectivity
          });
          console.log(
            "[CRYSTAL] Successfully created MeshPhysicalMaterial for crystal",
          );
        } else {
          throw new Error("MeshPhysicalMaterial not available");
        }
      } catch (materialError) {
        // Fallback to MeshPhongMaterial with enhanced properties
        console.warn(
          "[CRYSTAL] Could not create MeshPhysicalMaterial, using MeshPhongMaterial instead:",
          materialError.message,
        );
        material = new this.THREE.MeshPhongMaterial({
          color: 0x9932cc, // Purple color
          emissive: 0x330066, // Deep purple/blue glow
          emissiveIntensity: 0.6, // Medium glow strength
          shininess: 100, // Very shiny surface
          specular: 0xffffff, // White specular highlights
          transparent: true, // Enable transparency
          opacity: 0.8, // Set to 80% opacity
        });
        
        // Apply texture if available
        if (this.crystalTextureLoaded && this.crystalTexture) {
          material.map = this.crystalTexture;
        }
      }

      // Create the crystal mesh
      const crystal = new this.THREE.Mesh(geometry, material);

      // Position it on the hexagon with height offset
      crystal.position.set(
        hex.position.x,
        hex.position.y + this.config.crystalHeightOffset,
        hex.position.z,
      );

      // Add random rotation for variety
      crystal.rotation.y = Math.random() * Math.PI * 2;
      
      // Add slight random tilt
      crystal.rotation.x = (Math.random() - 0.5) * 0.2;
      crystal.rotation.z = (Math.random() - 0.5) * 0.2;

      // Add to scene and associate with hex
      this.scene.add(crystal);
      hex.userData.crystal = crystal;

      // Log success with crystal details
      console.log(
        `[CRYSTAL] Enhanced fallback crystal placed on hex (${hex.userData.q}, ${hex.userData.r})`,
        {
          materialType: material.type,
          geometryType: geometry.type,
          vertexCount: geometry.attributes.position.count,
        },
      );

      return crystal;
    } catch (error) {
      console.error("[CRYSTAL] Critical error creating fallback crystal:", error);
      console.error("[CRYSTAL] Error details:", error.message);
      console.error("[CRYSTAL] Error stack:", error.stack);
      return null;
    }
  }
}

// Export an instance for global access if needed
export default CrystalShardManager;
