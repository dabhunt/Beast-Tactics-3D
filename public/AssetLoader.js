/**
 * AssetLoader.js
 * A modular system for loading 3D assets with comprehensive logging and error handling
 * Used to separate asset loading concerns from game logic components
 */

class AssetLoader {
  /**
   * Constructor for the AssetLoader
   * @param {Object} THREE - The Three.js library instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.debug - Whether to show debug logs (default: false)
   * @param {string} options.basePath - Base path for resolving relative paths (default: current URL)
   */
  constructor(THREE, options = {}) {
    console.log('[ASSETS] Initializing AssetLoader module');
    this.THREE = THREE;
    
    // Store options with defaults
    this.options = {
      debug: options.debug || false,
      basePath: options.basePath || window.location.href
    };
    
    // Initialize state
    this.loaders = {};
    this.cache = {
      models: new Map(),
      textures: new Map(),
      materials: new Map()
    };
    
    // Errors tracking
    this.errors = [];
    
    // Initialize loaders if THREE is provided
    if (THREE) {
      this._initializeLoaders();
    } else {
      console.error('[ASSETS] THREE.js not provided to AssetLoader, loaders will not be initialized');
    }
    
    console.log('[ASSETS] AssetLoader initialized with options:', this.options);
  }
  
  /**
   * Initialize all the different loaders needed
   * @private
   */
  _initializeLoaders() {
    try {
      console.log('[ASSETS] Initializing model and texture loaders');
      
      // Initialize TextureLoader
      this.loaders.texture = new this.THREE.TextureLoader();
      console.log('[ASSETS] TextureLoader initialized');
      
      // Initialize FBXLoader
      this._initializeFBXLoader();
      
      // Initialize other loaders as needed
      // GLTFLoader, OBJLoader, etc.
      
    } catch (error) {
      console.error('[ASSETS] Error initializing loaders:', error);
      this.errors.push({
        type: 'initialization_error',
        message: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialize the FBXLoader specifically, with fallbacks
   * @private
   */
  async _initializeFBXLoader() {
    console.log('[ASSETS] Initializing FBXLoader...', {
      THREE: !!this.THREE,
      constructors: this.THREE ? Object.keys(this.THREE).length : 0,
      windowFBXLoader: !!window.FBXLoader,
      windowTHREE: !!window.THREE,
      initFn: !!window.initFBXLoader
    });
    
    // Track initialization to prevent multiple parallel attempts
    if (AssetLoader._initializingFBXLoader) {
      console.log('[ASSETS] FBXLoader initialization already in progress, waiting...');
      return;
    }
    
    // Set static flag to track initialization
    AssetLoader._initializingFBXLoader = true;
    
    // Store errors for debugging
    window._fbxLoaderErrors = window._fbxLoaderErrors || [];
    
    try {
      // Check if FBXLoader already exists
      if (this.loaders.fbx) {
        console.log('[ASSETS] FBXLoader already initialized');
        AssetLoader._initializingFBXLoader = false;
        return;
      }
      
      console.log('[ASSETS] FBXLoader not initialized yet, checking available loaders');
      
      // APPROACH 1: Try to use the handler's initFBXLoader function with our THREE instance
      if (window.initFBXLoader && this.THREE) {
        console.log('[ASSETS] Using FBXLoader handler with local THREE instance');
        try {
          const FBXLoader = window.initFBXLoader(this.THREE);
          if (FBXLoader) {
            console.log('[ASSETS] Successfully initialized FBXLoader with handler');
            this.loaders.fbx = new FBXLoader();
            this._fbxLoaderSource = 'handler-with-local-THREE';
            AssetLoader._initializingFBXLoader = false;
            return;
          }
        } catch (err) {
          console.warn('[ASSETS] Failed to initialize with handler + local THREE:', err);
          window._fbxLoaderErrors.push({ 
            source: 'handler-with-local-THREE', 
            error: err.toString(),
            time: new Date().toISOString()
          });
        }
      }
      
      // APPROACH 2: Use global window.FBXLoader if available
      if (window.FBXLoader) {
        try {
          console.log('[ASSETS] Using global window.FBXLoader');
          this.loaders.fbx = new window.FBXLoader();
          this._fbxLoaderSource = 'window-fbx-loader';
          console.log('[ASSETS] Successfully created FBXLoader instance from window.FBXLoader');
          AssetLoader._initializingFBXLoader = false;
          return;
        } catch (err) {
          console.warn('[ASSETS] Failed to initialize with global FBXLoader:', err);
          window._fbxLoaderErrors.push({ 
            source: 'window-fbx-loader', 
            error: err.toString(),
            time: new Date().toISOString()
          });
        }
      }
      
      // APPROACH 3: Create a simple placeholder loader
      console.log('[ASSETS] Creating placeholder FBXLoader');
      this._createPlaceholderFBXLoader();
      this._fbxLoaderSource = 'placeholder-loader';
      console.log('[ASSETS] Using placeholder FBXLoader for now');
      
    } catch (error) {
      console.error('[ASSETS] Error initializing FBXLoader:', error);
      window._fbxLoaderErrors.push({ 
        type: 'initialization-error', 
        error: error.toString(),
        stack: error.stack,
        time: new Date().toISOString()
      });
      
      // Create a placeholder loader as fallback
      this._createPlaceholderFBXLoader();
    }
    
    // Reset initialization flag
    AssetLoader._initializingFBXLoader = false;
  }
  
  /**
   * Creates a simple placeholder FBXLoader when the real one isn't available
   * This allows the game to continue running with a visual placeholder instead of crashing
   * @private
   */
  _createPlaceholderFBXLoader() {
    console.log('[ASSETS] Creating placeholder FBXLoader implementation');
    
    try {
      // Make sure THREE is available
      if (!this.THREE) {
        console.error('[ASSETS] Cannot create placeholder FBXLoader: THREE not available');
        this.loaders.fbx = null;
        return;
      }
      
      // Create a simple loader that returns a purple box as placeholder
      const placeholderLoader = {
        load: (url, onLoad, onProgress, onError) => {
          console.log('[ASSETS] PlaceholderFBXLoader.load called for:', url);
          
          try {
            // Create a simple colored box as placeholder
            const group = new this.THREE.Group();
            group.name = `PlaceholderFBX_${url.split('/').pop()}`;
            
            // Add debug information to the object
            group.userData = {
              isPlaceholder: true,
              originalUrl: url,
              createdAt: new Date().toISOString()
            };
            
            // Create a simple mesh
            const geometry = new this.THREE.BoxGeometry(0.5, 0.5, 0.5);
            let material;
            
            // Try to create a shiny material for visual debugging
            try {
              material = new this.THREE.MeshStandardMaterial({
                color: 0x8800ff,  // Purple color to indicate placeholder
                emissive: 0x440088,
                roughness: 0.2,
                metalness: 0.8,
                name: 'PlaceholderMaterial'
              });
            } catch (e) {
              // Fallback to basic material if standard isn't available
              console.warn('[ASSETS] Couldn\'t create MeshStandardMaterial, using basic:', e);
              material = new this.THREE.MeshBasicMaterial({ 
                color: 0x8800ff,
                name: 'PlaceholderBasicMaterial'
              });
            }
            
            const mesh = new this.THREE.Mesh(geometry, material);
            mesh.name = 'PlaceholderMesh';
            
            // Add placeholder text if TextGeometry is available
            if (this.THREE.TextGeometry) {
              try {
                const textGeo = new this.THREE.TextGeometry('FBX', {
                  size: 0.1,
                  height: 0.02
                });
                const textMat = new this.THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new this.THREE.Mesh(textGeo, textMat);
                textMesh.position.set(0.2, 0.2, 0.2);
                group.add(textMesh);
              } catch (e) {
                console.debug('[ASSETS] TextGeometry not fully available:', e);
              }
            }
            
            group.add(mesh);
            
            // Log success
            console.log('[ASSETS] Created placeholder FBX object:', {
              name: group.name,
              children: group.children.length
            });
            
            // Call the onLoad callback
            if (typeof onLoad === 'function') {
              onLoad(group);
            }
            
            return group;
          } catch (error) {
            console.error('[ASSETS] Error creating placeholder FBX:', error);
            if (typeof onError === 'function') {
              onError(error);
            }
            return null;
          }
        }
      };
      
      // Store the placeholder loader
      this.loaders.fbx = placeholderLoader;
      console.log('[ASSETS] Placeholder FBXLoader created successfully');
      
    } catch (error) {
      console.error('[ASSETS] Failed to create placeholder FBXLoader:', error);
      this.loaders.fbx = null;
    }
  }
  
  /**
   * Load a 3D model with proper error handling and caching
   * @param {string} path - Path to the model file
   * @param {Object} options - Loading options
   * @param {string} options.type - Type of model ('fbx', 'gltf', etc.)
   * @param {Function} options.onProgress - Progress callback
   * @param {Object} options.materialOptions - Material options for the model
   * @returns {Promise<Object>} - The loaded model
   */
  async loadModel(path, options = {}) {
    const { type = 'fbx', onProgress, materialOptions } = options;
    const resolvedPath = this._resolvePath(path);
    const cacheKey = `${type}:${resolvedPath}`;
    
    console.log(`[ASSETS] Loading ${type.toUpperCase()} model from: ${resolvedPath}`);
    
    // Check cache first
    if (this.cache.models.has(cacheKey)) {
      console.log(`[ASSETS] Using cached model for: ${resolvedPath}`);
      // Deep clone the cached model to avoid reference issues
      const cachedModel = this.cache.models.get(cacheKey);
      return this._cloneModel(cachedModel);
    }
    
    // Verify loader exists
    if (!this.loaders[type]) {
      console.error(`[ASSETS] ${type.toUpperCase()} loader not available`);
      throw new Error(`${type.toUpperCase()} loader not available`);
    }
    
    // Load model based on type
    try {
      let model;
      
      if (type === 'fbx') {
        model = await this._loadFBXModel(resolvedPath, onProgress);
      } else {
        throw new Error(`Unsupported model type: ${type}`);
      }
      
      // Apply PBR materials if requested
      if (materialOptions) {
        await this._applyPBRMaterials(model, materialOptions);
      }
      
      // Cache the model
      this.cache.models.set(cacheKey, this._cloneModel(model));
      
      console.log(`[ASSETS] Successfully loaded model: ${resolvedPath}`, {
        vertices: this._countVertices(model),
        materials: this._countMaterials(model),
        children: model.children.length
      });
      
      return model;
    } catch (error) {
      console.error(`[ASSETS] Error loading model from ${resolvedPath}:`, error);
      throw error;
    }
  }
  
  /**
   * Load an FBX model specifically
   * @param {string} path - Path to the FBX file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - The loaded FBX model
   * @private
   */
  _loadFBXModel(path, onProgress) {
    return new Promise((resolve, reject) => {
      try {
        this.loaders.fbx.load(
          path,
          (object) => {
            console.log(`[ASSETS] FBX model loaded successfully: ${path}`);
            resolve(object);
          },
          onProgress,
          (error) => {
            console.error(`[ASSETS] FBX loading error: ${path}`, error);
            reject(error);
          }
        );
      } catch (error) {
        console.error(`[ASSETS] Error initiating FBX load: ${path}`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Load textures for PBR materials
   * @param {string} basePath - Base path for the textures
   * @param {Object} options - Options for texture loading
   * @returns {Promise<Object>} - Object containing all loaded textures
   */
  async loadPBRTextures(basePath, options = {}) {
    const { 
      baseColor = 'baseColor.png',
      normal = 'normal.png',
      metallic = 'metallic.png',
      roughness = 'roughness.png',
      emissive = 'emissive.png',
      occlusion = 'occlusion.png'
    } = options;
    
    console.log(`[ASSETS] Loading PBR textures from: ${basePath}`);
    
    const textures = {};
    const loaders = [];
    
    // Helper to create each texture loading promise
    const createTextureLoader = (type, fileName) => {
      if (!fileName) return null;
      
      const texturePath = `${basePath}/${fileName}`;
      const resolvedPath = this._resolvePath(texturePath);
      
      // Check cache first
      if (this.cache.textures.has(resolvedPath)) {
        console.log(`[ASSETS] Using cached ${type} texture: ${resolvedPath}`);
        textures[type] = this.cache.textures.get(resolvedPath).clone();
        return null;
      }
      
      return new Promise((resolve, reject) => {
        console.log(`[ASSETS] Loading ${type} texture: ${resolvedPath}`);
        
        this.loaders.texture.load(
          resolvedPath,
          (texture) => {
            console.log(`[ASSETS] Successfully loaded ${type} texture`);
            
            // Configure texture based on type
            if (type === 'normal') {
              texture.encoding = this.THREE.LinearEncoding;
            } else if (type === 'baseColor') {
              texture.encoding = this.THREE.sRGBEncoding;
            }
            
            textures[type] = texture;
            this.cache.textures.set(resolvedPath, texture.clone());
            resolve();
          },
          undefined,
          (error) => {
            console.warn(`[ASSETS] Failed to load ${type} texture: ${resolvedPath}`, error);
            resolve(); // Resolve anyway to continue loading other textures
          }
        );
      });
    };
    
    // Create load promises for each texture type
    if (baseColor) loaders.push(createTextureLoader('baseColor', baseColor));
    if (normal) loaders.push(createTextureLoader('normal', normal));
    if (metallic) loaders.push(createTextureLoader('metallic', metallic));
    if (roughness) loaders.push(createTextureLoader('roughness', roughness));
    if (emissive) loaders.push(createTextureLoader('emissive', emissive));
    if (occlusion) loaders.push(createTextureLoader('occlusion', occlusion));
    
    // Wait for all texture loads to complete
    await Promise.all(loaders.filter(loader => loader !== null));
    
    console.log('[ASSETS] PBR texture loading complete:', Object.keys(textures));
    return textures;
  }
  
  /**
   * Create a PBR material with loaded textures
   * @param {Object} textures - Object containing loaded textures
   * @param {Object} options - Additional material options
   * @returns {THREE.Material} - The created material
   */
  createPBRMaterial(textures, options = {}) {
    console.log('[ASSETS] Creating PBR material with textures:', Object.keys(textures));
    
    try {
      // Check if MeshStandardMaterial is available (fallback to PhongMaterial if not)
      const MaterialClass = this.THREE.MeshStandardMaterial || this.THREE.MeshPhongMaterial;
      const isMeshStandard = MaterialClass === this.THREE.MeshStandardMaterial;
      
      // Log what material type we're using
      console.log(`[ASSETS] Using ${isMeshStandard ? 'MeshStandardMaterial' : 'MeshPhongMaterial'} for PBR material`);
      
      // Create material with appropriate parameters based on material type
      const materialParams = {
        name: options.name || 'PBR_Material',
        color: options.color || 0xffffff,
        transparent: options.transparent !== undefined ? options.transparent : false,
        opacity: options.opacity !== undefined ? options.opacity : 1.0,
        side: options.side || this.THREE.FrontSide
      };
      
      // Add textures to parameters based on material type
      if (textures.baseColor) {
        materialParams.map = textures.baseColor;
      }
      
      if (textures.normal) {
        materialParams.normalMap = textures.normal;
        materialParams.normalScale = new this.THREE.Vector2(1, 1);
      }
      
      if (textures.emissive) {
        materialParams.emissiveMap = textures.emissive;
        materialParams.emissive = options.emissiveColor || new this.THREE.Color(0xffffff);
        materialParams.emissiveIntensity = options.emissiveIntensity || 1.0;
      }
      
      // MeshStandardMaterial specific parameters
      if (isMeshStandard) {
        if (textures.metallic) {
          materialParams.metalnessMap = textures.metallic;
          materialParams.metalness = options.metalness || 1.0;
        } else {
          materialParams.metalness = options.metalness || 0.0;
        }
        
        if (textures.roughness) {
          materialParams.roughnessMap = textures.roughness;
          materialParams.roughness = options.roughness || 1.0;
        } else {
          materialParams.roughness = options.roughness || 0.5;
        }
        
        if (textures.occlusion) {
          materialParams.aoMap = textures.occlusion;
          materialParams.aoMapIntensity = options.aoIntensity || 1.0;
        }
      } 
      // MeshPhongMaterial fallback properties
      else {
        materialParams.shininess = options.shininess || 30;
        materialParams.specular = new this.THREE.Color(options.specular || 0x111111);
      }
      
      // Create and return the material
      const material = new MaterialClass(materialParams);
      
      console.log('[ASSETS] Created PBR material:', {
        name: material.name,
        maps: Object.keys(textures).filter(key => textures[key] !== undefined),
        parameters: Object.keys(materialParams)
          .filter(key => !key.includes('Map'))
          .reduce((obj, key) => {
            obj[key] = materialParams[key];
            return obj;
          }, {})
      });
      
      return material;
    } catch (error) {
      console.error('[ASSETS] Error creating PBR material:', error);
      
      // Return a basic material as fallback
      console.warn('[ASSETS] Using fallback basic material');
      return new this.THREE.MeshBasicMaterial({
        color: 0xff00ff, // Magenta for visibility
        wireframe: false
      });
    }
  }
  
  /**
   * Apply PBR materials to a model
   * @param {Object} model - The model to apply materials to
   * @param {Object} options - Material options
   * @private
   */
  async _applyPBRMaterials(model, options) {
    try {
      console.log('[ASSETS] Applying PBR materials to model', {
        modelName: model.name,
        childCount: model.children.length,
        materialOptions: options
      });
      
      // Load textures
      const textures = await this.loadPBRTextures(options.texturePath, options.textureFiles);
      
      // Create material
      const material = this.createPBRMaterial(textures, options.materialOptions);
      
      // Store the material for potential reuse
      const materialCacheKey = options.texturePath;
      this.cache.materials.set(materialCacheKey, material);
      
      // Apply material to all meshes in the model
      let appliedCount = 0;
      model.traverse((child) => {
        if (child.isMesh) {
          console.log(`[ASSETS] Applying PBR material to mesh: ${child.name || 'unnamed'}`);
          
          // Store original material for reference
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
          }
          
          // Apply the new material
          child.material = material;
          appliedCount++;
        }
      });
      
      console.log(`[ASSETS] Applied PBR materials to ${appliedCount} meshes`);
    } catch (error) {
      console.error('[ASSETS] Error applying PBR materials:', error);
    }
  }
  
  /**
   * Count the total number of vertices in a model
   * @param {Object} model - The model to count vertices for
   * @returns {number} - The total vertex count
   * @private
   */
  _countVertices(model) {
    let count = 0;
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        if (child.geometry.attributes && child.geometry.attributes.position) {
          count += child.geometry.attributes.position.count;
        }
      }
    });
    return count;
  }
  
  /**
   * Count the total number of materials in a model
   * @param {Object} model - The model to count materials for
   * @returns {number} - The total material count
   * @private
   */
  _countMaterials(model) {
    const materials = new Set();
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => materials.add(mat));
        } else {
          materials.add(child.material);
        }
      }
    });
    return materials.size;
  }
  
  /**
   * Create a clone of a model
   * @param {Object} model - The model to clone
   * @returns {Object} - The cloned model
   * @private
   */
  _cloneModel(model) {
    return model.clone();
  }
  
  /**
   * Resolve a path relative to the base path
   * @param {string} path - The path to resolve
   * @returns {string} - The resolved path
   * @private
   */
  _resolvePath(path) {
    // If path starts with http(s):// or /, it's already absolute
    if (path.match(/^(https?:\/\/|\/)/)) {
      return path;
    }
    
    // Otherwise join with base path
    try {
      const url = new URL(path, this.options.basePath);
      return url.href;
    } catch (e) {
      console.warn(`[ASSETS] Error resolving path: ${path}`, e);
      return path; // Return original as fallback
    }
  }
}

// Prevent duplicated initialization warning across modules
AssetLoader._initializingFBXLoader = false;

// Export the class
window.AssetLoader = AssetLoader;
