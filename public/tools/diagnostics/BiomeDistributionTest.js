
/**
 * BiomeDistributionTest.js
 * A diagnostic tool to check the availability of biome tile assets
 * and preview the element distribution logic for the map.
 * Also demos crystal shard spawning on biome hexagons.
 */

console.log('[BIOME-TEST] Starting Biome Distribution Test with Crystal Shard spawning...');

/**
 * Configuration parameters
 */
const CONFIG = {
  // Base game parameters
  hexRadius: 1,          // Size of each hexagon
  hexHeight: 0.2,        // Height of each hexagon
  gridRadius: 7,         // Radius of the entire map
  
  // Crystal shard parameters
  crystalSpawnChance: 0.2,  // 20% chance to spawn a crystal per hex
  crystalHeightOffset: 0.3, // Height above the hexagon
  crystalScaleFactor: 0.3,  // Size of the crystal (scale)
  crystalModelPath: '/assets/Purple_Crystal_Shard.fbx',
  crystalTexturePath: '/assets/Purple_Crystal_Shard_texture.png'
};

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
  
  // Create a test image element to verify if the asset exists
  const img = new Image();
  img.onload = () => {
    console.log(`✅ Successfully loaded ${element} texture: ${elemUrls[element]}`);
  };
  img.onerror = () => {
    console.error(`❌ Failed to load ${element} texture: ${elemUrls[element]}`);
  };
  img.src = elemUrls[element];
});

// Log the full URL map for reference
console.log('[BIOME-TEST] Element URL mapping:', elemUrls);

// Test the distribution logic we'll use for the map
console.log('\n[BIOME-TEST] Testing element distribution logic:');
function getRandomElement() {
  const randomIndex = Math.floor(Math.random() * elementTypes.length);
  return elementTypes[randomIndex];
}

// Generate a sample distribution
const sampleSize = 100;
const distribution = {};
elementTypes.forEach(element => { distribution[element] = 0; });

for (let i = 0; i < sampleSize; i++) {
  const element = getRandomElement();
  distribution[element]++;
}

console.log(`[BIOME-TEST] Random distribution of ${sampleSize} hexagons:`);
console.table(distribution);

// Calculate percentage distribution
console.log('[BIOME-TEST] Percentage distribution:');
Object.entries(distribution).forEach(([element, count]) => {
  const percentage = (count / sampleSize * 100).toFixed(1);
  console.log(`${element}: ${percentage}%`);
});

// Also test crystal shard distribution
const crystalTests = 100;
let crystalSpawns = 0;

for (let i = 0; i < crystalTests; i++) {
  if (Math.random() < CONFIG.crystalSpawnChance) {
    crystalSpawns++;
  }
}

console.log(`[BIOME-TEST] Crystal shard spawn test (${CONFIG.crystalSpawnChance * 100}% chance): ${crystalSpawns}/${crystalTests} spawned (${(crystalSpawns/crystalTests*100).toFixed(1)}%)`);

/**
 * Create Three.js scene to visualize biome distribution with crystal shards
 */
function createBiomeVisualization() {
  console.log('[BIOME-VIZ] Creating 3D visualization of biome distribution with crystal shards...');
  
  try {
    // Check if we have THREE.js available
    if (typeof THREE === 'undefined') {
      console.error('[BIOME-VIZ] THREE.js not loaded. Cannot create visualization');
      return;
    }
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111926); // Dark blue background
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    console.log('[BIOME-VIZ] Renderer configured with size:', {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio
    });
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 10);
    camera.lookAt(0, 0, 0);
    
    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xfff0d0, 1.2);
    directionalLight.position.set(5, 15, 5);
    scene.add(directionalLight);
    
    // Hexagon geometry
    const hexGeometry = new THREE.CylinderGeometry(
      CONFIG.hexRadius,
      CONFIG.hexRadius,
      CONFIG.hexHeight,
      6
    );
    
    // Crystal tracking for statistics
    const crystalStats = {
      total: 0,
      spawned: 0,
      loadSuccess: false,
      loadError: null
    };
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Create material map for each element type
    const hexMaterials = {};
    const edgeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 10 });
    
    // Default fallback materials if textures fail to load
    const fallbackMaterials = elementTypes.map(element => {
      // Use the color from GeneratePlaceholderTiles.js
      const elementColors = {
        'Combat': 0xff5733,
        'Corrosion': 0x7cfc00,
        'Dark': 0x581845,
        'Earth': 0x964b00,
        'Electric': 0xffff00,
        'Fire': 0xff4500,
        'Light': 0xffffff,
        'Metal': 0xc0c0c0,
        'Plant': 0x2ecc71,
        'Spirit': 0xd8bfd8,
        'Water': 0x3498db,
        'Wind': 0xc6e2ff
      };
      return new THREE.MeshPhongMaterial({ 
        color: elementColors[element] || 0xff5733, 
        shininess: 50, 
        specular: 0x555555 
      });
    });
    
    // Load crystal model and texture
    let crystalModel = null;
    const crystalTexture = new THREE.TextureLoader().load(
      CONFIG.crystalTexturePath,
      // onLoad callback
      texture => {
        console.log(`[BIOME-VIZ] ✅ Successfully loaded crystal texture: ${CONFIG.crystalTexturePath}`);
        
        // Load the model after texture is loaded
        const fbxLoader = new THREE.FBXLoader();
        console.log(`[BIOME-VIZ] Loading crystal model: ${CONFIG.crystalModelPath}`);
        
        fbxLoader.load(
          CONFIG.crystalModelPath,
          // onLoad callback
          (model) => {
            console.log('[BIOME-VIZ] ✅ Crystal model loaded successfully', {
              childCount: model.children.length,
              animations: model.animations?.length || 0
            });
            
            // Apply texture to model
            model.traverse(child => {
              if (child.isMesh) {
                console.log('[BIOME-VIZ] Applying crystal texture to model mesh');
                child.material = new THREE.MeshPhongMaterial({
                  map: texture,
                  shininess: 80,
                  specular: 0x888888,
                  transparent: true,
                });
              }
            });
            
            // Scale down model
            model.scale.set(
              CONFIG.crystalScaleFactor,
              CONFIG.crystalScaleFactor,
              CONFIG.crystalScaleFactor
            );
            
            // Store reference to use when creating hexagons
            crystalModel = model;
            crystalStats.loadSuccess = true;
            
            // If the grid was already generated, add crystals now
            if (hexagons.length > 0) {
              addCrystalsToExistingHexagons();
            }
          },
          // onProgress callback
          (xhr) => {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(`[BIOME-VIZ] Crystal model loading: ${Math.round(percentComplete)}% complete`);
          },
          // onError callback
          (error) => {
            console.error('[BIOME-VIZ] ❌ Error loading crystal model:', error);
            crystalStats.loadError = error;
          }
        );
      },
      // onProgress callback
      undefined,
      // onError callback
      (error) => {
        console.error(`[BIOME-VIZ] ❌ Failed to load crystal texture: ${CONFIG.crystalTexturePath}`, error);
        crystalStats.loadError = error;
      }
    );
    
    // Track all created hexagons
    const hexagons = [];
    let hexCount = 0;
    
    // Function to create individual hexagons
    function createHex(q, r, horizontalSpacing = 1.5, verticalFactor = 1.0) {
      // Assign element type - random selection
      const elementType = getRandomElement();
      
      // Get appropriate material based on element type
      const hexMaterial = hexMaterials[elementType] || fallbackMaterials[elementTypes.indexOf(elementType)];
      
      // Create multi-material for top/bottom and side
      const materials = [
        edgeMaterial, // Side
        hexMaterial,  // Top
        hexMaterial   // Bottom
      ];
      
      // Create mesh with geometry and materials
      const hex = new THREE.Mesh(hexGeometry, materials);
      
      // Store element data for game logic
      hex.userData.element = elementType;
      hex.userData.q = q;
      hex.userData.r = r;
      hex.name = `Hex_${q}_${r}_${elementType}`;
      
      // Position hexagon in grid
      const x = CONFIG.hexRadius * horizontalSpacing * q;
      const z = CONFIG.hexRadius * Math.sqrt(3) * verticalFactor * (r + q / 2);
      hex.position.set(x, 0, z);
      
      // In THREE.js, cylinders stand upright along Y axis by default
      // Rotate 30 degrees around the Y axis for proper grid alignment
      hex.rotation.y = Math.PI / 6; // 30 degrees rotation
      
      // Add to scene
      scene.add(hex);
      
      // Try to spawn a crystal on this hexagon
      crystalStats.total++;
      if (Math.random() < CONFIG.crystalSpawnChance) {
        crystalStats.spawned++;
        hex.userData.hasCrystal = true;
        
        // If crystal model is loaded, create and add crystal now
        if (crystalModel) {
          addCrystalToHex(hex);
        }
      }
      
      return hex;
    }
    
    // Function to add a crystal to a hexagon
    function addCrystalToHex(hex) {
      try {
        // Check that we have the model
        if (!crystalModel) {
          console.warn('[BIOME-VIZ] Cannot add crystal yet - model not loaded');
          return;
        }
        
        // Clone the crystal model
        const crystal = crystalModel.clone();
        
        // Position crystal slightly above the hexagon
        crystal.position.set(
          0, // Relative to the hex
          CONFIG.hexHeight/2 + CONFIG.crystalHeightOffset, // Slightly above hexagon
          0  // Relative to the hex
        );
        
        // Add some random rotation for variety
        crystal.rotation.y = Math.random() * Math.PI * 2;
        
        // Add crystal as child of hex so it moves with it
        hex.add(crystal);
        
        // Add reference to userData for later access
        hex.userData.crystal = crystal;
        
        console.log(`[BIOME-VIZ] Added crystal to hex ${hex.name} at position`, {
          hexPosition: [hex.position.x.toFixed(2), hex.position.y.toFixed(2), hex.position.z.toFixed(2)],
          crystalOffset: [crystal.position.x.toFixed(2), crystal.position.y.toFixed(2), crystal.position.z.toFixed(2)],
          rotation: crystal.rotation.y.toFixed(2)
        });
        
        return crystal;
      } catch (err) {
        console.error('[BIOME-VIZ] Error adding crystal to hex:', err);
        return null;
      }
    }
    
    // Function to add crystals to any existing hexagons marked for crystal spawning
    function addCrystalsToExistingHexagons() {
      console.log('[BIOME-VIZ] Adding crystals to existing hexagons...');
      let addedCount = 0;
      
      hexagons.forEach(hex => {
        if (hex.userData.hasCrystal && !hex.userData.crystal) {
          addCrystalToHex(hex);
          addedCount++;
        }
      });
      
      console.log(`[BIOME-VIZ] Added crystals to ${addedCount} existing hexagons`);
    }
    
    // Function to generate the entire grid
    function generateHexagonGrid(horizontalSpacing = 1.5, verticalFactor = 1.0) {
      console.log(`[BIOME-VIZ] Generating hex grid with radius ${CONFIG.gridRadius}, spacing: h=${horizontalSpacing}, v=${verticalFactor}`);
      
      // Track element distribution for debugging
      const elementDistribution = {};
      elementTypes.forEach((element) => {
        elementDistribution[element] = 0;
      });
      
      // Clear any existing hexagons if we're regenerating
      if (hexagons.length > 0) {
        console.log("[BIOME-VIZ] Clearing existing hexagons before regeneration");
        hexagons.forEach((hex) => {
          scene.remove(hex);
        });
        hexagons.length = 0;
        hexCount = 0;
      }
      
      // Reset crystal statistics
      crystalStats.total = 0;
      crystalStats.spawned = 0;
      
      // Generate hexagons in axial coordinates
      for (let q = -CONFIG.gridRadius; q <= CONFIG.gridRadius; q++) {
        for (
          let r = Math.max(-CONFIG.gridRadius, -q - CONFIG.gridRadius);
          r <= Math.min(CONFIG.gridRadius, -q + CONFIG.gridRadius);
          r++
        ) {
          const hex = createHex(q, r, horizontalSpacing, verticalFactor);
          hexagons.push(hex);
          hexCount++;
          
          // Track element distribution
          if (hex.userData.element) {
            elementDistribution[hex.userData.element]++;
          }
          
          // Log progress periodically
          if (hexCount % 20 === 0) {
            console.log(`[BIOME-VIZ] Created ${hexCount} hexagons so far...`);
          }
        }
      }
      
      console.log(`[BIOME-VIZ] Grid generation complete: ${hexagons.length} hexagons created`);
      console.log("[BIOME-VIZ] Element distribution:", elementDistribution);
      console.log("[BIOME-VIZ] Crystal statistics:", {
        total: crystalStats.total,
        spawned: crystalStats.spawned,
        percentage: ((crystalStats.spawned / crystalStats.total) * 100).toFixed(1) + '%',
        modelLoaded: crystalStats.loadSuccess
      });
    }
    
    // Make function available globally
    window.generateBiomeGridWithCrystals = generateHexagonGrid;
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Update controls
      controls.update();
      
      // Render the scene
      renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Add status display
    const statusDisplay = document.createElement('div');
    statusDisplay.style.position = 'absolute';
    statusDisplay.style.top = '10px';
    statusDisplay.style.left = '10px';
    statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    statusDisplay.style.color = 'white';
    statusDisplay.style.padding = '10px';
    statusDisplay.style.fontFamily = 'monospace';
    statusDisplay.style.borderRadius = '5px';
    statusDisplay.innerHTML = `
      <h3>Biome Distribution Test</h3>
      <div>Hexagons: <span id="hex-count">0</span></div>
      <div>Crystals: <span id="crystal-count">0</span> (<span id="crystal-percentage">0%</span>)</div>
      <div>Crystal Model: <span id="crystal-model-status">Loading...</span></div>
      <div>
        <button id="regenerate-btn" style="margin-top: 10px; padding: 5px 10px;">Regenerate Map</button>
      </div>
    `;
    document.body.appendChild(statusDisplay);
    
    // Update status display periodically
    function updateStatusDisplay() {
      document.getElementById('hex-count').textContent = hexCount;
      document.getElementById('crystal-count').textContent = crystalStats.spawned;
      document.getElementById('crystal-percentage').textContent = 
        ((crystalStats.spawned / Math.max(1, crystalStats.total)) * 100).toFixed(1) + '%';
      
      const modelStatus = document.getElementById('crystal-model-status');
      if (crystalStats.loadSuccess) {
        modelStatus.textContent = 'Loaded ✅';
        modelStatus.style.color = '#8f8';
      } else if (crystalStats.loadError) {
        modelStatus.textContent = 'Error ❌';
        modelStatus.style.color = '#f88';
      } else {
        modelStatus.textContent = 'Loading...';
        modelStatus.style.color = '#ff8';
      }
    }
    
    // Update status every second
    setInterval(updateStatusDisplay, 1000);
    
    // Add regenerate button handler
    document.getElementById('regenerate-btn').addEventListener('click', () => {
      generateHexagonGrid(1.5, 1.0);
    });
    
    // Start everything
    generateHexagonGrid();
    animate();
    
    console.log('[BIOME-VIZ] Visualization setup complete');
  } catch (error) {
    console.error('[BIOME-VIZ] Error setting up visualization:', error);
  }
}

// Check if THREE.js is available or needs to be loaded
if (typeof THREE === 'undefined') {
  console.log('[BIOME-TEST] THREE.js not detected, loading from CDN...');
  
  // Load THREE.js and other required dependencies sequentially
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  // Chain the scripts loading in correct order
  loadScript('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js')
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/js/controls/OrbitControls.js'))
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/js/loaders/FBXLoader.js'))
    .then(() => {
      console.log('[BIOME-TEST] All THREE.js dependencies loaded successfully');
      createBiomeVisualization();
    })
    .catch(error => {
      console.error('[BIOME-TEST] Error loading THREE.js dependencies:', error);
    });
} else {
  console.log('[BIOME-TEST] THREE.js already available, starting visualization');
  createBiomeVisualization();
}
