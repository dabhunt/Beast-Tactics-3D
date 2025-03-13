// Import Three.js from CDN
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Logging setup
console.log("Beast Tactics script loaded and starting...");

// Track mouse state for camera controls
const mouseState = {
  leftDragging: false, // For panning
  rightDragging: false, // For camera angle rotation
  lastX: 0,
  lastY: 0,
  panSensitivity: 0.003, // Sensitivity for panning
  rotateSensitivity: 0.005, // Sensitivity for rotation
  zoomSensitivity: 0.01,
  minZoom: 5,
  maxZoom: 50,
  target: new THREE.Vector3(0, 0, 0), // Camera look target
};

// Debug function to log mouse control events
function logMouseControl(action, data) {
  if (!DEBUG) return;
  console.log(`[MOUSE] ${action}`, data);
}

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

debugLog("Setting up THREE.js scene...");

try {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111926); // Slightly blue-tinted dark background for better contrast
  debugLog("Scene created with dark blue-tinted background for better contrast");

  // Camera setup with logging of parameters
  const cameraParams = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  };
  debugLog("Creating camera with parameters:", cameraParams);

  const camera = new THREE.PerspectiveCamera(
    cameraParams.fov,
    cameraParams.aspect,
    cameraParams.near,
    cameraParams.far,
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

  // Add enhanced lighting setup for better visibility
  debugLog("Setting up enhanced lighting...");
  
  // Enhanced lighting configuration for better color vibrancy
  
  // Brighter ambient light with warmer tone
  const ambientLight = new THREE.AmbientLight(0xfffcf0, 0.85); // Increased intensity, slightly warmer
  scene.add(ambientLight);
  debugLog("Created enhanced ambient light with intensity:", ambientLight.intensity);

  // Primary directional light (sun-like) with warmer color
  const dirLight = new THREE.DirectionalLight(0xfff0d0, 1.2); // Warmer color and higher intensity
  dirLight.position.set(5, 15, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);
  debugLog("Created enhanced directional light with intensity:", dirLight.intensity);
  
  // Secondary fill light from opposite side with complementary cooler tint
  const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.5); // Slightly higher intensity
  fillLight.position.set(-5, 8, -5);
  scene.add(fillLight);
  
  // Small overhead point light for specular highlights - brighter
  const pointLight = new THREE.PointLight(0xffffff, 0.7, 50); // Increased intensity
  pointLight.position.set(0, 15, 0);
  scene.add(pointLight);
  
  // Add an additional low rim light for edge definition
  const rimLight = new THREE.DirectionalLight(0xffe8d0, 0.3);
  rimLight.position.set(0, 3, -12);
  scene.add(rimLight);
  
  debugLog("Enhanced lighting setup complete with main, fill, and point lights");

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
    'Combat',
    'Corrosion',
    'Dark',
    'Earth',
    'Electric',
    'Fire',
    'Light',
    'Metal',
    'Plant',
    'Spirit',
    'Water',
    'Wind'
  ];
  
  // Create URLs for local assets
  const elemUrls = {};
  elementTypes.forEach(element => {
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
    textures: {}
  };
  
  // Texture configuration (reverted to default)
  const textureConfig = {
    verticalMarginRatio: 0, // No margin adjustment
    debug: true // Set to true to see debugging logs about texture adjustments
  };
  
  // Default fallback material (used if textures fail to load)
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
    new THREE.MeshPhongMaterial({ color: 0xc6e2ff, shininess: 50, specular: 0x555555 })  // Wind
  ];
  
  // Load all textures
  const hexMaterials = {};
  
  function updateLoadingStatus() {
    const total = textureLoadingTracker.total;
    const loaded = textureLoadingTracker.loaded;
    const failed = textureLoadingTracker.failed;
    
    debugLog(`Texture loading progress: ${loaded}/${total} loaded, ${failed} failed`);
    
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
            offset: texture.offset.toArray()
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
          color: 0xffffff // Full brightness base color to avoid muting
        });
        
        // Log material creation with enhanced properties
        if (textureConfig.debug) {
          console.log(`[MATERIAL] Created enhanced material for ${element} with properties:`, {
            shininess: material.shininess,
            specular: material.specular.getHexString(),
            emissive: material.emissive.getHexString(),
            emissiveIntensity: material.emissiveIntensity
          });
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
      }
    );
  });

  // Add side material (edges of hexagons)
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 10,
  });

  // Function to create individual hexagons
  function createHex(q, r) {
    // Assign element type - for now, random selection
    const randomElement = elementTypes[Math.floor(Math.random() * elementTypes.length)];
    
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
    const x = hexRadius * 1.5 * q;
    const z = hexRadius * Math.sqrt(3) * (r + q/2);
    hex.position.set(x, 0, z);

    // Debug rotation values for troubleshooting
    debugLog(`Creating hex at (${q},${r}) with position (${x},0,${z}) - Element: ${randomElement}`);

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
  function generateHexagonGrid() {
    // Generate grid (radius 7 - about 3x as many hexagons as radius 4)
    const gridRadius = 7;
    debugLog(`Generating hex grid with radius ${gridRadius}`);
    
    // Track element distribution for debugging
    const elementDistribution = {};
    elementTypes.forEach(element => { elementDistribution[element] = 0; });
    
    // Clear any existing hexagons if we're regenerating
    if (hexagons.length > 0) {
      debugLog("Clearing existing hexagons before regeneration");
      hexagons.forEach(hex => {
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
        const hex = createHex(q, r);
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

  // Position camera more top-down with slight angle
  camera.position.set(0, 30, 10);
  mouseState.target.set(0, 0, 0);
  camera.lookAt(mouseState.target);
  debugLog("Camera positioned at:", camera.position);

  // Set up camera controls for mouse interaction

  // Mouse down handler to start drag
  window.addEventListener("mousedown", (event) => {
    if (event.button === 1) {
      // Middle mouse button for panning
      mouseState.leftDragging = true;
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
      logMouseControl("Pan started", { x: event.clientX, y: event.clientY });
      event.preventDefault(); // Prevent default browser behavior
    } else if (event.button === 2) {
      // Right mouse button for rotation
      mouseState.rightDragging = true;
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
      logMouseControl("Rotation started", {
        x: event.clientX,
        y: event.clientY,
      });
      event.preventDefault(); // Prevent default context menu
    }
  });

  // Prevent context menu on right click
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  // Mouse move handler for dragging
  window.addEventListener("mousemove", (event) => {
    // Calculate how much the mouse has moved
    const deltaX = event.clientX - mouseState.lastX;
    const deltaY = event.clientY - mouseState.lastY;

    // Handle panning (middle mouse button)
    if (mouseState.leftDragging) {
      // Calculate the camera's right and forward vectors
      // For camera-relative panning that respects rotation
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0; // Keep movement in the horizontal plane
      cameraDirection.normalize();
      
      // Camera right vector (perpendicular to direction)
      const cameraRight = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);
      
      // Scale the movement based on camera height
      const moveFactor = mouseState.panSensitivity * camera.position.y;
      
      // Calculate movement vectors (negative to create natural "grab world" feel)
      const moveRight = cameraRight.multiplyScalar(-deltaX * moveFactor);
      const moveForward = cameraDirection.multiplyScalar(deltaY * moveFactor);
      
      // Create combined movement vector
      const movement = new THREE.Vector3().addVectors(moveRight, moveForward);
      
      // Apply movement to both camera and target
      camera.position.add(movement);
      mouseState.target.add(movement);
      
      // Update camera orientation
      camera.lookAt(mouseState.target);
      
      // Debug logging for significant movements
      if (Math.abs(deltaX) + Math.abs(deltaY) > 20) {
        logMouseControl("Panning camera", {
          deltaX,
          deltaY,
          newPos: {
            x: camera.position.x.toFixed(1),
            y: camera.position.y.toFixed(1),
            z: camera.position.z.toFixed(1),
          },
          moveVector: {
            x: movement.x.toFixed(2),
            y: movement.y.toFixed(2), 
            z: movement.z.toFixed(2)
          }
        });
      }
    }

    // Handle camera rotation (right mouse button)
    if (mouseState.rightDragging) {
      // Orbit the camera around the target point
      const theta = deltaX * mouseState.rotateSensitivity; // Horizontal rotation
      const phi = deltaY * mouseState.rotateSensitivity; // Vertical rotation

      // Get current camera vector from target
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        mouseState.target,
      );

      // Convert to spherical coordinates
      const radius = offset.length();
      let polarAngle = Math.atan2(
        Math.sqrt(offset.x * offset.x + offset.z * offset.z),
        offset.y,
      );
      let azimuthAngle = Math.atan2(offset.z, offset.x);

      // Camera constraints configuration
      const cameraConstraints = {
        minPolarAngle: 0.1,           // Minimum angle (rad) - close to top-down
        maxPolarAngle: Math.PI * 0.6, // Maximum angle (rad) - prevents looking from below
        minAzimuthAngle: -Infinity,   // No constraint on horizontal rotation
        maxAzimuthAngle: Infinity     // No constraint on horizontal rotation
      };
      
      // Apply rotation with constraints
      azimuthAngle -= theta;
      
      // Constrain polar angle to prevent looking from below the map
      polarAngle = Math.max(
        cameraConstraints.minPolarAngle, 
        Math.min(cameraConstraints.maxPolarAngle, polarAngle + phi)
      );
      
      // Log constraint application if significant angle adjustment made
      if (DEBUG && Math.abs(polarAngle - (polarAngle + phi)) > 0.1) {
        console.log("[CAMERA] Polar angle constrained:", { 
          requested: ((polarAngle + phi) * 180/Math.PI).toFixed(1),
          constrained: (polarAngle * 180/Math.PI).toFixed(1)
        });
      }

      // Convert back to Cartesian coordinates
      offset.x = radius * Math.sin(polarAngle) * Math.cos(azimuthAngle);
      offset.y = radius * Math.cos(polarAngle);
      offset.z = radius * Math.sin(polarAngle) * Math.sin(azimuthAngle);

      // Update camera position
      camera.position.copy(mouseState.target).add(offset);
      camera.lookAt(mouseState.target);

      if (Math.abs(deltaX) + Math.abs(deltaY) > 20) {
        logMouseControl("Rotating camera", {
          deltaX,
          deltaY,
          rotation: {
            azimuth: ((azimuthAngle * 180) / Math.PI).toFixed(1),
            polar: ((polarAngle * 180) / Math.PI).toFixed(1),
          },
        });
      }
    }

    // Update last position
    mouseState.lastX = event.clientX;
    mouseState.lastY = event.clientY;
  });

  // Mouse up handler to end drag
  window.addEventListener("mouseup", (event) => {
    if (event.button === 1) {
      mouseState.leftDragging = false;
      logMouseControl("Pan ended", null);
    } else if (event.button === 2) {
      mouseState.rightDragging = false;
      logMouseControl("Rotation ended", null);
    }
  });

  // Mouse wheel handler for zoom
  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault(); // Prevent default scroll

      // Determine zoom direction and calculate new position
      const zoomAmount = event.deltaY * mouseState.zoomSensitivity;

      // Get direction vector from camera to target
      const direction = new THREE.Vector3().subVectors(
        camera.position,
        mouseState.target,
      );

      // Scale the direction vector based on zoom
      const scaleFactor = 1 + zoomAmount / direction.length();
      direction.multiplyScalar(scaleFactor);

      // Calculate new camera position
      const newPosition = new THREE.Vector3()
        .copy(mouseState.target)
        .add(direction);

      // Enforce zoom limits
      if (
        newPosition.y > mouseState.minZoom &&
        newPosition.y < mouseState.maxZoom
      ) {
        camera.position.copy(newPosition);
        logMouseControl("Zooming camera", {
          delta: event.deltaY,
          distance: direction.length().toFixed(1),
        });
      }
    },
    { passive: false },
  ); // Important for preventing scroll

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

      // Add some movement to make it clear rendering is working
      hexagons.forEach((hex, index) => {
        // Make hexagons gently bob up and down
        if (index % 3 === 0) {
          hex.position.y = Math.sin(currentTime * 0.001 + index * 0.1) * 0.2;
        }
      });

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

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
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
    
    if (fpsElement) fpsElement.textContent = `FPS: ${currentFps}`;
    if (hexCountElement) hexCountElement.textContent = `Hexagons: ${hexagons.length}`;
    if (cameraElement) {
      cameraElement.textContent = `Camera: X:${camera.position.x.toFixed(1)} Y:${camera.position.y.toFixed(1)} Z:${camera.position.z.toFixed(1)}`;
    }
    if (texturesElement) {
      texturesElement.textContent = `Textures: ${textureLoadingTracker.loaded}/${textureLoadingTracker.total} loaded, ${textureLoadingTracker.failed} failed`;
    }
  }
  
  // Add variable to store current FPS
  let currentFps = 0;

  // Hide loading screen
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.add("hidden");
    debugLog("Loading screen hidden");
  }

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
