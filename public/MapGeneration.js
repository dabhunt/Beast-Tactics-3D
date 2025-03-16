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
  '/libs/three/addons/loaders/FBXLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js' // Added CDN path as fallback
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
      // Handle both direct export and named export formats
      FBXLoader = module.FBXLoader || module.default;
      console.log('[MAP] FBXLoader imported successfully from:', path, {
        type: typeof FBXLoader,
        isConstructor: typeof FBXLoader === 'function',
        moduleKeys: Object.keys(module)
      });
      
      // Store FBXLoader in window object for easier access across modules
      if (typeof FBXLoader === 'function') {
        window.FBXLoader = FBXLoader;
        fbxLoaderSuccess = true;
        return true;
      } else {
        console.warn('[MAP] Imported module does not contain valid FBXLoader:', module);
        fbxLoaderAttempts++;
        return attemptLoadFBXLoader(); // Try next path
      }
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
   * Attempts to find a valid FBXLoader from multiple sources with enhanced error handling
   */
  initializeCrystalLoader() {
    if (this.crystalLoader) {
      return; // Already initialized
    }
    
    console.log('[MAP] Crystal loader not initialized yet, checking available loaders');
    
    try {
      // Enhanced debug logging for FBXLoader availability
      console.log('[MAP] FBXLoader availability check:', {
        globalFBXLoader: typeof FBXLoader === 'function' ? 'Available' : 'Unavailable',
        windowFBXLoader: typeof window.FBXLoader === 'function' ? 'Available' : 'Unavailable',
        threeFBXLoader: this.THREE && typeof this.THREE.FBXLoader === 'function' ? 'Available' : 'Unavailable',
        threeAddons: this.THREE && this.THREE.addons ? Object.keys(this.THREE.addons) : 'No addons found'
      });
      
      // Approach 1: Check if FBXLoader is available from global import
      if (typeof FBXLoader === 'function') {
        console.log('[MAP] Using imported FBXLoader');
        this.crystalLoader = new FBXLoader();
        this.loadCrystalTexture();
        return;
      }
      
      // Approach 2: Check if it's available through THREE
      if (this.THREE && typeof this.THREE.FBXLoader === 'function') {
        console.log('[MAP] Using THREE.FBXLoader');
        this.crystalLoader = new this.THREE.FBXLoader();
        this.loadCrystalTexture();
        return;
      }
      
      // Approach 3: Try window object
      if (typeof window.FBXLoader === 'function') {
        console.log('[MAP] Using window.FBXLoader');
        this.crystalLoader = new window.FBXLoader();
        this.loadCrystalTexture();
        return;
      }
      
      // Approach 4: Try dynamic import from CDN as a fallback
      console.log('[MAP] Attempting dynamic import of FBXLoader from CDN');
      const cdnImportPromise = import('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js')
        .then(module => {
          console.log('[MAP] Successfully imported FBXLoader from CDN:', module);
          const CDNLoader = module.FBXLoader || module.default;
          if (typeof CDNLoader === 'function') {
            window.FBXLoader = CDNLoader; // Store for future use
            this.crystalLoader = new CDNLoader();
            this.loadCrystalTexture();
            return true;
          }
          return false;
        })
        .catch(error => {
          console.error('[MAP] Failed to import FBXLoader from CDN:', error);
          return false;
        });
      
      // Wait for the dynamic import to complete (with timeout)
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 3000));
      Promise.race([cdnImportPromise, timeoutPromise]).then(success => {
        if (!success) {
          // If all approaches fail, use fallback crystals
          console.warn('[MAP] All FBXLoader approaches failed! Will use fallback crystals.');
          this.crystalLoader = null;
        }
      });
      
      // Continue execution while import is happening
      console.warn('[MAP] FBXLoader not immediately available. Continuing with fallback while attempting async import.');
      this.crystalLoader = null;
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
   * @param {Object} hex - The hexagon to place the crystal on
   */
  loadCrystalModel(hex) {
    if (!this.crystalLoader) {
      console.error('[MAP] Cannot load crystal model: loader is not available');
      this.ensureFallbackCrystalMethod();
      this.createFallbackCrystal(hex);
      return;
    }
    
    try {
      // Now load the crystal model
      this.crystalLoader.load(
        // Model path - using the path from config allows easy customization
        this.config.crystalModelPath,
        
        // onLoad callback - called when model is successfully loaded
        (object) => {
          try {
            console.log('[MAP] Crystal model loaded successfully');
            
            // Scale down the crystal to an appropriate size
            object.scale.set(
              this.config.crystalScaleFactor,
              this.config.crystalScaleFactor,
              this.config.crystalScaleFactor
            );
            
            // Position the crystal on top of the hexagon with slight randomization
            const randomPositionOffset = (Math.random() - 0.5) * 0.1; // Small random offset for natural variation
            object.position.set(
              hex.position.x + (Math.random() - 0.5) * 0.1,
              hex.position.y + this.config.hexHeight/2 + this.config.crystalHeightOffset + randomPositionOffset,
              hex.position.z + (Math.random() - 0.5) * 0.1
            );
            
            console.log(`[MAP] Positioned loaded crystal model at: ${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)}`);
            
            // For loaded models, we need to keep them in their original upright orientation
            // Models should already be correctly oriented in their source files
            // No need to apply the -Math.PI/2 rotation that was causing them to lay on their side
            
            // Apply only Y-axis rotation (360 degrees) to keep crystals upright
            object.rotation.y = Math.random() * Math.PI * 2; // Full 360-degree rotation around vertical axis
            
            // Keep X and Z at 0 to ensure upright orientation
            object.rotation.x = 0;
            object.rotation.z = 0;
            
            console.log(`[MAP] Applied loaded crystal Y rotation: ${object.rotation.y.toFixed(2)} radians`);
            
            // Apply enhanced materials and textures to make the crystal look better
            console.log('[MAP] Applying enhanced materials to loaded crystal model');
            
            // Track how many meshes we've enhanced for logging
            let enhancedMeshCount = 0;
            
            // We need to traverse the object hierarchy to apply materials
            object.traverse((child) => {
              if (child.isMesh) {
                console.log(`[MAP] Enhancing material for mesh: ${child.name || 'unnamed'}`);
                
                try {
                  // Store original material properties we want to preserve
                  const originalColor = child.material.color ? child.material.color.clone() : new this.THREE.Color(0x9932CC);
                  const originalMap = this.crystalTextureLoaded ? this.crystalTexture : child.material.map;
                  
                  // Check material capabilities of the renderer
                  const originalMaterialType = child.material.type;
                  console.log(`[MAP] Original material type: ${originalMaterialType}`);
                  
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
                    console.log('[MAP] Applied MeshPhysicalMaterial to crystal model part');
                  } else {
                    // If physical material isn't available, enhance the existing material
                    console.log('[MAP] Physical material not available, enhancing existing material');
                    
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
                    child.material.opacity = 0.8; // Set to 80% opacity (semi-translucent)
                  }
                  
                  // Force material update
                  child.material.needsUpdate = true;
                  enhancedMeshCount++;
                  
                } catch (materialError) {
                  console.error(`[MAP] Error enhancing material for mesh ${child.name || 'unnamed'}:`, materialError);
                  // Apply texture only if material enhancement fails
                  if (this.crystalTextureLoaded && this.crystalTexture) {
                    child.material.map = this.crystalTexture;
                    child.material.needsUpdate = true;
                  }
                }
              }
            });
            
            console.log(`[MAP] Enhanced materials for ${enhancedMeshCount} meshes in crystal model`);
            
            // Add to scene and associate with hex for future reference
            this.scene.add(object);
            hex.userData.crystal = object;
            
            console.log(`[MAP] Crystal placed on hex at (${hex.userData.q}, ${hex.userData.r})`);
          } catch (modelError) {
            console.error('[MAP] Error processing loaded crystal model:', modelError);
            console.error('[MAP] Error details:', modelError.message);
            
            // Try to use fallback crystal if model processing fails
            this.ensureFallbackCrystalMethod();
            this.createFallbackCrystal(hex);
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
          this.ensureFallbackCrystalMethod();
          this.createFallbackCrystal(hex);
        }
      );
    } catch (error) {
      console.error('[MAP] Error starting crystal model load:', error);
      
      // Use fallback crystal if loading fails
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
