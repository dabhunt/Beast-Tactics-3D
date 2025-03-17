/**
 * CrystalShardManager.js
 * Responsible for managing crystal shard loading, placement, and visualization
 * Extracted from MapGeneration.js to improve modularity
 * Includes sparkling particle effects for visual enhancement
 */

// Import the particle effect system
import { CrystalParticleEffect } from "./effects/CrystalParticleEffect.js";

// Import our enhanced FBXLoader handler
import { getFBXLoader, isFBXLoaderReady } from "./libs/three/addons/loaders/FBXLoader.handler.js";

// Reference to FBXLoader
let FBXLoader;

// Debug flag for verbose logging
const DEBUG = true;

// Create a global variable to track errors during loading
window._crystalShardErrors = window._crystalShardErrors || [];

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
 * Log error with detailed diagnostics
 * @param {string} context - Error context description 
 * @param {Error} error - The error object
 */
function logError(context, error) {
  console.error(`[CRYSTAL] Error in ${context}:`, error);
  
  // Track errors for diagnostics
  window._crystalShardErrors.push({
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: error.stack,
  });
}

// FBXLoader will be loaded through our enhanced handler module
// No need for manual script or import loading anymore
console.log("[CRYSTAL] Using enhanced FBXLoader.handler.js for loading");

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
      
      // Particle effect configuration
      enableParticles: true,           // Whether to enable particle effects
      particleCount: 35,               // Number of particles per crystal (increased)
      particleSize: 0.09,              // Size of each particle (increased)
      particleColor: 0x9932CC,         // Color of particles (Dark Orchid - more visible purple)
      emissionRate: 0.7,               // Particles emitted per second (increased)
      particleMinLifetime: 1.5,        // Minimum lifetime in seconds
      particleMaxLifetime: 3.0,        // Maximum lifetime in seconds
      particleSpread: 0.5,             // How far particles spread from center
      particleSpeedMultiplier: 1.5,    // Makes particles move faster
      particleIntensity: 2.0,          // Overall intensity multiplier
      
      // Glow effect configuration
      enableGlowEffect: true,          // Whether to enable glow shader effects
      glowIntensity: 1.5,              // Intensity of the crystal glow effect
      glowSize: 1.2,                   // Size multiplier for the glow effect
      glowColor: { r: 0.7, g: 0.3, b: 1.0 }, // RGB color components for the glow (purple)
      ...config                    // Override defaults with provided config
    };
    
    this.crystalLoader = null;
    this.crystalTexture = null;
    this.crystalTextureLoaded = false;
    
    // Track initialization state for crystalloaders
    this._crystalLoaderSource = "none";
    this._initializingLoader = false;
    
    // Class-level promise for tracking loader initialization
    this._fbxLoaderPromise = null;
    this._fbxLoaderSuccess = false;
    
    // Particle effect system
    this.particleEffect = null;
    this.particleLastUpdate = Date.now();
    this.activeCrystals = [];      // Track all active crystals
    
    debugLog("Crystal Shard Manager initialized with config:", this.config);
    
    // Initialize particle effect system if enabled
    if (this.config.enableParticles) {
      this._initializeParticleSystem();
    }
    
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
   * Uses the enhanced FBXLoader.handler.js to manage loading
   *
   * @returns {Promise<boolean>} - Returns true if loader was initialized successfully
   */
  async initializeCrystalLoader() {
    // Start with detailed debug logging
    debugLog("Starting crystal loader initialization", {
      alreadyInitializing: this._initializingLoader,
      alreadyLoaded: this.crystalLoader !== null,
      loaderSource: this._crystalLoaderSource
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
      const result = this.crystalLoader !== null;
      debugLog("Using result from previous initialization", { successful: result });
      return result;
    }
    
    // Set flag to prevent concurrent initializations
    this._initializingLoader = true;
    debugLog("Starting new initialization process");

    // If we already have a loader, verify it has the load method before returning success
    if (this.crystalLoader && typeof this.crystalLoader.load === 'function') {
      debugLog("Crystal loader already initialized and has load method", { source: this._crystalLoaderSource });
      this._initializingLoader = false;
      return true;
    } else if (this.crystalLoader) {
      debugLog("WARNING: Crystal loader exists but doesn't have load method, reinitializing", { 
        source: this._crystalLoaderSource,
        type: typeof this.crystalLoader,
        methods: this.crystalLoader ? Object.keys(this.crystalLoader) : 'null'
      });
      this.crystalLoader = null; // Reset invalid loader

    try {
      // ===== STEP 1: Check if FBXLoader is already ready =====
      debugLog("STEP 1: Checking if FBXLoader is ready via handler");
      
      if (isFBXLoaderReady()) {
        debugLog("FBXLoader is already ready, retrieving instance");
        
        try {
          // Get the loader class from our handler
          const LoaderClass = await getFBXLoader();
          
          // Instantiate it - getFBXLoader returns the constructor, not an instance
          debugLog("Instantiating FBXLoader from constructor");
          this.crystalLoader = new LoaderClass();
          this._crystalLoaderSource = "fbx-handler-ready-instance";
          this._fbxLoaderSuccess = true;
          
          debugLog("Successfully obtained FBXLoader immediately", {
            loader: this.crystalLoader ? "valid" : "null",
            source: this._crystalLoaderSource
          });
          
          this._initializingLoader = false;
          return true;
        } catch (immediateError) {
          // Log but continue to next step if this fails
          debugLog("Error getting FBXLoader despite ready status", {
            error: immediateError.message,
            stack: immediateError.stack?.split('\n')[0] || 'No stack'
          });
        }
      }
      
      // ===== STEP 2: Wait for handler to initialize loader =====
      debugLog("STEP 2: FBXLoader not immediately ready, setting up wait process");
      
      // Create new promise only if we don't already have one
      if (!this._fbxLoaderPromise) {
        debugLog("Creating new loader wait promise");
        
        this._fbxLoaderPromise = new Promise(async (resolve) => {
          // Set timeout constraints
          const maxWaitTime = 8000; // 8 seconds max wait
          const startTime = Date.now();
          let attemptCount = 0;
          
          const checkLoaderInterval = setInterval(() => {
            attemptCount++;
            const elapsed = Date.now() - startTime;
            
            // Log each check attempt
            if (attemptCount % 4 === 0) { // Log every 4th attempt to avoid spam
              debugLog("Checking FBXLoader readiness", {
                attempt: attemptCount,
                elapsed: `${elapsed}ms`,
                maxWait: `${maxWaitTime}ms`,
                timeRemaining: `${Math.max(0, maxWaitTime - elapsed)}ms`
              });
            }
            
            // Check for timeout
            if (elapsed > maxWaitTime) {
              clearInterval(checkLoaderInterval);
              debugLog("Timeout waiting for FBXLoader", { 
                attemptsMade: attemptCount,
                elapsedMs: elapsed 
              });
              resolve({ success: false, reason: "timeout" });
              return;
            }
            
            // Check if loader is ready now
            if (isFBXLoaderReady()) {
              clearInterval(checkLoaderInterval);
              debugLog("FBXLoader became ready during wait");
              
              // Try to get the loader constructor
              getFBXLoader().then(LoaderClass => {
                debugLog("Successfully retrieved FBXLoader constructor after waiting");
                
                try {
                  // Instantiate the loader class
                  const loaderInstance = new LoaderClass();
                  debugLog("Successfully instantiated FBXLoader");
                  resolve({ success: true, loader: loaderInstance });
                } catch (instantiationError) {
                  debugLog("Error instantiating FBXLoader", { error: instantiationError.message });
                  resolve({ success: false, reason: "instantiation-error", error: instantiationError });
                }
              }).catch(err => {
                debugLog("Error getting FBXLoader after it became ready", {
                  error: err.message
                });
                resolve({ success: false, reason: "get-error", error: err });
              });
            }
          }, 500); // Check every 500ms
        });
      }
      
      // Wait for the promise to resolve
      debugLog("Waiting for loader promise to resolve");
      const result = await this._fbxLoaderPromise;
      
      // Process the result
      debugLog("Loader wait process completed", { 
        success: result?.success,
        reason: result?.reason || "normal"
      });
      
      // If we got a loader instance, save it
      if (result?.success && result?.loader) {
        this.crystalLoader = result.loader;
        this._crystalLoaderSource = "fbx-handler-wait-instance";
        this._fbxLoaderSuccess = true;
        debugLog("Successfully obtained FBXLoader from wait process");
        this._initializingLoader = false;
        return true;
      }
      
      // ===== STEP 3: Try fallback methods =====
      debugLog("STEP 3: Trying fallback loader acquisition methods");
      
      // Try basic global checks
      const availabilityChecks = [
        { name: "global-FBXLoader", check: () => typeof FBXLoader === "function", create: () => new FBXLoader() },
        { name: "THREE.FBXLoader", check: () => this.THREE && typeof this.THREE.FBXLoader === "function", create: () => new this.THREE.FBXLoader() },
        { name: "window.FBXLoader", check: () => typeof window.FBXLoader === "function", create: () => new window.FBXLoader() }
      ];
      
      // Try each fallback method
      for (const method of availabilityChecks) {
        debugLog(`Checking for ${method.name}`);
        
        if (method.check()) {
          debugLog(`Found ${method.name}, creating loader instance`);
          
          try {
            this.crystalLoader = method.create();
            this._crystalLoaderSource = method.name;
            this._fbxLoaderSuccess = true;
            
            debugLog(`Successfully created loader from ${method.name}`);
            this._initializingLoader = false;
            return true;
          } catch (fallbackError) {
            debugLog(`Error creating loader from ${method.name}`, {
              error: fallbackError.message 
            });
            // Continue to next method
          }
        }
      }
      
      // If we get here, we failed to initialize the loader
      debugLog("All loader initialization methods failed", {
        attempts: "handler-ready → handler-wait → global → THREE → window"
      });
      
      this._initializingLoader = false;
      return false;
    } catch (error) {
      // Handle unexpected errors during initialization
      console.error("[CRYSTAL] Critical error initializing crystal loader:", error);
      console.error("[CRYSTAL] Error details:", {
        message: error.message,
        stack: error.stack,
        loaderSource: this._crystalLoaderSource
      });
      
      // Track errors for diagnostics
      window._crystalShardErrors = window._crystalShardErrors || [];
      window._crystalShardErrors.push({
        timestamp: new Date().toISOString(),
        phase: "loader-initialization",
        error: error.message,
        stack: error.stack
      });
      
      this._initializingLoader = false;
      return false;
    }
  }
  
  /**
   * Initialize the particle effect system
   * @private
   */
  /**
   * Initialize the particle effect system.
   * Sets up the CrystalParticleEffect class and configures it.
   * @private
   */
  _initializeParticleSystem() {
    console.log('[CRYSTAL] Initializing enhanced particle effect system with detailed logging');
    
    try {
      // Only initialize if THREE.js is available
      if (!this.THREE) {
        console.warn('[CRYSTAL] Cannot initialize particle system: THREE.js not available');
        return;
      }
      
      console.log('[CRYSTAL] Particle system configuration:', {
        particleCount: this.config.particleCount,
        particleSize: this.config.particleSize,
        particleColor: '#' + this.config.particleColor.toString(16).padStart(6, '0'),
        emissionRate: this.config.emissionRate,
        lifetimeRange: [this.config.particleMinLifetime, this.config.particleMaxLifetime],
        spread: this.config.particleSpread,
        speedMultiplier: this.config.particleSpeedMultiplier
      });
      
      // Initialize last update time for smooth first update
      this.particleLastUpdate = Date.now();
      
      // Create new particle effect manager with our expanded configuration
      this.particleEffect = new CrystalParticleEffect(this.THREE, this.scene, {
        particleCount: this.config.particleCount,
        particleSize: this.config.particleSize,
        particleColor: this.config.particleColor,
        minLifetime: this.config.particleMinLifetime,
        maxLifetime: this.config.particleMaxLifetime,
        emissionRate: this.config.emissionRate,
        // Add enhanced velocity parameters for more movement
        minVelocity: 0.35,  // Increased for more visible movement
        maxVelocity: 0.65,  // Increased for more visible movement
        emitterRadius: 0.7, // Wider emission radius
        glowIntensity: 2.0, // Increased glow
        // Add new configuration parameters
        particleSpread: this.config.particleSpread || 0.8,
        particleSpeedMultiplier: this.config.particleSpeedMultiplier || 2
      });
      
      console.log('[CRYSTAL] Particle effect system initialized successfully');
      
      // Immediately force an update to ensure it's working properly
      setTimeout(() => {
        this.updateParticles(0.1); // Force a large delta time for first update
        console.log('[CRYSTAL] Forced initial particle update to test movement');
      }, 50);
      
    } catch (error) {
      console.error('[CRYSTAL] Failed to initialize particle effect system:', error);
      console.debug('Error details:', error.stack || error);
      this.config.enableParticles = false; // Disable particles on error
    }
  }
  
  /**
   * Add sparkle particle effects to a crystal.
   * @param {Object} crystal - The crystal to add particles to
   * @private
   */
  _addParticlesToCrystal(crystal) {
    if (!this.config.enableParticles || !this.particleEffect || !crystal) {
      return;
    }
    
    debugLog("Adding particles to crystal at position:", crystal.position);
    
    try {
      // Create particles for this crystal
      this.particleEffect.createParticlesForCrystal(crystal, crystal.position);
      
      // Add shader-based glow effect to the crystal
      this._addShaderGlowEffect(crystal);
      
      console.log('[CRYSTAL] Successfully added particles and glow effect to crystal');
    } catch (error) {
      console.error('[CRYSTAL] Error adding particles to crystal:', error);
      console.debug('Crystal data:', {
        position: crystal.position,
        uuid: crystal.uuid,
        type: crystal.type
      });
    }
  }
  
  /**
   * Update all crystal particle effects and glow effects
   * Should be called in the animation loop
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateParticles(deltaTime) {
    console.log('[CRYSTAL] updateParticles called', {
      deltaTime: deltaTime !== undefined ? deltaTime.toFixed(4) + 's' : 'undefined',
      hasParticleSystem: !!this.particleEffect,
      timestamp: Date.now(),
      particleSystemsCount: this.particleEffect ? this.particleEffect.particleSystems.length : 'no effect'
    });
    
    // Ensure we have a valid deltaTime value
    if (deltaTime === undefined) {
      const now = Date.now();
      deltaTime = (now - (this.particleLastUpdate || now)) / 1000; // Convert to seconds
      
      console.log(`[CRYSTAL] No deltaTime provided, calculated: ${deltaTime.toFixed(4)}s`);
      
      // Sanity check on calculated deltaTime
      if (deltaTime > 0.1 || deltaTime <= 0) {
        console.warn(`[CRYSTAL] Calculated deltaTime outside safe range: ${deltaTime.toFixed(4)}s, using fallback`);
        deltaTime = 0.016; // ~60 fps
      }
    }
    
    // Store current time for future calculations
    this.particleLastUpdate = Date.now();
    
    // ===== PART 1: UPDATE PARTICLE EFFECTS =====
    if (this.config.enableParticles && this.particleEffect) {
      try {
        console.log(`[CRYSTAL] Updating particle effects with deltaTime: ${deltaTime.toFixed(4)}s`);
        
        // Force a delta time if particles seem stuck
        if (this._particlesStuckCounter === undefined) this._particlesStuckCounter = 0;
        
        // After 10 frames with small delta, boost with larger delta to help unstick
        if (deltaTime < 0.005 && this._particlesStuckCounter++ > 10) {
          console.log('[CRYSTAL] Particles may be stuck, boosting animation with larger delta');
          deltaTime = 0.05;
          this._particlesStuckCounter = 0;
        }
        
        // Do the actual particle update - THIS IS CRITICAL FOR PARTICLE MOVEMENT
        this.particleEffect.update(deltaTime);
        
        console.log(`[CRYSTAL] Updated ${this.particleEffect.particleSystems.length} particle systems`);
      } catch (err) {
        console.error('[CRYSTAL] Error updating particle effects:', err, err.stack);
      }
    } else {
      if (Math.random() < 0.01) console.log('[CRYSTAL] Particles disabled or not initialized');
    }
    
    // ===== PART 2: UPDATE GLOW SHADER EFFECTS =====
    // Only process if we have active crystals
    if (!this.activeCrystals || this.activeCrystals.length === 0) {
      if (Math.random() < 0.01) console.log('[CRYSTAL] No active crystals for glow update');
      return;
    }
    
    try {
      // Count how many crystals have glow effects
      let glowCount = 0;
      
      // Process each crystal that has a glow effect
      this.activeCrystals.forEach(crystal => {
        if (!crystal || !crystal.userData || !crystal.userData.hasShaderGlow) return;
        
        // Get the glow mesh if it exists
        const glowMesh = crystal.userData.glowMesh;
        if (!glowMesh) return;
        
        glowCount++;
        
        // Update animation phase (0.0 to 1.0 loop)
        if (crystal.userData.glowAnimationPhase === undefined) {
          crystal.userData.glowAnimationPhase = 0;
        }
        
        // CRITICAL: Increment phase based on delta time (complete cycle in about 3 seconds)
        // This is what makes the glow effect animate over time
        crystal.userData.glowAnimationPhase += deltaTime * 0.3;
        if (crystal.userData.glowAnimationPhase > 1.0) {
          crystal.userData.glowAnimationPhase -= Math.floor(crystal.userData.glowAnimationPhase);
        }
        
        // Update shader uniforms
        if (glowMesh.material && glowMesh.material.uniforms) {
          // Update pulse phase
          glowMesh.material.uniforms.pulsePhase.value = crystal.userData.glowAnimationPhase;
          
          // Enhanced visual effect: gradually change glow intensity
          // Varies between 1.0 and 2.0 for more dramatic pulsing
          const cyclicalIntensity = 1.0 + Math.sin(crystal.userData.glowAnimationPhase * Math.PI * 2) * 0.5;
          glowMesh.material.uniforms.glowIntensity.value = cyclicalIntensity;
          
          // Update view vector (camera position for view-dependent effects)
          if (this.camera) {
            glowMesh.material.uniforms.viewVector.value.copy(this.camera.position);
          } else {
            // Use a default view vector if no camera is available
            glowMesh.material.uniforms.viewVector.value.set(0, 0, 5);
          }
        }
      });
      
      // Log details periodically to confirm shader updates are happening
      if (Math.random() < 0.01) {
        console.log(`[CRYSTAL] Updated ${glowCount} crystal glow effects with deltaTime: ${deltaTime.toFixed(4)}s`);
      }
    } catch (err) {
      console.error('[CRYSTAL] Error updating crystal glow effects:', err);
      console.debug('Particle effect state:', {
        particleSystems: this.particleEffect ? this.particleEffect.particleSystems.length : 0,
        deltaTime: deltaTime,
        lastUpdateTime: this.particleLastUpdate
      });
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
    debugLog("Hex position:", hexPosition);
    
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
                  shininess: 30,
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
          
          // Apply randomized 360-degree rotation on Y-axis only (keeps base on hexagon)
          const randomYRotation = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
          fbx.rotation.y = randomYRotation;
          
          debugLog("Applied random Y-axis rotation to crystal:", {
            hexPosition: [hex.position.x, hex.position.y, hex.position.z],
            rotationY: randomYRotation
          });
          
          // Add to the scene and associate with hex
          this.scene.add(fbx);
          hex.userData.crystal = fbx;
          
          // Track this crystal for animations and particles
          this.activeCrystals.push(fbx);
          
          // Add sparkle particle effects
          this._addParticlesToCrystal(fbx);
          
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

      // Add random rotation for variety (full 360 degrees on Y-axis only)
      const randomYRotation = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
      crystal.rotation.y = randomYRotation;
      
      debugLog("Applied random Y-axis rotation to fallback crystal:", {
        hexPosition: [hex.position.x, hex.position.y, hex.position.z],
        rotationY: randomYRotation
      });
      
      // We're no longer adding slight random tilt to keep base flat on hexagon

      // Add to scene and associate with hex
      this.scene.add(crystal);
      hex.userData.crystal = crystal;
      
      // Track this crystal for animations and particles
      this.activeCrystals.push(crystal);
      
      // Add sparkle particle effects
      this._addParticlesToCrystal(crystal);

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
  /**
   * Adds a shader-based glow effect to a crystal
   * Uses custom shader material to create animated glow effect
   * @param {Object} crystal - The crystal mesh to add glow effect to
   * @private
   */
  _addShaderGlowEffect(crystal) {
    if (!crystal || !this.THREE) {
      console.warn('[CRYSTAL] Cannot add shader glow: invalid crystal or THREE not available');
      return;
    }

    // Don't attempt to add shader if it's already been added
    if (crystal.userData.hasShaderGlow) {
      console.log('[CRYSTAL] Crystal already has shader glow effect');
      return;
    }

    try {
      console.log('[CRYSTAL] Adding shader-based glow effect to crystal');
      
      // Clone the crystal geometry for the glow mesh
      let glowGeometry;
      
      if (crystal.geometry) {
        // Use the crystal's own geometry if available
        glowGeometry = crystal.geometry.clone();
      } else if (crystal.children && crystal.children.length > 0) {
        // For FBX models, find the first mesh child with geometry
        let meshWithGeometry = null;
        crystal.traverse(child => {
          if (child.isMesh && child.geometry && !meshWithGeometry) {
            meshWithGeometry = child;
          }
        });

        if (meshWithGeometry) {
          console.log('[CRYSTAL] Using geometry from child mesh for glow effect');
          glowGeometry = meshWithGeometry.geometry.clone();
        } else {
          // Fallback to a simple octahedron (crystal-like shape)
          console.log('[CRYSTAL] Using fallback geometry for glow effect');
          glowGeometry = new this.THREE.OctahedronGeometry(0.5, 1);
        }
      } else {
        // Fallback to a simple octahedron (crystal-like shape)
        console.log('[CRYSTAL] Using fallback geometry for glow effect');
        glowGeometry = new this.THREE.OctahedronGeometry(0.5, 1);
      }
      
      // Create pulse animation shader material
      const glowMaterial = new this.THREE.ShaderMaterial({
        uniforms: {
          // Base color of the glow
          glowColor: { value: new this.THREE.Color(0x9932CC) },
          // Pulse animation progress (0.0 to 1.0)
          pulsePhase: { value: 0.0 },
          // Intensity of the glow effect
          glowIntensity: { value: 1.5 },
          // Original model position for distance calculations
          viewVector: { value: new this.THREE.Vector3() },
        },
        vertexShader: `
          uniform vec3 viewVector;
          uniform float pulsePhase;
          varying float intensity;
          void main() {
            // Add subtle vertex movement based on pulse phase
            vec3 vNormal = normalize(normal);
            vec3 animated_position = position + vNormal * 0.02 * sin(pulsePhase * 6.0);
            vec4 worldPosition = modelMatrix * vec4(animated_position, 1.0);
            
            // Calculate view intensity for fade effect
            vec3 viewDirection = normalize(viewVector - worldPosition.xyz);
            intensity = pow(abs(dot(vNormal, viewDirection)), 1.5);
            
            // Standard projection
            gl_Position = projectionMatrix * modelViewMatrix * vec4(animated_position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float pulsePhase;
          uniform float glowIntensity;
          varying float intensity;
          void main() {
            // Create pulsing intensity based on animation phase
            // Enhanced pulsing for more dramatic effect
            float pulseMultiplier = 0.6 + 0.4 * sin(pulsePhase * 3.14159 * 2.0);
            
            // Apply color with variable intensity and custom shimmer effect
            float wobble = sin(pulsePhase * 20.0) * 0.05; // Fast subtle wobble
            float finalIntensity = (intensity + wobble) * glowIntensity * pulseMultiplier;
            
            // Apply color with adjusted alpha for better visibility
            gl_FragColor = vec4(glowColor, finalIntensity * 0.6);
          }
        `,
        side: this.THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: this.THREE.AdditiveBlending,
      });
      
      // Create the glow mesh
      const glowMesh = new this.THREE.Mesh(glowGeometry, glowMaterial);
      
      // Scale the glow effect appropriately based on crystal type
      if (crystal.type === 'Group' || crystal.children?.length > 0) {
        // FBX model or complex model - calculate appropriate scale
        console.log('[CRYSTAL] Applying glow to complex crystal model');
        
        // For complex models, we need to determine the appropriate scale
        let boundingBox = new this.THREE.Box3();
        let hasMesh = false;
        
        // Calculate bounding box to get appropriate scale
        crystal.traverse(child => {
          if (child.isMesh) {
            boundingBox.expandByObject(child);
            hasMesh = true;
          }
        });
        
        if (hasMesh) {
          // Get the size of the crystal
          const size = new this.THREE.Vector3();
          boundingBox.getSize(size);
          
          // Calculate average dimension and apply scale based on that
          const avgDimension = (size.x + size.y + size.z) / 3;
          console.log(`[CRYSTAL] Crystal average dimension: ${avgDimension.toFixed(3)}`);
          
          // Apply appropriate scale based on the original size
          if (avgDimension > 0) {
            // Make glow mesh 10% larger than the crystal
            glowMesh.scale.set(
              crystal.scale.x * 1.1,
              crystal.scale.y * 1.1,
              crystal.scale.z * 1.1
            );
          } else {
            // Fallback for cases where we can't determine size
            glowMesh.scale.copy(crystal.scale);
            glowMesh.scale.multiplyScalar(1.1);
          }
        } else {
          // If no meshes found, use the crystal's scale directly
          glowMesh.scale.copy(crystal.scale);
          glowMesh.scale.multiplyScalar(1.1);
        }
      } else {
        // Simple crystal - apply a standard scale multiplier
        // Make glow 12% bigger than the original crystal
        glowMesh.scale.copy(crystal.scale || new this.THREE.Vector3(1, 1, 1));
        glowMesh.scale.multiplyScalar(1.12);
      }
      
      // Log the determined scale for debugging
      console.log('[CRYSTAL] Applied glow scale:', { 
        x: glowMesh.scale.x.toFixed(3), 
        y: glowMesh.scale.y.toFixed(3), 
        z: glowMesh.scale.z.toFixed(3) 
      });
      
      // Set initial position to match the crystal
      glowMesh.position.copy(crystal.position);
      if (crystal.quaternion) {
        glowMesh.quaternion.copy(crystal.quaternion);
      }
      
      // Add the glow mesh to the scene
      this.scene.add(glowMesh);
      
      // Store references for animation
      crystal.userData.hasShaderGlow = true;
      crystal.userData.glowMesh = glowMesh;
      crystal.userData.glowAnimationPhase = 0;
      
      console.log('[CRYSTAL] Successfully added shader glow effect to crystal');
      
      // Add update function to be called in animation loop
      if (!this._updateGlowEffects) {
        // Define the update method for all glow effects
        this._updateGlowEffects = (deltaTime) => {
          try {
            // Update all crystal glow effects
            this.activeCrystals.forEach(crystal => {
              if (crystal.userData.hasShaderGlow && crystal.userData.glowMesh) {
                const glowMesh = crystal.userData.glowMesh;
                
                // Update animation phase (0.0 to 1.0 loop)
                if (crystal.userData.glowAnimationPhase === undefined) {
                  crystal.userData.glowAnimationPhase = 0;
                }
                
                // Increment phase based on delta time (complete cycle in about 3 seconds)
                crystal.userData.glowAnimationPhase += deltaTime * 0.3;
                if (crystal.userData.glowAnimationPhase > 1.0) {
                  crystal.userData.glowAnimationPhase -= 1.0;
                }
                
                // Periodic debug logging
                if (Math.random() < 0.001) {
                  console.log(`[CRYSTAL] Updating glow effect phase: ${crystal.userData.glowAnimationPhase.toFixed(2)}`);
                }
                
                // Update shader uniforms
                if (glowMesh.material && glowMesh.material.uniforms) {
                  // Update pulse phase
                  glowMesh.material.uniforms.pulsePhase.value = crystal.userData.glowAnimationPhase;
                  
                  // Enhanced visual effect: gradually change glow intensity
                  // Varies between 1.0 and 2.0 for more dramatic pulsing
                  const cyclicalIntensity = 1.0 + Math.sin(crystal.userData.glowAnimationPhase * Math.PI * 2) * 0.5;
                  glowMesh.material.uniforms.glowIntensity.value = cyclicalIntensity;
                  
                  // Update view vector (camera position for view-dependent effects)
                  if (this.camera) {
                    glowMesh.material.uniforms.viewVector.value.copy(this.camera.position);
                    
                    // Periodic logging to confirm camera position is being used
                    if (Math.random() < 0.001) {
                      console.log('[CRYSTAL] Using camera for view-dependent glow effect', {
                        cameraPosition: this.camera.position.toArray().map(v => v.toFixed(2)),
                        glowPhase: crystal.userData.glowAnimationPhase.toFixed(2),
                        glowIntensity: cyclicalIntensity.toFixed(2)
                      });
                    }
                  } else {
                    // If no camera available, use a default view vector
                    // This ensures the effect still works without a camera reference
                    glowMesh.material.uniforms.viewVector.value.set(0, 0, 5);
                    
                    if (Math.random() < 0.01) {
                      console.warn('[CRYSTAL] No camera reference for view-dependent effects');
                    }
                  }
                }
                
                // Ensure the glow stays with the crystal if it moves
                glowMesh.position.copy(crystal.position);
                if (crystal.quaternion) {
                  glowMesh.quaternion.copy(crystal.quaternion);
                }
              }
            });
          } catch (err) {
            console.error('[CRYSTAL] Error updating glow effects:', err);
            console.debug('Error details:', err.stack || err);
          }
        };
        
        // Extend updateParticles to also update glow effects
        const originalUpdateParticles = this.updateParticles;
        this.updateParticles = function(forceDelta) {
          // First call the original method
          originalUpdateParticles.call(this, forceDelta);
          
          // Then update glow effects with the same delta time
          const now = Date.now();
          const deltaTime = (forceDelta !== undefined) ? forceDelta : (now - this.particleLastUpdate) / 1000;
          
          // Apply appropriate bounds to deltaTime
          const boundedDelta = Math.min(Math.max(deltaTime, 0.001), 0.1);
          
          // Update all glow effects
          if (Math.random() < 0.002) {
            console.log(`[CRYSTAL] Updating glow effects with delta: ${boundedDelta.toFixed(4)}s`);
          }
          this._updateGlowEffects(boundedDelta);
        };
        
        console.log('[CRYSTAL] Glow effect animation system initialized');
      }
    } catch (error) {
      console.error('[CRYSTAL] Error adding shader glow effect:', error);
      console.debug('Error details:', error.stack || error);
    }
  }
}

// Export the class for external use
export default CrystalShardManager;
