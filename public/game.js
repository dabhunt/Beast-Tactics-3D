// Import Three.js and other modules using dynamic imports for better compatibility
import { CameraManager } from "./camera.js";
import { DebugMenu } from "./tools/diagnostics/DebugMenu.js";
import { Beast } from './beast.js';
// Import the new MapGenerator module and the textureLoadingTracker
import { MapGenerator, ELEMENT_TYPES, textureLoadingTracker } from './MapGeneration.js';
// Import debug logging system with renamed functions to avoid conflicts with local functions
import { debugLog as moduleDebugLog, debugWarn as moduleDebugWarn, debugError as moduleDebugError } from "./tools/diagnostics/DebugFlags.js";

// Log the imported textureLoadingTracker to verify it's properly loaded
console.log('[GAME] Imported textureLoadingTracker:', textureLoadingTracker);
// Import Line2 and related modules for thicker lines - using consistent paths
import { Line2 } from '/libs/three/addons/lines/Line2.js';
import { LineGeometry } from '/libs/three/addons/lines/LineGeometry.js';
import { LineMaterial } from '/libs/three/addons/lines/LineMaterial.js';

// Global THREE variable
let THREE;

/**
 * Main game initialization function - called after all modules are loaded
 */
function initGame() {
  console.log("[GAME] Initializing game with loaded modules");
  console.log("[GAME] THREE.js available:", !!THREE);
  console.log("[GAME] Beast class available:", typeof Beast === 'function');
  
  // Debug log to verify Beast import was successful
  console.log("[GAME] Imported Beast class successfully:", { 
    beastClassAvailable: typeof Beast === 'function',
    staticMethodsAvailable: typeof Beast.findRandomHexOfElement === 'function'
  });
  
  // Continue with game initialization
  setupScene();
}

/**
 * Load all required modules before starting the game
 */
async function loadModules() {
  try {
    console.log("[GAME] Loading THREE.js module...");
    const threeModule = await import("/libs/three/three.module.js");
    // Assign the module to the global THREE variable
    THREE = threeModule;
    console.log("[GAME] THREE.js module loaded successfully");
    
    // Verify that Line2 and related modules are available globally
    console.log("[GAME] Verifying Line2 and LineMaterial modules availability:", {
      Line2Available: typeof Line2 === 'function',
      LineGeometryAvailable: typeof LineGeometry === 'function',
      LineMaterialAvailable: typeof LineMaterial === 'function'
    });
    
    // Load SpriteMixer library
    console.log("[GAME] Loading SpriteMixer library...");
    await loadScript("/libs/SpriteMixer.js");
    console.log("[GAME] SpriteMixer library loaded successfully");
    
    // Initialize the game after all modules are loaded
    initGame();
  } catch (err) {
    console.error("[GAME] Failed to load modules:", err);
    console.error("[GAME] Stack trace:", err.stack);
  }
}

/**
 * Helper function to load scripts via DOM
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    console.log(`[GAME] Loading script: ${url}`);
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      console.log(`[GAME] Script loaded successfully: ${url}`);
      resolve();
    };
    script.onerror = (err) => {
      console.error(`[GAME] Failed to load script: ${url}`, err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

// Logging setup
console.log("Beast Tactics script loaded and starting...");

// Start loading modules
loadModules();

// Global error handler for debugging
window.addEventListener("error", (event) => {
  console.error("Global error caught:", {
    message: event.message,
    source: event.filename,
    lineNo: event.lineno,
    colNo: event.colno,
    error: event.error,
  });
});

// Import the debug utilities
import { createLogger } from "./tools/diagnostics/DebugUtils.js";

// Debug flag for verbose logging in this file
const DEBUG = true;

// Create a logger for this file
const logger = createLogger('game.js', DEBUG);

/**
 * Enhanced logging function that only logs in debug mode
 * Integrates with DebugFlags module for controlled logging
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  // Extract module name from message if it follows the [MODULE] pattern
  const moduleMatch = message.match(/^\[(\w+)\]/); 
  
  if (moduleMatch) {
    // If we have a module tag in the message like [HOVER], use DebugFlags system
    const moduleName = moduleMatch[1];
    moduleDebugLog(moduleName, message.replace(`[${moduleName}] `, ''), data);
  } else {
    // Otherwise use the standard logger (maintains compatibility)
    if (data) {
      logger.debug(message, data);
    } else {
      logger.debug(message);
    }
  }
}

/**
 * Set up the THREE.js scene, renderer, and other core components
 */
function setupScene() {
  debugLog("Setting up THREE.js scene...");

  try {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111926); // Slightly blue-tinted dark background for better contrast
    debugLog(
      "Scene created with dark blue-tinted background for better contrast",
    );

    // Renderer setup with anti-aliasing
    debugLog("Creating WebGL renderer...");
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    debugLog("Renderer configured with size:", {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    });

    // Add canvas to document
    document.body.appendChild(renderer.domElement);
    debugLog("Renderer canvas added to document");

    // Initialize camera manager
    debugLog("Initializing camera manager...");
    const cameraManager = new CameraManager(scene);
    const camera = cameraManager.camera; // Get the camera instance for use in the render loop

    // Add enhanced lighting setup for better visibility
    debugLog("Setting up enhanced lighting...");

    // Create a lights container to organize and reference lights
    const lights = {};

    // Enhanced lighting configuration for better color vibrancy

    // Brighter ambient light with warmer tone
    lights.ambient = new THREE.AmbientLight(0xfffcf0, 0.85); // Increased intensity, slightly warmer
    scene.add(lights.ambient);
    debugLog(
      "Created enhanced ambient light with intensity:",
      lights.ambient.intensity,
    );

    // Primary directional light (sun-like) with warmer color
    lights.directional = new THREE.DirectionalLight(0xfff0d0, 1.2); // Warmer color and higher intensity
    lights.directional.position.set(5, 15, 5);
    lights.directional.castShadow = true;
    scene.add(lights.directional);
    debugLog(
      "Created enhanced directional light with intensity:",
      lights.directional.intensity,
    );

    // Secondary fill light from opposite side with complementary cooler tint
    lights.fill = new THREE.DirectionalLight(0xd0e8ff, 0.5); // Slightly higher intensity
    lights.fill.position.set(-5, 8, -5);
    scene.add(lights.fill);

    // Small overhead point light for specular highlights - brighter
    lights.point = new THREE.PointLight(0xffffff, 0.7, 50); // Increased intensity
    lights.point.position.set(0, 15, 0);
    scene.add(lights.point);

    // Add an additional low rim light for edge definition
    lights.rim = new THREE.DirectionalLight(0xffe8d0, 0.3);
    lights.rim.position.set(0, 3, -12);
    scene.add(lights.rim);

    debugLog(
      "Enhanced lighting setup complete with main, fill, and point lights",
    );

    // Hexagonal grid setup
    const hexRadius = 1;
    const hexHeight = 0.2;
    debugLog("Creating hexagonal grid with radius:", hexRadius);

    const hexGeometry = new THREE.CylinderGeometry(
      hexRadius,
      hexRadius,
      hexHeight,
      6,
    );

    // Use element types from the MapGeneration module
    const elementTypes = ELEMENT_TYPES;

    debugLog("Element types defined:", elementTypes);

    // Default fallback material (used if textures fail to load)
    // Create raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Create stroke material for hover effect using LineMaterial for thicker lines with gold animation
    moduleDebugLog('HOVER', 'Creating stroke material with LineMaterial for gold animated effect');
    
    // Base values for stroke effect
    const BASE_STROKE_WIDTH = 10;   // Thicker line as requested
    const hexPointCount = 6;        // Number of points in hexagon
    
    // Create reusable hover effect elements
    let currentHoverStroke = null;      // The Line2 object that renders the hover effect
    let currentHoverHex = null;         // Which hex currently has the hover
    let animationStartTime = 0;         // When the animation started
    let hoverAnimationActive = false;   // Whether animation is currently running
    let hoverAnimationFrame = null;     // Handle to cancel animation frame
    
    // Create the stroke material with improved settings for maximum visibility
    const strokeMaterial = new LineMaterial({
      color: 0xFFD700,      // Brighter gold color for better visibility (0xFFD700 instead of 0xDAA520)
      linewidth: BASE_STROKE_WIDTH, // Thicker lines as requested 
      vertexColors: true,   // Enable vertex colors for wave effect
      dashed: false,        // Solid line
      transparent: true,    // Enable transparency
      opacity: 0.9,         // 90% opacity for better visibility
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // Important for LineMaterial
      depthTest: false,     // Disable depth testing to ensure visibility above other objects
      depthWrite: false,    // Don't write to depth buffer (prevents z-fighting)
      alphaToCoverage: true, // Improves antialiasing of transparent lines
      toneMapped: false     // Disable tone mapping to preserve bright colors
      // Removed invalid properties: linecap, linejoin, renderOrder
      // renderOrder should be applied to the mesh, not the material
    });
    
    moduleDebugLog('HOVER', 'LineMaterial created with enhanced settings:', {
      linewidth: BASE_STROKE_WIDTH,
      opacity: 0.8,
      type: 'LineMaterial',
      color: '#DAA520',
      vertexColors: true,
      resolution: [window.innerWidth, window.innerHeight]
    });
    
    // Add resize handler to update resolution when window size changes
    window.addEventListener('resize', () => {
      moduleDebugLog('HOVER', 'Updating LineMaterial resolution on resize');
      strokeMaterial.resolution.set(window.innerWidth, window.innerHeight);
    });
    
    moduleDebugLog('HOVER', 'LineMaterial created successfully:', { 
      material: strokeMaterial,
      materialType: strokeMaterial.type,
      linewidth: strokeMaterial.linewidth,
      transparent: strokeMaterial.transparent,
      opacity: strokeMaterial.opacity
    });

    // Initialize mouse position vector outside event handler
    const mousePos = new THREE.Vector2();
    moduleDebugLog('MOUSE', 'Initialized mouse position vector:', mousePos);
    
    // Function to animate the hover effect with gold wave
    function animateHoverEffect() {
      // Only run if animation is active and we have a hover stroke
      if (!hoverAnimationActive || !currentHoverStroke) {
        //moduleDebugLog('HOVER', 'Animation inactive or no hover stroke');
        return;
      }
      
      // Calculate elapsed time for smooth animation
      const elapsed = Date.now() - animationStartTime;
      const colors = [];
      
      // Debug - log once per second that animation is running
      
      // Generate new gold colors with a shifting phase for wave effect
      for (let i = 0; i <= hexPointCount; i++) {
        // Faster animation for more vibrant effect
        const phase = (elapsed / 500); // Increased speed for more dynamic wave
        
        // Calculate wave position - offset each vertex by its position around the hexagon
        const vertexPosition = i / hexPointCount;
        const angle = ((vertexPosition * Math.PI * 2) + phase) % (Math.PI * 2);
        
        // Enhanced gold effect with more pronounced shimmer
        const baseHue = 0.13; // Rich gold base hue
        const hueVariation = 0.01 * Math.sin(angle * 2); // Subtle hue shift
        const hue = baseHue + hueVariation;
        
        // More dynamic saturation and lightness for a shinier effect
        const saturation = 0.9 + Math.sin(angle) * 0.1; // 0.8-1.0 range
        const lightness = 0.6 + Math.cos(angle) * 0.25; // 0.35-0.85 range for stronger highlight
        
        // Create color and add to array
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
        
        // Debug color values every 60 frames (approximately once per second)
      }
      
      // Update the colors in the geometry
      try {
        if (currentHoverStroke.geometry && 
            typeof currentHoverStroke.geometry.setColors === 'function') {
          
          // Apply colors to geometry
          currentHoverStroke.geometry.setColors(colors);
          
          // Make sure attributes are updated
          if (currentHoverStroke.geometry.attributes && 
              currentHoverStroke.geometry.attributes.color) {
            currentHoverStroke.geometry.attributes.color.needsUpdate = true;
            
            // Log vertex count periodically to verify connections
            // if (elapsed % 300 === 0) { // Every ~5 seconds
            //   moduleDebugLog('HOVER', `Animation vertex data check:`, {
            //     vertexCount: currentHoverStroke.geometry.attributes.position.count,
            //     colorCount: currentHoverStroke.geometry.attributes.color.count,
            //     expectedVertices: hexPointCount + 1
            //   });
            // }
          }
          
          // Update material if needed
          if (currentHoverStroke.material) {
            currentHoverStroke.material.needsUpdate = true;
          }
        }
        
        // Schedule next frame if still active
        if (hoverAnimationActive) {
          hoverAnimationFrame = requestAnimationFrame(animateHoverEffect);
        }
      } catch (err) {
        console.error('[HOVER-ANIM] Error in animation:', err);
        hoverAnimationActive = false;
      }
    }
    
    // Function to clear hover effect
    function clearHoverEffect() {
      // Stop animation
      hoverAnimationActive = false;
      if (hoverAnimationFrame) {
        cancelAnimationFrame(hoverAnimationFrame);
        hoverAnimationFrame = null;
      }
      
      // If we have a current hover hex and stroke
      if (currentHoverHex && currentHoverStroke) {
        try {
          // Remove the stroke from its parent
          currentHoverHex.remove(currentHoverStroke);
          
          // Clean up references
          if (currentHoverHex.material && currentHoverHex.material.userData) {
            currentHoverHex.material.userData.strokeMesh = null;
          }
        } catch (err) {
          console.error('[HOVER] Error removing stroke mesh:', err);
        }
      }
      
      // Reset references
      currentHoverHex = null;
      window.hoveredHex = null;
    }

    // Handle mouse move for hex hover
    window.addEventListener('mousemove', (event) => {
      moduleDebugLog('MOUSE', 'Mouse move event:', { 
        clientX: event.clientX, 
        clientY: event.clientY 
      });

      // Calculate mouse position in normalized device coordinates
      mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

      moduleDebugLog('MOUSE', 'Updated normalized coordinates:', { 
        x: mousePos.x, 
        y: mousePos.y 
      });

      // Log before raycasting to ensure variables are defined
      moduleDebugLog('RAYCASTER', 'Preparing to find intersects', {
        raycasterDefined: !!raycaster,
      hexagonsDefined: !!hexagons,
      hexagonsCount: hexagons ? hexagons.length : 0
    });

    // Update raycaster with new mouse position
    raycaster.setFromCamera(mousePos, camera);

    // Check if hexagons array is defined and not empty before raycasting
    if (!hexagons || hexagons.length === 0) {
      console.warn('[RAYCASTER] Cannot raycast: hexagons array is undefined or empty');
      return; // Exit the event handler early
    }
    
    // Debug camera and scene state for troubleshooting ray intersection issues
    moduleDebugLog('RAYCASTER', 'Camera state:', {
      position: [camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2)],
      rotation: [camera.rotation.x.toFixed(2), camera.rotation.y.toFixed(2), camera.rotation.z.toFixed(2)],
      near: camera.near,
      far: camera.far
    });
    
    // Use recursive flag to ensure we check child objects too
    // This is critical if the hexagons have any nested structures
    const recursive = true;
    
    // Find intersected hexagons with defensive try/catch
    let intersects = [];
    try {
      // Try first with direct objects approach
      intersects = raycaster.intersectObjects(hexagons, recursive);
      
      // If no intersections are found, try with the entire scene as fallback
      if (intersects.length === 0) {
        moduleDebugLog('RAYCASTER', 'No direct intersections found, trying with scene objects');
        const sceneIntersects = raycaster.intersectObjects(scene.children, recursive);
        
        // Filter scene intersects to only include hexagons
        intersects = sceneIntersects.filter(intersect => {
          // Check if this object or any parent is in our hexagons array
          let obj = intersect.object;
          while (obj) {
            if (hexagons.includes(obj)) return true;
            obj = obj.parent;
          }
          return false;
        });
      }
      
      // Log after raycasting to confirm execution
      moduleDebugLog('RAYCASTER', 'Intersects found:', {
        intersectCount: intersects.length,
        firstIntersect: intersects.length > 0 ? {
          distance: intersects[0].distance.toFixed(2),
          elementType: intersects[0].object.userData?.element || 'unknown',
          position: intersects[0].object.position ? [
            intersects[0].object.position.x.toFixed(2),
            intersects[0].object.position.y.toFixed(2),
            intersects[0].object.position.z.toFixed(2)
          ] : 'unknown'
        } : null
      });
    } catch (err) {
      console.error('[RAYCASTER] Error during raycasting:', err, {
        raycasterDefined: !!raycaster,
        hexagonsDefined: !!hexagons,
        hexagonsLength: hexagons ? hexagons.length : 'undefined'
      });
      return; // Exit the event handler early
    }

    // If we were hovering a hex, remove its stroke
    if (window.hoveredHex) {
      moduleDebugLog('HOVER', 'Clearing previous hover effect', {
        hexExists: !!window.hoveredHex,
        hasMaterial: !!window.hoveredHex.material,
        hasUserData: window.hoveredHex.material ? !!window.hoveredHex.material.userData : false
      });
      
      try {
        // Safely access nested properties with optional chaining
        const strokeMesh = window.hoveredHex?.material?.userData?.strokeMesh;
        if (strokeMesh) {
          window.hoveredHex.remove(strokeMesh);
          if (window.hoveredHex.material && window.hoveredHex.material.userData) {
            window.hoveredHex.material.userData.strokeMesh = null;
            window.hoveredHex.material.userData.strokeMaterial = null;
          }
          moduleDebugLog('HOVER', 'Successfully removed stroke mesh');
        } else {
          moduleDebugLog('HOVER', 'No stroke mesh found to remove');
        }
      } catch (err) {
        console.error('[HOVER] Error removing stroke mesh:', err);
      }
    }

    // Clear previous hover
    window.hoveredHex = null;

    // If we found a new hex to hover
    if (intersects.length > 0) {
      try {
        const hex = intersects[0].object;
        moduleDebugLog('HOVER', 'Setting new hover on hex:', {
          hexExists: !!hex,
          hasMaterial: !!hex?.material,
          hasUserData: !!hex?.material?.userData,
          hexType: hex?.userData?.element || 'unknown'
        });
        
        // Ensure the hex has required properties before proceeding
        if (!hex || !hex.material) {
          console.error('[HOVER] Cannot create hover effect: hex or material is undefined');
          return;
        }
        
        // Initialize userData if it doesn't exist and track hover state
        if (!hex.material.userData) {
          hex.material.userData = {};
        }
        
        // Add timestamp to track hover duration for debugging
        hex.material.userData.hoverStartTime = Date.now();
        
        // Store as global reference for inspection
        window.hoveredHex = hex;
        
        moduleDebugLog('HOVER', `Hovering hex of type: ${hex.userData.element}`, {
          position: [hex.position.x.toFixed(2), hex.position.y.toFixed(2), hex.position.z.toFixed(2)],
          rotation: [hex.rotation.x.toFixed(2), hex.rotation.y.toFixed(2), hex.rotation.z.toFixed(2)],
          timestamp: new Date().toISOString()
        });

        // Create stroke geometry (hexagon outline) using LineGeometry
        //console.log('[HOVER] Creating stroke geometry with LineGeometry');
        
        const radius = 0.95; // Slightly smaller than hex radius for inset effect
        const positions = [];
        
        // CRITICAL: Store the first point coordinates to ensure perfect closure
        const firstX = radius * Math.cos(0);
        const firstZ = radius * Math.sin(0);
        
        // Generate points for hexagon ensuring proper closure
        // Store all points for debugging
        const hexPoints = [];
        
        for (let i = 0; i <= hexPointCount; i++) {
          let x, z;
          
          if (i === hexPointCount) {
            // Use EXACT same coordinates for first and last point
            // This guarantees perfect closure with no visible seam
            x = firstX; 
            z = firstZ;
            moduleDebugLog('HOVER', 'Closing loop with exact coordinates match');
          } else {
            const angle = (i / hexPointCount) * Math.PI * 2;
            x = radius * Math.cos(angle);
            z = radius * Math.sin(angle);
          }
          
          // Track point for debugging
          hexPoints.push({index: i, x: x.toFixed(6), z: z.toFixed(6)});
          
          positions.push(
            x,
            0.01, // Slightly above hex surface to prevent z-fighting
            z
          );
        }
        
        // Log first and last points to verify perfect closure
        moduleDebugLog('HOVER', 'Hexagon stroke points verification:', {
          pointCount: hexPoints.length,
          firstPoint: hexPoints[0],
          lastPoint: hexPoints[hexPoints.length-1],
          identical: hexPoints[0].x === hexPoints[hexPoints.length-1].x && 
                     hexPoints[0].z === hexPoints[hexPoints.length-1].z
        });
        
        moduleDebugLog('HOVER', `Created ${positions.length / 3} vertices for hexagon stroke`);
        
        // Generate initial gold colors
        const colors = [];
        for (let i = 0; i <= hexPointCount; i++) {
          const gold = new THREE.Color(0xDAA520); // Default gold color
          colors.push(gold.r, gold.g, gold.b);
        }
        
        // Create LineGeometry and set positions and colors for Line2
        console.log('[HOVER] Creating stroke geometry with LineGeometry');
        
        const strokeGeometry = new LineGeometry();
        strokeGeometry.setPositions(positions);
        strokeGeometry.setColors(colors); // Add initial colors for animation
        
        //moduleDebugLog('HOVER', 'LineGeometry created successfully with points:', positions.length / 3);
        
        // Create stroke mesh with material
        //moduleDebugLog('HOVER', 'Creating stroke mesh with Line2');
        
        // Create the stroke mesh with our geometry and material
        const strokeMesh = new Line2(strokeGeometry, strokeMaterial);
        strokeMesh.computeLineDistances(); // Required for Line2
        
        // Use hex rotation to align properly
        const hexRotationY = hex.rotation.y || 0;
        strokeMesh.rotation.y = hexRotationY;
        
        moduleDebugLog('HOVER', `Using hex rotation: ${hexRotationY.toFixed(4)} radians`);
        
        // Position higher above hex to avoid z-fighting
        strokeMesh.position.y = 0.05;
        
        // Set very high rendering order to ensure visibility
        strokeMesh.renderOrder = 1000;
        
        // Make sure it's visible regardless of distance
        strokeMesh.frustumCulled = false;
        
        // Store mesh references
        currentHoverStroke = strokeMesh;
        currentHoverHex = hex;
        hex.material.userData.strokeMesh = strokeMesh;

        // Add stroke to hex
        hex.add(strokeMesh);
        
        // Start the animation
        animationStartTime = Date.now();
        hoverAnimationActive = true;
        hoverAnimationFrame = requestAnimationFrame(animateHoverEffect);
        
        moduleDebugLog('HOVER', 'Successfully created and attached animated gold stroke mesh');
      } catch (err) {
        console.error('[HOVER] Error creating hover effect:', err);
      }
    }
  });

  const fallbackMaterials = [
    new THREE.MeshPhongMaterial({ color: 0xff5733, shininess: 50, specular: 0x555555 }), // Combat
    new THREE.MeshPhongMaterial({ color: 0x7cfc00, shininess: 50, specular: 0x555555 }), // Corrosion
    new THREE.MeshPhongMaterial({ color: 0x581845, shininess: 50, specular: 0x555555 }), // Dark
    new THREE.MeshPhongMaterial({ color: 0x964b00, shininess: 50, specular: 0x555555 }), // Earth
    new THREE.MeshPhongMaterial({ color: 0xffff00, shininess: 50, specular: 0x555555 }), // Electric
    new THREE.MeshPhongMaterial({ color: 0xff4500, shininess: 50, specular: 0x555555 }), // Fire
    new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 50, specular: 0x555555 }), // Light
    new THREE.MeshPhongMaterial({ color: 0xc0c0c0, shininess: 50, specular: 0x555555 }), // Metal
    new THREE.MeshPhongMaterial({ color: 0x2ecc71, shininess: 50, specular: 0x555555 }), // Plant
    new THREE.MeshPhongMaterial({ color: 0xd8bfd8, shininess: 50, specular: 0x555555 }), // Spirit
    new THREE.MeshPhongMaterial({ color: 0x3498db, shininess: 50, specular: 0x555555 }), // Water
    new THREE.MeshPhongMaterial({ color: 0xc6e2ff, shininess: 50, specular: 0x555555 }), // Wind
  ];

  // Initialize map generator with scene and THREE
  debugLog("Initializing MapGenerator...");
  const mapGenerator = new MapGenerator(scene, THREE);
  
  // Define variable to store hexagons with immediate initialization from MapGenerator
  // This helps avoid race conditions where code tries to access hexagons before they're ready
  let hexagons = mapGenerator.getHexagons() || [];
  console.log(`[GAME] Initial hexagons array: ${hexagons.length} hexagons available at startup`);
  
  // Listen for map generation completion to update the hexagons array
  mapGenerator.onMapGenerated((generatedHexagons) => {
    console.log(`[GAME] Map generation complete: ${generatedHexagons.length} hexagons received via callback`);
    if (generatedHexagons && generatedHexagons.length > 0) {
      hexagons = generatedHexagons;
      console.log(`[GAME] Hexagons array updated with ${hexagons.length} hexagons`);
      
      // Update any components that depend on hexagons array
      if (debugMenu) {
        console.log('[GAME] Updating debug menu with new hexagons array');
        debugMenu.updateHexagons(hexagons);
      }
    } else {
      console.warn('[GAME] Received empty hexagons array from map generator callback!');
    }
  });
  
  // Function to re-generate the hexagon grid (for compatibility with existing code)
  function generateHexagonGrid(horizontalSpacing = 1.5, verticalFactor = 1.0) {
    debugLog(`Delegating hexagon grid generation to MapGenerator...`);
    return mapGenerator.generateHexagonGrid(horizontalSpacing, verticalFactor);
  }

  // Make generateHexagonGrid available globally for diagnostics tools
  window.generateHexagonGrid = generateHexagonGrid;
  
  // Make mapGenerator available globally for diagnostics
  window.mapGenerator = mapGenerator;

  // Initialize the debug menu after all components are created
  debugLog("Initializing debug menu...");

  // Define debugMenu in outer scope so it's accessible throughout the file
  let debugMenu = null;

  try {
    debugMenu = new DebugMenu(
      scene,
      camera,
      renderer,
      hexagons,
      lights,
      textureLoadingTracker.textures,
    );

    // Connect camera manager to debug menu
    debugMenu.setCameraManager(cameraManager);

    // Connect grid generator to debug menu
    debugMenu.setGridGenerator(generateHexagonGrid);

    // Make debug menu globally accessible immediately
    window.gameDebugMenu = debugMenu;

    debugLog("Debug menu initialized and connected to game components");
  } catch (error) {
    console.error("Failed to initialize debug menu:", error);
    debugLog("Debug menu initialization failed, continuing without it");
  }

  // Animation loop with performance tracking
  let frameCount = 0;
  let lastTime = performance.now();
  let fpsUpdateTime = performance.now();

  debugLog("Starting animation loop...");

  function animate() {
    try {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS counter every 30 frames (more frequent updates for UI)
      if (frameCount % 30 === 0) {
        const elapsed = currentTime - fpsUpdateTime;
        currentFps = Math.round((30 * 1000) / elapsed);
        fpsUpdateTime = currentTime;
        updateDebugInfo(); // Update the debug overlay
      }

      // Log FPS every 100 frames (to console)
      if (frameCount % 100 === 0) {
        const elapsed = currentTime - lastTime;
        const fps = Math.round((100 * 1000) / elapsed);
        debugLog(`Rendering at ${fps} FPS`);
        lastTime = currentTime;
      }

      // Update any hover animations
      if (window.hoveredHex) {
        try {
          // Update hover stroke animation with safe property access
          const hoverProgress = (Math.sin(currentTime * 0.002) + 1) / 2; // 0 to 1 animation
          
          // Debug logging - runs once every 300 frames to avoid console spam
          if (frameCount % 300 === 0) {
            moduleDebugLog('HOVER', 'Animation state:', {
              hoveredHexExists: !!window.hoveredHex,
              hasMaterial: !!window.hoveredHex?.material,
              hasUserData: !!window.hoveredHex?.material?.userData,
              hasStrokeMaterial: !!window.hoveredHex?.material?.userData?.strokeMaterial
            });
          }
          
          // Safely access and update the stroke material
          const strokeMaterial = window.hoveredHex?.material?.userData?.strokeMaterial;
          if (strokeMaterial) {
            strokeMaterial.opacity = hoverProgress;
          }
        } catch (err) {
          // Only log this error occasionally to prevent console spam
          if (frameCount % 300 === 0) {
            console.error('[HOVER] Error updating hover animation:', err);
          }
        }
      }

      // Render the scene
      renderer.render(scene, camera);
    } catch (error) {
      console.error("Animation loop error:", error);
      console.debug("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Request next frame
    requestAnimationFrame(animate);
  }

  // Start animation
  animate();

  // Resize handler with debugging
  window.addEventListener("resize", () => {
    debugLog("Window resized to:", {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update camera aspect ratio via camera manager
    cameraManager.updateAspect(window.innerWidth, window.innerHeight);

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    debugLog("Renderer and camera updated for new dimensions");
  });

  // Add debug info overlay
  const debugInfo = document.createElement("div");
  debugInfo.style.position = "absolute";
  debugInfo.style.top = "10px";
  debugInfo.style.right = "10px";
  debugInfo.style.backgroundColor = "rgba(0,0,0,0.7)";
  debugInfo.style.color = "white";
  debugInfo.style.padding = "10px";
  debugInfo.style.fontFamily = "monospace";
  debugInfo.style.zIndex = "1000";
  debugInfo.style.maxHeight = "80vh";
  debugInfo.style.overflowY = "auto";
  debugInfo.innerHTML = `
    <h3>Beast Tactics</h3>
    <div id="debug-fps">FPS: --</div>
    <div id="debug-hex-count">Hexagons: --</div>
    <div id="debug-camera">Camera: --</div>
    <div id="debug-textures">Textures: Loading...</div>
    <div id="debug-hovered">Hovered: None</div>
  `;
  document.body.appendChild(debugInfo);

  // Function to update debug info
  function updateDebugInfo() {
    if (!DEBUG) return;

    const fpsElement = document.getElementById("debug-fps");
    const hexCountElement = document.getElementById("debug-hex-count");
    const cameraElement = document.getElementById("debug-camera");
    const texturesElement = document.getElementById("debug-textures");

    if (fpsElement) fpsElement.textContent = "FPS: " + currentFps;
    if (hexCountElement)
      hexCountElement.textContent = "Hexagons: " + hexagons.length;
    if (cameraElement) {
      cameraElement.textContent =
        "Camera: X:" +
        camera.position.x.toFixed(1) +
        " Y:" +
        camera.position.y.toFixed(1) +
        " Z:" +
        camera.position.z.toFixed(1);
    }
    if (texturesElement) {
      texturesElement.textContent =
        "Textures: " +
        textureLoadingTracker.loaded +
        "/" +
        textureLoadingTracker.total +
        " loaded, " +
        textureLoadingTracker.failed +
        " failed";
    }
  }

  // Add variable to store current FPS
  let currentFps = 0;

  // Animation debugger for GIF animations
  let animationDebugger = null;

  // Import and initialize the animation debugger
  console.log("[DEBUG] Loading Animation Debugger module...");
  import('./tools/diagnostics/AnimationDebugger.js')
    .then(module => {
      console.log("[DEBUG] Successfully imported AnimationDebugger module");
      // Create new instance
      animationDebugger = new module.AnimationDebugger();

      // Make it globally available for debugging with a clear name
      window.animationDebugger = animationDebugger;

      // Also make available under an alternate name for better discovery
      window.gifDebugger = animationDebugger;

      console.log("[DEBUG] Animation Debugger initialized and made globally available");

      // Force an immediate animation update to ensure beast animations start
      animationDebugger.update();

      // If fire beast already exists, register it with the animation debugger
      if (fireBeast && fireBeast.beastTexture) {
        console.log("[DEBUG] Registering existing Fire Beast with animation debugger");
        fireBeast.animationDebuggerIndex = animationDebugger.registerTexture(
          fireBeast.beastTexture, 
          "FireBeast"
        );
      }
    })
    .catch(err => {
      console.error("[DEBUG] Failed to load Animation Debugger:", err);
      console.error("Error details:", err);
    });

  // Hide loading screen
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.add("hidden");
    debugLog("Loading screen hidden");
  }

  // Load additional GIF debugging tools
  console.log("[DEBUG] Loading additional GIF debugging tools");
  import('./tools/diagnostics/GifDebugger.js')
    .then(module => {
      console.log("[DEBUG] GIF debugging tools loaded successfully");
      // The module automatically initializes itself and attaches to window.gifDebugger
    })
    .catch(err => {
      console.error("[DEBUG] Failed to load GIF debugging tools:", err);
    });

  // Add Beast to scene after grid generation
  let fireBeast = null;
  let arrowDebugger = null;


  // Import the debugger tools with dynamic imports to handle module loading properly
  let ArrowDebugger;
  let GifDebugger;

  // Dynamically load debugger modules
  async function loadDebuggerModules() {
    try {
      console.log("[GAME] Loading debugger modules...");

      // Import the debugger modules
      const arrowModule = await import('./tools/diagnostics/ArrowDebugger.js');
      const gifModule = await import('./tools/diagnostics/GifDebugger.js');

      // Store the imported classes
      ArrowDebugger = arrowModule.ArrowDebugger;
      GifDebugger = gifModule.GifDebugger;

      console.log("[GAME] Debugger modules loaded successfully:", {
        arrowDebugger: !!ArrowDebugger,
        gifDebugger: !!GifDebugger
      });
    } catch (err) {
      console.error("[GAME] Error loading debugger modules:", err);
    }
  }

  // Start loading debugger modules
  loadDebuggerModules();


  // Initialize the Arrow Debugger
  debugLog("Initializing Arrow Debugger for directional movement debugging");
  try {
    // Import the Arrow Debugger tool
    // This is now handled by loadDebuggerModules
    //import('./tools/diagnostics/ArrowDebugger.js')
    //  .then(module => {
    //    debugLog("Arrow Debugger module loaded successfully");
    //    arrowDebugger = new module.ArrowDebugger(scene);

    //    // Make it globally available for debugging with a clear name
    //    window.arrowDebugger = arrowDebugger;

    //    // If beast already exists, connect it to the debugger
    //    if (fireBeast) {
    //      debugLog("Connecting existing Fire Beast to Arrow Debugger");
    //      arrowDebugger.setBeast(fireBeast);
    //    }
    //  })
    //  .catch(err => {
    //    console.error("Failed to load Arrow Debugger:", err);
    //  });
  } catch (error) {
    console.error("Failed to initialize Arrow Debugger:", error);
  }

  // Function to spawn a Fire Beast on a random Fire tile
  function spawnFireBeast() {
    debugLog("Attempting to spawn Fire Beast on a random Fire tile");

    if (hexagons.length === 0) {
      console.warn("Cannot spawn beast: No hexagons in scene");
      return null;
    }

    // Find a random Fire hex using the Beast class static method
    console.log("[GAME] Searching for Fire hex using Beast.findRandomHexOfElement");
    const fireHex = Beast.findRandomHexOfElement(hexagons, "Fire");

    if (!fireHex) {
      console.warn("No Fire hexagons found, using first available hex instead");
      // Fallback to any hex
      const randomHex = hexagons[Math.floor(Math.random() * hexagons.length)];
      createBeastAtHex(randomHex);
    } else {
      createBeastAtHex(fireHex);
    }

    function createBeastAtHex(hex) {
      // Create beast at hex position (slightly elevated)
      const beastPosition = {
        x: hex.position.x,
        y: hex.position.y + 0.7, // Raise above the hex
        z: hex.position.z,
      };

      debugLog(`Creating Fire Beast at position`, beastPosition);

      // Create the beast
      fireBeast = new Beast("Fire", scene, camera, beastPosition, 1);

      // Set up click handling for beast movement
      fireBeast.setupClickHandling(hexagons);

      // Update the current hex position with additional logging
      fireBeast.currentAxialPos = { q: hex.userData.q, r: hex.userData.r };
      console.log("[BEAST] Initial hex position set:", fireBeast.currentAxialPos);

      // Connect beast to arrow debugger if available
      if (arrowDebugger) {
        debugLog("Connecting Fire Beast to Arrow Debugger");
        arrowDebugger.setBeast(fireBeast);
      } else {
        debugLog("Arrow Debugger not yet available, will connect when loaded");

        // Try again after a short delay
        setTimeout(() => {
          if (window.arrowDebugger && fireBeast) {
            debugLog("Connecting Fire Beast to Arrow Debugger (delayed)");
            window.arrowDebugger.setBeast(fireBeast);
          }
        }, 2000);
      }

      // Connect beast to arrow debugger in debug menu if it exists
      if (window.gameDebugMenu) {
        debugLog("Connecting Fire Beast to Debug Menu Arrow Debugger");
        window.gameDebugMenu.initArrowDebugger(fireBeast);
      } else {
        // Check if we need to look for a debug menu in parent scope
        debugLog("Global gameDebugMenu not found, checking for alternatives");

        // Try to find any existing debug menu instance
        const existingMenus = document.querySelectorAll('#debug-menu');
        if (existingMenus.length > 0) {
          debugLog("Found existing debug menu in DOM, but no global reference");
        }

        // Log diagnostic information to help track down the issue
        console.log("[BEAST] Debug state:", {
          globalDebugMenu: !!window.gameDebugMenu,
          arrowDebugger: !!arrowDebugger,
          beastObject: !!fireBeast,
          beastType: fireBeast ? fireBeast.type : 'undefined'
        });
      }

      // Log the hex where the beast spawned
      debugLog(`Fire Beast spawned on hex`, {
        position: hex.position,
        element: hex.userData.element,
        coords: { q: hex.userData.q, r: hex.userData.r },
      });
    }
  }

  // Add beast update to animation loop
  let originalAnimate = animate;
  
  // Create a clock for tracking time
  const clock = new THREE.Clock();

  // Create enhanced animation function with beast updates
  function enhancedAnimate() {
    // Calculate delta time for smooth animations
    const now = performance.now();
    const delta = (now - (lastFrameTime || now)) / 1000; // Convert to seconds
    lastFrameTime = now;
    
    // Log delta time occasionally for debugging
    if (frameCount % 300 === 0) {
      console.log(`[GAME] Animation delta: ${delta.toFixed(4)}s (${(1/delta).toFixed(1)} FPS)`);
    }
    
    // Call original animation function first
    originalAnimate();

    // Update beast if it exists with delta time
    if (fireBeast) {
      try {
        fireBeast.update(delta);
      } catch (err) {
        console.error('[GAME] Error updating Fire Beast:', err);
      }
    }

    // Update animation debugger if available
    if (animationDebugger) {
      try {
        animationDebugger.update();
      } catch (err) {
        console.error('[GAME] Error updating animation debugger:', err);
      }
    }
    
    // Update crystal particle effects if available
    if (mapGenerator && mapGenerator.crystalManager) {
      try {
        // Update sparkling particle effects on crystal shards
        mapGenerator.crystalManager.updateParticles();
        
        // Log update periodically
        if (frameCount % 600 === 0) { // Log every ~10 seconds at 60fps
          console.log('[CRYSTAL] Updated particle effects');
        }
      } catch (err) {
        console.error('[GAME] Error updating crystal particles:', err);
      }
    }
  }
  
  // Track last frame time for delta calculation
  let lastFrameTime = null;

  // Replace the animate function with our enhanced version
  animate = enhancedAnimate;

  // Trigger beast spawn after grid is generated
  debugLog("Setting up Fire Beast spawn after grid generation");

  // Spawn the Fire Beast when the map generation is complete
  mapGenerator.onMapGenerated((generatedHexagons) => {
    // Wait a bit to make sure grid is fully set up
    setTimeout(() => {
      if (!fireBeast) {
        debugLog("Grid generation complete, spawning Fire Beast");
        spawnFireBeast();
      }
    }, 1000);
  });

  debugLog("Fire Beast integration complete");
  debugLog("Three.js setup complete - game should be visible now");
} catch (error) {
  console.error("CRITICAL ERROR:", error);
  console.debug("Error details:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });

  // Display error on page
  const errorElement = document.createElement("div");
  errorElement.style.position = "absolute";
  errorElement.style.top = "50%";
  errorElement.style.left = "50%";
  errorElement.style.transform = "translate(-50%, -50%)";
  errorElement.style.color = "red";
  errorElement.style.background = "black";
  errorElement.style.padding = "20px";
  errorElement.style.borderRadius = "5px";
  errorElement.style.maxWidth = "80%";
  errorElement.innerHTML = `
    <h2>Rendering Error</h2>
    <p>${error.message}</p>
    <pre>${error.stack}</pre>
    <button onclick="location.reload()">Reload Page</button>
  `;
  document.body.appendChild(errorElement);
}

} // Close setupScene function