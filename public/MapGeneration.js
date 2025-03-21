/**
 * MapGeneration.js
 * Responsible for generating and managing the hexagonal grid map system
 * including biome distribution, crystal shard spawning, and related functionality.
 */

// FBXLoader reference variable and loading status
let FBXLoader = null;
let fbxLoaderLoaded = false;

/**
 * Load the FBXLoader from CDN using the same version as Three.js
 * Enhanced with better error handling, timeouts, and diagnostics
 * @returns {Promise} - Promise that resolves when the loader is available
 */
function loadFBXLoader() {
  console.log('[MAP] Starting FBXLoader initialization with enhanced diagnostics');
  
  if (typeof window.FBXLoader === 'function') {
    try {
      const testLoader = new window.FBXLoader();
      if (testLoader && typeof testLoader.load === 'function') {
        console.log('[MAP] FBXLoader already available and validated as window.FBXLoader');
        FBXLoader = window.FBXLoader;
        fbxLoaderLoaded = true;
        return Promise.resolve(true);
      }
    } catch (validationError) {
      console.warn('[MAP] window.FBXLoader validation failed, will reload:', validationError);
    }
  }
  
  const CDN_URL = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js';
  console.log(`[MAP] Verifying FBXLoader URL: ${CDN_URL}`);

  return new Promise((resolve, reject) => {
    try {
      const loadErrors = [];
      if (!window._fbxLoaderErrors) window._fbxLoaderErrors = [];

      console.log('[MAP] Attempting direct dynamic import of FBXLoader');
      import(CDN_URL)
        .then(module => {
          if (module.FBXLoader) {
            FBXLoader = module.FBXLoader;
            const testLoader = new FBXLoader();
            if (typeof testLoader.load === 'function') {
              console.log('[MAP] Dynamic import succeeded', {
                moduleKeys: Object.keys(module),
                loaderType: typeof FBXLoader,
                loadMethod: typeof testLoader.load
              });
              window.FBXLoader = FBXLoader;
              fbxLoaderLoaded = true;
              resolve(true);
            }
          } else {
            throw new Error('FBXLoader not found in module');
          }
        })
        .catch(importError => {
          console.warn('[MAP] Dynamic import failed, falling back to script tag:', importError);
          loadErrors.push(`Dynamic import: ${importError.message}`);
          window._fbxLoaderErrors.push(`Dynamic import: ${importError.message}`);

          console.log('[MAP] Falling back to script tag approach');
          const script = document.createElement('script');
          script.type = 'module';
          script.src = CDN_URL;

          // Add timing diagnostics
          const loadStart = performance.now();
          script.onload = () => {
            console.log('[MAP] Script tag onload triggered', {
              timeTaken: (performance.now() - loadStart).toFixed(2) + 'ms'
            });
            
            setTimeout(() => {
              console.log('[MAP] Checking FBXLoader after 200ms delay', {
                windowFBXLoader: typeof window.FBXLoader,
                localFBXLoader: typeof FBXLoader,
                threeNamespace: typeof window.THREE?.FBXLoader
              });
              
              if (typeof window.FBXLoader === 'function') {
                FBXLoader = window.FBXLoader;
                const testLoader = new FBXLoader();
                if (typeof testLoader.load === 'function') {
                  console.log('[MAP] FBXLoader validated from script tag');
                  fbxLoaderLoaded = true;
                  resolve(true);
                } else {
                  reject(new Error('FBXLoader loaded but invalid'));
                }
              } else {
                reject(new Error('FBXLoader not available after script load'));
              }
            }, 200);
          };

          script.onerror = (error) => {
            console.error('[MAP] Script tag failed to load:', error);
            loadErrors.push('Script tag load failed');
            window._fbxLoaderErrors.push('Script tag load failed');
            reject(new Error('Script tag load failed'));
          };

          console.log('[MAP] Appending script tag to head');
          document.head.appendChild(script);
        });
    } catch (unexpectedError) {
      console.error('[MAP] Unexpected error in loadFBXLoader:', unexpectedError);
      reject(unexpectedError);
    }
  });
}

// Start the FBXLoader loading process when this module loads
try {
  // Initialize FBXLoader immediately when this module loads
  loadFBXLoader().catch(error => {
    console.error('[MAP] Initial FBXLoader loading failed:', error);
  });
} catch (e) {
  console.warn('[MAP] Error initiating FBXLoader load:', e);
}

// Track loading status of resources
// Export this so game.js can access it for debugging
export let textureLoadingTracker = {
  total: 0,
  loaded: 0,
  failed: 0,
  textures: {},
};

// Debug log to track initialization
console.log('[MAP] Initialized textureLoadingTracker:', textureLoadingTracker);

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
    console.log(`[MAP] ${message}`, data);
  } else {
    console.log(`[MAP] ${message}`);
  }
}

/**
 * Map Generation class that handles all map creation functionality
 */
export class MapGenerator {
  constructor(scene, THREE) {
    console.log('[MAP] Initializing Map Generator...');
    
    this.scene = scene;
    this.THREE = THREE;
    this.hexagons = [];
    this.hexCount = 0;
    this.onMapGeneratedCallback = null;
    
    // Configuration parameters
    this.config = {
      hexRadius: 1,
      hexHeight: 0.2,
      gridRadius: 7,
      horizontalSpacing: 1.5,
      verticalFactor: 1.0,
      // Crystal shard parameters
      crystalSpawnChance: 0.2,  // 20% chance to spawn a crystal per hex
      crystalHeightOffset: 0.3, // Height above the hexagon
      crystalScaleFactor: 0.005,  // Size of the crystal (scale - reduced from 0.3 to fix oversized shards)
      crystalModelPath: '/assets/Purple_Crystal_Shard.fbx',
      crystalTexturePath: '/assets/Purple_Crystal_Shard_texture.png'
    };
    
    // Define all element types
    this.elementTypes = [
      'Combat',
      'Corrosion',
      'Dark',
      'Earth',
      'Electric',
      'Fire',
      'Light',
      'Metal',
      'Plant',
      'Spirit',
      'Water',
      'Wind',
    ];
    
    // Create URLs for local assets
    this.elemUrls = {};
    this.elementTypes.forEach(element => {
      this.elemUrls[element] = `/assets/BiomeTiles/${element}.png`;
    });
    
    debugLog('Element types defined:', this.elementTypes);
    debugLog('Element URLs mapped:', this.elemUrls);
    
    // Initialize geometry and materials
    this.initGeometryAndMaterials();
    
    // Reset tracking for texture loading
    // IMPORTANT: We're modifying the exported textureLoadingTracker
    // This ensures game.js sees the updated values
    textureLoadingTracker.total = this.elementTypes.length;
    textureLoadingTracker.loaded = 0;
    textureLoadingTracker.failed = 0;
    textureLoadingTracker.textures = {};
    console.log('[MAP] Reset textureLoadingTracker:', textureLoadingTracker);
    
    // Define crystal-related methods to avoid 'not a function' errors
    this.initCrystalMethods();
    
    // Load textures
    this.loadTextures();
  }
  
  /**
   * Initialize crystal-related methods to ensure they're properly bound to the class instance
   * This prevents 'not a function' errors that can occur with conditional method definitions
   */
  initCrystalMethods() {
    console.log('[MAP] Initializing crystal methods');
    
    // Method to load crystal texture with enhanced error handling and diagnostics
    this.loadCrystalTexture = () => {
      console.log('[MAP] Starting enhanced crystal texture and model loading process');
      
      // First load the crystal texture
      console.log('[MAP] Setting up crystal texture loading');
      this.crystalTexture = new this.THREE.TextureLoader().load(
        this.config.crystalTexturePath,
        (texture) => {
          console.log('[MAP] Crystal texture loaded successfully', {
            imageWidth: texture.image?.width,
            imageHeight: texture.image?.height,
            format: texture.format,
            timestamp: new Date().toISOString()
          });
          this.crystalTextureLoaded = true;
          
          // After texture loads, try to load the model if we have a loader
          this._loadCrystalModel();
        },
        (xhr) => {
          // Texture loading progress
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`[MAP] Crystal texture loading progress: ${progress.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error('[MAP] Error loading crystal texture:', error, {
            path: this.config.crystalTexturePath,
            timestamp: new Date().toISOString()
          });
          
          // Even if texture fails, try to load the model
          this._loadCrystalModel();
        }
      );
    };
    
    // Private method to load crystal model
    this._loadCrystalModel = () => {
      // Check if crystal loader is initialized
      if (!this.crystalLoader) {
        console.warn('[MAP] Crystal loader not available for model loading, will use fallback crystals', {
          reason: this._crystalLoaderSource || 'unknown',
          errors: window._fbxLoaderErrors || [],
          initTime: this._crystalLoaderInitTime
        });
        return;
      }
      
      // Set and validate crystal model path
      const modelPath = this.config.crystalModelPath;
      if (!modelPath) {
        console.error('[MAP] Crystal model path is not defined');
        this.crystalModel = null;
        return;
      }
      
      // Log the loading attempt with details
      console.log('[MAP] Attempting to load crystal model:', {
        path: modelPath,
        loader: this.crystalLoader.constructor.name,
        loaderSource: this._crystalLoaderSource,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Load crystal model with FBXLoader and enhanced error handling
        this.crystalLoader.load(
          modelPath,
          (fbx) => {
            // Success callback
            console.log('[MAP] Crystal model loaded successfully', {
              modelType: fbx.type,
              childCount: fbx.children?.length || 0,
              isObject3D: fbx instanceof this.THREE.Object3D,
              timestamp: new Date().toISOString()
            });
            
            // Store the loaded crystal model
            this.crystalModel = fbx;
            
            // Apply loaded texture if available
            if (this.crystalTextureLoaded && this.crystalTexture) {
              console.log('[MAP] Applying loaded texture to crystal model');
              this._applyCrystalTexture(fbx, this.crystalTexture);
            }
            
            // Dispatch an event that crystal loading is complete
            const event = new CustomEvent('crystalModelLoaded', { detail: { success: true } });
            window.dispatchEvent(event);
          },
          (xhr) => {
            // Loading progress callback
            if (xhr.lengthComputable) {
              const progress = (xhr.loaded / xhr.total) * 100;
              console.log('[MAP] Crystal model loading progress:', {
                percentage: progress.toFixed(1) + '%',
                loaded: xhr.loaded,
                total: xhr.total,
                timestamp: new Date().toISOString()
              });
            }
          },
          (error) => {
            // Error callback with enhanced diagnostics
            console.error('[MAP] Error loading crystal model:', error, {
              modelPath: modelPath,
              errorType: error.constructor.name,
              errorMessage: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
            
            this.crystalModel = null;
            
            // Dispatch an event that crystal loading failed
            const event = new CustomEvent('crystalModelLoaded', { 
              detail: { success: false, error: error.message } 
            });
            window.dispatchEvent(event);
          }
        );
      } catch (unexpectedError) {
        // Catch any unexpected errors in the load call itself
        console.error('[MAP] Unexpected error during crystal model loading:', unexpectedError, {
          callStack: unexpectedError.stack,
          loaderState: {
            type: typeof this.crystalLoader,
            hasLoadMethod: typeof this.crystalLoader?.load === 'function'
          }
        });
        
        this.crystalModel = null;
      }
    };
    
    // Helper to apply texture to the FBX model
    this._applyCrystalTexture = (model, texture) => {
      try {
        if (!model || !texture) return;
        
        // Create a standard material with the texture
        const material = new this.THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.5,
          roughness: 0.2,
          emissive: 0x330066,
          emissiveIntensity: 0.2
        });
        
        // Apply to all mesh children
        model.traverse((child) => {
          if (child.isMesh) {
            console.log('[MAP] Applying texture to crystal mesh:', child.name);
            child.material = material;
          }
        });
      } catch (error) {
        console.error('[MAP] Error applying texture to crystal model:', error);
      }
    };
    
    /**
     * Creates a fallback crystal when model loading fails
     * Uses advanced material properties to create a more realistic and shiny crystal
     * 
     * @param {Object} hex - The hexagon object to place the crystal on
     */
    this.createFallbackCrystal = (hex) => {
      console.log('[MAP] Creating enhanced fallback crystal for hex:', { 
        position: hex.position ? [hex.position.x, hex.position.y, hex.position.z] : 'undefined',
        userData: hex.userData || 'missing userData'
      });
      
      try {
        // Validate hex has required properties before proceeding
        if (!hex || !hex.position) {
          console.error('[MAP] Invalid hex object provided to createFallbackCrystal:', hex);
          return null;
        }
        
        // Create a more complex crystal geometry with more facets for better light reflection
        // Using a combined geometry approach for more interesting shape
        console.log('[MAP] Creating advanced crystal geometry');
        const geometryTop = new this.THREE.ConeGeometry(0.3, 0.5, 6);
        const geometryBottom = new this.THREE.ConeGeometry(0.2, 0.3, 6);
        
        // Merge geometries if BufferGeometryUtils is available
        let geometry;
        if (this.THREE.BufferGeometryUtils) {
          console.log('[MAP] Using BufferGeometryUtils to create merged geometry');
          geometryBottom.rotateX(Math.PI); // Flip the bottom cone
          geometryBottom.translate(0, -0.2, 0); // Position it below the top cone
          geometry = this.THREE.BufferGeometryUtils.mergeBufferGeometries([geometryTop, geometryBottom]);
        } else {
          console.log('[MAP] BufferGeometryUtils not available, using simple geometry');
          geometry = geometryTop;
        }
        
        // Create an enhanced material based on recommendations for realistic crystals
        // Try to use MeshPhysicalMaterial if available, otherwise fallback to MeshPhongMaterial
        let material;
        
        // Log our material creation attempt for debugging
        console.log('[MAP] Creating enhanced crystal material');
        
        // First try to use MeshPhysicalMaterial for more realistic rendering
        try {
          if (this.THREE.MeshPhysicalMaterial) {
            // Use advanced PBR material for better realism
            material = new this.THREE.MeshPhysicalMaterial({
              color: 0x9932CC,           // Base purple color
              metalness: 0.5,             // Partly metallic for shine
              roughness: 0.2,             // Fairly smooth surface
              transmission: 0.6,          // Partial transparency
              thickness: 0.5,             // Material thickness for refraction
              ior: 1.8,                   // Index of refraction (diamonds ~2.4, glass ~1.5)
              clearcoat: 1.0,             // Add clear coat layer
              clearcoatRoughness: 0.1,    // Make clear coat glossy
              emissive: 0x330066,         // Deep purple glow
              emissiveIntensity: 0.6,     // Stronger glow
              transparent: true,          // Enable transparency
              opacity: 0.8,               // Set to 80% opacity (semi-translucent)
              reflectivity: 1.0           // Maximum reflectivity
            });
            console.log('[MAP] Successfully created MeshPhysicalMaterial for crystal');
          } else {
            throw new Error('MeshPhysicalMaterial not available');
          }
        } catch (materialError) {
          // Fallback to MeshPhongMaterial with enhanced properties
          console.warn('[MAP] Could not create MeshPhysicalMaterial, using enhanced MeshPhongMaterial:', materialError.message);
          
          material = new this.THREE.MeshPhongMaterial({
            color: 0x9932CC,           // Purple color
            shininess: 150,             // Very shiny (increased from 90)
            specular: 0xFFFFFF,         // White specular highlights
            emissive: 0x4B0082,         // Indigo glow
            emissiveIntensity: 0.6,     // Increased glow intensity (from 0.3)
            transparent: true,          // Enable transparency
            opacity: 0.8                // Set to 80% opacity (semi-translucent)
          });
          console.log('[MAP] Created enhanced MeshPhongMaterial for crystal');
        }
        
        // Create the crystal mesh with our enhanced geometry and material
        const crystal = new this.THREE.Mesh(geometry, material);
        
        // Position the crystal on top of the hexagon with slight randomization
        const randomOffset = Math.random() * 0.05;
        crystal.position.set(
          hex.position.x + (Math.random() - 0.5) * 0.1,
          hex.position.y + this.config.hexHeight/2 + this.config.crystalHeightOffset + randomOffset,
          hex.position.z + (Math.random() - 0.5) * 0.1
        );
        console.log(`[MAP] Positioned crystal at: ${crystal.position.x.toFixed(2)}, ${crystal.position.y.toFixed(2)}, ${crystal.position.z.toFixed(2)}`);
        
        // Apply only a 360-degree rotation around Y axis to keep crystals upright
        // No need for custom rotation order since we're only rotating on Y
        
        // Full 360-degree rotation around Y axis
        crystal.rotation.y = Math.random() * Math.PI * 2;
        
        // Reset any X and Z rotation to ensure crystals are upright
        crystal.rotation.x = 0;
        crystal.rotation.z = 0;
        
        console.log(`[MAP] Applied crystal Y rotation: ${crystal.rotation.y.toFixed(2)} radians`);
        console.log(`[MAP] Applied random rotation: ${crystal.rotation.x.toFixed(2)}, ${crystal.rotation.y.toFixed(2)}, ${crystal.rotation.z.toFixed(2)}`);
        
        // Add to scene and associate with hex
        this.scene.add(crystal);
        hex.userData.crystal = crystal;
        
        // Log success with crystal details
        console.log(`[MAP] Enhanced fallback crystal placed on hex (${hex.userData.q}, ${hex.userData.r})`, {
          materialType: material.type,
          geometryType: geometry.type,
          vertexCount: geometry.attributes.position.count
        });
        
        return crystal;
      } catch (error) {
        console.error('[MAP] Critical error creating fallback crystal:', error);
        console.error('[MAP] Error details:', error.message);
        console.error('[MAP] Error stack:', error.stack);
      }
    };
    
    console.log('[MAP] Crystal methods initialized');
  }
  
  /**
   * Initialize geometry and materials needed for map generation
   */
  initGeometryAndMaterials() {
    // Create hexagon geometry
    debugLog(`Creating hexagon geometry with radius: ${this.config.hexRadius}`);
    this.hexGeometry = new this.THREE.CylinderGeometry(
      this.config.hexRadius,
      this.config.hexRadius,
      this.config.hexHeight,
      6
    );
    
    // Add side material (edges of hexagons)
    this.edgeMaterial = new this.THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
    });
    
    // Define fallback materials if textures fail to load
    this.fallbackMaterials = [
      new this.THREE.MeshPhongMaterial({ color: 0xff5733, shininess: 50, specular: 0x555555 }), // Combat
      new this.THREE.MeshPhongMaterial({ color: 0x7cfc00, shininess: 50, specular: 0x555555 }), // Corrosion
      new this.THREE.MeshPhongMaterial({ color: 0x581845, shininess: 50, specular: 0x555555 }), // Dark
      new this.THREE.MeshPhongMaterial({ color: 0x964b00, shininess: 50, specular: 0x555555 }), // Earth
      new this.THREE.MeshPhongMaterial({ color: 0xffff00, shininess: 50, specular: 0x555555 }), // Electric
      new this.THREE.MeshPhongMaterial({ color: 0xff4500, shininess: 50, specular: 0x555555 }), // Fire
      new this.THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 50, specular: 0x555555 }), // Light
      new this.THREE.MeshPhongMaterial({ color: 0xc0c0c0, shininess: 50, specular: 0x555555 }), // Metal
      new this.THREE.MeshPhongMaterial({ color: 0x2ecc71, shininess: 50, specular: 0x555555 }), // Plant
      new this.THREE.MeshPhongMaterial({ color: 0xd8bfd8, shininess: 50, specular: 0x555555 }), // Spirit
      new this.THREE.MeshPhongMaterial({ color: 0x3498db, shininess: 50, specular: 0x555555 }), // Water
      new this.THREE.MeshPhongMaterial({ color: 0xc6e2ff, shininess: 50, specular: 0x555555 }), // Wind
    ];
    
    // Initialize map for storing hex materials
    this.hexMaterials = {};
  }
  
  /**
   * Load textures for all element types
   */
  loadTextures() {
    // Create texture loader with error handling
    debugLog("Loading textures for all element types...");
    const textureLoader = new this.THREE.TextureLoader();
    
    // Texture configuration
    const textureConfig = {
      verticalMarginRatio: 0, // No margin adjustment
      debug: true, // Set to true to see debugging logs about texture adjustments
    };
    
    // Start loading all textures
    this.elementTypes.forEach((element, index) => {
      debugLog(`Loading texture for ${element} element...`);
      
      textureLoader.load(
        // URL
        this.elemUrls[element],
        
        // onLoad callback
        (texture) => {
          debugLog(`Successfully loaded ${element} texture`);
          
          // Use default texture mapping (no offset)
          texture.repeat.set(1, 1);
          texture.offset.set(0, 0);
          
          if (textureConfig.debug) {
            console.log(`[TEXTURE] Applied texture offset for ${element}:`, {
              verticalMargin: textureConfig.verticalMarginRatio,
              repeat: texture.repeat.toArray(),
              offset: texture.offset.toArray(),
            });
          }
          
          // Create material with the loaded texture and enhanced properties
          const material = new this.THREE.MeshPhongMaterial({
            map: texture,
            shininess: 70,
            specular: 0x666666,
            emissive: 0x333333,
            emissiveIntensity: 0.4,
            transparent: true,
            side: this.THREE.DoubleSide,
            color: 0xffffff,
          });
          
          // Log material creation with enhanced properties
          if (textureConfig.debug) {
            console.log(
              `[MATERIAL] Created enhanced material for ${element} with properties:`,
              {
                shininess: material.shininess,
                specular: material.specular.getHexString(),
                emissive: material.emissive.getHexString(),
                emissiveIntensity: material.emissiveIntensity,
              }
            );
          }
          
          // Store the material
          this.hexMaterials[element] = material;
          textureLoadingTracker.textures[element] = texture;
          textureLoadingTracker.loaded++;
          
          this.updateLoadingStatus();
        },
        
        // onProgress callback (not used)
        undefined,
        
        // onError callback
        (error) => {
          console.error(`Failed to load texture for ${element}:`, error);
          
          // Use fallback material
          debugLog(`Using fallback material for ${element}`);
          this.hexMaterials[element] = this.fallbackMaterials[index];
          textureLoadingTracker.failed++;
          
          this.updateLoadingStatus();
        }
      );
    });
  }
  
  /**
   * Update the loading status and generate the map when all textures are loaded
   */
  updateLoadingStatus() {
    const total = textureLoadingTracker.total;
    const loaded = textureLoadingTracker.loaded;
    const failed = textureLoadingTracker.failed;
    
    debugLog(
      `Texture loading progress: ${loaded}/${total} loaded, ${failed} failed`
    );
    
    // Check if all textures are processed (either loaded or failed)
    if (loaded + failed === total) {
      debugLog("All textures processed. Ready to generate map.");
      
      // Check if we already have hexagons to avoid duplicate generation
      if (this.hexagons && this.hexagons.length > 0) {
        console.log(`[MAP] Map already generated with ${this.hexagons.length} hexagons, skipping generation`);
        
        // Ensure callbacks are still triggered even if we skip generation
        if (this.onMapGeneratedCallback) {
          console.log('[MAP] Triggering onMapGenerated callback with existing hexagons');
          this.onMapGeneratedCallback(this.hexagons);
        }
        
        return;
      }
      
      // If no hexagons yet, proceed with generation
      this.generateHexagonGrid();
    }
  }
  
  /**
   * Set a callback to be called when the map generation is complete
   * @param {Function} callback - The callback function
   */
  onMapGenerated(callback) {
    this.onMapGeneratedCallback = callback;
  }
  
  /**
   * Create an individual hexagon with the given coordinates
   * @param {number} q - q coordinate in axial system
   * @param {number} r - r coordinate in axial system
   * @param {number} horizontalSpacing - Horizontal spacing between hexagons
   * @param {number} verticalFactor - Vertical spacing factor
   * @returns {Object} - The created hexagon mesh
   */
  createHex(q, r, horizontalSpacing = 1.5, verticalFactor = 1.0) {
    // Assign element type - for now, random selection
    const randomElement =
      this.elementTypes[Math.floor(Math.random() * this.elementTypes.length)];
    
    // Get appropriate material based on element type
    const hexMaterial = this.hexMaterials[randomElement] || this.fallbackMaterials[0];
    
    // Create multi-material for top/bottom and side
    const materials = [
      this.edgeMaterial, // Side
      hexMaterial, // Top
      hexMaterial, // Bottom
    ];
    
    // Create mesh with geometry and materials
    const hex = new this.THREE.Mesh(this.hexGeometry, materials);
    
    // Store element data for game logic
    hex.userData.element = randomElement;
    hex.userData.q = q;
    hex.userData.r = r;
    
    // Make sure raycast works properly by adding a proper name and enabling raycasting
    hex.name = `Hex_${q}_${r}_${randomElement}`;
    hex.raycast = this.THREE.Mesh.prototype.raycast;
    
    // Position hexagon in grid
    // For perfect fit in axial coordinate system:
    // x = hexRadius * 3/2 * q
    // z = hexRadius * sqrt(3) * (r + q/2)
    const x = this.config.hexRadius * horizontalSpacing * q;
    const z = this.config.hexRadius * Math.sqrt(3) * verticalFactor * (r + q / 2);
    hex.position.set(x, 0, z);
    
    // Debug rotation values for troubleshooting
    debugLog(
      `Creating hex at (${q},${r}) with position (${x},0,${z}) - Element: ${randomElement}`
    );
    
    // In THREE.js, cylinders stand upright along Y axis by default
    // We need to rotate them 30 degrees (π/6 radians) around the Y axis
    // for the hexagons to align properly in the grid
    hex.rotation.x = 0;
    hex.rotation.y = Math.PI / 6; // 30 degrees rotation
    hex.rotation.z = 0;
    
    // Add to scene
    this.scene.add(hex);
    
    // Spawn crystal shard with configured probability
    this.trySpawnCrystalShard(hex);
    
    return hex;
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
  trySpawnCrystalShard(hex) {
    try {
      // Log the evaluation process for debugging
      console.log(`[MAP] Evaluating crystal spawn for hex at (${hex.userData.q}, ${hex.userData.r})`);
      
      // First validate the hex is a valid object with necessary properties
      if (!hex || !hex.userData || hex.userData.crystal) {
        console.log(`[MAP] Skipping crystal spawn - invalid hex or crystal already exists`);
        return;
      }
      
      // Check if we should spawn a crystal based on probability
      if (Math.random() >= this.config.crystalSpawnChance) {
        console.log(`[MAP] Crystal spawn skipped for hex at (${hex.userData.q}, ${hex.userData.r}) - random check failed`); 
        return;
      }
      
      console.log(`[MAP] Spawning crystal shard on hex at (${hex.userData.q}, ${hex.userData.r})`);
      
      // Initialize the crystal loader if it doesn't exist yet
      this.initializeCrystalLoader();
      
      // If we have a crystal loader, use it to load the model
      if (this.crystalLoader) {
        this.loadCrystalModel(hex);
      } else {
        // Otherwise use the fallback crystal method
        this.ensureFallbackCrystalMethod();
        this.createFallbackCrystal(hex);
      }
    } catch (error) {
      console.error('[MAP] Critical error in trySpawnCrystalShard:', error);
      console.error('[MAP] Error details:', error.message);
      console.error('[MAP] Stack trace:', error.stack);
      // Attempt to create a fallback crystal as a last resort
      try {
        this.ensureFallbackCrystalMethod();
        this.createFallbackCrystal(hex);
      } catch (fallbackError) {
        console.error('[MAP] Even fallback crystal creation failed:', fallbackError);
      }
    }
  }
  
  /**
   * Initialize the crystal loader if it doesn't exist
   * Uses the FBXLoader from CDN with robust error handling and enhanced debugging
   */
  initializeCrystalLoader() {
    if (this.crystalLoader) {
      console.log('[MAP] Crystal loader already exists - skipping initialization', {
        loaderType: this.crystalLoader.constructor.name,
        timeInitialized: this._crystalLoaderInitTime || 'unknown'
      });
      return; // Already initialized
    }
    
    console.log('[MAP] Crystal loader not initialized yet, starting setup process');
    this._crystalLoaderInitTime = new Date().toISOString();
    
    try {
      // Extended diagnostics for FBXLoader availability
      const diagnostics = {
        loaderVariable: typeof FBXLoader,
        windowLoader: typeof window.FBXLoader,
        threeLoaded: typeof THREE !== 'undefined',
        fbxLoaderLoaded: typeof window.fbxLoaderLoaded !== 'undefined' ? window.fbxLoaderLoaded : false,
        loadAttempted: window._fbxLoaderLoadAttempted || false,
        // Safely check for dynamic import support without causing syntax errors
        browserSupportsModules: (function() {
          try {
            // Check if import is defined in window (it won't be in non-module contexts)
            return typeof window.dynamicImport === 'function' || 
                   ('noModule' in document.createElement('script'));
          } catch(e) {
            console.log('[MAP] Module support detection error:', e);
            return false;
          }
        })(),
        documentReadyState: document.readyState,
        timestamp: new Date().toISOString(),
        // Check for any errors in loading
        anyRecentErrors: window._fbxLoaderErrors || [],
        CDN_URL: 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js'
      };
      
      console.log('[MAP] Extended FBXLoader diagnostics:', diagnostics);
      
      // Force validation of FBXLoader
      let fbxLoaderValid = false;
      try {
        // Test if the FBXLoader is a proper constructor by creating a test instance
        if (typeof FBXLoader === 'function') {
          const testLoader = new FBXLoader();
          fbxLoaderValid = (testLoader && typeof testLoader.load === 'function');
          
          console.log('[MAP] FBXLoader validation test:', {
            created: !!testLoader, 
            hasLoadMethod: typeof testLoader?.load === 'function',
            valid: fbxLoaderValid
          });
        }
      } catch (testError) {
        console.error('[MAP] FBXLoader validation failed:', testError);
        fbxLoaderValid = false;
      }
      
      // Scenario 1: FBXLoader is already available and validated - use it immediately
      if (fbxLoaderValid) {
        console.log('[MAP] Using existing validated FBXLoader constructor');
        this.crystalLoader = new FBXLoader();
        this._crystalLoaderSource = 'direct';
        this.loadCrystalTexture();
        return;
      }
      
      // Scenario 2: FBXLoader isn't loaded yet or failed validation - load it from CDN
      console.log('[MAP] FBXLoader not available or invalid, attempting to load from CDN');
      
      // Track whether this is the first attempt to prevent multiple simultaneous loads
      if (!window._fbxLoaderLoadAttempted) {
        window._fbxLoaderLoadAttempted = true;
        window._fbxLoaderErrors = [];
        
        // Load the FBXLoader from CDN with timeout
        const loadPromise = loadFBXLoader();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('FBXLoader load timeout after 5000ms')), 5000);
        });
        
        Promise.race([loadPromise, timeoutPromise])
          .then(success => {
            console.log('[MAP] FBXLoader loaded successfully from CDN');
            
            // Validate the newly loaded FBXLoader
            let validLoader = false;
            try {
              if (typeof FBXLoader === 'function') {
                const testLoader = new FBXLoader();
                validLoader = (testLoader && typeof testLoader.load === 'function');
              }
            } catch (validationError) {
              console.error('[MAP] Post-load FBXLoader validation failed:', validationError);
              window._fbxLoaderErrors.push(validationError.message);
              validLoader = false;
            }
            
            // If loader is valid and crystalLoader hasn't been initialized by another method yet
            if (!this.crystalLoader && validLoader) {
              console.log('[MAP] Creating FBXLoader after async load');
              this.crystalLoader = new FBXLoader();
              this._crystalLoaderSource = 'async';
              this.loadCrystalTexture();
            } else if (!validLoader) {
              console.error('[MAP] FBXLoader loaded but failed validation');
              // Ensure fallback crystals will be used
              this.crystalLoader = null;
            }
          })
          .catch(error => {
            console.error('[MAP] Failed to load FBXLoader from CDN:', error);
            window._fbxLoaderErrors.push(error.message);
            // Ensure fallback crystals will be used
            this.crystalLoader = null;
          });
      } else {
        console.log('[MAP] FBXLoader loading already in progress, waiting for completion');
      }
      
      // Scenario 3: Use fallback while async loading happens
      console.warn('[MAP] Using fallback crystals while waiting for FBXLoader to load asynchronously');
      this.crystalLoader = null;
      this._crystalLoaderSource = 'fallback';
    } catch (error) {
      console.error('[MAP] Error initializing crystal loader:', error);
      this.crystalLoader = null;
    }
  }
  
  /**
   * Make sure the fallback crystal method exists
   * Creates an emergency implementation if needed
   */
  ensureFallbackCrystalMethod() {
    if (typeof this.createFallbackCrystal === 'function') {
      return; // Method already exists
    }
    
    console.error('[MAP] Critical error: createFallbackCrystal is not defined!');
    
    /**
     * Emergency fallback crystal creation method
     * Used as a last resort if the normal fallback method is missing
     * @param {Object} hex - The hexagon to place the crystal on
     * @returns {Object|null} - The created crystal mesh or null on failure
     */
    this.createFallbackCrystal = (hex) => {
      console.log('[MAP] Using emergency inline fallback crystal creation for hex:', {
        position: hex?.position ? [hex.position.x, hex.position.y, hex.position.z] : 'undefined',
        userData: hex?.userData || 'missing userData'
      });
      
      try {
        // Validate the hex object
        if (!hex || !hex.position) {
          console.error('[MAP] Invalid hex provided to emergency fallback crystal creation');
          return null;
        }
        
        // Create a more interesting emergency fallback crystal
        console.log('[MAP] Creating emergency fallback crystal geometry');
        const crystalGeometry = new this.THREE.ConeGeometry(0.2, 0.5, 5); // More sides for better look
        
        // Create a more advanced material for the emergency fallback
        console.log('[MAP] Creating emergency fallback crystal material');
        const crystalMaterial = new this.THREE.MeshPhongMaterial({
          color: 0x8844AA,           // Purple color
          shininess: 120,             // Increased shininess
          specular: 0xFFFFFF,         // White highlights
          emissive: 0x330066,         // Purple glow
          emissiveIntensity: 0.7,     // Strong glow
          transparent: true,          // Enable transparency
          opacity: 0.8                // 80% opacity (semi-translucent)
        });
        
        // Log material creation
        console.log('[MAP] Emergency fallback crystal material created:', {
          type: crystalMaterial.type,
          shininess: crystalMaterial.shininess,
          emissiveIntensity: crystalMaterial.emissiveIntensity
        });
        
        // Create the mesh
        const crystal = new this.THREE.Mesh(crystalGeometry, crystalMaterial);
        
        // Position slightly above hex with small random offset for natural look
        const hexPosition = hex.position.clone();
        const randomOffset = (Math.random() - 0.5) * 0.1; // Small random offset
        hexPosition.y += 0.35 + randomOffset; // Position above the hex
        crystal.position.copy(hexPosition);
        
        // Log position data
        console.log('[MAP] Emergency crystal positioned at:', {
          x: crystal.position.x.toFixed(2),
          y: crystal.position.y.toFixed(2),
          z: crystal.position.z.toFixed(2),
          hexY: hex.position.y.toFixed(2),
          calculatedOffset: (0.35 + randomOffset).toFixed(2)
        });
        
        // Apply only a 360-degree rotation around Y axis
        // Full 360-degree rotation around Y axis keeping crystals upright
        crystal.rotation.y = Math.random() * Math.PI * 2;
        
        // Reset X and Z rotations to ensure crystal is perfectly upright
        crystal.rotation.x = 0;
        crystal.rotation.z = 0;
        
        // Log the applied rotation
        console.log(`[MAP] Applied emergency crystal Y rotation: ${crystal.rotation.y.toFixed(2)} radians`);
        
        // Add to scene and hex's userData
        this.scene.add(crystal);
        hex.userData.crystal = crystal;
        
        // Log successful creation
        console.log(`[MAP] Emergency fallback crystal placed on hex (${hex.userData.q || '?'}, ${hex.userData.r || '?'})`);
        
        return crystal;
      } catch (err) {
        console.error('[MAP] Emergency fallback crystal creation failed:', err);
        return null;
      }
    };
    
    console.log('[MAP] Emergency fallback crystal method defined');
  }
  
  /**
   * Load a crystal model for a specific hex using the FBXLoader
   * Enhanced with detailed debugging logs and error diagnostics
   * @param {Object} hex - The hexagon to place the crystal on
   */
  loadCrystalModel(hex) {
    // Pre-validation: Check if the crystal loader is available
    if (!this.crystalLoader) {
      console.error('[MAP] Crystal loader unavailable', {
        source: this._crystalLoaderSource || 'unknown',
        errors: window._fbxLoaderErrors || [],
        attempted: true,
        timestamp: new Date().toISOString()
      });
      
      // Fall back to simplified crystal rendering
      this.ensureFallbackCrystalMethod();
      this.createFallbackCrystal(hex);
      return;
    }
    
    // Pre-validation: Check if the hex object is valid
    if (!hex || !hex.position) {
      console.error('[MAP] Invalid hex provided to loadCrystalModel', {
        hex: hex ? 'object exists but incomplete' : 'null/undefined',
        hasPosition: hex?.position ? true : false,
        userData: hex?.userData || 'missing userData'
      });
      return;
    }
    
    // Log start of loading process with detailed information
    const loadStart = performance.now();
    console.log('[MAP] Starting crystal model load', {
      path: this.config.crystalModelPath,
      loaderType: this.crystalLoader.constructor.name,
      loaderSource: this._crystalLoaderSource || 'unknown',
      hexCoords: hex.userData?.q !== undefined ? `(${hex.userData.q}, ${hex.userData.r})` : 'unknown',
      hexPosition: [hex.position.x.toFixed(2), hex.position.y.toFixed(2), hex.position.z.toFixed(2)]
    });
    
    try {
      // Attempt to load the crystal model using FBXLoader
      this.crystalLoader.load(
        // Model path from config
        this.config.crystalModelPath,
        
        // onLoad callback - called when model is successfully loaded
        (object) => {
          try {
            // Log successful load with timing information
            console.log('[MAP] Crystal model loaded successfully', {
              timeTaken: (performance.now() - loadStart).toFixed(2) + 'ms',
              childCount: object.children?.length || 0,
              hasAnimations: object.animations?.length > 0,
              objectType: object.type || 'unknown'
            });
            
            // Pre-processing validation
            if (!object) {
              throw new Error('Loaded object is null or undefined');
            }
            
            // Scale down the crystal to an appropriate size
            const scaleFactor = this.config.crystalScaleFactor;
            object.scale.set(scaleFactor, scaleFactor, scaleFactor);
            console.log('[MAP] Crystal scaled', { 
              factor: scaleFactor,
              resultingSize: `~${(scaleFactor * 100).toFixed(1)}% of original`
            });
            
            // Position the crystal on top of the hexagon with slight randomization for natural look
            const randomXOffset = (Math.random() - 0.5) * 0.1; // ±0.05 units X
            const randomZOffset = (Math.random() - 0.5) * 0.1; // ±0.05 units Z
            const randomYOffset = (Math.random() - 0.5) * 0.1; // ±0.05 units Y
            
            // Calculate position with all components
            const baseYPosition = hex.position.y + (this.config.hexHeight / 2);
            const finalYPosition = baseYPosition + this.config.crystalHeightOffset + randomYOffset;
            
            // Apply the calculated position
            object.position.set(
              hex.position.x + randomXOffset,
              finalYPosition,
              hex.position.z + randomZOffset
            );
            
            // Log detailed positioning information
            console.log('[MAP] Crystal positioned', {
              final: [object.position.x.toFixed(2), object.position.y.toFixed(2), object.position.z.toFixed(2)],
              hexBase: [hex.position.x.toFixed(2), hex.position.y.toFixed(2), hex.position.z.toFixed(2)],
              heightComponents: {
                hexBase: hex.position.y.toFixed(2),
                halfHeight: (this.config.hexHeight / 2).toFixed(2),
                offset: this.config.crystalHeightOffset.toFixed(2),
                random: randomYOffset.toFixed(2),
                total: finalYPosition.toFixed(2)
              },
              randomOffsets: [randomXOffset.toFixed(3), randomYOffset.toFixed(3), randomZOffset.toFixed(3)]
            });
            
            // Apply only Y-axis rotation to keep crystals upright
            const randomYRotation = Math.random() * Math.PI * 2; // 0 to 2π (0-360°)
            object.rotation.set(0, randomYRotation, 0); // Explicitly set all 3 axes
            
            console.log('[MAP] Crystal rotation applied', {
              yRotation: `${randomYRotation.toFixed(2)} rad (${(randomYRotation * 180 / Math.PI).toFixed(0)}°)`,
              xRotation: '0 rad (upright)',
              zRotation: '0 rad (upright)'
            });
            
            // Apply enhanced materials and textures
            console.log('[MAP] Beginning material enhancement for crystal model');
            
            // Track statistics for reporting
            let stats = {
              meshesProcessed: 0,
              meshesEnhanced: 0,
              materialTypes: {},
              errors: []
            };
            
            // Traverse the object hierarchy to apply materials
            object.traverse((child) => {
              if (child.isMesh) {
                stats.meshesProcessed++;
                
                console.log(`[MAP] Processing mesh in crystal model:`, {
                  name: child.name || `unnamed-${stats.meshesProcessed}`,
                  vertexCount: child.geometry?.attributes?.position?.count || 'unknown',
                  materialType: child.material?.type || 'unknown'
                });
                
                try {
                  // Store original material properties we want to preserve
                  const originalColor = child.material?.color ? 
                    child.material.color.clone() : 
                    new this.THREE.Color(0x9932CC); // Default purple if no color
                  
                  const originalMap = this.crystalTextureLoaded ? 
                    this.crystalTexture : 
                    child.material?.map;
                  
                  // Track material type for diagnostics
                  const materialType = child.material?.type || 'unknown';
                  stats.materialTypes[materialType] = (stats.materialTypes[materialType] || 0) + 1;
                  
                  // Try to create a physical material for better realism
                  if (this.THREE.MeshPhysicalMaterial) {
                    // Create enhanced physical material
                    const enhancedMaterial = new this.THREE.MeshPhysicalMaterial({
                      map: originalMap,             // Keep original texture if any
                      color: originalColor,         // Keep original color
                      metalness: 0.6,               // More metallic for shine
                      roughness: 0.15,              // Very smooth surface
                      transmission: 0.7,            // Significant transparency
                      thickness: 0.6,               // Material thickness for refraction
                      ior: 1.6,                     // Index of refraction (between glass and diamond)
                      clearcoat: 0.8,               // Add clear coat layer
                      clearcoatRoughness: 0.1,      // Glossy clear coat
                      emissive: new this.THREE.Color(0x330066),  // Purple glow
                      emissiveIntensity: 0.8,       // Strong glow
                      transparent: true,            // Enable transparency
                      opacity: 0.8                  // 80% opacity (semi-translucent)
                    });
                    
                    // Replace the original material
                    child.material = enhancedMaterial;
                    stats.meshesEnhanced++;
                    
                    console.log(`[MAP] Applied MeshPhysicalMaterial to mesh: ${child.name || 'unnamed'}`);
                  } else {
                    // If physical material isn't available, enhance the existing material
                    console.log('[MAP] Physical material not available, enhancing existing material properties');
                    
                    // Keep the existing material but enhance its properties
                    if (child.material.map || this.crystalTextureLoaded) {
                      child.material.map = this.crystalTextureLoaded ? this.crystalTexture : child.material.map;
                    }
                    
                    // Enhance standard properties available in most materials
                    if (child.material.shininess !== undefined) child.material.shininess = 150;
                    if (child.material.specular !== undefined) child.material.specular = new this.THREE.Color(0xFFFFFF);
                    child.material.emissive = new this.THREE.Color(0x330066);
                    child.material.emissiveIntensity = 0.8;
                    
                    // Make it transparent if possible with 80% opacity
                    child.material.transparent = true;
                    child.material.opacity = 0.8;
                    
                    stats.meshesEnhanced++;
                  }
                  
                  // Force material update
                  child.material.needsUpdate = true;
                  
                } catch (materialError) {
                  // Log the specific error with context
                  const errorMsg = `Error enhancing material for mesh ${child.name || 'unnamed'}`;
                  console.error(`[MAP] ${errorMsg}:`, materialError);
                  stats.errors.push({
                    mesh: child.name || `unnamed-${stats.meshesProcessed}`,
                    error: materialError.message,
                    materialType: child.material?.type || 'unknown'
                  });
                  
                  // Apply texture only if material enhancement fails
                  if (this.crystalTextureLoaded && this.crystalTexture) {
                    try {
                      child.material.map = this.crystalTexture;
                      child.material.needsUpdate = true;
                      console.log(`[MAP] Applied fallback texture to mesh: ${child.name || 'unnamed'}`);
                    } catch (textureError) {
                      console.error(`[MAP] Unable to apply fallback texture:`, textureError);
                    }
                  }
                }
              }
            });
            
            // Log comprehensive enhancement summary
            console.log('[MAP] Crystal material enhancement completed', {
              totalMeshes: stats.meshesProcessed,
              enhancedMeshes: stats.meshesEnhanced,
              successRate: stats.meshesProcessed ? 
                `${((stats.meshesEnhanced / stats.meshesProcessed) * 100).toFixed(1)}%` : 
                'N/A',
              materialTypesFound: stats.materialTypes,
              errors: stats.errors.length,
              timeSinceLoadStart: (performance.now() - loadStart).toFixed(2) + 'ms'
            });
            
            // Add to scene and associate with hex for future reference
            this.scene.add(object);
            hex.userData.crystal = object;
            
            console.log(`[MAP] Crystal placement completed`, {
              hexCoords: hex.userData?.q !== undefined ? `(${hex.userData.q}, ${hex.userData.r})` : 'unknown',
              hexPosition: [hex.position.x.toFixed(2), hex.position.y.toFixed(2), hex.position.z.toFixed(2)],
              totalTimeTaken: (performance.now() - loadStart).toFixed(2) + 'ms'
            });
          } catch (modelError) {
            // Catch and log any errors during model processing
            console.error('[MAP] Error processing loaded crystal model:', {
              errorMsg: modelError.message,
              errorName: modelError.name,
              errorStack: modelError.stack?.split('\n')[0] || 'No stack trace',
              timeTaken: (performance.now() - loadStart).toFixed(2) + 'ms',
              hexCoords: hex.userData?.q !== undefined ? `(${hex.userData.q}, ${hex.userData.r})` : 'unknown'
            });
            
            // Fall back to simplified crystal
            this.ensureFallbackCrystalMethod();
            this.createFallbackCrystal(hex);
          }
        },
        
        // onProgress callback - provides loading percentage updates
        (xhr) => {
          if (xhr.lengthComputable) {
            // Calculate loading percentage and log with details
            const percent = ((xhr.loaded / xhr.total) * 100).toFixed(2);
            
            console.log('[MAP] Crystal model loading progress', {
              percent: `${percent}%`,
              loaded: `${(xhr.loaded / 1024).toFixed(2)}KB`,
              total: `${(xhr.total / 1024).toFixed(2)}KB`,
              timeSoFar: (performance.now() - loadStart).toFixed(2) + 'ms'
            });
          } else {
            // Log when progress is not computable
            console.log('[MAP] Crystal model loading in progress (size unknown)', {
              timeSoFar: (performance.now() - loadStart).toFixed(2) + 'ms'
            });
          }
        },
        
        // onError callback - called when loading fails
        (error) => {
          console.error('[MAP] Crystal model load failed', {
            errorMsg: error.message || 'Unknown error',
            errorType: error.constructor.name,
            timeTaken: (performance.now() - loadStart).toFixed(2) + 'ms',
            path: this.config.crystalModelPath,
            loader: this.crystalLoader?.constructor.name,
            loaderSource: this._crystalLoaderSource || 'unknown'
          });
          
          // Attempt to use fallback crystal if model loading fails
          this.ensureFallbackCrystalMethod();
          this.createFallbackCrystal(hex);
        }
      );
    } catch (error) {
      // Catch any errors that might occur when initiating the load
      console.error('[MAP] Error initiating crystal model load:', {
        errorMsg: error.message,
        errorType: error.constructor.name,
        timeTaken: (performance.now() - loadStart).toFixed(2) + 'ms',
        path: this.config.crystalModelPath,
        hexCoords: hex.userData?.q !== undefined ? `(${hex.userData.q}, ${hex.userData.r})` : 'unknown'
      });
      
      // Use fallback crystal approach
      this.ensureFallbackCrystalMethod();
      this.createFallbackCrystal(hex);
    }
  }
  
  /**
   * Generate the entire hexagon grid with the specified spacing parameters
   * This is the main map generation function that creates all hexagons and their properties
   * 
   * @param {number} horizontalSpacing - Horizontal spacing between hexagons (default: 1.5)
   * @param {number} verticalFactor - Vertical spacing factor (default: 1.0)
   */
  generateHexagonGrid(horizontalSpacing = 1.5, verticalFactor = 1.0) {
    console.log('[MAP] Starting hexagon grid generation with params:', {
      horizontalSpacing,
      verticalFactor,
      configSpacing: this.config.horizontalSpacing,
      configVertical: this.config.verticalFactor,
      gridRadius: this.config.gridRadius
    });
    horizontalSpacing = horizontalSpacing || this.config.horizontalSpacing;
    verticalFactor = verticalFactor || this.config.verticalFactor;
    
    const gridRadius = this.config.gridRadius;
    debugLog(
      `Generating hex grid with radius ${gridRadius}, spacing: h=${horizontalSpacing}, v=${verticalFactor}`
    );
    
    // Track element distribution for debugging
    const elementDistribution = {};
    this.elementTypes.forEach((element) => {
      elementDistribution[element] = 0;
    });
    
    // Track crystal spawning statistics
    const crystalStats = {
      total: 0,
      spawned: 0
    };
    
    // Clear any existing hexagons if we're regenerating
    if (this.hexagons.length > 0) {
      debugLog("Clearing existing hexagons before regeneration");
      this.hexagons.forEach((hex) => {
        // Also remove any crystal attached to this hex
        if (hex.userData.crystal) {
          this.scene.remove(hex.userData.crystal);
        }
        this.scene.remove(hex);
      });
      this.hexagons.length = 0;
      this.hexCount = 0;
    }
    
    console.log('[MAP] Beginning map generation with grid radius:', gridRadius);
    
    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (
        let r = Math.max(-gridRadius, -q - gridRadius);
        r <= Math.min(gridRadius, -q + gridRadius);
        r++
      ) {
        const hex = this.createHex(q, r, horizontalSpacing, verticalFactor);
        this.hexagons.push(hex);
        this.hexCount++;
        
        // Track element distribution if hex has element data
        if (hex.userData.element) {
          elementDistribution[hex.userData.element]++;
        }
        
        // Track crystal statistics for post-generation reporting
        crystalStats.total++;
        if (hex.userData.crystal) {
          crystalStats.spawned++;
        }
        
        // Log progress every 20 hexagons to show generation status
        if (this.hexCount % 20 === 0) {
          debugLog(`Created ${this.hexCount} hexagons so far...`);
        }
      }
    }
    
    debugLog(`Grid generation complete: ${this.hexagons.length} hexagons created`);
    debugLog("Element distribution:", elementDistribution);
    
    // Log crystal spawning statistics
    const crystalPercentage = (crystalStats.spawned / crystalStats.total * 100).toFixed(1);
    debugLog(`Crystal spawning: ${crystalStats.spawned}/${crystalStats.total} hexes (${crystalPercentage}%)`);
    
    // Call the callback if it exists
    if (this.onMapGeneratedCallback) {
      this.onMapGeneratedCallback(this.hexagons);
    }
    
    return this.hexagons;
  }
  
  /**
   * Get all hexagons on the map
   * @returns {Array} - Array of hexagon meshes
   */
  getHexagons() {
    return this.hexagons;
  }
  
  /**
   * Find a hexagon by its grid coordinates
   * @param {number} q - q coordinate
   * @param {number} r - r coordinate
   * @returns {Object|null} - The found hexagon or null
   */
  findHexByCoordinates(q, r) {
    return this.hexagons.find(hex => 
      hex.userData.q === q && hex.userData.r === r
    ) || null;
  }
  
  /**
   * Find hexagons that contain a specific element type
   * @param {string} elementType - The element type to search for
   * @returns {Array} - Array of matching hexagons
   */
  findHexesByElement(elementType) {
    console.log(`[MAP] Finding hexes with element: ${elementType}`);
    return this.hexagons.filter(hex => hex.userData.element === elementType);
  }
  
  /**
   * Find a random hexagon of a specific element type
   * @param {string} elementType - The element type to search for
   * @returns {Object|null} - A random hexagon with the specified element or null
   */
  findRandomHexOfElement(elementType) {
    const hexesOfElement = this.findHexesByElement(elementType);
    if (hexesOfElement.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * hexesOfElement.length);
    return hexesOfElement[randomIndex];
  }
  
  /**
   * Update configuration settings
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = {...this.config, ...newConfig};
    debugLog("Updated map configuration:", this.config);
  }
}

// Export element types as a constant for other modules to use
// This allows other modules to reference these without duplicating the values
export const ELEMENT_TYPES = [
  'Combat',
  'Corrosion',
  'Dark',
  'Earth',
  'Electric',
  'Fire',
  'Light',
  'Metal',
  'Plant',
  'Spirit',
  'Water',
  'Wind',
];
