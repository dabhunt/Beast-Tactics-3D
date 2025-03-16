/**
 * MapGeneration.js
 * Responsible for generating and managing the hexagonal grid map system
 * including biome distribution, crystal shard spawning, and related functionality.
 */

// Try to import FBXLoader if available
let FBXLoader;

// Different possible paths to try for loading FBXLoader
const FBXLOADER_PATHS = [
  'three/addons/loaders/FBXLoader.js',
  './libs/three/addons/loaders/FBXLoader.js',
  '/libs/three/addons/loaders/FBXLoader.js'
];

// Track if we've successfully loaded the FBXLoader
let fbxLoaderPromise = null;
let fbxLoaderSuccess = false;
let fbxLoaderAttempts = 0;

/**
 * Try loading FBXLoader from different paths until successful
 * @returns {Promise} - A promise that resolves when loader is found or all paths failed
 */
function attemptLoadFBXLoader() {
  console.log(`[MAP] Attempting to load FBXLoader (attempt ${fbxLoaderAttempts + 1}/${FBXLOADER_PATHS.length})`);
  
  if (fbxLoaderAttempts >= FBXLOADER_PATHS.length) {
    console.warn('[MAP] All FBXLoader import attempts failed');
    return Promise.resolve(false);
  }
  
  const path = FBXLOADER_PATHS[fbxLoaderAttempts];
  console.log(`[MAP] Trying to import FBXLoader from: ${path}`);
  
  return import(path)
    .then(module => {
      FBXLoader = module.FBXLoader;
      console.log('[MAP] FBXLoader imported successfully from:', path);
      fbxLoaderSuccess = true;
      return true;
    })
    .catch(error => {
      console.warn(`[MAP] Failed to import FBXLoader from ${path}:`, error);
      fbxLoaderAttempts++;
      return attemptLoadFBXLoader(); // Try next path recursively
    });
}

// Start the loading process
try {
  fbxLoaderPromise = attemptLoadFBXLoader();
} catch (e) {
  console.warn('[MAP] Error setting up FBXLoader import:', e);
  fbxLoaderPromise = Promise.resolve(false);
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
      crystalScaleFactor: 0.3,  // Size of the crystal (scale)
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
    
    // Method to load crystal texture
    this.loadCrystalTexture = () => {
      console.log('[MAP] Setting up crystal texture loading');
      this.crystalTexture = new this.THREE.TextureLoader().load(
        this.config.crystalTexturePath,
        (texture) => {
          console.log('[MAP] Crystal texture loaded successfully');
          this.crystalTextureLoaded = true;
        },
        undefined,
        (error) => {
          console.error('[MAP] Error loading crystal texture:', error);
        }
      );
    };
    
    // Method to create a simple fallback crystal when model loading fails
    this.createFallbackCrystal = (hex) => {
      console.log('[MAP] Creating fallback crystal geometry for hex:', hex.userData);
      
      try {
        // Create a simple crystal geometry
        const geometry = new this.THREE.ConeGeometry(0.3, 0.6, 6);
        
        // Create a purple material for the crystal
        const material = new this.THREE.MeshPhongMaterial({
          color: 0x9932CC,       // Purple color
          shininess: 90,          // Very shiny
          specular: 0xFFFFFF,     // White specular highlights
          emissive: 0x4B0082,     // Slight indigo glow
          emissiveIntensity: 0.3, // Moderate glow intensity
        });
        
        // Create the crystal mesh
        const crystal = new this.THREE.Mesh(geometry, material);
        
        // Position the crystal on top of the hexagon
        crystal.position.set(
          hex.position.x,
          hex.position.y + this.config.hexHeight/2 + this.config.crystalHeightOffset,
          hex.position.z
        );
        
        // Add some random rotation for variety
        crystal.rotation.y = Math.random() * Math.PI * 2;
        crystal.rotation.x = Math.random() * 0.2;
        
        // Add to scene and associate with hex
        this.scene.add(crystal);
        hex.userData.crystal = crystal;
        
        // Log success
        console.log(`[MAP] Fallback crystal placed on hex (${hex.userData.q}, ${hex.userData.r})`);
      } catch (error) {
        console.error('[MAP] Error creating fallback crystal:', error);
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
   * @param {Object} hex - The hexagon mesh to potentially spawn a crystal on
   */
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
      // Using >= ensures exactly the percentage chance specified (e.g. 0.2 = 20% chance)
      if (Math.random() >= this.config.crystalSpawnChance) {
        console.log(`[MAP] Crystal spawn skipped for hex at (${hex.userData.q}, ${hex.userData.r}) - random check failed`); 
        return;
      }
      
      console.log(`[MAP] Spawning crystal shard on hex at (${hex.userData.q}, ${hex.userData.r})`);
      
      // We'll lazily load the crystal model the first time we need it
      // This avoids unnecessary loading if no crystals are spawned
      if (!this.crystalLoader) {
        console.log('[MAP] Crystal loader not initialized yet, checking available loaders');
        
        // Check if FBXLoader is available from global import
        if (typeof FBXLoader === 'function') {
          console.log('[MAP] Using imported FBXLoader');
          this.crystalLoader = new FBXLoader();
          this.loadCrystalTexture();
        }
        // Check if it's available through THREE
        else if (typeof this.THREE.FBXLoader === 'function') {
          console.log('[MAP] Using THREE.FBXLoader');
          this.crystalLoader = new this.THREE.FBXLoader();
          this.loadCrystalTexture();
        } 
        // Try alternative loader paths
        else if (typeof window.FBXLoader === 'function') {
          console.log('[MAP] Using window.FBXLoader');
          this.crystalLoader = new window.FBXLoader();
          this.loadCrystalTexture();
        }
        // If no FBXLoader is available, create a fallback crystal
        else {
          console.warn('[MAP] FBXLoader not available! Creating fallback crystal.');
          
          // Verify that createFallbackCrystal exists
          if (typeof this.createFallbackCrystal !== 'function') {
            console.error('[MAP] Critical error: createFallbackCrystal is not defined!');
            // Define it inline as emergency fallback if it wasn't created properly
            this.createFallbackCrystal = (hex) => {
              console.log('[MAP] Using emergency inline fallback crystal creation');
              
              try {
                // Create a simple geometric shape as fallback
                const crystalGeometry = new this.THREE.ConeGeometry(0.2, 0.5, 4);
                const crystalMaterial = new this.THREE.MeshPhongMaterial({
                  color: 0x8844AA,
                  shininess: 100,
                  transparent: true,
                  opacity: 0.7
                });
                
                const crystal = new this.THREE.Mesh(crystalGeometry, crystalMaterial);
                
                // Position slightly above hex
                const hexPosition = hex.position.clone();
                hexPosition.y += 0.35; // Position above the hex
                crystal.position.copy(hexPosition);
                
                // Random rotation and slight tilt
                crystal.rotation.y = Math.random() * Math.PI * 2;
                crystal.rotation.x = (Math.random() - 0.5) * 0.5;
                
                // Add to scene and hex's userData
                this.scene.add(crystal);
                hex.userData.crystal = crystal;
                
                return crystal;
              } catch (err) {
                console.error('[MAP] Emergency fallback crystal creation failed:', err);
                return null;
              }
            };
            
            console.log('[MAP] Emergency fallback crystal method defined');
          }
          
          // Create the fallback crystal and return early
          console.log('[MAP] Using fallback crystal method for hex:', hex.userData);
          this.createFallbackCrystal(hex);
          return;
        }
      }
      
      // Now load the crystal model
      // FBXLoader.load takes a URL, success callback, progress callback, and error callback
      this.crystalLoader.load(
        // Model path - using the path from config allows easy customization
        this.config.crystalModelPath,
        
        // onLoad callback - called when model is successfully loaded
        (object) => {
          try {
            console.log('[MAP] Crystal model loaded successfully');
            
            // Scale down the crystal to an appropriate size
            // We use the scaleFactor from config to allow easy adjustment
            object.scale.set(
              this.config.crystalScaleFactor,
              this.config.crystalScaleFactor,
              this.config.crystalScaleFactor
            );
            
            // Position the crystal on top of the hexagon
            // We add height to position it on the surface plus a small offset
            object.position.set(
              hex.position.x,
              hex.position.y + this.config.hexHeight/2 + this.config.crystalHeightOffset,
              hex.position.z
            );
            
            // Apply texture if available - makes the crystal look better
            if (this.crystalTextureLoaded && this.crystalTexture) {
              console.log('[MAP] Applying texture to crystal');
              // We need to traverse the object hierarchy to apply textures
              // to all meshes within the model
              object.traverse((child) => {
                if (child.isMesh) {
                  child.material.map = this.crystalTexture;
                  child.material.needsUpdate = true;
                }
              });
            }
            
            // Add to scene and associate with hex for future reference
            this.scene.add(object);
            hex.userData.crystal = object;
            
            console.log(`[MAP] Crystal placed on hex at (${hex.userData.q}, ${hex.userData.r})`);
          } catch (modelError) {
            console.error('[MAP] Error processing loaded crystal model:', modelError);
            console.error('[MAP] Error details:', modelError.message);
            console.error('[MAP] Stack trace:', modelError.stack);
            // Try to use fallback crystal if model processing fails
            if (typeof this.createFallbackCrystal === 'function') {
              console.log('[MAP] Attempting fallback crystal after model processing error');
              this.createFallbackCrystal(hex);
            }
          }
        },
        
        // onProgress callback - useful for loading indicators
        (xhr) => {
          if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(`[MAP] Crystal model ${percentComplete.toFixed(2)}% loaded`);
          }
        },
        
        // onError callback - called when loading fails
        (error) => {
          console.error('[MAP] Error loading crystal model:', error);
          console.error('[MAP] Model path attempted:', this.config.crystalModelPath);
          // Try to use fallback crystal if model loading fails
          if (typeof this.createFallbackCrystal === 'function') {
            console.log('[MAP] Creating fallback crystal due to model load error');
            this.createFallbackCrystal(hex);
          }
        }
      );
    } catch (error) {
      console.error('[MAP] Critical error in trySpawnCrystalShard:', error);
      console.error('[MAP] Error details:', error.message);
      console.error('[MAP] Stack trace:', error.stack);
      // Don't attempt to use createFallbackCrystal here as it might be the source of the error
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
