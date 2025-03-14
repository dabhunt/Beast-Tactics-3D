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
    this.beastTexture = null;
    this.loadStaticTexture();

    // Create directional indicators
    this._createDirectionalIndicators();

    debugLog(`${type} Beast initialized`);
  }

  /**
   * Load the static texture for the beast
   */
  loadStaticTexture() {
    const textureUrl = `/assets/Beasts/${this.type}.gif`;
    debugLog(`Loading static texture from: ${textureUrl}`);

    // Create texture loader with error handling
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      // URL
      textureUrl,

      // onLoad callback
      (texture) => {
        debugLog(`Successfully loaded ${this.type} Beast texture`);

        // Store reference to texture
        this.beastTexture = texture;

        // Configure texture for crisp pixel art rendering
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;

        // Create material with the texture
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
        });

        // Create sprite
        this.sprite = new THREE.Sprite(material);

        // Scale sprite
        this.sprite.scale.set(this.scale, this.scale, 1);

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
        console.error(`Failed to load texture for ${this.type} Beast:`, error);
        this._createFallbackSprite();
      }
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
      'Fire': 0xff4500,
      'Water': 0x3498db,
      'Earth': 0x964b00,
      'Wind': 0xc6e2ff,
      'Electric': 0xffff00,
      'Plant': 0x2ecc71,
      'Metal': 0xc0c0c0,
      'Light': 0xffffff,
      'Dark': 0x581845,
      'Combat': 0xff5733,
      'Spirit': 0xd8bfd8,
      'Corrosion': 0x7cfc00
    };

    // Get appropriate color or default to fire color
    const color = elementColors[this.type] || 0xff4500;

    // Create fallback colored sprite
    const fallbackMaterial = new THREE.SpriteMaterial({
      color: color,
      transparent: true
    });

    this.sprite = new THREE.Sprite(fallbackMaterial);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.group.add(this.sprite);
    this.isLoaded = true;

    debugLog(`Created colored fallback sprite for ${this.type} Beast`, { color: color.toString(16) });
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
      { id: 6, name: "NorthWest", q: -1, r: 0 }
    ];

    // Hex grid configuration
    const hexRadius = 1.0; // Radius of a hex
    const hexHeight = 0.2; // Height of hex tile
    const horizontalSpacing = 1.5; // Horizontal spacing between hexes
    const verticalFactor = 1.0; // Vertical spacing factor
    const arrowDistance = 0.7; // Controls how far along the vector the arrow is placed
    const arrowHeight = 0.7; // Height of arrows above the hex plane

    // Create geometry for arrow
    const arrowGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);

    // Material for arrows
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      emissive: 0x996600,
      specular: 0xffffff
    });

    // Create an array to store arrow references
    this.directionalArrows = [];

    // Function to calculate 3D hex position from axial coordinates
    const calculateHexPosition = (q, r) => {
      // For perfect fit in axial coordinate system
      const x = hexRadius * horizontalSpacing * q;
      const z = hexRadius * Math.sqrt(3) * verticalFactor * (r + q/2);
      const y = hexHeight / 2; // Half height of hex

      return new THREE.Vector3(x, y, z);
    };

    // Create arrows for each direction
    this.hexDirections.forEach(direction => {
      // Calculate target hex position in world space
      const targetHexPos = calculateHexPosition(direction.q, direction.r);

      // Calculate direction vector from beast to target hex
      const directionVector = new THREE.Vector3().subVectors(targetHexPos, new THREE.Vector3(0, 0, 0));

      // Normalize the direction vector
      const normalizedDirection = directionVector.clone().normalize();

      // Calculate arrow position at fraction of distance to hex
      const arrowPos = new THREE.Vector3().addScaledVector(normalizedDirection, hexRadius * arrowDistance);
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
        targetHexPos: targetHexPos.clone()
      };

      // Add to the group
      this.group.add(arrow);

      // Store arrow reference
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        directionId: direction.id,
        coordinates: {q: direction.q, r: direction.r},
        targetPosition: targetHexPos.clone()
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

        // Log the move for debugging
        console.log(`[BEAST] Moving to new hex:`, {
          from: { q: this.currentAxialPos.q - clickedArrow.userData.moveOffset.q, 
                 r: this.currentAxialPos.r - clickedArrow.userData.moveOffset.r },
          to: { q: newQ, r: newR },
          hexPosition: {
            x: targetHex.position.x.toFixed(2),
            y: targetHex.position.y.toFixed(2),
            z: targetHex.position.z.toFixed(2)
          },
          hexElement: targetHex.userData.element
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
   * Update the beast (called in animation loop)
   */
  update() {
    if (!this.isLoaded) return;

    // Animate the directional arrows
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

    // Update current position
    this.position = {
      x: newPosition.x,
      y: this.position.y, // Keep the same y
      z: newPosition.z
    };

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

    // Dispose texture if exists
    if (this.beastTexture) {
      this.beastTexture.dispose();
      this.beastTexture = null;
    }

    // Remove and dispose sprite
    if (this.sprite) {
      this.group.remove(this.sprite);
      if (this.sprite.material) {
        this.sprite.material.dispose();
      }
      this.sprite = null;
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

    debugLog(`${this.type} Beast disposed`);
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