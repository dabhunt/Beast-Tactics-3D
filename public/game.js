// Import Three.js and other modules using dynamic imports for better compatibility
import { CameraManager } from "./camera.js";
import { DebugMenu } from "./tools/diagnostics/DebugMenu.js";
import { Beast } from './beast.js';

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
    const threeModule = await import("https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js");
    // Assign the module to the global THREE variable
    THREE = threeModule;
    console.log("[GAME] THREE.js module loaded successfully");
    
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

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Enhanced logging function that only logs in debug mode
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[DEBUG] ${message}`, data);
  } else {
    console.log(`[DEBUG] ${message}`);
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

    // Define all element types
    const elementTypes = [
      "Combat",
      "Corrosion",
      "Dark",
      "Earth",
      "Electric",
      "Fire",
      "Light",
      "Metal",
      "Plant",
      "Spirit",
      "Water",
      "Wind",
    ];

    // Create URLs for local assets
    const elemUrls = {};
    elementTypes.forEach((element) => {
      elemUrls[element] = `/assets/BiomeTiles/${element}.png`;
    });

    debugLog("Element types defined:", elementTypes);
    debugLog("Element URLs mapped:", elemUrls);

    // Create texture loader with error handling
    const textureLoader = new THREE.TextureLoader();

    // Create a loading tracker
    const textureLoadingTracker = {
      total: elementTypes.length,
      loaded: 0,
      failed: 0,
      textures: {},
    };

    // Texture configuration (reverted to default)
    const textureConfig = {
      verticalMarginRatio: 0, // No margin adjustment
      debug: true, // Set to true to see debugging logs about texture adjustments
    };

    // Default fallback material (used if textures fail to load)
    // Create raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Create stroke material for hover effect
    const strokeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });

    // Initialize mouse position vector outside event handler
    const mousePos = new THREE.Vector2();
    console.log('[MOUSE] Initialized mouse position vector:', mousePos);

    // Handle mouse move for hex hover
    window.addEventListener('mousemove', (event) => {
      console.log('[MOUSE] Mouse move event:', { 
        clientX: event.clientX, 
        clientY: event.clientY 
      });

      // Calculate mouse position in normalized device coordinates
      mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

      console.log('[MOUSE] Updated normalized coordinates:', { 
        x: mousePos.x, 
        y: mousePos.y 
      });

      // Log before raycasting to ensure variables are defined
      console.log('[RAYCASTER] Preparing to find intersects', {
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
    
    // Find intersected hexagons with defensive try/catch
    let intersects = [];
    try {
      intersects = raycaster.intersectObjects(hexagons);
      
      // Log after raycasting to confirm execution
      console.log('[RAYCASTER] Intersects found:', {
        intersectCount: intersects.length,
        firstIntersect: intersects.length > 0 ? intersects[0].object : null
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
      console.log('[HOVER] Clearing previous hover effect', {
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
          console.log('[HOVER] Successfully removed stroke mesh');
        } else {
          console.log('[HOVER] No stroke mesh found to remove');
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
        console.log('[HOVER] Setting new hover on hex:', {
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
        
        // Initialize userData if it doesn't exist
        if (!hex.material.userData) {
          hex.material.userData = {};
        }
        
        window.hoveredHex = hex;

        // Create stroke geometry (hexagon outline)
        const strokeGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const hexPoints = 6;
        const radius = 1.05; // Slightly larger than hex radius for visible outline

        for (let i = 0; i <= hexPoints; i++) {
          const angle = (i / hexPoints) * Math.PI * 2;
          vertices.push(
            radius * Math.cos(angle),
            0.1, // Slightly above hex surface
            radius * Math.sin(angle)
          );
        }

        strokeGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(vertices, 3)
        );

        // Create stroke mesh with a fresh material clone
        const strokeMaterialClone = strokeMaterial.clone();
        const strokeMesh = new THREE.Line(strokeGeometry, strokeMaterialClone);
        strokeMesh.rotation.y = Math.PI / 6; // Match hex rotation

        // Store references for animation
        hex.material.userData.strokeMesh = strokeMesh;
        hex.material.userData.strokeMaterial = strokeMaterialClone;

        // Add stroke to hex
        hex.add(strokeMesh);
        
        console.log('[HOVER] Successfully created and attached stroke mesh');
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

  // Load all textures
  const hexMaterials = {};

  function updateLoadingStatus() {
    const total = textureLoadingTracker.total;
    const loaded = textureLoadingTracker.loaded;
    const failed = textureLoadingTracker.failed;

    debugLog(
      `Texture loading progress: ${loaded}/${total} loaded, ${failed} failed`,
    );

    // Check if all textures are processed (either loaded or failed)
    if (loaded + failed === total) {
      debugLog("All textures processed. Ready to generate map.");
      generateHexagonGrid();
    }
  }

  // Start loading all textures
  elementTypes.forEach((element, index) => {
    debugLog(`Loading texture for ${element} element...`);

    textureLoader.load(
      // URL
      elemUrls[element],

      // onLoad callback
      (texture) => {
        debugLog(`Successfully loaded ${element} texture`);

        // Use default texture mapping (no offset)
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);

        if (textureConfig.debug) {
          console.log(`[TEXTURE] Applied texture offset for ${element}:`, {
            verticalMargin: textureConfig.verticalMarginRatio,
            repeat: texture.repeat.toArray(),
            offset: texture.offset.toArray(),
          });
        }

        // Create material with the loaded texture and enhanced properties for more vibrant colors
        const material = new THREE.MeshPhongMaterial({
          map: texture,
          shininess: 70, // Higher shininess for more defined reflections
          specular: 0x666666, // Brighter specular highlights
          emissive: 0x333333, // Stronger emissive for better color representation
          emissiveIntensity: 0.4, // Doubled emissive intensity to enhance colors
          transparent: true,
          side: THREE.DoubleSide, // Ensure both sides render properly
          color: 0xffffff, // Full brightness base color to avoid muting
        });

        // Log material creation with enhanced properties
        if (textureConfig.debug) {
          console.log(
            `[MATERIAL] Created enhanced material for ${element} with properties:`,
            {
              shininess: material.shininess,
              specular: material.specular.getHexString(),
              emissive: material.emissive.getHexString(),
              emissiveIntensity: material.emissiveIntensity,
            },
          );
        }

        // Store the material
        hexMaterials[element] = material;
        textureLoadingTracker.textures[element] = texture;
        textureLoadingTracker.loaded++;

        updateLoadingStatus();
      },

      // onProgress callback (not used)
      undefined,

      // onError callback
      (error) => {
        console.error(`Failed to load texture for ${element}:`, error);

        // Use fallback material
        debugLog(`Using fallback material for ${element}`);
        hexMaterials[element] = fallbackMaterials[index];
        textureLoadingTracker.failed++;

        updateLoadingStatus();
      },
    );
  });

  // Add side material (edges of hexagons)
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 10,
  });

  // Function to create individual hexagons
  function createHex(q, r, horizontalSpacing = 1.5, verticalFactor = 1.0) {
    // Assign element type - for now, random selection
    const randomElement =
      elementTypes[Math.floor(Math.random() * elementTypes.length)];

    // Get appropriate material based on element type
    const hexMaterial = hexMaterials[randomElement] || fallbackMaterials[0];

    // Create multi-material for top/bottom and side
    const materials = [
      edgeMaterial, // Side
      hexMaterial, // Top
      hexMaterial, // Bottom
    ];

    // Create mesh with geometry and materials
    const hex = new THREE.Mesh(hexGeometry, materials);

    // Store element data for game logic
    hex.userData.element = randomElement;
    hex.userData.q = q;
    hex.userData.r = r;

    // Position hexagon in grid
    // For perfect fit in axial coordinate system:
    // x = hexRadius * 3/2 * q
    // z = hexRadius * sqrt(3) * (r + q/2)
    const x = hexRadius * horizontalSpacing * q;
    const z = hexRadius * Math.sqrt(3) * verticalFactor * (r + q / 2);
    hex.position.set(x, 0, z);

    // Debug rotation values for troubleshooting
    debugLog(
      `Creating hex at (${q},${r}) with position (${x},0,${z}) - Element: ${randomElement}`,
    );

    // In THREE.js, cylinders stand upright along Y axis by default
    // We need to rotate them 30 degrees (π/6 radians) around the Y axis
    // for the hexagons to align properly in the grid
    hex.rotation.x = 0;
    hex.rotation.y = Math.PI / 6; // 30 degrees rotation
    hex.rotation.z = 0;

    // Add to scene
    scene.add(hex);

    return hex;
  }

  debugLog("Starting to generate hexagon grid...");
  const hexagons = [];
  let hexCount = 0;

  // Function to generate the entire grid
  function generateHexagonGrid(horizontalSpacing = 1.5, verticalFactor = 1.0) {
    // Generate grid (radius 7 - about 3x as many hexagons as radius 4)
    const gridRadius = 7;
    debugLog(
      `Generating hex grid with radius ${gridRadius}, spacing: h=${horizontalSpacing}, v=${verticalFactor}`,
    );

    // Track element distribution for debugging
    const elementDistribution = {};
    elementTypes.forEach((element) => {
      elementDistribution[element] = 0;
    });

    // Clear any existing hexagons if we're regenerating
    if (hexagons.length > 0) {
      debugLog("Clearing existing hexagons before regeneration");
      hexagons.forEach((hex) => {
        scene.remove(hex);
      });
      hexagons.length = 0;
      hexCount = 0;
    }

    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (
        let r = Math.max(-gridRadius, -q - gridRadius);
        r <= Math.min(gridRadius, -q + gridRadius);
        r++
      ) {
        const hex = createHex(q, r, horizontalSpacing, verticalFactor);
        hexagons.push(hex);
        hexCount++;

        // Track element distribution if hex has element data
        if (hex.userData.element) {
          elementDistribution[hex.userData.element]++;
        }

        // Log progress every 20 hexagons
        if (hexCount % 20 === 0) {
          debugLog(`Created ${hexCount} hexagons so far...`);
        }
      }
    }

    debugLog(`Grid generation complete: ${hexagons.length} hexagons created`);
    debugLog("Element distribution:", elementDistribution);
  }

  // Wait for texture loading to complete before generating the grid
  // The grid will be generated from the updateLoadingStatus function
  // when all textures are processed

  // Make generateHexagonGrid available globally for diagnostics tools
  window.generateHexagonGrid = generateHexagonGrid;

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
            console.log('[HOVER] Animation state:', {
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
  }
  
  // Track last frame time for delta calculation
  let lastFrameTime = null;

  // Replace the animate function with our enhanced version
  animate = enhancedAnimate;

  // Trigger beast spawn after grid is generated
  debugLog("Setting up Fire Beast spawn after grid generation");

  // Modified version of updateLoadingStatus to spawn beast when ready
  const originalUpdateLoadingStatus = updateLoadingStatus;
  function enhancedUpdateLoadingStatus() {
    // Call original function
    originalUpdateLoadingStatus();

    // Check if grid is generated
    const total = textureLoadingTracker.total;
    const loaded = textureLoadingTracker.loaded;
    const failed = textureLoadingTracker.failed;

    // If all textures processed, grid should be generated
    if (loaded + failed === total && hexagons.length > 0) {
      // Wait a bit to make sure grid is fully set up
      setTimeout(() => {
        if (!fireBeast) {
          debugLog("Grid generation complete, spawning Fire Beast");
          spawnFireBeast();
        }
      }, 1000);
    }
  }

  // Replace the updateLoadingStatus function
  updateLoadingStatus = enhancedUpdateLoadingStatus;

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