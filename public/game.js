// Import Three.js from CDN
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Import game architecture
import { GameManager } from "./js/core/GameManager.js";
import { Logger } from "./js/utils/Logger.js";

// Logging setup
console.log("Beast Tactics script loaded and starting...");

// Game manager instance
let gameManager = null;

// Initialize core game architecture
async function initializeGameArchitecture() {
  try {
    console.log("Initializing Beast Tactics core architecture...");
    
    // Create game manager
    gameManager = new GameManager({
      version: '1.0.0',
      debugMode: true
    });
    
    // Initialize the game
    await gameManager.initialize({
      players: [
        { name: 'Player 1', color: 'Red' }
      ]
    });
    
    console.log("Core architecture initialized successfully");
    return gameManager;
  } catch (error) {
    console.error("Failed to initialize game architecture:", error);
    console.debug("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Initialize game architecture in the background
initializeGameArchitecture().then(manager => {
  console.log("Game architecture ready, manager:", manager);
}).catch(error => {
  console.error("Game architecture initialization failed:", error);
});

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
  //console.log(`[MOUSE] ${action}`, data);
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
  scene.background = new THREE.Color(0x222222);
  //debugLog("Scene created with dark background");

  // Camera setup with logging of parameters
  const cameraParams = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  };
  //debugLog("Creating camera with parameters:", cameraParams);

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

  // Add lights to scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

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

  // Define color palette for hexagons
  const colorPalette = [
    0xff5733, // Vibrant orange
    0xc70039, // Crimson
    0x900c3f, // Dark pink
    0x581845, // Dark purple
    0xffc300, // Bright yellow
    0x2ecc71, // Green
    0x3498db, // Blue
  ];
  debugLog("Color palette defined with", colorPalette.length, "colors");

  // Create materials with different colors
  const hexMaterials = colorPalette.map(
    (color) =>
      new THREE.MeshPhongMaterial({
        color: color,
        shininess: 30,
        specular: 0x222222,
      }),
  );

  // Add side material (edges of hexagons)
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 10,
  });

  // Function to create individual hexagons
  function createHex(q, r) {
    // Pick a random material from our palette
    const materialIndex = Math.floor(Math.random() * hexMaterials.length);
    const hexMaterial = hexMaterials[materialIndex];

    // Create multi-material for top/bottom and side
    const materials = [
      edgeMaterial, // Side
      hexMaterial, // Top
      hexMaterial, // Bottom
    ];

    // Create mesh with geometry and materials
    const hex = new THREE.Mesh(hexGeometry, materials);

    // Position hexagon in grid
    const x = hexRadius * 1.75 * q;
    const z = hexRadius * Math.sqrt(3) * (r + q / 2);
    hex.position.set(x, 0, z);

    // Debug rotation values for troubleshooting
    debugLog(`Creating hex at (${q},${r}) with position (${x},0,${z})`);

    // In THREE.js, cylinders stand upright along Y axis by default
    // We need to rotate them 30 degrees (π/6 radians) around the Y axis
    // for the hexagons to align properly in the grid
    hex.rotation.x = 0;
    hex.rotation.y = Math.PI / 6; // 30 degrees rotation
    hex.rotation.z = 0;

    // Log rotation for verification
    debugLog(
      `Hex rotation set to Y: ${hex.rotation.y} radians (${(hex.rotation.y * 180) / Math.PI} degrees)`,
    );

    // Add to scene
    scene.add(hex);

    return hex;
  }

  debugLog("Starting to generate hexagon grid...");
  const hexagons = [];
  let hexCount = 0;

  // Generate grid (radius 7 - about 3x as many hexagons as radius 4)
  const gridRadius = 7;
  debugLog(`Generating hex grid with radius ${gridRadius}`);

  for (let q = -gridRadius; q <= gridRadius; q++) {
    for (
      let r = Math.max(-gridRadius, -q - gridRadius);
      r <= Math.min(gridRadius, -q + gridRadius);
      r++
    ) {
      const hex = createHex(q, r);
      hexagons.push(hex);
      hexCount++;

      // Log progress every 20 hexagons
      if (hexCount % 20 === 0) {
        debugLog(`Created ${hexCount} hexagons so far...`);
      }
    }
  }

  debugLog(`Grid generation complete: ${hexagons.length} hexagons created`);

  // Position camera more top-down with slight angle
  camera.position.set(0, 30, 10);
  mouseState.target.set(0, 0, 0);
  camera.lookAt(mouseState.target);
  //debugLog("Camera positioned at:", camera.position);

  // Set up camera controls for mouse interaction

  // Mouse down handler to start drag
  window.addEventListener("mousedown", (event) => {
    if (event.button === 1) {
      // Middle mouse button for panning
      mouseState.leftDragging = true;
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
      //logMouseControl("Pan started", { x: event.clientX, y: event.clientY });
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
      // Update camera position and target together to maintain orientation
      // The negative signs create the "grab world" effect (drag right, world moves right)
      const moveX = -deltaX * mouseState.panSensitivity * camera.position.y;
      const moveZ = -deltaY * mouseState.panSensitivity * camera.position.y;

      camera.position.x += moveX;
      camera.position.z += moveZ;
      mouseState.target.x += moveX;
      mouseState.target.z += moveZ;

      // Apply the new orientation
      camera.lookAt(mouseState.target);

      if (Math.abs(deltaX) + Math.abs(deltaY) > 20) {
        logMouseControl("Panning camera", {
          deltaX,
          deltaY,
          newPos: {
            x: camera.position.x.toFixed(1),
            y: camera.position.y.toFixed(1),
            z: camera.position.z.toFixed(1),
          },
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

      // Apply rotation
      azimuthAngle -= theta;
      polarAngle = Math.max(0.1, Math.min(Math.PI - 0.1, polarAngle + phi));

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

  debugLog("Starting animation loop...");

  function animate() {
    try {
      const currentTime = performance.now();
      frameCount++;

      // Log FPS every 100 frames
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
  debugInfo.textContent = "Beast Tactics: Rendering active";
  document.body.appendChild(debugInfo);

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
