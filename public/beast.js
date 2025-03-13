
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
  constructor(type, scene, camera, position, scale = 1.5) {
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
    this.group.position.set(
      this.position.x, 
      this.position.y, 
      this.position.z
    );
    
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
          console.log(`[BEAST] Applied pixel art optimizations for ${this.type} Beast`);
          
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
          // Create fallback colored sprite
          const fallbackMaterial = new THREE.SpriteMaterial({ 
            color: 0xff4500, // Fire color as fallback
          });
          
          this.sprite = new THREE.Sprite(fallbackMaterial);
          this.sprite.scale.set(this.scale, this.scale, 1);
          this.group.add(this.sprite);
          this.isLoaded = true;
          
          debugLog(`Created fallback sprite for ${this.type} Beast due to loading error`);
        }
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
    
    // Hex directions - these should match your hex grid layout
    const hexDirections = [
      { x: Math.cos(0), y: 0, z: Math.sin(0), name: 'E' },       // East (0°)
      { x: Math.cos(Math.PI/3), y: 0, z: Math.sin(Math.PI/3), name: 'NE' },   // Northeast (60°)
      { x: Math.cos(2*Math.PI/3), y: 0, z: Math.sin(2*Math.PI/3), name: 'NW' }, // Northwest (120°)
      { x: Math.cos(Math.PI), y: 0, z: Math.sin(Math.PI), name: 'W' },     // West (180°)
      { x: Math.cos(4*Math.PI/3), y: 0, z: Math.sin(4*Math.PI/3), name: 'SW' }, // Southwest (240°)
      { x: Math.cos(5*Math.PI/3), y: 0, z: Math.sin(5*Math.PI/3), name: 'SE' }  // Southeast (300°)
    ];
    
    // Distance from center to arrow - increased to match hex grid spacing
    const arrowDistance = 1.5;
    
    // Create arrows for each direction
    hexDirections.forEach((direction, index) => {
      // Create triangle geometry for arrow - smaller and more visible
      const arrowGeometry = new THREE.ConeGeometry(0.15, 0.4, 3);
      const arrowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff8800, // Brighter orange-yellow for better visibility
        transparent: true,
        opacity: 0.9,
        // Disable depth test so arrows always show even if behind tiles
        depthTest: false
      });
      
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      
      // Position the arrow in the right direction - slightly higher for visibility
      arrow.position.set(
        direction.x * arrowDistance,
        0.7, // Higher above the base for better visibility
        direction.z * arrowDistance
      );
      
      // Rotate to point outward from center (away from beast)
      arrow.rotation.y = -Math.atan2(direction.z, direction.x);
      arrow.rotation.x = Math.PI/4; // Angled to be more visible
      
      // Add debug log for arrow positioning
      console.log(`[BEAST] Positioned ${direction.name} arrow at:`, {
        x: direction.x * arrowDistance,
        y: 0.7,
        z: direction.z * arrowDistance
      });
      
      // Add arrow to group
      this.group.add(arrow);
      
      // Store reference
      this.directionalArrows.push({
        mesh: arrow,
        direction: direction.name,
        vec: direction
      });
      
      debugLog(`Created ${direction.name} direction indicator`);
    });
    
    debugLog(`All directional indicators created`);
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
      
      this.directionalArrows.forEach(arrow => {
        arrow.mesh.material.opacity = 0.4 + (pulseFactor * 0.6); // 0.4 to 1.0
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
      z: this.group.position.z
    };
    
    // Animation function
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Update position
      this.group.position.x = startPos.x + (newPosition.x - startPos.x) * easeOut;
      this.group.position.y = startPos.y + (newPosition.y - startPos.y) * easeOut;
      this.group.position.z = startPos.z + (newPosition.z - startPos.z) * easeOut;
      
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
      this.directionalArrows.forEach(arrow => {
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
  debugLog(`Finding random ${elementType} hex from ${hexagons.length} hexagons`);
  
  // Filter hexagons by element type
  const matchingHexes = hexagons.filter(hex => 
    hex.userData && hex.userData.element === elementType
  );
  
  if (matchingHexes.length === 0) {
    console.warn(`No hexes found with element type: ${elementType}`);
    return null;
  }
  
  // Select random hex from matching hexes
  const randomIndex = Math.floor(Math.random() * matchingHexes.length);
  const selectedHex = matchingHexes[randomIndex];
  
  debugLog(`Found ${matchingHexes.length} ${elementType} hexes, selected index ${randomIndex}`);
  
  return selectedHex;
}
