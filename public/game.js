// Import Three.js from CDN
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Import game architecture
import { GameManager } from "./js/core/GameManager.js";
import { Logger } from "./js/utils/Logger.js";

// Import biome distribution test tool
import { createBiomeDistributionUI } from '../tools/diagnostics/BiomeDistributionTest.js';

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

// Import our HexGridRenderer
import { HexGridRenderer, BiomeTypes } from "./js/rendering/HexGridRenderer.js";

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

// Track loading state
let texturesLoaded = false;
let hexGridRenderer = null;
let hexagons = [];

try {
  // Scene setup with improved background
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333344); // Slightly bluish dark color for better contrast
  debugLog("Scene created with improved background color");

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

  // Add improved lighting to scene
  // Increase ambient light intensity for better base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased from 0.5 to 0.7
  scene.add(ambientLight);
  console.log("Enhanced ambient lighting added with intensity 0.7");

  // Add primary directional light (sun-like)
  const primaryLight = new THREE.DirectionalLight(0xffffee, 1.0); // Slightly warm white, increased intensity
  primaryLight.position.set(5, 15, 10); // Higher position for better top-down lighting
  primaryLight.castShadow = true; // Enable shadows for depth
  scene.add(primaryLight);
  console.log("Primary directional light added with position:", primaryLight.position);

  // Add secondary fill light to reduce harsh shadows
  const secondaryLight = new THREE.DirectionalLight(0xaaccff, 0.4); // Slightly blue for contrast
  secondaryLight.position.set(-10, 10, -5); // Coming from opposite direction
  scene.add(secondaryLight);
  console.log("Secondary directional light added for fill lighting");

  // Add subtle hemisphere light for realistic environmental lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5); // Sky/ground colors
  scene.add(hemisphereLight);
  console.log("Hemisphere light added for environmental lighting");

  // Set up hex grid renderer with biome distribution from game config
  hexGridRenderer = new HexGridRenderer({
    gridRadius: 7,
    hexRadius: 1,
    hexHeight: 0.2,
    scene: scene,
    biomeDistribution: {
      plains: 0.1,
      forest: 0.1,
      mountains: 0.1,
      desert: 0.1,
      water: 0.1,
      fire: 0.05,
      earth: 0.05,
      air: 0.05,
      light: 0.05,
      shadow: 0.05,
      metal: 0.05,
      spirit: 0.05
    }
  });

  // Load textures and create grid when textures are ready
  debugLog("Loading biome textures...");
  hexGridRenderer.loadTextures().then(success => {
    if (success) {
      debugLog("Textures loaded successfully, generating grid...");
      hexGridRenderer.createGrid();
      hexagons = hexGridRenderer.getHexagons();
      texturesLoaded = true;

      // Hide loading screen once the grid is ready
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.classList.add("hidden");
        debugLog("Loading screen hidden");
      }

      // Additional debug info
      debugLog(`Grid generation complete: ${hexagons.length} hexagons created with biome textures`);
    } else {
      console.error("Failed to load all textures, grid may not render correctly");
    }
  }).catch(error => {
    console.error("Error during texture loading:", error);
  });

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

      // Update hexagon animations if grid is loaded
      if (texturesLoaded && hexGridRenderer) {
        hexGridRenderer.update(currentTime);
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

  // Initialize the game when the page is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Beast Tactics...');

    // Start the game (assuming 'Game' is defined elsewhere)
    const game = new Game(); //This line needs to be adapted to your actual game initialization
    game.init();

    // Import system check diagnostic
    import { createSystemCheckUI } from '../tools/diagnostics/SystemCheck.js';
    
    // Add debug keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Press 'B' to toggle biome distribution panel
      if (e.key === 'b' && e.ctrlKey) {
        console.log('Toggling biome distribution debug panel');

        // Check if panel exists
        let panel = document.getElementById('biome-debug-panel');

        if (panel) {
          // Remove existing panel
          panel.remove();
        } else {
          // Create new panel if game is initialized
          if (game.gridRenderer) {
            createBiomeDistributionUI(game.gridRenderer);
          } else {
            console.error('Grid renderer not initialized yet');
          }
        }
      }
      
      // Press 'S' to toggle system check panel
      if (e.key === 's' && e.ctrlKey) {
        console.log('Toggling system check panel');
        
        // Check if panel exists
        let panel = document.getElementById('system-check-panel');
        
        if (panel) {
          // Remove existing panel
          panel.remove();
        } else {
          // Create new panel
          if (gameManager) {
            createSystemCheckUI(gameManager);
          } else {
            console.error('Game manager not initialized yet');
          }
        }
      }
    });
  });

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