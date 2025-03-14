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

    try {
      // Import the animated GIF loader on-demand
      import('./tools/AnimatedGIFLoader.js')
        .then(module => {
          const { gifLoader } = module;

          // Load beast texture as animated GIF
          const beastUrl = `/assets/Beasts/${this.type}.gif`;
          debugLog(`Loading beast texture as animated GIF from: ${beastUrl}`);

          // Set animation speed (higher for more fluid animation)
          gifLoader.setFPS(15);

          // Use GIF loader to handle animation
          gifLoader.load(
            // URL
            beastUrl,

            // onComplete callback
            (texture) => {
              debugLog(`Successfully loaded ${this.type} Beast texture as animated GIF`);

              // Store reference to texture for later cleanup
              this.beastTexture = texture;

              // Create material with the animated texture
              const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.1, // Reduce alpha test for better edges
              });

              // Create sprite
              this.sprite = new THREE.Sprite(material);

              // Scale sprite for pixel art
              this.sprite.scale.set(this.scale, this.scale, 1);

              // Log animation setup
              console.log(
                `[BEAST] Applied animated GIF setup for ${this.type} Beast`,
                { 
                  animated: true,
                  url: beastUrl
                }
              );

              // Register with animation debugger if available
              if (window.animationDebugger) {
                console.log(`[BEAST] Registering ${this.type} Beast with animation debugger`);
                this.animationDebuggerIndex = window.animationDebugger.registerTexture(
                  texture, 
                  `${this.type}Beast`
                );
              } else {
                console.log(`[BEAST] Animation debugger not available, animation may not work correctly`);
              }

              // Add sprite to group
              this.group.add(this.sprite);

              // Mark as loaded
              this.isLoaded = true;

              debugLog(`${this.type} Beast animated sprite created`);
            },

            // onError callback
            (error) => {
              console.error(
                `Failed to load animated GIF for ${this.type} Beast:`,
                error
              );

              // Fall back to static texture loader
              debugLog(`Falling back to static texture loader`);
              this._loadStaticTexture(beastUrl);
            }
          );
        })
        .catch(err => {
          console.error(`Failed to import AnimatedGIFLoader:`, err);

          // Fall back to regular texture loading if module import fails
          const beastUrl = `/assets/Beasts/${this.type}.gif`;
          this._loadStaticTexture(beastUrl);
        });
    } catch (err) {
      console.error(`Error in texture loading for ${this.type} Beast:`, err);
      debugLog(`Beast creation failed with error: ${err.message}`);

      // Create emergency fallback with colored sprite
      this._createFallbackSprite();
    }
  }

  /**
   * Load a static texture as fallback when animation fails
   * @param {string} url - URL to load texture from
   * @private
   */
  _loadStaticTexture(url) {
    debugLog(`Loading static texture fallback from: ${url}`);

    // Create texture loader with error handling
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      // URL
      url,

      // onLoad callback
      (texture) => {
        debugLog(`Successfully loaded ${this.type} Beast static texture`);

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

        // Log fallback
        console.log(
          `[BEAST] Applied static texture fallback for ${this.type} Beast`,
          { 
            animated: false, 
            url: url
          }
        );

        // Add sprite to group
        this.group.add(this.sprite);

        // Mark as loaded
        this.isLoaded = true;

        debugLog(`${this.type} Beast static sprite created`);
      },

      // onProgress callback (not used)
      undefined,

      // onError callback
      (error) => {
        console.error(`Failed to load static texture for ${this.type} Beast:`, error);
        this._createFallbackSprite();
      }
    );
  }

  /**
   * Create a colored fallback sprite when all texture loading fails
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

    // Define hex directions if not already set
    this.hexDirections = this.hexDirections || [
      { name: "North", q: 0, r: -1, angle: 0 },
      { name: "NorthEast", q: 1, r: -1, angle: 60 },
      { name: "SouthEast", q: 1, r: 0, angle: 120 },
      { name: "South", q: 0, r: 1, angle: 180 },
      { name: "SouthWest", q: -1, r: 1, angle: 240 },
      { name: "NorthWest", q: -1, r: 0, angle: 300 }
    ];

    const hexDirections = this.hexDirections; // Use the defined directions
    const arrowDistance = 1.2;
    const hexRadius = 1.0; // Adjust based on your hex tile size

    // Create triangle geometry for arrow
    const arrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);

    // Material for arrows
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.8,
      emissive: 0x996600,
      specular: 0xffffff
    });

    // Set arrow distance
    

    // Create an array to store arrow references for debugging
    this.directionalArrows = [];

    // Create an arrow for each direction
    hexDirections.forEach(direction => {
      // Calculate position from center
      const x = arrowDistance * Math.cos(direction.angle * Math.PI / 180);
      const z = arrowDistance * Math.sin(direction.angle * Math.PI / 180);

      // Create arrow mesh
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.set(
        x,
        0.7, // Height above ground
        z,
      );

      // DEBUGGING: Create a small colored sphere to visualize the direction
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      debugSphere.position.set(x + 0.3 * Math.cos(direction.angle * Math.PI / 180), 0.7, z + 0.3 * Math.sin(direction.angle * Math.PI / 180));
      this.group.add(debugSphere);

      // Rotation: Use quaternion for more precise control
      // We need to:
      // 1. First rotate 90 degrees around X to make cone point horizontally
      // 2. Then rotate around Y by the direction angle

      // Create rotation quaternion
      const quaternion = new THREE.Quaternion();

      // Set up rotation axes
      const xAxis = new THREE.Vector3(1, 0, 0);
      const yAxis = new THREE.Vector3(0, 1, 0);

      // Apply X rotation first (90 degrees to make horizontal)
      quaternion.setFromAxisAngle(xAxis, Math.PI / 2);

      // Create temporary quaternion for Y rotation
      const yRotation = new THREE.Quaternion();
      yRotation.setFromAxisAngle(yAxis, direction.angle * Math.PI / 180);

      // Combine rotations (order matters!)
      quaternion.premultiply(yRotation);

      // Apply the combined rotation
      arrow.setRotationFromQuaternion(quaternion);

      // Add extensive debug logs for arrow positioning and rotation
      console.log(`[BEAST] Positioned ${direction.name} arrow at:`, {
        x: x.toFixed(2),
        y: 0.7,
        z: z.toFixed(2),
        angle: (direction.angle * 180 / Math.PI).toFixed(1) + '°',
        direction: {
          x: Math.cos(direction.angle * Math.PI / 180).toFixed(2),
          z: Math.sin(direction.angle * Math.PI / 180).toFixed(2)
        },
        pointingDirection: direction.name,
        quaternion: {
          x: quaternion.x.toFixed(3),
          y: quaternion.y.toFixed(3),
          z: quaternion.z.toFixed(3),
          w: quaternion.w.toFixed(3)
        }
      });

      // Make arrow interactive
      arrow.userData = { 
        direction: direction.name, 
        moveOffset: { q: direction.q, r: direction.r },
        isMovementArrow: true
      };

      // Add to the group
      this.group.add(arrow);

      // Store arrow reference for debugging
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        coordinates: {q: direction.q, r: direction.r},
        angle: direction.angle
      });
    });

    // Connect to arrow debugger if available
    this._connectToArrowDebugger();
  }

  /**
   * Connect this beast to the arrow debugger
   * @private
   */
  _connectToArrowDebugger() {
    console.log("[BEAST] Attempting to connect to arrow debugger");

    // Check if debug menu is available globally
    if (window.gameDebugMenu) {
      console.log("[BEAST] Debug menu found, connecting to arrow debugger");
      window.gameDebugMenu.updateArrowDebuggerBeast(this);
    } else {
      console.log("[BEAST] Debug menu not available yet, will retry in 1 second");

      // Retry after a short delay to allow debug menu to initialize
      setTimeout(() => {
        if (window.gameDebugMenu) {
          console.log("[BEAST] Debug menu now available, connecting to arrow debugger");
          window.gameDebugMenu.updateArrowDebuggerBeast(this);
        } else {
          console.log("[BEAST] Debug menu still not available, arrow debugging disabled");
        }
      }, 1000);
    }
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

    // Dispose animated texture if exists
    if (this.beastTexture) {
      // Try to use GIF loader's dispose method if available
      import('./tools/AnimatedGIFLoader.js')
        .then(module => {
          const { gifLoader } = module;
          try {
            gifLoader.dispose(this.beastTexture);
            debugLog(`Disposed animated texture for ${this.type} Beast`);
          } catch (err) {
            console.warn(`Could not dispose animated texture:`, err);
            this.beastTexture.dispose();
          }
        })
        .catch(() => {
          // Fallback to regular dispose
          if (this.beastTexture.dispose) {
            this.beastTexture.dispose();
          }
        });

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