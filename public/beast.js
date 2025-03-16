/**
 * Beast.js - Manages game creatures with directional movement and animated sprites
 * 
 * This module handles Beast entities with animated sprites using SpriteMixer
 * for frame-based animations from pre-made spritesheets.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";


// Import SpriteMixer as a module
const SpriteMixer = (function() {
  // Store the SpriteMixer instance
  let instance;

  // Create or return the existing instance
  return function() {
    if (!instance) {
      console.log('[BEAST] Creating new SpriteMixer instance');
      instance = new window.SpriteMixer();
    }
    return instance;
  };
})();

// Debug flag
const DEBUG = true;

/**
 * Enhanced logging function that only logs in debug mode
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[BEAST] ${message}`, data);
  } else {
    console.log(`[BEAST] ${message}`);
  }
}

/**
 * Class representing a Beast entity in the game
 */
export class Beast {
  /**
   * Create a new Beast
   * @param {string} type - The beast elemental type (e.g., 'Fire', 'Water')
   * @param {THREE.Scene} scene - The THREE.js scene
   * @param {THREE.Camera} camera - The THREE.js camera for billboarding
   * @param {Object} position - The initial position {x, y, z}
   * @param {number} scale - Scale factor for the beast (default: 3)
   */
  constructor(type, scene, camera, position, scale = 1) {
    debugLog(`Creating ${type} Beast`, position);

    this.type = type;
    this.scene = scene;
    this.camera = camera;
    this.scale = scale;
    this.position = position || { x: 0, y: 0.5, z: 0 };

    // Track loading state
    this.isLoaded = false;
    this.loadingProgress = 0;

    // Set up object group to contain beast and direction indicators
    this.group = new THREE.Group();
    this.group.position.set(this.position.x, this.position.y, this.position.z);

    // Add to scene immediately so it's in the hierarchy
    scene.add(this.group);

    // Animation properties
    try {
      console.log('[BEAST] Initializing SpriteMixer...');
      if (typeof SpriteMixer !== 'function') {
        console.error('[BEAST] SpriteMixer is not defined! Check if the library is loaded.');
      }
      this.spriteMixer = SpriteMixer();
      console.log('[BEAST] SpriteMixer initialized successfully:', { 
        mixerAvailable: !!this.spriteMixer,
        updateMethod: typeof this.spriteMixer.update === 'function' ? 'Available' : 'Missing'
      });
    } catch (err) {
      console.error('[BEAST] Failed to initialize SpriteMixer:', err);
      this.spriteMixer = null;
    }
    
    this.actionSprite = null;
    this.animations = {};
    this.currentAnimation = null;
    this.animationState = {
      playing: false,
      currentName: null,
      startTime: 0,
      frameCount: 0
    };
    
    // Texture properties
    this.beastTexture = null;
    this.spriteSheetData = null;
    
    // Shadow properties
    this.shadow = null;
    this.shadowSize = 0.9 * this.scale; // Slightly larger shadow size for better visibility
    this.shadowOpacity = 0.7; // Increased opacity for better visibility
    this.shadowHeight = 0.1; // Increased height offset to ensure visibility above hexagons
    this.shadowBlur = 0.2; // Softness factor for shadow edges
    
    // Load animated texture based on beast type
    this.loadAnimatedTexture();

    // Create shadow plane beneath the beast
    this._createShadow();

    // Create directional indicators
    this._createDirectionalIndicators();

    debugLog(`${type} Beast initialized`);
  }

  /**
   * Load the animated texture for the beast using pre-made spritesheets
   */
  loadAnimatedTexture() {
    console.log(`[BEAST] Loading animated texture for ${this.type} Beast`);
    
    // Add a loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = `beast-loading-${this.type}`;
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '10px';
    loadingIndicator.style.right = '10px';
    loadingIndicator.style.background = 'rgba(0,0,0,0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '5px 10px';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.zIndex = '1000';
    loadingIndicator.textContent = `Loading ${this.type} Beast: 0%`;
    document.body.appendChild(loadingIndicator);
    
    try {
      // Verify that SpriteMixer is available
      if (!this.spriteMixer) {
        console.error('[BEAST] SpriteMixer not available, falling back to colored texture');
        this._createColoredFallbackTexture();
        try { document.body.removeChild(loadingIndicator); } catch(e) {}
        return;
      }
      
      // Path to the pre-made spritesheet
      const spritesheetPath = `/assets/Beasts/spritesheets/${this.type}_spritesheet.png`;
      console.log(`[BEAST] Loading spritesheet from: ${spritesheetPath}`);
      
      // Load the spritesheet texture
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        spritesheetPath,
        (texture) => {
          try {
            console.log(`[BEAST] Spritesheet loaded successfully for ${this.type} Beast`);
            
            // Configure texture settings for pixel art
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            // Define spritesheet data based on beast type
            // Each frame is 32x32 pixels
            console.log(`[BEAST] Configuring spritesheet for ${this.type} Beast`);
            
            // All beasts use 2x2 layout with 32x32 pixel frames
            let tilesHoriz = 2; // 2 columns
            let tilesVert = 2;  // 2 rows
            let frameCount = 4; // 4 total frames
            
            console.log(`[BEAST] Using standard configuration for ${this.type} Beast: 2 columns, 2 rows (4 frames)`);
            
            // Note: There's one exception in the Beasts folder, but for now we're focusing on the Fire Beast
            
            // Log the configuration for debugging
            console.log('[BEAST] Spritesheet configuration:', {
              type: this.type,
              frameSize: '32x32',
              columns: tilesHoriz,
              rows: tilesVert,
              totalFrames: frameCount
            });
            
            const spriteSheetData = {
              texture: texture,
              tilesHoriz: tilesHoriz,
              tilesVert: tilesVert,
              frameCount: frameCount,
              frameSize: 32, // 32x32 pixel frames
              averageFrameDelay: 30 // 150ms per frame for smoother animation
            };
            
            // Store the sprite sheet data for reference
            this.spriteSheetData = spriteSheetData;
            
            // Create the ActionSprite using the sprite sheet texture
            this.actionSprite = this.spriteMixer.ActionSprite(
              spriteSheetData.texture,
              spriteSheetData.tilesHoriz,
              spriteSheetData.tilesVert
            );
            
            // Scale the sprite appropriately
            this.actionSprite.scale.set(this.scale,this.scale, 1);
            
            // Add the sprite to our group
            this.group.add(this.actionSprite);
            
            // Create animations based on the sprite sheet
            this._createAnimations(spriteSheetData);
            
            // Start the default animation
            this._playAnimation('idle');
            
            this.isLoaded = true;
            console.log(`[BEAST] ${this.type} Beast animated sprite created and added to scene`);
            
            // Debug: display the sprite sheet
            if (DEBUG) {
              const debugImg = document.createElement('img');
              debugImg.src = spritesheetPath;
              debugImg.style.position = 'absolute';
              debugImg.style.bottom = '10px';
              debugImg.style.right = '10px';
              debugImg.style.width = '100px';
              debugImg.style.border = '2px solid white';
              debugImg.style.zIndex = '1000';
              document.body.appendChild(debugImg);
              
              // Remove after 5 seconds
              setTimeout(() => {
                try { document.body.removeChild(debugImg); } catch(e) {}
              }, 5000);
            }
          } catch (err) {
            console.error('[BEAST] Error creating ActionSprite:', err);
            this._createColoredFallbackTexture();
          } finally {
            // Remove loading indicator
            try { document.body.removeChild(loadingIndicator); } catch(e) {}
          }
        },
        (progress) => {
          // Track loading progress
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          this.loadingProgress = percentage;
          if (loadingIndicator) {
            loadingIndicator.textContent = `Loading ${this.type} Beast: ${percentage}%`;
          }
          console.log(`[BEAST] ${this.type} Beast texture loading: ${percentage}%`);
        },
        (error) => {
          console.error(`[BEAST] Error loading spritesheet for ${this.type} Beast:`, error);
          // Fall back to colored texture
          this._createColoredFallbackTexture();
          // Remove loading indicator
          try { document.body.removeChild(loadingIndicator); } catch(e) {}
        }
      );
    } catch (err) {
      console.error(`[BEAST] Exception during animated texture loading:`, err);
      // Fall back to colored texture
      this._createColoredFallbackTexture();
      // Remove loading indicator
      try { document.body.removeChild(loadingIndicator); } catch(e) {}
    }
  }
  
  /**
   * Create animations from the sprite sheet data
   * @param {Object} spriteSheetData - Data from the sprite sheet conversion
   * @private
   */
  _createAnimations(spriteSheetData) {
    try {
      console.log('[BEAST] Creating animations from sprite sheet');
      
      // Calculate the average frame duration in milliseconds
      // Default to 100ms if not provided
      const frameDuration = Math.max(50, Math.round((spriteSheetData.averageFrameDelay || 100) * 10));
      
      console.log('[BEAST] Animation frame duration:', {
        averageFrameDelay: spriteSheetData.averageFrameDelay,
        calculatedDuration: frameDuration
      });
      
      // Validate frame count to avoid errors
      if (!spriteSheetData.frameCount || spriteSheetData.frameCount < 1) {
        console.error('[BEAST] Invalid frame count:', spriteSheetData.frameCount);
        return;
      }
      
      // Create an 'idle' animation using all frames
      try {
        this.animations.idle = this.spriteMixer.Action(
          this.actionSprite,
          0,                              // Start frame index
          spriteSheetData.frameCount - 1, // End frame index
          frameDuration                   // Frame duration in ms
        );
        
        // Set animation properties
        this.animations.idle.clampWhenFinished = false; // Loop indefinitely
        this.animations.idle.hideWhenFinished = false;  // Keep visible
        
        console.log('[BEAST] Created idle animation:', {
          frames: spriteSheetData.frameCount,
          frameDuration: frameDuration,
          totalDuration: frameDuration * spriteSheetData.frameCount
        });
      } catch (err) {
        console.error('[BEAST] Failed to create idle animation:', err);
      }
      
      // Create animations based on available frames
      console.log('[BEAST] Creating animations with frame count:', spriteSheetData.frameCount);
      
      // For beasts with 4 frames (2x2 layout)
      if (spriteSheetData.frameCount >= 4) {
        try {
          // Create 'attack' animation using first half of frames
          const attackFrames = Math.ceil(spriteSheetData.frameCount / 2);
          this.animations.attack = this.spriteMixer.Action(
            this.actionSprite,
            0,                  // Start frame
            attackFrames - 1,   // End frame
            frameDuration - 10  // Slightly faster
          );
          this.animations.attack.clampWhenFinished = true;
          this.animations.attack.hideWhenFinished = false;
          this.animations.attack.loop = 0;  // Play once
          
          console.log('[BEAST] Created attack animation:', {
            startFrame: 0,
            endFrame: attackFrames - 1,
            frames: attackFrames,
            frameDuration: frameDuration - 10
          });
        } catch (err) {
          console.error('[BEAST] Failed to create attack animation:', err);
        }
        
        try {
          // Create 'hurt' animation using second half of frames
          const attackFrames = Math.ceil(spriteSheetData.frameCount / 2);
          this.animations.hurt = this.spriteMixer.Action(
            this.actionSprite,
            attackFrames,                   // Start frame
            spriteSheetData.frameCount - 1, // End frame
            frameDuration + 20              // Slightly slower
          );
          this.animations.hurt.clampWhenFinished = true;
          this.animations.hurt.hideWhenFinished = false;
          this.animations.hurt.loop = 0;  // Play once
          
          console.log('[BEAST] Created hurt animation:', {
            startFrame: attackFrames,
            endFrame: spriteSheetData.frameCount - 1,
            frames: spriteSheetData.frameCount - attackFrames,
            frameDuration: frameDuration + 20
          });
        } catch (err) {
          console.error('[BEAST] Failed to create hurt animation:', err);
        }
      } 
      // For beasts with only 2 frames (Fire beast with 1x2 layout)
      else if (spriteSheetData.frameCount === 2) {
        try {
          // For the 2-frame case, use both frames for attack
          this.animations.attack = this.spriteMixer.Action(
            this.actionSprite,
            0,                               // Start frame
            spriteSheetData.frameCount - 1,  // End frame
            frameDuration - 10               // Slightly faster
          );
          
          // Set animation properties
          this.animations.attack.clampWhenFinished = true;  // Stop at end
          this.animations.attack.hideWhenFinished = false;  // Keep visible
          this.animations.attack.loop = 0;                  // Play once
          
          console.log('[BEAST] Created attack animation for 2-frame sprite:', {
            startFrame: 0,
            endFrame: spriteSheetData.frameCount - 1,
            frameDuration: frameDuration - 10,
            loop: 0
          });
        } catch (err) {
          console.error('[BEAST] Failed to create attack animation for 2-frame sprite:', err);
        }
        
        try {
          // Create 'hurt' animation using both frames but with different timing
          this.animations.hurt = this.spriteMixer.Action(
            this.actionSprite,
            0,                               // Start frame
            spriteSheetData.frameCount - 1,  // End frame
            frameDuration + 20               // Slower for hurt effect
          );
          
          // Set animation properties
          this.animations.hurt.clampWhenFinished = true;  // Stop at end
          this.animations.hurt.hideWhenFinished = false;  // Keep visible
          this.animations.hurt.loop = 0;                  // Play once
          
          console.log('[BEAST] Created hurt animation for 2-frame sprite:', {
            startFrame: 0,
            endFrame: spriteSheetData.frameCount - 1,
            frameDuration: frameDuration + 20,
            loop: 0
          });
        } catch (err) {
          console.error('[BEAST] Failed to create hurt animation for 2-frame sprite:', err);
        }
      }
    } catch (err) {
      console.error('[BEAST] Error creating animations:', err);
    }
  }
  
  /**
   * Play a specific animation
   * @param {string} animationName - Name of the animation to play
   * @private
   */
  _playAnimation(animationName) {
    try {
      if (!this.animations[animationName]) {
        console.warn(`[BEAST] Animation '${animationName}' not found, defaulting to 'idle'`);
        animationName = 'idle';
      }
      
      // Stop current animation if one is playing
      if (this.currentAnimation) {
        this.currentAnimation.stop();
      }
      
      // Set and play the new animation
      this.currentAnimation = this.animations[animationName];
      
      if (animationName === 'idle') {
        this.currentAnimation.playLoop();
        console.log(`[BEAST] Playing looping animation: ${animationName}`);
      } else {
        this.currentAnimation.playOnce();
        console.log(`[BEAST] Playing one-shot animation: ${animationName}`);
      }
    } catch (err) {
      console.error(`[BEAST] Error playing animation '${animationName}':`, err);
    }
  }
  
  /**
   * Create a colored fallback texture when all else fails
   * @private
   */
  _createColoredFallbackTexture() {
    console.log('[BEAST] Creating colored fallback texture');
    
    try {
      // Create a simple colored canvas as absolute fallback
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      // Choose color based on beast type
      let color = '#ff6b6b';
      switch(this.type.toLowerCase()) {
        case 'fire': color = '#ff6b6b'; break;
        case 'water': color = '#118ab2'; break;
        case 'earth': color = '#06d6a0'; break;
        case 'wind': color = '#73d2de'; break;
        case 'electric': color = '#ffd166'; break;
        case 'plant': color = '#06d6a0'; break;
        case 'dark': color = '#073b4c'; break;
        case 'light': color = '#ffd166'; break;
        case 'metal': color = '#adb5bd'; break;
        case 'spirit': color = '#b5838d'; break;
        case 'combat': color = '#e07a5f'; break;
        case 'corrosion': color = '#81b29a'; break;
        default: color = '#ff6b6b'; break;
      }
      
      // Fill with a gradient
      const gradient = ctx.createLinearGradient(0, 0, 64, 64);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      
      // Add a border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);
      
      // Add beast type text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.type, 32, 32);
      
      // Create a texture
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Configure texture
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      
      // Create a simple sprite with the texture
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      
      // Scale the sprite
      sprite.scale.set(this.scale,this.scale, 1);
      
      // Add to our group
      this.group.add(sprite);
      
      this.isLoaded = true;
      console.log('[BEAST] Colored fallback sprite created and added to scene');
      
    } catch (err) {
      console.error('[BEAST] Failed to create colored fallback texture:', err);
    }
  }



  /**
   * Create directional arrows pointing to adjacent hexes
   * @private
   */
  _createDirectionalIndicators() {
    console.log("[BEAST] Creating directional movement arrows");

    // Define hex directions
    this.hexDirections = [
      { id: 1, name: "North", q: 0, r: -1 },
      { id: 2, name: "NorthEast", q: 1, r: -1 },
      { id: 3, name: "SouthEast", q: 1, r: 0 },
      { id: 4, name: "South", q: 0, r: 1 },
      { id: 5, name: "SouthWest", q: -1, r: 1 },
      { id: 6, name: "NorthWest", q: -1, r: 0 },
    ];

    // Hex grid configuration
    const hexRadius = 1.0; // Radius of a hex
    const hexHeight = 0.2; // Height of hex tile
    const horizontalSpacing = 1.5; // Horizontal spacing between hexes
    const verticalFactor = 1.0; // Vertical spacing factor
    const arrowDistance = 0.7; // Controls how far along the vector the arrow is placed
    const arrowHeight = 0.25; // Height of arrows above the hex plane

    // Create geometry for arrow
    const arrowGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);

    // Material for arrows
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      emissive: 0x996600,
      specular: 0xffffff,
    });

    // Create an array to store arrow references
    this.directionalArrows = [];

    // Function to calculate 3D hex position from axial coordinates
    const calculateHexPosition = (q, r) => {
      // For perfect fit in axial coordinate system
      const x = hexRadius * horizontalSpacing * q;
      const z = hexRadius * Math.sqrt(3) * verticalFactor * (r + q / 2);
      const y = hexHeight / 2; // Half height of hex

      return new THREE.Vector3(x, y, z);
    };

    // Create arrows for each direction
    this.hexDirections.forEach((direction) => {
      // Calculate target hex position in world space
      const targetHexPos = calculateHexPosition(direction.q, direction.r);

      // Calculate direction vector from beast to target hex
      const directionVector = new THREE.Vector3().subVectors(
        targetHexPos,
        new THREE.Vector3(0, 0, 0),
      );

      // Normalize the direction vector
      const normalizedDirection = directionVector.clone().normalize();

      // Calculate arrow position at fraction of distance to hex
      const arrowPos = new THREE.Vector3().addScaledVector(
        normalizedDirection,
        hexRadius * arrowDistance,
      );
      arrowPos.y = arrowHeight; // Set fixed height above ground

      // Create arrow mesh
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial.clone());

      // Position arrow
      arrow.position.copy(arrowPos);

      // Store original target for lookAt
      const targetPoint = new THREE.Vector3().copy(targetHexPos);
      targetPoint.y = arrowHeight; // Keep on same plane for correct orientation

      // Point arrow toward target
      // We need to apply a -90 degree X rotation to account for cone's default orientation
      arrow.lookAt(targetPoint);
      arrow.rotateX(Math.PI / 2);

      // Make arrow interactive
      arrow.userData = {
        direction: direction.name,
        directionId: direction.id,
        moveOffset: { q: direction.q, r: direction.r },
        isMovementArrow: true,
        targetHexPos: targetHexPos.clone(),
      };

      // Add to the group
      this.group.add(arrow);

      // Store arrow reference
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        directionId: direction.id,
        coordinates: { q: direction.q, r: direction.r },
        targetPosition: targetHexPos.clone(),
      });
    });
  }

  /**
   * Set up click detection for beast arrows
   * @param {Array} hexagons - Array of hexagons in the scene
   */
  setupClickHandling(hexagons) {
    // Store the hexagons reference for movement
    this.hexagons = hexagons;

    // Create raycaster for click detection
    this.raycaster = new THREE.Raycaster();

    // Current hex position in axial coordinates
    this.currentAxialPos = { q: 0, r: 0 };

    // Find the hexagon we're currently on
    this._updateCurrentHexPosition();

    // Set up click listener
    window.addEventListener("click", this._handleClick.bind(this));

    debugLog(`Click handling set up for ${this.type} Beast`);
  }

  /**
   * Handle click events for beast movement
   * @private
   */
  _handleClick(event) {
    // Only process if beast is loaded
    if (!this.isLoaded) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray
    this.raycaster.setFromCamera(mouse, this.camera);

    // Find intersections with directional arrows
    const arrowMeshes = this.directionalArrows.map((arrow) => arrow.mesh);
    const intersects = this.raycaster.intersectObjects(arrowMeshes, false);

    // If an arrow was clicked
    if (intersects.length > 0) {
      const clickedArrow = intersects[0].object;

      // Calculate the new axial position
      const newQ = this.currentAxialPos.q + clickedArrow.userData.moveOffset.q;
      const newR = this.currentAxialPos.r + clickedArrow.userData.moveOffset.r;

      // Find the corresponding hex at this position
      const targetHex = this._findHexAtAxialPosition(newQ, newR);

      if (targetHex) {
        // Move to the new hex position
        this.moveTo({
          x: targetHex.position.x,
          y: targetHex.position.y + 0.7, // Offset above the hex
          z: targetHex.position.z,
        });

        // Update current axial position
        this.currentAxialPos = { q: newQ, r: newR };

        // Log the move for debugging
        console.log(`[BEAST] Moving to new hex:`, {
          from: {
            q: this.currentAxialPos.q - clickedArrow.userData.moveOffset.q,
            r: this.currentAxialPos.r - clickedArrow.userData.moveOffset.r,
          },
          to: { q: newQ, r: newR },
          hexPosition: {
            x: targetHex.position.x.toFixed(2),
            y: targetHex.position.y.toFixed(2),
            z: targetHex.position.z.toFixed(2),
          },
          hexElement: targetHex.userData.element,
        });
      } else {
        console.warn(`[BEAST] No hex found at q=${newQ}, r=${newR}`);
      }
    }
  }

  /**
   * Update the beast's current hex position
   * @private
   */
  _updateCurrentHexPosition() {
    if (!this.hexagons) return;

    // Find the closest hex to the beast's current position
    let closestHex = null;
    let closestDistance = Infinity;

    this.hexagons.forEach((hex) => {
      const distance = Math.sqrt(
        Math.pow(hex.position.x - this.group.position.x, 2) +
          Math.pow(hex.position.z - this.group.position.z, 2),
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHex = hex;
      }
    });

    if (closestHex) {
      this.currentAxialPos = {
        q: closestHex.userData.q,
        r: closestHex.userData.r,
      };
      debugLog(
        `Beast is on hex at q=${this.currentAxialPos.q}, r=${this.currentAxialPos.r}`,
      );
    }
  }

  /**
   * Find a hex at specified axial coordinates
   * @param {number} q - q axial coordinate
   * @param {number} r - r axial coordinate
   * @returns {Object} - The hex mesh object or null if not found
   * @private
   */
  _findHexAtAxialPosition(q, r) {
    if (!this.hexagons) return null;

    return this.hexagons.find(
      (hex) => hex.userData.q === q && hex.userData.r === r,
    );
  }

  /**
   * Update the beast (called in animation loop)
   * @param {number} delta - Time delta since last frame in seconds
   */
  update(delta = 0.016) {
    if (!this.isLoaded) {
      // If still loading, we can show a loading indicator or similar
      return;
    }
    
    try {
      // Update shadow based on current height above ground
      if (this.shadow) {
        const currentHeight = this.group.position.y;
        this._updateShadow(currentHeight);
        
        // Ensure shadow is visible and properly positioned
        if (DEBUG && Math.random() < 0.01) { // Occasionally verify shadow state
          console.log('[BEAST] Shadow state in update():', {
            exists: !!this.shadow,
            height: currentHeight,
            shadowPosition: this.shadow.position.clone(),
            shadowOpacity: this.shadow.material ? this.shadow.material.opacity : 'N/A',
            visible: this.shadow.visible
          });
        }
      }
      // Update the sprite mixer to advance animations
      if (this.spriteMixer) {
        // Log animation state occasionally for debugging
        this.animationState.frameCount++;
        if (this.animationState.frameCount % 300 === 0) {
          console.log('[BEAST] Animation state:', {
            playing: this.animationState.playing,
            animation: this.animationState.currentName,
            elapsedTime: ((Date.now() - this.animationState.startTime) / 1000).toFixed(2) + 's',
            delta: delta.toFixed(4) + 's'
          });
        }
        
        // Update the sprite mixer with delta time
        this.spriteMixer.update(delta);
      } else {
        // If SpriteMixer isn't available, log it occasionally
        if (Math.random() < 0.01) { // Log roughly every 100 frames
          console.warn('[BEAST] SpriteMixer not available for animation updates');
        }
      }
      
      // Animate the directional arrows
      if (this.directionalArrows) {
        // Pulse the arrows by adjusting opacity
        const pulseFactor = (Math.sin(Date.now() * 0.005) + 1) / 2; // 0 to 1

        this.directionalArrows.forEach((arrow) => {
          arrow.mesh.material.opacity = 0.4 + pulseFactor * 0.6; // 0.4 to 1.0
        });
      }
    } catch (err) {
      console.error('[BEAST] Error in update loop:', err, err.stack);
    }
  }

  /**
   * Move the beast to a new hex position
   * @param {Object} newPosition - New position {x, y, z}
   */
  moveTo(newPosition) {
    debugLog(`[BEAST] Moving ${this.type} Beast to new position`, newPosition);

    try {
      // Play movement animation if available
      if (this.animations.attack) {
        this._playAnimation('attack');
        
        // Set up a listener to return to idle when attack animation finishes
        const onAnimationFinished = (event) => {
          console.log('[BEAST] Animation finished event:', { 
            type: event.type, 
            action: event.action,
            isAttackAnimation: event.action === this.animations.attack
          });
          
          if (event.type === 'finished' && event.action === this.animations.attack) {
            this._playAnimation('idle');
            
            // Check if removeEventListener exists before calling it
            if (this.spriteMixer && typeof this.spriteMixer.removeEventListener === 'function') {
              console.log('[BEAST] Removing animation finished event listener');
              this.spriteMixer.removeEventListener('finished', onAnimationFinished);
            } else {
              console.warn('[BEAST] Cannot remove event listener - method not available');
              // Store the listener to avoid adding duplicates
              this._currentAnimationListener = onAnimationFinished;
            }
          }
        };
        
        // Add the listener if not already added
        if (!this._currentAnimationListener) {
          console.log('[BEAST] Adding animation finished event listener');
          this.spriteMixer.addEventListener('finished', onAnimationFinished);
          this._currentAnimationListener = onAnimationFinished;
        } else {
          console.log('[BEAST] Animation listener already exists, reusing');
        }
      }

      // Update current position
      this.position = {
        x: newPosition.x,
        y: this.position.y, // Keep the same y
        z: newPosition.z,
      };

      // Animate the movement
      const duration = 1000; // ms
      const startTime = Date.now();
      const startPos = {
        x: this.group.position.x,
        y: this.group.position.y,
        z: this.group.position.z,
      };
      
      console.log('[BEAST] Starting movement animation:', {
        from: startPos,
        to: newPosition,
        duration: duration
      });

      // Animation function
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // Update position
        this.group.position.x =
          startPos.x + (newPosition.x - startPos.x) * easeOut;
        this.group.position.y =
          startPos.y + (newPosition.y - startPos.y) * easeOut;
        this.group.position.z =
          startPos.z + (newPosition.z - startPos.z) * easeOut;
          
        // Enhanced shadow updates during movement animation
        if (this.shadow) {
          // Get the current beast height for shadow calculations
          const currentHeight = this.group.position.y;
          
          // Update shadow with enhanced positioning and effects
          this._updateShadow(currentHeight);
          
          // Occasionally validate shadow is appearing correctly during animation
          if (DEBUG && Math.random() < 0.05) {
            // Log comprehensive shadow state for debugging
            console.log('[BEAST] Enhanced shadow updated during animation:', {
              height: currentHeight,
              position: this.shadow.position.clone(),
              worldPosition: (() => {
                const wp = new THREE.Vector3();
                this.shadow.getWorldPosition(wp);
                return wp;
              })(),
              visible: this.shadow.visible,
              opacity: this.shadow.material.opacity,
              renderOrder: this.shadow.renderOrder
            });
          }
        }

        // Continue animation if not complete
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          debugLog(`[BEAST] ${this.type} Beast movement complete`);
          
          // Update the current hex position after movement completes
          this._updateCurrentHexPosition();
        }
      };

      // Start animation
      animate();
    } catch (err) {
      console.error('[BEAST] Error during movement animation:', err);
      
      // Fallback: immediately move to position without animation
      this.group.position.set(newPosition.x, this.position.y, newPosition.z);
    }
  }

  /**
   * Create a circular shadow beneath the beast
   * @private
   */
  /**
   * Creates a shadow mesh for the beast
   * Enhanced with better visibility, proper depth handling, and blur effects
   * @private
   */
  _createShadow() {
    try {
      console.log('[BEAST] Creating enhanced shadow for beast');
      
      // Create a circular plane for the shadow with more segments for smoother edges
      const shadowGeometry = new THREE.CircleGeometry(this.shadowSize, 64);
      
      // Create a material for the shadow with improved properties for visibility
      const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,  // Black color for shadow
        transparent: true, // Enable transparency
        opacity: this.shadowOpacity,
        depthWrite: false, // Don't write to depth buffer
        depthTest: true,   // But still test against depth buffer
        side: THREE.DoubleSide, // Visible from both sides
        fog: true,        // Allow fog effects
        alphaTest: 0.01   // Slight alpha test to improve edge quality
      });
      
      // Create the shadow mesh
      this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      
      // Rotate to lie flat on the ground (default circle is in XY plane)
      this.shadow.rotation.x = -Math.PI / 2;
      
      // Set very high renderOrder to ensure shadow always renders on top of terrain
      this.shadow.renderOrder = 5; // Higher value = rendered later = appears on top
      
      // Set up high resolution shadow buffer for better quality
      if (this.shadow.material) {
        this.shadow.material.precision = 'highp';
      }
      
      // Increase shadow's receive shadow capability (if used)
      this.shadow.receiveShadow = false; // Don't receive shadows from other objects
      this.shadow.castShadow = false;    // Don't cast shadow itself
      
      // Log shadow creation details
      console.log('[BEAST] Shadow created with enhanced visibility properties:', {
        size: this.shadowSize,
        opacity: this.shadowOpacity,
        height: this.shadowHeight,
        renderOrder: this.shadow.renderOrder
      });
      
      // Give shadow a name for debugging
      this.shadow.name = 'beast-enhanced-shadow';
      
      // Initially position the shadow with proper height offset
      const height = this.group.position.y;
      this._updateShadow(height);
      
      // Save beast reference and add to group
      this.shadow.beastReference = this;
      this.group.add(this.shadow);
      
      console.log('[BEAST] Shadow created successfully with properties:', {
        size: this.shadowSize,
        opacity: this.shadowOpacity,
        position: this.shadow.position,
        rotation: this.shadow.rotation
      });
      
    } catch (err) {
      console.error('[BEAST] Error creating shadow:', err);
    }
  }
  
  /**
   * Update the shadow based on beast height above ground
   * @param {number} height - Height of beast above ground
   * @private
   */
  /**
   * Updates the shadow position, scale, and appearance based on beast height
   * Enhanced with better height handling and visual properties
   * @param {number} height - Current height of the beast above ground
   * @private
   */
  _updateShadow(height) {
    try {
      if (!this.shadow) {
        console.warn('[BEAST] Cannot update shadow - shadow not created');
        return;
      }
      
      // Get current world position of the beast group
      const worldPos = new THREE.Vector3();
      this.group.getWorldPosition(worldPos);
      
      // Position shadow directly beneath beast but elevated above ground
      // The shadowHeight property prevents z-fighting with hexagons
      this.shadow.position.set(0, -height + this.shadowHeight, 0);
      
      // Enhanced shadow scaling based on height with better curve
      // As beast goes higher, shadow gets smaller and more transparent
      let heightFactor;
      if (height <= 0.5) {
        // For low heights, maintain larger shadow
        heightFactor = Math.max(0.7, 1 - (height * 0.15));
      } else {
        // For higher elevations, scale down more dramatically
        heightFactor = Math.max(0.5, 1 - (height * 0.25));
      }
      
      // Apply the scale to make shadow smaller with height
      this.shadow.scale.set(heightFactor * 1.1, heightFactor * 1.1, 1);
      
      // Update material properties if it exists
      if (this.shadow.material) {
        // Enhanced opacity calculation with better minimum threshold
        const minOpacity = 0.45; // Slightly higher minimum opacity
        const calculatedOpacity = Math.max(minOpacity, this.shadowOpacity * (1 - (height * 0.15)));
        
        // Apply the calculated opacity
        this.shadow.material.opacity = calculatedOpacity;
        
        // Mark material for update to ensure changes take effect
        this.shadow.material.needsUpdate = true;
      }
      
      // Ensure shadow visibility is enabled
      this.shadow.visible = true;
      
      // Log detailed shadow state for debugging (occasionally)
      if (DEBUG && Math.random() < 0.01) {
        console.log('[BEAST] Enhanced shadow updated:', {
          beastWorldPos: worldPos.clone(),
          height: height,
          shadowPos: this.shadow.position.clone(),
          scaleFactor: heightFactor,
          opacity: this.shadow.material.opacity,
          renderOrder: this.shadow.renderOrder,
          heightOffset: this.shadowHeight,
          visible: this.shadow.visible
        });
      }
      
    } catch (err) {
      console.error('[BEAST] Error updating shadow:', err, {
        hasShadow: !!this.shadow,
        beastHeight: height,
        shadowHeight: this.shadowHeight
      });
    }
  }

  /**
   * Dispose of all THREE.js objects to prevent memory leaks
   */
  dispose() {
    debugLog(`[BEAST] Disposing ${this.type} Beast`);

    try {
      // Stop any playing animations
      if (this.currentAnimation) {
        this.currentAnimation.stop();
        this.currentAnimation = null;
      }
      
      // Clear animation references
      this.animations = {};
      
      // Dispose texture if exists
      if (this.beastTexture) {
        this.beastTexture.dispose();
        this.beastTexture = null;
      }
      
      // Dispose sprite sheet texture if exists
      if (this.spriteSheetData && this.spriteSheetData.texture) {
        this.spriteSheetData.texture.dispose();
        this.spriteSheetData = null;
      }

      // Remove and dispose regular sprite
      if (this.sprite) {
        this.group.remove(this.sprite);
        if (this.sprite.material) {
          this.sprite.material.dispose();
        }
        this.sprite = null;
      }
      
      // Remove and dispose action sprite
      if (this.actionSprite) {
        this.group.remove(this.actionSprite);
        if (this.actionSprite.material) {
          this.actionSprite.material.dispose();
        }
        this.actionSprite = null;
      }

      // Remove and dispose shadow
      if (this.shadow) {
        this.group.remove(this.shadow);
        if (this.shadow.geometry) {
          this.shadow.geometry.dispose();
        }
        if (this.shadow.material) {
          this.shadow.material.dispose();
        }
        this.shadow = null;
        console.log('[BEAST] Shadow disposed');
      }
      
      // Remove and dispose directional arrows
      if (this.directionalArrows) {
        this.directionalArrows.forEach((arrow) => {
          this.group.remove(arrow.mesh);
          if (arrow.mesh) {
            if (arrow.mesh.geometry) arrow.mesh.geometry.dispose();
            if (arrow.mesh.material) arrow.mesh.material.dispose();
          }
        });
        this.directionalArrows = [];
      }

      // Remove group from scene
      if (this.group && this.scene) {
        this.scene.remove(this.group);
      }
      this.group = null;

      debugLog(`[BEAST] ${this.type} Beast disposed successfully`);
    } catch (err) {
      console.error(`[BEAST] Error during disposal:`, err);
    }
  }

  /**
   * Find a random hex of specified element type from an array of hexagons
   * @param {Array} hexagons - Array of hex objects
   * @param {string} elementType - The element type to look for
   * @returns {Object|null} The found hex or null
   */
  static findRandomHexOfElement(hexagons, elementType) {
    debugLog(
      `Finding random ${elementType} hex from ${hexagons.length} hexagons`,
    );

    // Filter hexagons by element type
    const matchingHexes = hexagons.filter(
      (hex) => hex.userData && hex.userData.element === elementType,
    );

    if (matchingHexes.length === 0) {
      console.warn(`No hexes found with element type: ${elementType}`);
      return null;
    }

    // Select random hex from matching hexes
    const randomIndex = Math.floor(Math.random() * matchingHexes.length);
    const selectedHex = matchingHexes[randomIndex];

    debugLog(
      `Found ${matchingHexes.length} ${elementType} hexes, selected index ${randomIndex}`,
    );

    return selectedHex;
  }
}
