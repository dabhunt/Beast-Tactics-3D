import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
// Import Discord SDK from CDN
import { DiscordSDK } from "https://cdn.jsdelivr.net/npm/@discord/embedded-app-sdk@1.2.0/dist/discord-embedded-app-sdk.min.js";

console.log("Starting Beast Tactics game initialization...");

// Discord SDK initialization function
async function initDiscord() {
  try {
    console.log("Initializing Discord SDK...");
    const CLIENT_ID = "YOUR_CLIENT_ID"; // Replace with your actual Discord client ID
    
    const discordSdk = new DiscordSDK(CLIENT_ID);
    console.log("Discord SDK instance created");
    
    // Authorize with Discord - required before using the SDK
    await discordSdk.ready();
    console.log("Discord SDK ready");
    
    // Get authentication token if needed
    const token = await discordSdk.commands.authenticate();
    console.log("Discord authentication successful:", { tokenReceived: !!token });
    
    return discordSdk;
  } catch (error) {
    console.error("Discord SDK initialization failed:", error);
    console.debug("Error details:", { 
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    // Continue with the game even if Discord integration fails
    return null;
  }
}

// Initialize Discord SDK and then proceed with game setup
initDiscord().then(sdk => {
  console.log("Discord initialization complete, SDK available:", !!sdk);
  
  // THREE.js setup with detailed logging
  console.log("Setting up THREE.js scene and camera...");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222); // Dark background for contrast

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  console.log("Camera created with aspect ratio:", window.innerWidth / window.innerHeight);

  try {
    // Create WebGL renderer with anti-aliasing
    console.log("Creating WebGL renderer...");
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log("Renderer created with size:", { 
      width: window.innerWidth, 
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio
    });

    // Add canvas to document
    document.body.appendChild(renderer.domElement);
    console.log("Renderer canvas added to document body");

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light for shadows and depth
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);
    console.log("Lighting setup complete");

    // Hexagonal grid with vibrant colors
    const hexRadius = 1;
    const hexHeight = 0.2;
    console.log("Creating hexagon geometry with radius:", hexRadius);
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

      // Rotate to lay flat
      hex.rotation.x = Math.PI / 2;

      // Add to scene
      scene.add(hex);

      return hex;
    }

    console.log("Starting to generate hexagon grid...");
    const hexagons = [];
    // Generate grid (radius 4)
    for (let q = -4; q <= 4; q++) {
      for (let r = Math.max(-4, -q - 4); r <= Math.min(4, -q + 4); r++) {
        const hex = createHex(q, r);
        hexagons.push(hex);
      }
    }
    console.log(`Created ${hexagons.length} hexagons in the grid`);

    // Position camera to view the entire grid
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);
    console.log("Camera positioned at:", camera.position);

    // Animation loop with performance tracking
    let frameCount = 0;
    let lastTime = performance.now();

    function animate() {
      const currentTime = performance.now();
      frameCount++;

      // Log FPS every 100 frames
      if (frameCount % 100 === 0) {
        const elapsed = currentTime - lastTime;
        const fps = Math.round((100 * 1000) / elapsed);
        console.log(`Rendering at ${fps} FPS`);
        lastTime = currentTime;
      }

      // Optional: Add some movement to make it clear rendering is working
      hexagons.forEach((hex, index) => {
        // Make hexagons gently bob up and down
        if (index % 3 === 0) {
          hex.position.y = Math.sin(currentTime * 0.001 + index * 0.1) * 0.2;
        }
      });

      // Render the scene
      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.error("Render error:", error);
      }

      // Request next frame
      requestAnimationFrame(animate);
    }

    console.log("Starting animation loop...");
    animate();

    // Resize handler with logging
    window.addEventListener("resize", () => {
      console.log("Window resized to:", { 
        width: window.innerWidth, 
        height: window.innerHeight 
      });

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      console.log("Renderer and camera updated for new dimensions");
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
      console.log("Loading screen hidden");
    }

    console.log("Setup complete - game should be visible now");
  } catch (error) {
    console.error("Critical error during scene setup:", error);
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
    errorElement.innerHTML = `<h2>Rendering Error</h2><p>${error.message}</p>`;
    document.body.appendChild(errorElement);
  }
}).catch(error => {
  console.error("Failed to initialize game:", error);
  // Display a user-friendly error message on the page
  const errorElement = document.createElement('div');
  errorElement.style.position = 'absolute';
  errorElement.style.top = '10px';
  errorElement.style.left = '10px';
  errorElement.style.color = 'red';
  errorElement.style.background = 'rgba(0,0,0,0.7)';
  errorElement.style.padding = '10px';
  errorElement.style.borderRadius = '5px';
  errorElement.textContent = 'Failed to initialize game. Please check console for details.';
  document.body.appendChild(errorElement);
});