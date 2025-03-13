/**
 * Beast.js - Manages game creatures with directional movement
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

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

    // Set up object group to contain beast and direction indicators
    this.group = new THREE.Group();
    this.group.position.set(this.position.x, this.position.y, this.position.z);

    // Add to scene immediately so it's in the hierarchy
    scene.add(this.group);

    // Load textures and create sprite
    this._loadTextures();

    // Create directional indicators
    this._createDirectionalIndicators();

    debugLog(`${type} Beast initialized`);
  }

  /**
   * Load beast textures and create sprite
   * @private
   */
  _loadTextures() {
    debugLog(`Loading textures for ${this.type} Beast`);

    // Create texture loader with error handling
    const textureLoader = new THREE.TextureLoader();

    try {
      // Load beast texture
      const beastUrl = `/assets/Beasts/${this.type}.gif`;
      debugLog(`Loading beast texture from: ${beastUrl}`);

      textureLoader.load(
        // URL
        beastUrl,

        // onLoad callback
        (texture) => {
          debugLog(`Successfully loaded ${this.type} Beast texture`);

          // Configure texture for crisp pixel art rendering
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;

          // Create material with the loaded texture configured for pixel art
          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1, // Reduce alpha test for better edges
          });

          // Create sprite
          this.sprite = new THREE.Sprite(material);

          // Scale sprite (3x upres for pixel art)
          this.sprite.scale.set(this.scale, this.scale, 1);

          // Log pixel art optimization
          console.log(
            `[BEAST] Applied pixel art optimizations for ${this.type} Beast`,
          );

          // Add sprite to group
          this.group.add(this.sprite);

          // Mark as loaded
          this.isLoaded = true;

          debugLog(`${this.type} Beast sprite created`);
        },

        // onProgress callback (not used)
        undefined,

        // onError callback
        (error) => {
          console.error(
            `Failed to load texture for ${this.type} Beast:`,
            error,
          );
          // Create fallback colored sprite
          const fallbackMaterial = new THREE.SpriteMaterial({
            color: 0xff4500, // Fire color as fallback
          });

          this.sprite = new THREE.Sprite(fallbackMaterial);
          this.sprite.scale.set(this.scale, this.scale, 1);
          this.group.add(this.sprite);
          this.isLoaded = true;

          debugLog(
            `Created fallback sprite for ${this.type} Beast due to loading error`,
          );
        },
      );
    } catch (err) {
      console.error(`Error in texture loading for ${this.type} Beast:`, err);
      debugLog(`Beast creation failed with error: ${err.message}`);
    }
  }

  /**
   * Create directional arrows pointing to adjacent hexes
   * @private
   */
  _createDirectionalIndicators() {
    debugLog(`Creating directional indicators for ${this.type} Beast`);

    // Arrow heads for six directions - based on flat-topped hex geometry
    this.directionalArrows = [];

    // Simplified hex directions with evenly spaced angles
    // Each has a movement offset but we'll position them in a cleaner layout
    const hexDirections = [
      { q: 1, r: 0, name: "E", angle: 0 }, // East
      { q: 0, r: -1, name: "NE", angle: Math.PI / 3 }, // Northeast
      { q: -1, r: 0, name: "NW", angle: 2 * Math.PI / 3 }, // Northwest
      { q: -1, r: 1, name: "W", angle: Math.PI }, // West
      { q: 0, r: 1, name: "SW", angle: 4 * Math.PI / 3 }, // Southwest
      { q: 1, r: -1, name: "SE", angle: 5 * Math.PI / 3 }, // Southeast
    ];

    // Distance from beast to place arrows
    const arrowDistance = 1.2;
    
    // Create arrows for each direction
    hexDirections.forEach((direction) => {
      // Use simple trig to place arrows in a nice circle around the beast
      // This is more intuitive and cleaner than trying to place them exactly on adjacent hexes
      const x = arrowDistance * Math.cos(direction.angle);
      const z = arrowDistance * Math.sin(direction.angle);
      
      console.log(`[BEAST] Calculating position for ${direction.name} arrow:`, {
        moveOffset: { q: direction.q, r: direction.r },
        angle: (direction.angle * 180 / Math.PI).toFixed(1) + '°',
        calculatedPosition: { x, z }
      });
      
      // Create triangle geometry for arrow - slightly larger for better visibility
      const arrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800, // Bright orange-yellow
        transparent: true,
        opacity: 0.9,
        depthTest: false, // Always show even if behind tiles
      });

      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

      // Position the arrow in a circular pattern around the beast
      arrow.position.set(
        x,
        0.7, // Higher above the base for better visibility
        z,
      );

      // Rotation: point outward from beast (away from center)
      // This matches the movement direction more intuitively
      
      // Apply rotation - pointing outward (cone points up by default)
      arrow.rotation.x = Math.PI / 2; // First rotate to point horizontally (90 degrees)
      arrow.rotation.y = direction.angle; // Then rotate to point outward
      
      // Add debug log for arrow positioning and rotation
      console.log(`[BEAST] Positioned ${direction.name} arrow at:`, {
        x: x.toFixed(2),
        y: 0.7,
        z: z.toFixed(2),
        rotationY: (arrow.rotation.y * 180 / Math.PI).toFixed(1) + '°',
        pointingDirection: direction.name
      });

      // Make arrow interactive
      arrow.userData = { 
        direction: direction.name, 
        moveOffset: { q: direction.q, r: direction.r },
        isMovementArrow: true
      };

      // Add arrow to group
      this.group.add(arrow);

      // Store reference with additional data
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        moveOffset: { q: direction.q, r: direction.r }
      });

      debugLog(`Created ${direction.name} direction indicator with movement data`);
    });

    debugLog(`All directional indicators created`);
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
    window.addEventListener('click', this._handleClick.bind(this));
    
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
    const arrowMeshes = this.directionalArrows.map(arrow => arrow.mesh);
    const intersects = this.raycaster.intersectObjects(arrowMeshes, false);
    
    // If an arrow was clicked
    if (intersects.length > 0) {
      const clickedArrow = intersects[0].object;
      
      // Log click info for debugging
      console.log(`[BEAST] Arrow clicked:`, {
        direction: clickedArrow.userData.direction,
        offset: clickedArrow.userData.moveOffset
      });
      
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
          z: targetHex.position.z
        });
        
        // Update current axial position
        this.currentAxialPos = { q: newQ, r: newR };
        
        debugLog(`Moving to new hex at q=${newQ}, r=${newR}`);
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
    
    this.hexagons.forEach(hex => {
      const distance = Math.sqrt(
        Math.pow(hex.position.x - this.group.position.x, 2) +
        Math.pow(hex.position.z - this.group.position.z, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestHex = hex;
      }
    });
    
    if (closestHex) {
      this.currentAxialPos = { q: closestHex.userData.q, r: closestHex.userData.r };
      debugLog(`Beast is on hex at q=${this.currentAxialPos.q}, r=${this.currentAxialPos.r}`);
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
    
    return this.hexagons.find(hex => 
      hex.userData.q === q && hex.userData.r === r
    );
  }

  /**
   * Update the beast to face the camera (billboarding)
   * This should be called in the animation loop
   */
  update() {
    if (!this.isLoaded) return;

    // Make the beast face the camera (billboard effect)
    if (this.sprite) {
      // Sprites automatically face the camera in THREE.js
      // No additional rotation needed
    }

    // Animate the directional arrows (optional)
    if (this.directionalArrows) {
      // Pulse the arrows by adjusting opacity
      const pulseFactor = (Math.sin(Date.now() * 0.005) + 1) / 2; // 0 to 1

      this.directionalArrows.forEach((arrow) => {
        arrow.mesh.material.opacity = 0.4 + pulseFactor * 0.6; // 0.4 to 1.0
      });
    }
  }

  /**
   * Move the beast to a new hex position
   * @param {Object} newPosition - New position {x, y, z}
   */
  moveTo(newPosition) {
    debugLog(`Moving ${this.type} Beast to new position`, newPosition);

    // Update internal position
    this.position = newPosition;

    // Animate the movement
    const duration = 1000; // ms
    const startTime = Date.now();
    const startPos = {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
    };

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
        debugLog(`${this.type} Beast movement complete`);
      }
    };

    // Start animation
    animate();
  }

  /**
   * Dispose of all THREE.js objects to prevent memory leaks
   */
  dispose() {
    debugLog(`Disposing ${this.type} Beast`);

    // Remove and dispose sprite
    if (this.sprite) {
      this.group.remove(this.sprite);
      this.sprite.material.dispose();
      this.sprite = null;
    }

    // Remove and dispose directional arrows
    if (this.directionalArrows) {
      this.directionalArrows.forEach((arrow) => {
        this.group.remove(arrow.mesh);
        arrow.mesh.geometry.dispose();
        arrow.mesh.material.dispose();
      });
      this.directionalArrows = [];
    }

    // Remove group from scene
    this.scene.remove(this.group);
    this.group = null;

    debugLog(`${this.type} Beast disposed`);
  }
}

/**
 * Find a random hex of specified element type from an array of hexagons
 * @param {Array} hexagons - Array of hex objects
 * @param {string} elementType - The element type to look for
 * @returns {Object|null} The found hex or null
 */
export function findRandomHexOfElement(hexagons, elementType) {
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
