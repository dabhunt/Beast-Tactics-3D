/**
 * MapGeneration.js
 * Responsible for generating and managing the hexagonal grid map system
 * including biome distribution, terrain models, and crystal shard functionality
 */

// Import the CrystalShardManager for handling shard-related functionality
import { CrystalShardManager } from './CrystalShardManager.js';

// Import the BiomeModelManager for handling 3D models for biome tiles
import { BiomeModelManager } from './BiomeModelManager.js';

// GLBLoader handling moved to dedicated manager classes

// Track loading status of resources
// Export this so game.js can access it for debugging
export let textureLoadingTracker = {
  total: 0,
  loaded: 0,
  failed: 0,
  textures: {},
};

// Debug log to track initialization
console.log("[MAP] Initialized textureLoadingTracker:", textureLoadingTracker);

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
    console.log("[MAP] Initializing Map Generator...");

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
      // Crystal shard parameters - now managed by CrystalShardManager
      crystalSpawnChance: 0.2, // 20% chance to spawn a crystal per hex
      crystalHeightOffset: 0.5, // Height above the hexagon
      crystalScaleFactor: 0.005, // Size of the crystal
      crystalModelPath: "/assets/Purple_Crystal_Shard.glb",
      crystalTexturePath: "/assets/Purple_Crystal_Shard_texture.png",
    };

    // Define all element types
    this.elementTypes = [
      "Combat",
      "Corrosion",
      "Dark",
      "Earth",
      "Electric",
      "Fire",
      "Light",
      "Metal",
      "Plant",
      "Spirit",
      "Water",
      "Wind",
    ];

    // Create URLs for local assets
    this.elemUrls = {};
    this.elementTypes.forEach((element) => {
      this.elemUrls[element] = `/assets/BiomeTiles/${element}.png`;
    });

    debugLog("Element types defined:", this.elementTypes);
    debugLog("Element URLs mapped:", this.elemUrls);

    // Initialize geometry and materials
    this.initGeometryAndMaterials();

    // Reset tracking for texture loading
    // IMPORTANT: We're modifying the exported textureLoadingTracker
    // This ensures game.js sees the updated values
    textureLoadingTracker.total = this.elementTypes.length;
    textureLoadingTracker.loaded = 0;
    textureLoadingTracker.failed = 0;
    textureLoadingTracker.textures = {};
    console.log("[MAP] Reset textureLoadingTracker:", textureLoadingTracker);
    
    // Initialize the Crystal Shard Manager for handling all crystal-related functionality
    console.log("[MAP] Setting up CrystalShardManager...");
    this.crystalShardManager = new CrystalShardManager(scene, THREE, {
      crystalSpawnChance: this.config.crystalSpawnChance,
      crystalHeightOffset: this.config.crystalHeightOffset,
      crystalScaleFactor: this.config.crystalScaleFactor,
      crystalModelPath: this.config.crystalModelPath,
      crystalTexturePath: this.config.crystalTexturePath
    });
    console.log("[MAP] CrystalShardManager initialized successfully");
    
    // Initialize the Biome Model Manager for handling 3D models for biome tiles
    console.log("[MAP] Setting up BiomeModelManager...");
    this.biomeModelManager = new BiomeModelManager(scene, THREE, {
      modelBasePath: "./assets/BiomeTiles/Models/",
      modelHeightOffset: 0.3, // Height above the hexagon
      modelScaleFactor: 0.01  // Size scaling factor for models
    });
    console.log("[MAP] BiomeModelManager initialized successfully");

    // Load textures
    this.loadTextures();
  }

  // Crystal methods now handled by CrystalShardManager

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
      6,
    );

    // Add side material (edges of hexagons)
    this.edgeMaterial = new this.THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
    });

    // Define fallback materials if textures fail to load
    this.fallbackMaterials = [
      new this.THREE.MeshPhongMaterial({
        color: 0xff5733,
        shininess: 50,
        specular: 0x555555,
      }), // Combat
      new this.THREE.MeshPhongMaterial({
        color: 0x7cfc00,
        shininess: 50,
        specular: 0x555555,
      }), // Corrosion
      new this.THREE.MeshPhongMaterial({
        color: 0x581845,
        shininess: 50,
        specular: 0x555555,
      }), // Dark
      new this.THREE.MeshPhongMaterial({
        color: 0x964b00,
        shininess: 50,
        specular: 0x555555,
      }), // Earth
      new this.THREE.MeshPhongMaterial({
        color: 0xffff00,
        shininess: 50,
        specular: 0x555555,
      }), // Electric
      new this.THREE.MeshPhongMaterial({
        color: 0xff4500,
        shininess: 50,
        specular: 0x555555,
      }), // Fire
      new this.THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 50,
        specular: 0x555555,
      }), // Light
      new this.THREE.MeshPhongMaterial({
        color: 0xc0c0c0,
        shininess: 50,
        specular: 0x555555,
      }), // Metal
      new this.THREE.MeshPhongMaterial({
        color: 0x2ecc71,
        shininess: 50,
        specular: 0x555555,
      }), // Plant
      new this.THREE.MeshPhongMaterial({
        color: 0xd8bfd8,
        shininess: 50,
        specular: 0x555555,
      }), // Spirit
      new this.THREE.MeshPhongMaterial({
        color: 0x3498db,
        shininess: 50,
        specular: 0x555555,
      }), // Water
      new this.THREE.MeshPhongMaterial({
        color: 0xc6e2ff,
        shininess: 50,
        specular: 0x555555,
      }), // Wind
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
              },
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
        },
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
      `Texture loading progress: ${loaded}/${total} loaded, ${failed} failed`,
    );

    // Check if all textures are processed (either loaded or failed)
    if (loaded + failed === total) {
      debugLog("All textures processed. Ready to generate map.");

      // Check if we already have hexagons to avoid duplicate generation
      if (this.hexagons && this.hexagons.length > 0) {
        console.log(
          `[MAP] Map already generated with ${this.hexagons.length} hexagons, skipping generation`,
        );

        // Ensure callbacks are still triggered even if we skip generation
        if (this.onMapGeneratedCallback) {
          console.log(
            "[MAP] Triggering onMapGenerated callback with existing hexagons",
          );
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
    const hexMaterial =
      this.hexMaterials[randomElement] || this.fallbackMaterials[0];

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
    const z =
      this.config.hexRadius * Math.sqrt(3) * verticalFactor * (r + q / 2);
    hex.position.set(x, 0, z);

    // Debug rotation values for troubleshooting
    debugLog(
      `Creating hex at (${q},${r}) with position (${x},0,${z}) - Element: ${randomElement}`,
    );

    // In THREE.js, cylinders stand upright along Y axis by default
    // We need to rotate them 30 degrees (π/6 radians) around the Y axis
    // for the hexagons to align properly in the grid
    hex.rotation.x = 0;
    hex.rotation.y = Math.PI / 6; // 30 degrees rotation
    hex.rotation.z = 0;

    // Add to scene
    this.scene.add(hex);
    this.hexagons.push(hex);
    this.hexCount++;

    // Spawn crystal shard with configured probability
    this.trySpawnCrystalShard(hex);
    
    // Load and place a 3D biome model if available
    if (this.biomeModelManager) {
      console.log(`[MAP] Attempting to load biome model for hex (${q},${r}) with element: ${hex.userData.element}`);
      
      // Load the biome model asynchronously
      this.biomeModelManager.loadBiomeModel(hex)
        .then(success => {
          if (success) {
            console.log(`[MAP] Successfully loaded biome model for ${hex.userData.element} hex at (${q},${r})`);
            
            // If we were successful, check if we got a biomeName and store it
            if (hex.userData.biomeName) {
              console.log(`[MAP] Biome name for ${hex.userData.element} element is: ${hex.userData.biomeName}`);
            }
          } else {
            console.log(`[MAP] No biome model available for ${hex.userData.element} hex at (${q},${r})`);
          }
        })
        .catch(error => {
          console.error(`[MAP] Error loading biome model for ${hex.userData.element} hex at (${q},${r}):`, error);
        });
    }

    return hex;
  }

  /**
   * Try to spawn a crystal shard on a given hexagon based on probability
   * This method now delegates the crystal creation process to the CrystalShardManager.
   *
   * @param {Object} hex - The hexagon mesh to potentially spawn a crystal on
   */
  async trySpawnCrystalShard(hex) {
    console.log(`[MAP] Delegating crystal shard spawning to CrystalShardManager for hex at (${hex.userData.q}, ${hex.userData.r})`);
    
    try {
      // Let the CrystalShardManager handle the entire crystal creation process
      await this.crystalShardManager.trySpawnCrystalShard(hex);
      console.log(`[MAP] Crystal shard spawn attempt completed for hex at (${hex.userData.q}, ${hex.userData.r})`);
    } catch (error) {
      console.error("[MAP] Error during crystal shard spawn via CrystalShardManager:", error);
      console.error("[MAP] Error details:", error.message);
      console.error("[MAP] Stack trace:", error.stack);
    }
  }

  /**
   * Crystal loader initialization is now handled by CrystalShardManager
   * This method is kept as a stub for compatibility but delegates to CrystalShardManager
   */
  async initializeCrystalLoader() {
    console.log("[MAP] Crystal loader initialization now handled by CrystalShardManager");
    return true; // Return success since CrystalShardManager will handle actual initialization
  }

  /**
   * Fallback crystal creation is now handled by CrystalShardManager
   * This method is kept as a stub for compatibility but does nothing
   */
  ensureFallbackCrystalMethod() {
    console.log("[MAP] Fallback crystal methods now handled by CrystalShardManager");
    // Method intentionally empty as functionality is in CrystalShardManager
  }

  /**
   * Load a crystal model is now handled by CrystalShardManager
   * This method is kept as a stub for compatibility but redirects to CrystalShardManager
   * @param {Object} hex - The hexagon to place the crystal on
   */
  loadCrystalModel(hex) {
    console.log("[MAP] Crystal model loading now handled by CrystalShardManager");
    // This is now a stub that does nothing as the functionality is in CrystalShardManager
    return null;
  }
  /**
   * Create a fallback crystal - now handled by CrystalShardManager
   * This method is kept as a stub for compatibility
   * @param {Object} hex - The hexagon to place the crystal on
   */
  createFallbackCrystal(hex) {
    console.log("[MAP] Fallback crystal creation now handled by CrystalShardManager");
    // This is now a stub that does nothing as the functionality is in CrystalShardManager
    return null;
  }

  /**
   * Generate the entire hexagon grid with the specified spacing parameters
   * This is the main map generation function that creates all hexagons and their properties
   *
   * @param {number} horizontalSpacing - Horizontal spacing between hexagons (default: 1.5)
   * @param {number} verticalFactor - Vertical spacing factor (default: 1.0)
   */
  generateHexagonGrid(horizontalSpacing = 1.5, verticalFactor = 1.0) {
    console.log("[MAP] Starting hexagon grid generation with params:", {
      horizontalSpacing,
      verticalFactor,
      configSpacing: this.config.horizontalSpacing,
      configVertical: this.config.verticalFactor,
      gridRadius: this.config.gridRadius,
    });
    horizontalSpacing = horizontalSpacing || this.config.horizontalSpacing;
    verticalFactor = verticalFactor || this.config.verticalFactor;

    const gridRadius = this.config.gridRadius;
    debugLog(
      `Generating hex grid with radius ${gridRadius}, spacing: h=${horizontalSpacing}, v=${verticalFactor}`,
    );

    // Track element distribution for debugging
    const elementDistribution = {};
    this.elementTypes.forEach((element) => {
      elementDistribution[element] = 0;
    });

    // Track crystal spawning statistics
    const crystalStats = {
      total: 0,
      spawned: 0,
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

    console.log("[MAP] Beginning map generation with grid radius:", gridRadius);

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

    debugLog(
      `Grid generation complete: ${this.hexagons.length} hexagons created`,
    );
    debugLog("Element distribution:", elementDistribution);

    // Log crystal spawning statistics
    const crystalPercentage = (
      (crystalStats.spawned / crystalStats.total) *
      100
    ).toFixed(1);
    debugLog(
      `Crystal spawning: ${crystalStats.spawned}/${crystalStats.total} hexes (${crystalPercentage}%)`,
    );

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
    return (
      this.hexagons.find(
        (hex) => hex.userData.q === q && hex.userData.r === r,
      ) || null
    );
  }

  /**
   * Find hexagons that contain a specific element type
   * @param {string} elementType - The element type to search for
   * @returns {Array} - Array of matching hexagons
   */
  findHexesByElement(elementType) {
    console.log(`[MAP] Finding hexes with element: ${elementType}`);
    return this.hexagons.filter((hex) => hex.userData.element === elementType);
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
    this.config = { ...this.config, ...newConfig };
    debugLog("Updated map configuration:", this.config);
  }
}

// Export element types as a constant for other modules to use
// This allows other modules to reference these without duplicating the values
export const ELEMENT_TYPES = [
  "Combat",
  "Corrosion",
  "Dark",
  "Earth",
  "Electric",
  "Fire",
  "Light",
  "Metal",
  "Plant",
  "Spirit",
  "Water",
  "Wind",
];
