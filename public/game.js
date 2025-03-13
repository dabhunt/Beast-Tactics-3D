
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
