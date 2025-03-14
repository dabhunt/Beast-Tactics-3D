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
    this.animator = null;  // Will hold our GIF animator instance
    this.loadBeastTexture();

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
   * Using vector-based positioning for more accurate alignment
   * @private
   */
  _createDirectionalIndicators() {
    console.log("[BEAST] Creating directional movement arrows using vector-based orientation");

    // Define hex directions with numerical labels for debugging
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
    const arrowDistance = 0.7; // Controls how far along the vector the arrow is placed (0-1)
    const arrowHeight = 0.7; // Height of arrows above the hex plane

    // Create geometry for arrow
    const arrowGeometry = new THREE.ConeGeometry(0.15, 0.4, 4); // Slightly smaller arrows

    // Material for arrows - using distinct colors for better visibility
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      emissive: 0x996600,
      specular: 0xffffff
    });

    // Font for debug labels
    let font = null;
    // Try to load font for labels asynchronously - using dynamic import for FontLoader
    try {
      // Import the FontLoader properly from three.js modules
      import('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FontLoader.js')
        .then(module => {
          const FontLoader = module.FontLoader;
          const fontLoader = new FontLoader();
          fontLoader.load('/assets/fonts/helvetiker_regular.typeface.json', loadedFont => {
            font = loadedFont;
            this._createDebugLabels();
            console.log("[BEAST] Loaded font for debug labels using proper module import");
          }, undefined, error => {
            console.warn("[BEAST] Failed to load font:", error);
          });
        })
        .catch(error => {
          console.error("[BEAST] Error loading FontLoader module:", error);
          console.log("[BEAST] Using text sprites instead of 3D text for debug labels");
        });
    } catch (error) {
      console.error("[BEAST] FontLoader import error:", error);
      console.log("[BEAST] Using text sprites for labels (fallback)");
    }

    // Store references to debug objects
    this.debugObjects = {
      directionLabels: [],
      targetHexLabels: [],
      directionVectors: []
    };

    // Create an array to store arrow references for debugging
    this.directionalArrows = [];

    // Create text sprite function (for better text rendering than geometry)
    const createTextSprite = (text, color = 0xffffff, size = 0.3) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;

      // Draw background
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      context.font = '64px Arial';
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width/2, canvas.height/2);

      // Create texture and sprite
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);

      return sprite;
    };

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

      // Debug: Create a line showing the vector
      const debugLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, arrowHeight, 0),
          new THREE.Vector3().copy(targetHexPos).setY(arrowHeight)
        ]),
        new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
      );
      this.group.add(debugLine);
      this.debugObjects.directionVectors.push(debugLine);

      // Store original target for lookAt
      const targetPoint = new THREE.Vector3().copy(targetHexPos);
      targetPoint.y = arrowHeight; // Keep on same plane for correct orientation

      // Point arrow toward target
      // We need to apply a -90 degree X rotation to account for cone's default orientation
      arrow.lookAt(targetPoint);
      arrow.rotateX(Math.PI / 2);

      // Create debug number label for the arrow
      const arrowLabel = createTextSprite(direction.id.toString(), 0xffcc00);
      arrowLabel.position.set(
        arrowPos.x, 
        arrowPos.y + 0.3, // Slightly above the arrow
        arrowPos.z
      );
      this.group.add(arrowLabel);
      this.debugObjects.directionLabels.push(arrowLabel);

      // Create debug sphere to mark target hex position
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      debugSphere.position.copy(targetHexPos);
      debugSphere.position.y = hexHeight + 0.05; // Just above hex
      this.group.add(debugSphere);

      // Create matching target hex label
      const hexLabel = createTextSprite(direction.id.toString(), 0x00ffff);
      hexLabel.position.set(
        targetHexPos.x,
        targetHexPos.y + 0.3, // Above the hex
        targetHexPos.z
      );
      this.group.add(hexLabel);
      this.debugObjects.targetHexLabels.push(hexLabel);

      // Log detailed positioning information
      console.log(`[BEAST] Created arrow #${direction.id} (${direction.name}):`, {
        q: direction.q,
        r: direction.r,
        targetHexPos: {
          x: targetHexPos.x.toFixed(2),
          y: targetHexPos.y.toFixed(2),
          z: targetHexPos.z.toFixed(2)
        },
        arrowPos: {
          x: arrowPos.x.toFixed(2),
          y: arrowPos.y.toFixed(2),
          z: arrowPos.z.toFixed(2)
        },
        directionVector: {
          x: directionVector.x.toFixed(2),
          y: directionVector.y.toFixed(2),
          z: directionVector.z.toFixed(2),
          length: directionVector.length().toFixed(2)
        }
      });

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

      // Store arrow reference for debugging
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        directionId: direction.id,
        coordinates: {q: direction.q, r: direction.r},
        targetPosition: targetHexPos.clone()
      });
    });

    // Add a debug helper to toggle visualization
    this.toggleDebugVisualization = (visible = true) => {
      Object.values(this.debugObjects).forEach(group => {
        group.forEach(obj => {
          obj.visible = visible;
        });
      });
      console.log(`[BEAST] Debug visualization ${visible ? 'enabled' : 'disabled'}`);
    };

    // Make debug helper available globally for console access
    if (window.beastDebugHelpers === undefined) {
      window.beastDebugHelpers = {};
    }
    window.beastDebugHelpers.toggleArrowDebug = this.toggleDebugVisualization;
    console.log("[BEAST] Debug helper added to window.beastDebugHelpers.toggleArrowDebug()");

    // Connect to arrow debugger if available
    this._connectToArrowDebugger();
  }

  /**
   * Create debug text labels using Three.js TextGeometry
   * Called after font is loaded
   * @private
   */
  _createDebugLabels() {
    if (!this.directionalArrows || !this.directionalArrows.length) return;

    // Don't create labels if already created with sprites
    if (this.debugObjects.directionLabels.length > 0) return;

    console.log("[BEAST] Creating 3D text debug labels");

    this.directionalArrows.forEach(arrow => {
      try {
        const textGeometry = new THREE.TextGeometry(arrow.directionId.toString(), {
          font: font,
          size: 0.2,
          height: 0.05
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Position near the arrow
        textMesh.position.copy(arrow.mesh.position);
        textMesh.position.y += 0.3;

        // Rotate to face camera
        textMesh.lookAt(this.camera.position);

        this.group.add(textMesh);
        this.debugObjects.directionLabels.push(textMesh);
      } catch (err) {
        console.warn("[BEAST] Failed to create 3D text label:", err);
      }
    });
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

      // Highlight arrow in debugger if available
      if (window.arrowDebugger) {
        window.arrowDebugger.highlightArrow(clickedArrow.userData.directionId);
      }

      // Log click info for debugging
      console.log(`[BEAST] Arrow clicked:`, {
        direction: clickedArrow.userData.direction,
        directionId: clickedArrow.userData.directionId,
        offset: clickedArrow.userData.moveOffset,
        currentPosition: { ...this.currentAxialPos },
        targetPosition: {
          q: this.currentAxialPos.q + clickedArrow.userData.moveOffset.q,
          r: this.currentAxialPos.r + clickedArrow.userData.moveOffset.r
        }
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

        // Additional debug info when target hex is not found
        console.log(`[BEAST] Available hexagons:`, {
          count: this.hexagons.length,
          nearby: this.hexagons
            .filter(h => Math.abs(h.userData.q - newQ) <= 1 && Math.abs(h.userData.r - newR) <= 1)
            .map(h => ({ q: h.userData.q, r: h.userData.r }))
        });
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

    // Update GIF animation if available
    if (this.animator) {
      this.animator.update();

      // Update animator position to follow beast
      if (this.beastGroup) {
        this.animator.setPosition({
          x: this.beastGroup.position.x,
          y: this.beastGroup.position.y + 0.7, // Keep elevated
          z: this.beastGroup.position.z
        });
      }
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

    // Update animator position if available
    if (this.animator) {
      this.animator.setPosition({
        x: newPosition.x,
        y: this.position.y + 0.7, // Keep elevated
        z: newPosition.z
      });
      console.log(`[BEAST] Updated animator position:`, {
        x: newPosition.x,
        y: this.position.y + 0.7,
        z: newPosition.z
      });
    }

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

  /**
   * Load the beast texture
   */
  loadBeastTexture() {
    const textureUrl = `/assets/Beasts/${this.type}.gif`;
    console.log(`[BEAST] Loading beast texture as animated GIF from: ${textureUrl}`);

    // Import the SimpleGIFAnimator if not already available
    import('./tools/SimpleGIFAnimator.js')
      .then(module => {
        const SimpleGIFAnimator = module.SimpleGIFAnimator;

        // Create animator instance
        console.log(`[BEAST] Creating GIF animator for ${this.type} Beast`);

        // Calculate position (slightly elevated from beast position)
        const animPosition = {
          x: this.position.x,
          y: this.position.y + 0.7, // Elevate above beast
          z: this.position.z
        };

        // Create the animator
        this.animator = new SimpleGIFAnimator(
          textureUrl,
          this.scene,
          animPosition,
          1.5, // Scale
          // Success callback
          (animator) => {
            console.log(`[BEAST] Successfully loaded ${this.type} Beast GIF animation`, {
              frames: animator.frames.length,
              size: `${animator.canvas.width}x${animator.canvas.height}`
            });

            // Store reference to the sprite for manipulation
            this.beastSprite = this.animator.sprite;
          },
          // Error callback
          (error) => {
            console.error(`[BEAST] Failed to load animated GIF for ${this.type} Beast:`, error);
            this.loadStaticTextureFallback();
          }
        );
      })
      .catch(error => {
        console.error(`[BEAST] Error importing SimpleGIFAnimator:`, error);
        this.loadStaticTextureFallback();
      });
  }

  /**
   * Load static texture as fallback
   */
  loadStaticTextureFallback() {
    const textureUrl = `/assets/Beasts/${this.type}.png`;
    console.log(`[BEAST] Loading beast texture as static PNG from: ${textureUrl}`);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      (texture) => {
        console.log(`[BEAST] Successfully loaded ${this.type} Beast PNG texture`);
        this.beastTexture = texture;
        this.createSprite();
      },
      undefined,
      (error) => {
        console.error(`[BEAST] Failed to load static texture for ${this.type} Beast:`, error);
        this.createFallbackSprite();
      }
    );
  }

  /**
   * Create sprite from loaded texture
   */
  createSprite() {
    if (!this.beastTexture) {
      console.warn(`[BEAST] No texture loaded yet for ${this.type} Beast`);
      return;
    }

    // Configure texture for crisp pixel art rendering
    this.beastTexture.magFilter = THREE.NearestFilter;
    this.beastTexture.minFilter = THREE.NearestFilter;
    this.beastTexture.generateMipmaps = false;

    // Create material with the texture
    const material = new THREE.SpriteMaterial({
      map: this.beastTexture,
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
  }

  /**
   * Create fallback sprite if all texture loading fails
   */
  createFallbackSprite() {
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