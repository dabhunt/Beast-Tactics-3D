/**
 * ShardManager.js
 * Handles crystal shard models and their placement in the game world
 * Provides a dedicated interface for working with crystal assets
 */

class ShardManager {
  /**
   * Constructor for the ShardManager
   * Can be called with separate parameters or a single options object
   * @param {Object|THREE} params - THREE.js library instance OR options object containing all parameters
   * @param {Object} [scene] - THREE.Scene where shards will be added
   * @param {Object} [assetLoader] - Instance of AssetLoader class
   * @param {Object} [options] - Configuration options for shard management
   */
  constructor(params, scene, assetLoader, options = {}) {
    console.log('[SHARDS] Initializing ShardManager');
    console.log('[SHARDS] Constructor params:', { 
      paramsType: typeof params,
      isObject: params && typeof params === 'object',
      hasScene: params && params.scene,
      hasTHREE: params && params.THREE
    });
    
    // Handle both parameter styles (separate params or single object)
    if (params && params.scene && params.THREE) {
      // Called with a single options object
      const optionsObject = params;
      this.THREE = optionsObject.THREE;
      this.scene = optionsObject.scene;
      this.assetLoader = optionsObject.assetLoader;
      options = optionsObject;
      
      console.log('[SHARDS] Using object-style initialization');
    } else {
      // Called with separate parameters
      this.THREE = params; // First param is THREE
      this.scene = scene;
      this.assetLoader = assetLoader;
      
      console.log('[SHARDS] Using traditional parameter initialization');
    }
    
    // Validate critical dependencies
    if (!this.THREE) {
      console.error('[SHARDS] THREE.js library not provided to ShardManager');
    }
    
    if (!this.scene) {
      console.error('[SHARDS] Scene not provided to ShardManager');
    }
    
    // Check AssetLoader availability with detailed validation
    console.log('[SHARDS] AssetLoader availability:', {
      available: !!this.assetLoader,
      type: this.assetLoader ? typeof this.assetLoader : 'undefined',
      hasLoadModel: this.assetLoader && typeof this.assetLoader.loadModel === 'function',
      hasCache: this.assetLoader && !!this.assetLoader.cache
    });
    
    // Create a placeholder assetLoader if not provided
    if (!this.assetLoader) {
      console.warn('[SHARDS] AssetLoader not provided - creating placeholder with fallback geometry');
      this.assetLoader = {
        loadModel: async (path, options) => {
          console.warn(`[SHARDS] Creating fallback geometry for: ${path}`);
          // Create a simple geometry as fallback
          const geometry = new this.THREE.ConeGeometry(0.2, 0.5, 6);
          const material = new this.THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0x330066,
            metalness: 0.9,
            roughness: 0.1
          });
          const mesh = new this.THREE.Mesh(geometry, material);
          mesh.userData = { isFallback: true };
          return mesh;
        },
        cache: {
          models: new Map(),
          textures: new Map()
        }
      };
    }
    
    // Default configuration with overrides from options
    this.config = {
      defaultShardPath: '/assets/Shards/crystal-shard.fbx',
      texturePath: '/assets/Shards/Textures',
      textureFiles: {
        baseColor: 'baseColor.png',
        normal: 'normal.png',
        metallic: 'metallic.png',
        roughness: 'roughness.png',
        emissive: 'emissive.png'
      },
      materialOptions: {
        color: 0xffffff,
        emissiveColor: 0x330066,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
      },
      scale: 0.005,
      heightOffset: 0.5,
      debugVisuals: false,
      ...options
    };
    
    // Tracking for created shards
    this.shards = [];
    this.shardsById = new Map();
    
    // Debug material for high visibility
    this.debugMaterial = null;
    
    console.log('[SHARDS] ShardManager initialized with config:', this.config);
  }
  
  /**
   * Initialize the debug material if needed
   * @private
   */
  _initializeDebugMaterial() {
    if (this.debugMaterial) return;
    
    console.log('[SHARDS] Creating debug material for high visibility');
    
    try {
      // Validate THREE is available
      if (!this.THREE || typeof this.THREE.MeshBasicMaterial !== 'function') {
        console.error('[SHARDS] THREE or MeshBasicMaterial not available');
        return null;
      }
      
      // Create debug material with proper validation
      this.debugMaterial = new this.THREE.MeshBasicMaterial({
        color: 0xFF00FF,  // Bright magenta
        wireframe: this.config.debugWireframe || false,
        transparent: false,
        side: this.THREE.DoubleSide
      });
      
      console.log('[SHARDS] Debug material created successfully:', {
        materialType: this.debugMaterial.type,
        color: this.debugMaterial.color.getHexString()
      });
    } catch (error) {
      console.error('[SHARDS] Error creating debug material:', error);
    }
  }
  
  /**
   * Place a crystal shard at the specified position
   * @param {Object} position - {x, y, z} position coordinates
   * @param {Object} options - Shard options (override defaults)
   * @returns {Promise<Object>} - The created shard object
   */
  async placeShard(position, options = {}) {
    try {
      // Begin with validation of input parameters
      if (!position || typeof position !== 'object') {
        console.error('[SHARDS] Invalid position provided to placeShard:', position);
        return this.createFallbackShard(position ? position : {x: 0, y: 0, z: 0});
      }

      // Validate position object has needed properties
      if (position.x === undefined || position.y === undefined || position.z === undefined) {
        console.error('[SHARDS] Position missing coordinates:', position);
        // Create a valid position object with any missing coordinates set to 0
        const validPosition = {
          x: position.x !== undefined ? position.x : 0,
          y: position.y !== undefined ? position.y : 0,
          z: position.z !== undefined ? position.z : 0
        };
        console.log('[SHARDS] Created valid position object:', validPosition);
        position = validPosition;
      }

      const shardId = options.id || `shard_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const elementType = options.elementType || 'default';
      
      console.log(`[SHARDS] Placing shard ${shardId} at position:`, {
        x: position.x.toFixed(2),
        y: position.y.toFixed(2), 
        z: position.z.toFixed(2),
        element: elementType
      });
      
      // Critical dependency validation
      if (!this.THREE) {
        console.error('[SHARDS] THREE.js library not available, cannot place shard');
        return this.createFallbackShard(position, shardId);
      }
      
      if (!this.scene) {
        console.error('[SHARDS] Scene not available, cannot place shard');
        return this.createFallbackShard(position, shardId);
      }
      
      // Check if AssetLoader is available
      if (!this.assetLoader) {
        console.error('[SHARDS] AssetLoader not available, using fallback shard');
        console.log('[SHARDS] If this is unexpected, check that assetLoader is properly passed to ShardManager constructor');
        
        // Try to get global AssetLoader if available
        if (window.assetLoader) {
          console.log('[SHARDS] Found global AssetLoader, using it instead');
          this.assetLoader = window.assetLoader;
        } else {
          return this.createFallbackShard(position, shardId);
        }
      }
      
      // Combine default config with provided options
      const shardOptions = {
        ...this.config,
        ...options
      };
      
      // Load the shard model
      const modelPath = shardOptions.modelPath || this.config.defaultShardPath;
      
      console.log(`[SHARDS] Loading shard model from ${modelPath}`, {
        assetLoaderAvailable: !!this.assetLoader,
        hasLoadModelFn: this.assetLoader && typeof this.assetLoader.loadModel === 'function'
      });
      
      // Prepare material options combining defaults with provided options
      const materialOptions = {
        texturePath: shardOptions.texturePath || this.config.texturePath,
        textureFiles: shardOptions.textureFiles || this.config.textureFiles,
        materialOptions: {
          ...this.config.materialOptions,
          ...(shardOptions.materialOptions || {})
        }
      };
      
      // Track loading start time
      const startTime = performance.now();
      
      // Load the model with the AssetLoader
      const modelOptions = {
        type: 'fbx',
        onProgress: (xhr) => {
          if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(`[SHARDS] Shard ${shardId} loading: ${percentComplete.toFixed(1)}%`);
          }
        },
        materialOptions: materialOptions
      };
      
      // Verify AssetLoader has loadModel method
      if (!this.assetLoader.loadModel || typeof this.assetLoader.loadModel !== 'function') {
        console.error('[SHARDS] AssetLoader missing loadModel method, using fallback');
        return this.createFallbackShard(position, shardId);
      }
      
      // Attempt to load the model
      let shard = null;
      try {
        shard = await this.assetLoader.loadModel(modelPath, modelOptions);
        
        if (!shard) {
          console.error('[SHARDS] AssetLoader.loadModel returned null or undefined');
          return this.createFallbackShard(position, shardId);
        }
        
        console.log(`[SHARDS] Successfully loaded shard model in ${(performance.now() - startTime).toFixed(1)}ms`);
      } catch (error) {
        console.error(`[SHARDS] Failed to load shard model:`, error);
        // Create a fallback if loading fails
        return this.createFallbackShard(position, shardId);
      }
      
      // Position the shard correctly
      try {
        this._positionShard(shard, position, shardOptions);
      } catch (positionError) {
        console.error(`[SHARDS] Error positioning shard:`, positionError);
        // Try to continue even if positioning fails
      }
      
      // Apply debug material if needed
      if (shardOptions.debugVisuals) {
        try {
          this._applyDebugMaterial(shard);
        } catch (materialError) {
          console.error('[SHARDS] Error applying debug material:', materialError);
          // Continue even if material application fails
        }
      }
      
      // Add to tracking
      this.shards.push(shard);
      this.shardsById.set(shardId, shard);
      
      // Store the shard ID in userData for later reference
      // Create userData if it doesn't exist
      if (!shard.userData) {
        shard.userData = {};
      }
      
      shard.userData.shardId = shardId;
      shard.userData.shardType = shardOptions.type || 'default';
      shard.userData.createdAt = new Date().toISOString();
      
      // Make sure the shard is added to the scene
      if (shard.parent !== this.scene) {
        this.scene.add(shard);
      }
      
      console.log(`[SHARDS] Successfully placed shard ${shardId} in scene`);
      
      return shard;
    } catch (error) {
      console.error('[SHARDS] Error placing shard:', error);
      console.error('[SHARDS] Stack trace:', error.stack);
      return this.createFallbackShard(position);
    }
  }
  
  /**
   * Position and scale a shard in the scene
   * @param {Object} shard - The shard object to position
   * @param {Object} position - The target position
   * @param {Object} options - Options for positioning and scaling
   * @private
   */
  _positionShard(shard, position, options) {
    try {
      console.log('[SHARDS] Positioning and scaling shard');
      
      // Extract options with defaults
      const scale = options.scale || this.config.scale;
      const heightOffset = options.heightOffset || this.config.heightOffset;
      
      // Set position (with height offset)
      shard.position.set(
        position.x,
        position.y + heightOffset,
        position.z
      );
      
      // Set scale uniformly
      shard.scale.set(scale, scale, scale);
      
      // Rotate randomly for variety if requested
      if (options.randomRotation) {
        shard.rotation.y = Math.random() * Math.PI * 2;
      }
      
      // Make sure shard is visible
      shard.visible = true;
      
      // Validate position and scale for debugging
      console.log('[SHARDS] Shard positioned with properties:', {
        position: [
          shard.position.x.toFixed(2),
          shard.position.y.toFixed(2),
          shard.position.z.toFixed(2)
        ],
        scale: [
          shard.scale.x.toFixed(4),
          shard.scale.y.toFixed(4),
          shard.scale.z.toFixed(4)
        ],
        visible: shard.visible
      });
      
      // Add to scene if not already added
      if (!shard.parent) {
        console.log('[SHARDS] Adding shard to scene');
        this.scene.add(shard);
      }
    } catch (error) {
      console.error('[SHARDS] Error positioning shard:', error);
    }
  }
  
  /**
   * Apply a highly visible debug material to all meshes in the shard
   * @param {Object} shard - The shard to apply debug material to
   * @private
   */
  _applyDebugMaterial(shard) {
    try {
      console.log('[SHARDS] Applying debug material to shard');
      
      // Create debug material if not already created
      if (!this.debugMaterial) {
        this._initializeDebugMaterial();
      }
      
      // Apply to all meshes
      let appliedCount = 0;
      shard.traverse((child) => {
        if (child.isMesh) {
          // Store original material for reference
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
          }
          
          // Apply debug material
          child.material = this.debugMaterial;
          appliedCount++;
        }
        
        // Always make objects visible
        child.visible = true;
      });
      
      console.log(`[SHARDS] Applied debug material to ${appliedCount} meshes`);
    } catch (error) {
      console.error('[SHARDS] Error applying debug material:', error);
    }
  }
  
  /**
   * Create a fallback shard using basic geometry
   * @param {Object} position - Position for the fallback
   * @param {string} id - Optional ID for the shard
   * @returns {Object} - The created fallback shard
   */
  createFallbackShard(position, id = null) {
    const shardId = id || `fallback_shard_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      console.log(`[SHARDS] Creating fallback shard ${shardId} at:`, {
        x: position.x.toFixed(2),
        y: position.y.toFixed(2),
        z: position.z.toFixed(2)
      });
      
      // Verify THREE.js is available
      if (!this.THREE) {
        console.error('[SHARDS] THREE.js not available in createFallbackShard');
        return null;
      }
      
      // Debugging THREE availability and constructors
      console.log('[SHARDS] THREE availability check:', {
        THREE: !!this.THREE,
        ConeGeometry: !!this.THREE.ConeGeometry,
        MeshStandardMaterial: !!this.THREE.MeshStandardMaterial,
        Mesh: !!this.THREE.Mesh
      });
      
      // Create a simple geometric shape for the fallback
      // First verify that ConeGeometry constructor exists
      if (!this.THREE.ConeGeometry) {
        console.error('[SHARDS] THREE.ConeGeometry constructor not available!');  
        // Try to use BoxGeometry as an alternative fallback
        if (this.THREE.BoxGeometry) {
          console.warn('[SHARDS] Attempting to use BoxGeometry as alternative fallback');
          var geometry = new this.THREE.BoxGeometry(0.2, 0.5, 0.2);
        } else {
          console.error('[SHARDS] No suitable geometry constructor available');
          return null;
        }
      } else {
        var geometry = new this.THREE.ConeGeometry(0.2, 0.5, 6);
      }
      
      // Create a vibrant, easily visible material
      // Construct material properties with explicit THREE.Color objects to avoid WebGL uniform errors
      let material;
      try {
        // Validate MeshStandardMaterial is available
        if (!this.THREE.MeshStandardMaterial) {
          console.error('[SHARDS] THREE.MeshStandardMaterial not available');
          throw new Error('MeshStandardMaterial constructor not found');
        }
        
        // Log material creation parameters
        console.log('[SHARDS] Creating fallback material with:', {
          colorType: typeof 0xff00ff,
          colorValue: '0x' + (0xff00ff).toString(16),
          emissiveType: typeof 0x330066,
          emissiveValue: '0x' + (0x330066).toString(16)
        });
        
        // Create material with proper color objects
        material = new this.THREE.MeshStandardMaterial({
          color: new this.THREE.Color(0xff00ff), // Explicit color object
          metalness: 0.9,
          roughness: 0.1,
          emissive: new this.THREE.Color(0x330066), // Explicit color object
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.8
        });
        
        // Validate material creation
        console.log('[SHARDS] Fallback material created:', {
          type: material.type,
          colorType: material.color?.constructor?.name || 'unknown',
          emissiveType: material.emissive?.constructor?.name || 'unknown'
        });
      } catch (materialError) {
        console.error('[SHARDS] Error creating fallback material:', materialError);
        // Create a simple material as ultimate fallback
        material = new this.THREE.MeshBasicMaterial({ color: 0xff00ff });
      }
      
      // Create mesh and position it
      const fallbackShard = new this.THREE.Mesh(geometry, material);
      fallbackShard.position.set(
        position.x,
        position.y + (this.config.heightOffset || 0.5),
        position.z
      );
      
      // Rotate it upright
      fallbackShard.rotation.x = -Math.PI / 2;
      
      // Add to scene
      this.scene.add(fallbackShard);
      
      // Store for tracking
      fallbackShard.userData.shardId = shardId;
      fallbackShard.userData.isFallback = true;
      this.shards.push(fallbackShard);
      this.shardsById.set(shardId, fallbackShard);
      
      console.log(`[SHARDS] Successfully created fallback shard ${shardId}`);
      return fallbackShard;
      
    } catch (error) {
      console.error('[SHARDS] Error creating fallback shard:', error);
      return null;
    }
  }
  
  /**
   * Remove a shard from the scene
   * @param {string|Object} shardOrId - The shard object or its ID
   * @returns {boolean} - Whether removal was successful
   */
  removeShard(shardOrId) {
    try {
      let shard = null;
      let shardId = null;
      
      // Get the shard based on input type
      if (typeof shardOrId === 'string') {
        shardId = shardOrId;
        shard = this.shardsById.get(shardId);
      } else {
        shard = shardOrId;
        shardId = shard.userData?.shardId;
      }
      
      // Verify shard exists
      if (!shard) {
        console.warn(`[SHARDS] Cannot remove shard: not found`);
        return false;
      }
      
      console.log(`[SHARDS] Removing shard ${shardId}`);
      
      // Remove from scene
      if (shard.parent) {
        shard.parent.remove(shard);
      }
      
      // Remove from tracking
      this.shards = this.shards.filter(s => s !== shard);
      if (shardId) {
        this.shardsById.delete(shardId);
      }
      
      // Dispose resources
      shard.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      console.log(`[SHARDS] Successfully removed shard ${shardId}`);
      return true;
    } catch (error) {
      console.error('[SHARDS] Error removing shard:', error);
      return false;
    }
  }
  
  /**
   * Change all shards visibility
   * @param {boolean} visible - Whether to show or hide all shards
   */
  setAllShardsVisible(visible) {
    console.log(`[SHARDS] Setting all shards visible: ${visible}`);
    this.shards.forEach(shard => {
      shard.visible = visible;
    });
  }
  
  /**
   * Get all shards in the scene
   * @returns {Array} - Array of all managed shards
   */
  getAllShards() {
    return [...this.shards];
  }
  
  /**
   * Get a specific shard by ID
   * @param {string} id - The shard ID
   * @returns {Object|null} - The found shard or null
   */
  getShardById(id) {
    return this.shardsById.get(id) || null;
  }
}

// Export the class
window.ShardManager = ShardManager;
