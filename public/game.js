
// Import Three.js from CDN
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Logging setup
console.log("Beast Tactics script loaded and starting...");

// Global error handler for debugging
window.addEventListener('error', (event) => {
  console.error("Global error caught:", {
    message: event.message,
    source: event.filename,
    lineNo: event.lineno,
    colNo: event.colno,
    error: event.error
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
  debugLog("Scene created with dark background");
  
  // Camera setup with logging of parameters
  const cameraParams = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000
  };
  debugLog("Creating camera with parameters:", cameraParams);
  
  const camera = new THREE.PerspectiveCamera(
    cameraParams.fov,
    cameraParams.aspect,
    cameraParams.near,
    cameraParams.far
  );
  
  // Renderer setup with anti-aliasing
  debugLog("Creating WebGL renderer...");
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  debugLog("Renderer configured with size:", { 
    width: window.innerWidth, 
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio
  });
  
  // Add canvas to document
  document.body.appendChild(renderer.domElement);
  debugLog("Renderer canvas added to document");
  
  // Add lights to scene
  debugLog("Setting up lighting...");
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);
  debugLog("Lighting setup complete: ambient and directional lights added");
  
  // Hexagonal grid setup
  const hexRadius = 1;
  const hexHeight = 0.2;
  debugLog("Creating hexagonal grid with radius:", hexRadius);
  
  const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, hexHeight, 6);
  
  // Define color palette for hexagons
  const colorPalette = [
    0xFF5733, // Vibrant orange
    0xC70039, // Crimson
    0x900C3F, // Dark pink
    0x581845, // Dark purple
    0xFFC300, // Bright yellow
    0x2ECC71, // Green
    0x3498DB  // Blue
  ];
  debugLog("Color palette defined with", colorPalette.length, "colors");
  
  // Create materials with different colors
  const hexMaterials = colorPalette.map(color => 
    new THREE.MeshPhongMaterial({ 
      color: color,
      shininess: 30,
      specular: 0x222222
    })
  );
  
  // Add side material (edges of hexagons)
  const edgeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    shininess: 10
  });
  
  // Function to create individual hexagons
  function createHex(q, r) {
    // Pick a random material from our palette
    const materialIndex = Math.floor(Math.random() * hexMaterials.length);
    const hexMaterial = hexMaterials[materialIndex];
    
    // Create multi-material for top/bottom and side
    const materials = [
      edgeMaterial,  // Side
      hexMaterial,   // Top
      hexMaterial    // Bottom
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
    debugLog(`Hex rotation set to Y: ${hex.rotation.y} radians (${hex.rotation.y * 180 / Math.PI} degrees)`);
    
    // Add to scene
    scene.add(hex);
    
    return hex;
  }
  
  debugLog("Starting to generate hexagon grid...");
  const hexagons = [];
  let hexCount = 0;
  
  // Generate grid (radius 4)
  for (let q = -4; q <= 4; q++) {
    for (let r = Math.max(-4, -q - 4); r <= Math.min(4, -q + 4); r++) {
      const hex = createHex(q, r);
      hexagons.push(hex);
      hexCount++;
      
      // Log progress every 10 hexagons
      if (hexCount % 10 === 0) {
        debugLog(`Created ${hexCount} hexagons so far...`);
      }
    }
  }
  
  debugLog(`Grid generation complete: ${hexagons.length} hexagons created`);
  
  // Position camera to view the entire grid
  camera.position.set(0, 15, 15);
  camera.lookAt(0, 0, 0);
  debugLog("Camera positioned at:", camera.position);
  
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
        stack: error.stack
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
      height: window.innerHeight 
    });
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    debugLog("Renderer and camera updated for new dimensions");
  });
  
  // Add debug info overlay
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '10px';
  debugInfo.style.right = '10px';
  debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugInfo.style.color = 'white';
  debugInfo.style.padding = '10px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.zIndex = '1000';
  debugInfo.textContent = 'Beast Tactics: Rendering active';
  document.body.appendChild(debugInfo);
  
  // Hide loading screen
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    debugLog("Loading screen hidden");
  }
  
  debugLog("Three.js setup complete - game should be visible now");

} catch (error) {
  console.error("CRITICAL ERROR:", error);
  console.debug("Error details:", {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  
  // Display error on page
  const errorElement = document.createElement('div');
  errorElement.style.position = 'absolute';
  errorElement.style.top = '50%';
  errorElement.style.left = '50%';
  errorElement.style.transform = 'translate(-50%, -50%)';
  errorElement.style.color = 'red';
  errorElement.style.background = 'black';
  errorElement.style.padding = '20px';
  errorElement.style.borderRadius = '5px';
  errorElement.style.maxWidth = '80%';
  errorElement.innerHTML = `
    <h2>Rendering Error</h2>
    <p>${error.message}</p>
    <pre>${error.stack}</pre>
    <button onclick="location.reload()">Reload Page</button>
  `;
  document.body.appendChild(errorElement);
}
