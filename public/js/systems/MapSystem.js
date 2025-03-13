
/**
 * MapSystem.js
 * Handles map generation and management
 */

import { Logger } from '../utils/Logger.js';

export class MapSystem {
  /**
   * Create a new map system
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._mapData = null;
    this._mapSize = 7; // Default size
    this._hexGrid = null;
    this._initialized = false;
    
    // Track revealed tiles
    this._revealedTiles = new Set();
    
    Logger.debug('MapSystem', 'Instance created with default map size', this._mapSize);
  }
  
  /**
   * Initialize the map system
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    try {
      Logger.info('MapSystem', 'Initializing map system');
      
      // Register for events
      this._registerEventListeners();
      
      this._initialized = true;
      Logger.info('MapSystem', 'Map system initialized successfully');
      return true;
    } catch (error) {
      Logger.error('MapSystem', 'Failed to initialize map system', error);
      console.error('Map system initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Register event listeners
   * @private
   */
  _registerEventListeners() {
    const eventSystem = this._gameManager.eventSystem;
    
    // Register for turn start events to update map state
    eventSystem.registerListener('onTurnStart', (data) => {
      Logger.debug('MapSystem', 'Processing turn start effects for map');
      this._processTurnStart(data);
    });
    
    Logger.debug('MapSystem', 'Registered event listeners');
  }
  
  /**
   * Process map-related effects at turn start
   * @param {Object} data - Turn start event data
   * @private
   */
  _processTurnStart(data) {
    if (!this._mapData) {
      Logger.warning('MapSystem', 'No map data available for turn start processing');
      return;
    }
    
    // TODO: Update active tiles, trigger environmental effects, etc.
    Logger.debug('MapSystem', 'Map updated for turn start');
  }
  
  /**
   * Generate a new game map
   * @param {Object} config - Map generation configuration
   * @returns {Promise} Resolves with the generated map
   */
  async generateMap(config = {}) {
    try {
      Logger.info('MapSystem', 'Generating game map with config:', config);
      
      // Set map size from config
      if (config && typeof config.size === 'number') {
        this._mapSize = config.size;
      }
      
      // Generate basic map structure (hexagonal grid)
      this._mapData = this._generateHexGrid(this._mapSize);
      
      // Apply biome distribution
      this._assignBiomesToTiles();
      
      // Place resources
      this._placeResources();
      
      Logger.info('MapSystem', `Map generated with ${this._mapData.tiles.length} tiles`);
      
      // Trigger map generated event
      this._gameManager.eventSystem.triggerEvent('onMapGenerated', {
        mapSize: this._mapSize,
        tileCount: this._mapData.tiles.length
      });
      
      return this._mapData;
    } catch (error) {
      Logger.error('MapSystem', 'Error generating map', error);
      console.error('Map generation error:', error);
      throw error;
    }
  }
  
  /**
   * Generate a hexagonal grid structure
   * @param {Number} radius - Radius of the hex grid
   * @returns {Object} Map data structure
   * @private
   */
  _generateHexGrid(radius) {
    Logger.debug('MapSystem', `Generating hex grid with radius ${radius}`);
    
    const tiles = [];
    
    // Generate tile coordinates using axial coordinates (q,r)
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      
      for (let r = r1; r <= r2; r++) {
        const tileId = `${q},${r}`;
        
        // Create new tile
        const tile = {
          id: tileId,
          q: q,
          r: r,
          biome: null, // Will be assigned later
          resources: [],
          units: [],
          revealed: false,
          elevation: 0
        };
        
        tiles.push(tile);
      }
    }
    
    const map = {
      radius: radius,
      tiles: tiles,
      tileMap: {} // For quick lookups
    };
    
    // Create lookup map by ID
    tiles.forEach(tile => {
      map.tileMap[tile.id] = tile;
    });
    
    Logger.debug('MapSystem', `Created hex grid with ${tiles.length} tiles`);
    return map;
  }
  
  /**
   * Assign biomes to tiles
   * @private
   */
  _assignBiomesToTiles() {
    if (!this._mapData || !this._mapData.tiles) {
      Logger.error('MapSystem', 'Cannot assign biomes: no map data');
      return;
    }
    
    Logger.debug('MapSystem', 'Assigning biomes to tiles');
    
    // List of available biome types
    const biomeTypes = [
      'plains',
      'forest',
      'mountains',
      'desert',
      'water',
      'volcanic',
      'storm',
      'tundra',
      'swamp',
      'dark',
      'sacred',
      'battlefield'
    ];
    
    // Create a distribution map with equal representation
    const totalTiles = this._mapData.tiles.length;
    const biomesPerType = Math.floor(totalTiles / biomeTypes.length);
    
    // Create a distribution array with each biome repeated biomesPerType times
    let distribution = [];
    biomeTypes.forEach(biome => {
      for (let i = 0; i < biomesPerType; i++) {
        distribution.push(biome);
      }
    });
    
    // Add remaining biomes if needed
    const remaining = totalTiles - distribution.length;
    for (let i = 0; i < remaining; i++) {
      distribution.push(biomeTypes[i % biomeTypes.length]);
    }
    
    // Shuffle distribution for randomness
    this._shuffleArray(distribution);
    
    // Assign biomes from the distribution
    this._mapData.tiles.forEach((tile, index) => {
      tile.biome = distribution[index];
    });
    
    Logger.debug('MapSystem', 'Biomes assigned to tiles');
  }
  
  /**
   * Place resources on the map
   * @private
   */
  _placeResources() {
    if (!this._mapData || !this._mapData.tiles) {
      Logger.error('MapSystem', 'Cannot place resources: no map data');
      return;
    }
    
    Logger.debug('MapSystem', 'Placing resources on map');
    
    // Resource types by biome
    const biomeResources = {
      'plains': ['food', 'herbs'],
      'forest': ['wood', 'herbs'],
      'mountains': ['metal', 'gems'],
      'desert': ['crystals'],
      'water': ['fish', 'pearls'],
      'volcanic': ['obsidian', 'fire-essence'],
      'storm': ['lightning-essence'],
      'tundra': ['ice-essence'],
      'swamp': ['poison', 'mushrooms'],
      'dark': ['shadow-essence'],
      'sacred': ['spirit-essence'],
      'battlefield': ['war-essence', 'scrap']
    };
    
    // Place resources based on biome type (with randomness)
    this._mapData.tiles.forEach(tile => {
      // Skip some tiles randomly
      if (Math.random() < 0.3) return;
      
      const resources = biomeResources[tile.biome];
      if (resources && resources.length > 0) {
        // Randomly select one resource type from available ones
        const resourceType = resources[Math.floor(Math.random() * resources.length)];
        
        // Add resource with random amount
        tile.resources.push({
          type: resourceType,
          amount: Math.floor(Math.random() * 3) + 1
        });
      }
    });
    
    Logger.debug('MapSystem', 'Resources placed on map');
  }
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @private
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Get a tile by its coordinates
   * @param {Number} q - Q coordinate
   * @param {Number} r - R coordinate
   * @returns {Object|null} The tile or null if not found
   */
  getTileAt(q, r) {
    if (!this._mapData) return null;
    
    const tileId = `${q},${r}`;
    return this._mapData.tileMap[tileId] || null;
  }
  
  /**
   * Get the map size (radius)
   * @returns {Number} Map radius
   */
  getMapSize() {
    return this._mapSize;
  }
  
  /**
   * Get all map data
   * @returns {Object|null} The map data or null if not generated
   */
  getMapData() {
    return this._mapData;
  }
  
  /**
   * Get all tiles matching a filter
   * @param {Function} filterFn - Filter function
   * @returns {Array} Filtered tiles
   */
  getTiles(filterFn) {
    if (!this._mapData || !this._mapData.tiles) return [];
    
    if (typeof filterFn !== 'function') {
      return [...this._mapData.tiles];
    }
    
    return this._mapData.tiles.filter(filterFn);
  }
  
  /**
   * Reveal a tile on the map
   * @param {Number} q - Q coordinate
   * @param {Number} r - R coordinate
   * @returns {Boolean} Whether the tile was revealed
   */
  revealTile(q, r) {
    const tile = this.getTileAt(q, r);
    
    if (!tile) {
      Logger.warning('MapSystem', `Cannot reveal tile at (${q},${r}): tile not found`);
      return false;
    }
    
    if (tile.revealed) {
      return false; // Already revealed
    }
    
    // Mark as revealed
    tile.revealed = true;
    this._revealedTiles.add(tile.id);
    
    // Trigger event
    this._gameManager.eventSystem.triggerEvent('onBiomeRevealed', {
      tile: tile,
      q: q,
      r: r,
      biome: tile.biome
    });
    
    Logger.debug('MapSystem', `Revealed tile at (${q},${r}): ${tile.biome}`);
    return true;
  }
  
  /**
   * Get tile neighbors
   * @param {Number} q - Q coordinate
   * @param {Number} r - R coordinate
   * @returns {Array} Neighboring tiles
   */
  getNeighbors(q, r) {
    // Directions for all 6 neighbors in a hex grid
    const directions = [
      {q: 1, r: 0}, {q: 0, r: 1}, {q: -1, r: 1},
      {q: -1, r: 0}, {q: 0, r: -1}, {q: 1, r: -1}
    ];
    
    const neighbors = [];
    
    directions.forEach(dir => {
      const neighborQ = q + dir.q;
      const neighborR = r + dir.r;
      
      const neighbor = this.getTileAt(neighborQ, neighborR);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    });
    
    return neighbors;
  }
  
  /**
   * Set reference to the renderer's hex grid
   * @param {HexGridRenderer} hexGrid - The hex grid renderer
   */
  setHexGrid(hexGrid) {
    this._hexGrid = hexGrid;
    Logger.debug('MapSystem', 'Hex grid renderer reference set');
  }
}
