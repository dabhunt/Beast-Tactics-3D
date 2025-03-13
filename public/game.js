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
  
  // Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Hexagonal grid (simplified)
const hexRadius = 1;
const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.2, 6);
const hexMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

function createHex(q, r) {
  const hex = new THREE.Mesh(hexGeometry, hexMaterial);
  const x = hexRadius * 1.5 * q;
  const z = hexRadius * Math.sqrt(3) * (r + q / 2);
  hex.position.set(x, 0, z);
  scene.add(hex);
}

// Generate grid (radius 4)
for (let q = -4; q <= 4; q++) {
  for (let r = Math.max(-4, -q - 4); r <= Math.min(4, -q + 4); r++) {
    createHex(q, r);
  }
}

camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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
