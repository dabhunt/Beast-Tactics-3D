/**
 * HexGridRenderer.js
 * Manages the creation and rendering of the hexagonal grid with biome textures
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { Logger } from "../utils/Logger.js";

// Biome type enum - matches the available texture files
export const BiomeTypes = {
  PLAINS: 'plains',
  FOREST: 'forest',
  MOUNTAINS: 'mountains',
  DESERT: 'desert',
  WATER: 'water',
  VOLCANIC: 'volcanic',
  STORM: 'storm',
  TUNDRA: 'tundra',
  SWAMP: 'swamp',
  DARK: 'dark',
  SACRED: 'sacred',
  BATTLEFIELD: 'battlefield',
  ELECTRICFOREST: 'electricForest',
  CAVE: 'cave',
  TEMP: 'temp'
};

export class HexGridRenderer {
  /**
   * Create a hex grid renderer
   * @param {Object} config - Configuration for the hex grid
   * @param {Number} config.gridRadius - Radius of the hex grid (in hexes)
   * @param {Number} config.hexRadius - Radius of each hexagon (in 3D units)
   * @param {Number} config.hexHeight - Height of each hexagon (in 3D units)
   * @param {THREE.Scene} config.scene - The THREE.js scene to render to
   */
  constructor(config) {
    Logger.debug('HexGridRenderer', 'Initializing with config:', config);

    this._gridRadius = config.gridRadius || 7;
    this._hexRadius = config.hexRadius || 1;
    this._hexHeight = config.hexHeight || 0.2;
    this._scene = config.scene;

    // Store created hexagons
    this._hexagons = [];

    // Load textures for each biome type
    this._biomeTextures = {};
    this._textureLoader = new THREE.TextureLoader();

    // Store biome distribution for the map
    this._biomeDistribution = config.biomeDistribution || {
      plains: 1,      // Earth
      forest: 1,      // Plant
      mountains: 1,   // Earth (was Metal)
      desert: 1,      // Light
      water: 1,       // Water
      volcanic: 1,    // Fire
      storm: 1,       // Electric
      tundra: 1,      // Wind
      swamp: 1,       // Corrosion
      dark: 1,        // Dark
      sacred: 1,      // Spirit
      battlefield: 1  // Combat
    };

    // With equal distribution, we're just using these as a list of biome types
    // Values are set to 1 to indicate "include this biome" but actual distribution
    // will be calculated to be equal
    
    // Log the biome types we're using
    Logger.debug('HexGridRenderer', 'Biome types to distribute equally:', Object.keys(this._biomeDistribution));
    
    // The actual allocation will be calculated in _initializeEqualBiomeDistribution
    this._biomeAllocation = null;

    Logger.debug('HexGridRenderer', 'Created instance');
  }

  /**
   * Load all biome textures asynchronously
   * @returns {Promise} Resolves when all textures are loaded
   */
  async loadTextures() {
    Logger.info('HexGridRenderer', 'Loading biome textures...');

    // Mapping from biome types to element texture files
    const biomeToElementMap = {
      'plains': 'Earth',
      'forest': 'Plant',
      'mountains': 'Earth', // Changed from Metal to Earth
      'desert': 'Light',
      'water': 'Water',
      'volcanic': 'Fire',
      'storm': 'Electric',
      'tundra': 'Wind',
      'swamp': 'Corrosion',
      'dark': 'Dark', // Should be Cave = Dark
      'sacred': 'Spirit', // Should be Temp = Spirit
      'battlefield': 'Combat',
      'electricForest': 'Electric', // Added specifically for Electric
      'cave': 'Dark', // Added for Cave = Dark
      'temp': 'Spirit', // Added for Temp = Spirit
      'volcano': 'Fire' // Added for Volcano = Fire
    };

    Logger.debug('HexGridRenderer', 'Using biome to element mapping:', biomeToElementMap);

    // Define the texture offset to account for transparent padding (17px at top and bottom)
    const textureOffsetY = 17; // 17px offset from top and bottom
    
    Logger.debug('HexGridRenderer', `Applying texture offset of ${textureOffsetY}px to account for transparent space`);

    const texturePromises = Object.values(BiomeTypes).map(biomeType => {
      return new Promise((resolve, reject) => {
        console.log(`Loading texture for biome: ${biomeType}`);

        // Get the corresponding element name from the mapping
        const elementName = biomeToElementMap[biomeType] || biomeType;
        const texturePath = `./assets/BiomeTiles/${elementName}.png`;

        // Log the actual path being requested for debugging
        console.log(`Requesting texture from path: ${texturePath} (element for ${biomeType})`);

        this._textureLoader.load(
          texturePath,
          (texture) => {
            // Success callback
            console.log(`Successfully loaded texture: ${biomeType}`);
            
            // Apply offset to texture to account for transparent padding
            // This adjusts the texture coordinates to trim the transparent edges
            texture.center.set(0.5, 0.5); // Set center point for transformations
            
            // Store texture dimensions for debugging
            const dimensions = {
              width: texture.image.width,
              height: texture.image.height
            };
            
            // Calculate the percentage of the image that's actual content (excluding transparent padding)
            // For a 17px offset on top and bottom on e.g. a 100px tall image, we'd have: (100 - 34) / 100 = 0.66
            const contentHeight = Math.max(0, texture.image.height - (textureOffsetY * 2));
            const contentRatio = contentHeight / texture.image.height;
            
            // Set the repeat and offset to account for the transparent padding
            texture.repeat.set(1, contentRatio);
            texture.offset.set(0, (1 - contentRatio) / 2);
            
            Logger.debug('HexGridRenderer', `Applied texture transform for ${biomeType}:`, {
              dimensions,
              contentHeight,
              contentRatio,
              offset: texture.offset.y
            });
            
            // Store the processed texture
            this._biomeTextures[biomeType] = texture;
            resolve();
          },
          // Progress callback
          (xhr) => {
            console.log(`${biomeType} texture: ${(xhr.loaded / xhr.total) * 100}% loaded`);
          },
          // Error callback
          (error) => {
            console.error(`Failed to load ${biomeType} texture:`, error);
            // Resolve anyway to not block other textures
            resolve();
          }
        );
      });
    });

    try {
      await Promise.all(texturePromises);
      Logger.info('HexGridRenderer', 'All biome textures loaded successfully');
      return true;
    } catch (error) {
      Logger.error('HexGridRenderer', 'Error loading textures:', error);
      return false;
    }
  }

  /**
   * Get all generated hexes for analysis
   * @returns {Array} Array of hex objects
   */
  getHexes() {
    return this._hexes;
  }

  /**
   * Initialize the distribution map to ensure equal representation of biomes
   * @private
   */
  _initializeEqualBiomeDistribution() {
    Logger.debug('HexGridRenderer', 'Initializing equal biome distribution');
    
    // Calculate total number of hexes in the grid
    const hexCount = 3 * this._gridRadius * (this._gridRadius + 1) + 1;
    Logger.debug('HexGridRenderer', `Grid will contain approximately ${hexCount} hexes`);
    
    // Get all biome types
    const allBiomeTypes = Object.keys(this._biomeDistribution);
    const biomeCount = allBiomeTypes.length;
    
    // Calculate how many hexes of each type we need
    const hexesPerBiome = Math.floor(hexCount / biomeCount);
    Logger.debug('HexGridRenderer', `Allocating ~${hexesPerBiome} hexes per biome`);
    
    // Create a distribution array with equal parts of each biome
    this._biomeAllocation = [];
    
    allBiomeTypes.forEach(biomeType => {
      // Add this biome type hexesPerBiome times
      for (let i = 0; i < hexesPerBiome; i++) {
        this._biomeAllocation.push(biomeType);
      }
    });
    
    // If we have remaining hexes, distribute them evenly
    const remaining = hexCount - (hexesPerBiome * biomeCount);
    for (let i = 0; i < remaining; i++) {
      this._biomeAllocation.push(allBiomeTypes[i % biomeCount]);
    }
    
    // Shuffle the allocation array thoroughly to randomize positions
    this._shuffleArray(this._biomeAllocation);
    
    Logger.info('HexGridRenderer', `Created equal distribution map with ${this._biomeAllocation.length} allocated hexes`, {
      biomeTypes: allBiomeTypes,
      hexesPerBiome: hexesPerBiome
    });
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - The array to shuffle
   * @private
   */
  _shuffleArray(array) {
    // Logger for deep debugging of the shuffling process
    Logger.debug('HexGridRenderer', `Shuffling array of ${array.length} elements`);
    
    // Perform Fisher-Yates shuffle for thorough randomization
    for (let i = array.length - 1; i > 0; i--) {
      // Generate random index
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap elements
      [array[i], array[j]] = [array[j], array[i]];
    }
    
    // Log sample of shuffled results for verification
    const sampleSize = Math.min(10, array.length);
    Logger.debug('HexGridRenderer', `Shuffle complete. Sample of first ${sampleSize} elements:`, 
      array.slice(0, sampleSize));
  }

  /**
   * Determine biome type for a hex based on coordinates in an equal distribution
   * @param {Number} q - Q coordinate
   * @param {Number} r - R coordinate
   * @returns {String} Biome type
   */
  _determineBiomeType(q, r) {
    // Initialize the equal distribution on first call if needed
    if (!this._biomeAllocation) {
      this._initializeEqualBiomeDistribution();
      this._usedPositions = new Map();
      this._positionIndex = 0;
    }
    
    // Create a position key from coordinates
    const posKey = `${q},${r}`;
    
    // If this position already has an assigned biome, return it
    if (this._usedPositions.has(posKey)) {
      return this._usedPositions.get(posKey);
    }
    
    // Get the next biome from the pre-generated equal distribution
    const biomeType = this._biomeAllocation[this._positionIndex] || BiomeTypes.PLAINS;
    
    // Increment position index and wrap around if needed
    this._positionIndex = (this._positionIndex + 1) % this._biomeAllocation.length;
    
    // Store the assignment for this position
    this._usedPositions.set(posKey, biomeType);
    
    // Log every 20th assignment for debugging
    if (this._positionIndex % 20 === 0) {
      Logger.debug('HexGridRenderer', `Assigned biome ${biomeType} to position (${q},${r}). Used ${this._positionIndex} of ${this._biomeAllocation.length} allocations.`);
    }
    
    return biomeType;
  }

  /**
   * Create the full hexagonal grid
   */
  createGrid() {
    Logger.info('HexGridRenderer', `Generating hex grid with radius ${this._gridRadius}`);

    let hexCount = 0;

    // Create hexagon geometry once and reuse
    const hexGeometry = new THREE.CylinderGeometry(
      this._hexRadius,
      this._hexRadius,
      this._hexHeight,
      6
    );

    // Create base materials (will be updated with textures)
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 5,
      specular: 0x222222
    });

    // Edge material (for hexagon sides)
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10
    });

    // Generate the grid using axial coordinates (q,r)
    for (let q = -this._gridRadius; q <= this._gridRadius; q++) {
      for (
        let r = Math.max(-this._gridRadius, -q - this._gridRadius);
        r <= Math.min(this._gridRadius, -q + this._gridRadius);
        r++
      ) {
        // Determine which biome this hex should be
        const biomeType = this._determineBiomeType(q, r);
        console.log(`Hex at (${q},${r}) is biome type: ${biomeType}`);

        // Create hex with the appropriate biome
        const hex = this._createHex(q, r, hexGeometry, biomeType, baseMaterial, edgeMaterial);
        this._hexagons.push(hex);
        hexCount++;

        // Log progress periodically
        if (hexCount % 20 === 0) {
          Logger.debug('HexGridRenderer', `Created ${hexCount} hexagons so far...`);
        }
      }
    }

    Logger.info('HexGridRenderer', `Grid generation complete: ${this._hexagons.length} hexagons created`);
  }

  /**
   * Create an individual hexagon
   * @param {Number} q - Q coordinate (axial)
   * @param {Number} r - R coordinate (axial)
   * @param {THREE.Geometry} geometry - Hexagon geometry
   * @param {String} biomeType - Type of biome for this hex
   * @param {THREE.Material} baseMaterial - Base material to clone
   * @param {THREE.Material} edgeMaterial - Edge material
   * @returns {THREE.Mesh} Created hexagon mesh
   * @private
   */
  _createHex(q, r, geometry, biomeType, baseMaterial, edgeMaterial) {
    // Clone the base material so we can customize it
    const topMaterial = baseMaterial.clone();

    // Apply biome texture if available
    if (this._biomeTextures[biomeType]) {
      topMaterial.map = this._biomeTextures[biomeType];
      topMaterial.needsUpdate = true;
    } else {
      // Fallback colors if texture not available
      const biomeColors = {
        plains: 0x91c13e,
        forest: 0x1e6621,
        mountains: 0x7c7c7c,
        desert: 0xe6cc86,
        water: 0x1e90ff,
        volcanic: 0xff6347,
        storm: 0x4682b4,
        tundra: 0xd3d3d3,
        swamp: 0x808000,
        dark: 0x000000,
        sacred: 0xffd700,
        battlefield: 0x8b0000,
        electricForest: 0x4682b4, // Added color for electricForest
        cave: 0x000000, // Added color for cave
        temp: 0xffd700, // Added color for temp
        volcano: 0xff6347 // Added color for volcano
      };
      topMaterial.color.setHex(biomeColors[biomeType] || 0xffffff);
    }

    // Create materials array for cylinder (side, top, bottom)
    const materials = [
      edgeMaterial,    // Side
      topMaterial,     // Top face
      topMaterial.clone()  // Bottom face
    ];

    // Create the mesh
    const hex = new THREE.Mesh(geometry, materials);

    // Position hexagon in grid using axial to pixel conversion
    const x = this._hexRadius * 1.75 * q;
    const z = this._hexRadius * Math.sqrt(3) * (r + q / 2);
    hex.position.set(x, 0, z);

    // Rotate to align hexagon faces
    hex.rotation.y = Math.PI / 6; // 30 degrees rotation

    // Store biome type on the hex for game logic access
    hex.userData = {
      q: q,
      r: r,
      biomeType: biomeType,
      // Add other hex properties here as needed
    };

    // Add to scene
    this._scene.add(hex);

    return hex;
  }

  /**
   * Update hexagons (animations, effects, etc)
   * @param {Number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Apply visual effects or animations to hexagons
    this._hexagons.forEach((hex, index) => {
      // Make water tiles gently bob up and down
      if (hex.userData.biomeType === BiomeTypes.WATER) {
        hex.position.y = Math.sin(performance.now() * 0.001 + index * 0.1) * 0.1;
      }

      // Make forest tiles sway slightly
      if (hex.userData.biomeType === BiomeTypes.FOREST) {
        hex.rotation.z = Math.sin(performance.now() * 0.0005 + index * 0.05) * 0.02;
      }
    });
  }

  /**
   * Get all hexagons
   * @returns {Array<THREE.Mesh>} Array of hexagon meshes
   */
  getHexagons() {
    return this._hexagons;
  }

  /**
   * Get hexagon at specific coordinates
   * @param {Number} q - Q coordinate
   * @param {Number} r - R coordinate
   * @returns {THREE.Mesh|null} Hexagon at coordinates or null if not found
   */
  getHexAt(q, r) {
    return this._hexagons.find(hex =>
      hex.userData.q === q && hex.userData.r === r
    ) || null;
  }
}