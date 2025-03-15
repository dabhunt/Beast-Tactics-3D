/**
 * Beast.js - Manages game creatures with directional movement and animated sprites
 * 
 * This module handles Beast entities with animated sprites using SpriteMixer
 * for frame-based animations from sprite sheets converted from GIFs.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { convertGifToSpriteSheet } from "../tools/gifToSpriteSheet.js";

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
    
    // Load animated texture based on beast type
    this.loadAnimatedTexture();

    // Create directional indicators
    this._createDirectionalIndicators();

    debugLog(`${type} Beast initialized`);
  }

  /**
   * Load the animated texture for the beast using GIF frames
   */
  loadAnimatedTexture() {
    debugLog(`[BEAST] Loading animated texture for ${this.type} Beast`);
    
    // Path to the GIF file
    const gifPath = `/assets/Beasts/${this.type}.gif`;
    
    try {
      console.log(`[BEAST] Starting conversion of ${gifPath} to sprite sheet`);
      
      // Convert GIF to sprite sheet format for SpriteMixer
      convertGifToSpriteSheet(
        gifPath,
        (spriteSheetData) => {
          // Store the sprite sheet data for reference
          this.spriteSheetData = spriteSheetData;
          
          console.log('[BEAST] Sprite sheet created successfully:', {
            frameCount: spriteSheetData.frameCount,
            dimensions: `${spriteSheetData.width}x${spriteSheetData.height}`,
            grid: `${spriteSheetData.tilesHoriz}x${spriteSheetData.tilesVert}`
          });
          
          // Create the ActionSprite using the sprite sheet texture
          this.actionSprite = this.spriteMixer.ActionSprite(
            spriteSheetData.texture,
            spriteSheetData.tilesHoriz,
            spriteSheetData.tilesVert
          );
          
          // Scale the sprite appropriately
          this.actionSprite.scale.set(2 * this.scale, 2 * this.scale, 1);
          
          // Add the sprite to our group
          this.group.add(this.actionSprite);
          
          // Create animations based on the sprite sheet
          this._createAnimations(spriteSheetData);
          
          // Start the default animation
          this._playAnimation('idle');
          
          this.isLoaded = true;
          debugLog(`[BEAST] ${this.type} Beast animated sprite created and added to scene`);
        },
        (progress) => {
          // Track loading progress
          this.loadingProgress = progress.percentage;
          debugLog(`[BEAST] ${this.type} Beast texture loading: ${progress.percentage}% (Frame ${progress.frame}/${progress.total})`);
        },
        (error) => {
          console.error(`[BEAST] Error creating sprite sheet for ${this.type} Beast:`, error);
          // Fall back to static texture if GIF conversion fails
          this._loadStaticTextureFallback();
        }
      );
    } catch (err) {
      console.error(`[BEAST] Exception during animated texture loading:`, err);
      // Fall back to static texture if GIF conversion throws an exception
      this._loadStaticTextureFallback();
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
      const frameDuration = Math.max(50, Math.round(spriteSheetData.averageFrameDelay * 10));
      
      // Create an 'idle' animation using all frames
      this.animations.idle = this.spriteMixer.Action(
        this.actionSprite,
        0,                              // Start frame index
        spriteSheetData.frameCount - 1, // End frame index
        frameDuration                   // Frame duration in ms
      );
      
      // Set animation properties
      this.animations.idle.clampWhenFinished = false; // Loop indefinitely
      this.animations.idle.hideWhenFinished = false;  // Keep visible
      
      console.log('[BEAST] Created animations:', {
        idle: {
          frames: spriteSheetData.frameCount,
          frameDuration: frameDuration,
          totalDuration: frameDuration * spriteSheetData.frameCount
        }
      });
      
      // If we have enough frames, create additional animations
      if (spriteSheetData.frameCount >= 8) {
        // Create 'attack' animation using first half of frames
        const attackFrames = Math.floor(spriteSheetData.frameCount / 2);
        this.animations.attack = this.spriteMixer.Action(
          this.actionSprite,
          0,                  // Start frame
          attackFrames - 1,   // End frame
          frameDuration - 10  // Slightly faster
        );
        this.animations.attack.clampWhenFinished = true;
        this.animations.attack.hideWhenFinished = false;
        
        // Create 'hurt' animation using second half of frames
        this.animations.hurt = this.spriteMixer.Action(
          this.actionSprite,
          attackFrames,                   // Start frame
          spriteSheetData.frameCount - 1, // End frame
          frameDuration + 20              // Slightly slower
        );
        this.animations.hurt.clampWhenFinished = true;
        this.animations.hurt.hideWhenFinished = false;
        
        console.log('[BEAST] Created additional animations:', {
          attack: { frames: attackFrames, frameDuration: frameDuration - 10 },
          hurt: { frames: spriteSheetData.frameCount - attackFrames, frameDuration: frameDuration + 20 }
        });
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
   * Load a static texture as fallback when animated texture fails
   * @private
   */
  _loadStaticTextureFallback() {
    const textureLoader = new THREE.TextureLoader();
    const texturePath = `/assets/Beasts/${this.type}.png`;

    debugLog(`[BEAST] Falling back to static texture for ${this.type} Beast: ${texturePath}`);

    textureLoader.load(
      texturePath,
      (texture) => {
        debugLog(`[BEAST] ${this.type} Beast fallback texture loaded successfully`);

        this.beastTexture = texture;

        // Create sprite with the loaded texture
        const material = new THREE.SpriteMaterial({
          map: texture,
          color: 0xffffff,
        });

        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(1.5 * this.scale, 1.5 * this.scale, 1);
        this.group.add(this.sprite);

        this.isLoaded = true;
        debugLog(`[BEAST] ${this.type} Beast fallback sprite created and added to scene`);
      },
      (xhr) => {
        // Loading progress
        const progress = (xhr.loaded / xhr.total) * 100;
        debugLog(`[BEAST] ${this.type} Beast fallback texture loading: ${progress.toFixed(2)}%`);
      },
      (error) => {
        console.error(`[BEAST] Error loading ${this.type} Beast fallback texture:`, error);
        this._createFallbackSprite();
      },
    );
  }

  /**
   * Create a colored fallback sprite when texture loading fails
   * @private
   */
  _createFallbackSprite() {
    debugLog(`Creating colored fallback sprite for ${this.type} Beast`);

    // Element color mapping
    const elementColors = {
      Fire: 0xff4500,
      Water: 0x3498db,
      Earth: 0x964b00,
      Wind: 0xc6e2ff,
      Electric: 0xffff00,
      Plant: 0x2ecc71,
      Metal: 0xc0c0c0,
      Light: 0xffffff,
      Dark: 0x581845,
      Combat: 0xff5733,
      Spirit: 0xd8bfd8,
      Corrosion: 0x7cfc00,
    };

    // Get appropriate color or default to fire color
    const color = elementColors[this.type] || 0xff4500;

    // Create fallback colored sprite
    const fallbackMaterial = new THREE.SpriteMaterial({
      color: color,
      transparent: true,
    });

    this.sprite = new THREE.Sprite(fallbackMaterial);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.group.add(this.sprite);
    this.isLoaded = true;

    debugLog(`Created colored fallback sprite for ${this.type} Beast`, {
      color: color.toString(16),
    });
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
          if (event.type === 'finished' && event.action === this.animations.attack) {
            this._playAnimation('idle');
            // Remove the listener to avoid memory leaks
            this.spriteMixer.removeEventListener('finished', onAnimationFinished);
          }
        };
        
        // Add the listener
        this.spriteMixer.addEventListener('finished', onAnimationFinished);
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
