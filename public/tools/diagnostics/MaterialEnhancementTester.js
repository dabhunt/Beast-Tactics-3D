
/**
 * MaterialEnhancementTester - A diagnostic tool to test and visualize 
 * different material settings to improve color vibrancy
 */

const MaterialEnhancementTester = {
  isActive: false,
  testHexes: [],
  controls: null,
  elementTypes: [
    'Combat', 'Corrosion', 'Dark', 'Earth', 'Electric', 'Fire',
    'Light', 'Metal', 'Plant', 'Spirit', 'Water', 'Wind'
  ],
  
  // Material configuration options to test
  config: {
    shininess: 60,
    emissiveIntensity: 0.2,
    specularColor: 0x555555,
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0
  },
  
  // Possible sources of color muting to test
  potentialSources: [
    "Lighting intensity and color temperature",
    "Material emissive properties not strong enough",
    "Default material properties causing overshadowing",
    "Texture color saturation levels",
    "Ambient light insufficient to show texture colors",
    "Specular highlights overpowering texture colors",
    "Background color creating color contrast issues"
  ],
  
  start: function() {
    console.log("[MATERIAL TESTER] Starting material enhancement tester...");
    console.log("[MATERIAL TESTER] Analyzing potential sources of color muting:");
    
    // Log potential sources of the problem
    this.potentialSources.forEach((source, index) => {
      console.log(`[MATERIAL TESTER] Source ${index+1}: ${source}`);
    });
    
    console.log("[MATERIAL TESTER] Most likely sources:");
    console.log("[MATERIAL TESTER] 1. Emissive properties need adjustment for better color representation");
    console.log("[MATERIAL TESTER] 2. Lighting setup might need warmer color temperature or higher intensity");
    
    if (this.isActive) {
      console.warn("[MATERIAL TESTER] Already running!");
      return;
    }
    
    this.isActive = true;
    this.createControls();
    this.createTestRow();
  },
  
  createControls: function() {
    // Create UI panel for adjustments
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.left = '10px';
    panel.style.top = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    panel.style.padding = '15px';
    panel.style.borderRadius = '5px';
    panel.style.color = 'white';
    panel.style.fontFamily = 'monospace';
    panel.style.zIndex = '1000';
    panel.innerHTML = `
      <h3>Material Enhancement Tester</h3>
      
      <div>
        <label>Emissive Intensity: <span id="emissive-value">0.2</span></label>
        <input type="range" id="emissive-slider" min="0" max="1" step="0.05" value="0.2">
      </div>
      
      <div>
        <label>Shininess: <span id="shininess-value">60</span></label>
        <input type="range" id="shininess-slider" min="0" max="100" step="5" value="60">
      </div>
      
      <div>
        <label>Ambient Light: <span id="ambient-value">0.7</span></label>
        <input type="range" id="ambient-slider" min="0.2" max="1.5" step="0.1" value="0.7">
      </div>
      
      <div>
        <label>Directional Light: <span id="dir-value">1.0</span></label>
        <input type="range" id="dir-slider" min="0.5" max="2" step="0.1" value="1.0">
      </div>
      
      <div>
        <label>Background Darkness: <span id="bg-value">0.1</span></label>
        <input type="range" id="bg-slider" min="0.05" max="0.3" step="0.01" value="0.1">
      </div>
      
      <button id="apply-all">Apply To All Tiles</button>
      <div id="status">Ready</div>
    `;
    
    document.body.appendChild(panel);
    this.controls = panel;
    
    // Add event listeners
    this.setupEventListeners();
  },
  
  setupEventListeners: function() {
    if (!this.controls) return;
    
    const emissiveSlider = document.getElementById('emissive-slider');
    const shininessSlider = document.getElementById('shininess-slider');
    const ambientSlider = document.getElementById('ambient-slider');
    const dirSlider = document.getElementById('dir-slider');
    const bgSlider = document.getElementById('bg-slider');
    const applyButton = document.getElementById('apply-all');
    
    if (emissiveSlider) {
      emissiveSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('emissive-value').textContent = value.toFixed(2);
        this.config.emissiveIntensity = value;
        this.updateTestMaterials();
      });
    }
    
    if (shininessSlider) {
      shininessSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('shininess-value').textContent = value;
        this.config.shininess = value;
        this.updateTestMaterials();
      });
    }
    
    if (ambientSlider) {
      ambientSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('ambient-value').textContent = value.toFixed(1);
        this.updateLighting('ambient', value);
      });
    }
    
    if (dirSlider) {
      dirSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('dir-value').textContent = value.toFixed(1);
        this.updateLighting('directional', value);
      });
    }
    
    if (bgSlider) {
      bgSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('bg-value').textContent = value.toFixed(2);
        this.updateBackground(value);
      });
    }
    
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.applyToAllHexagons();
      });
    }
  },
  
  createTestRow: function() {
    // Get access to scene and other globals
    const scene = window.scene;
    const hexGeometry = window.hexGeometry;
    const textureLoader = window.textureLoader;
    
    if (!scene || !hexGeometry) {
      console.error("[MATERIAL TESTER] Cannot access scene or geometry");
      return;
    }
    
    // Clear previous test hexes
    this.testHexes.forEach(hex => {
      scene.remove(hex);
    });
    this.testHexes = [];
    
    // Create a row of test hexagons, one for each element type
    const spacing = 2.5;
    let startX = -(this.elementTypes.length * spacing) / 2;
    
    this.elementTypes.forEach((element, index) => {
      // Create new enhanced material for testing
      const texture = window.textureLoadingTracker?.textures[element];
      
      if (!texture) {
        console.warn(`[MATERIAL TESTER] No texture for ${element}`);
        return;
      }
      
      // Create enhanced material
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: this.config.shininess,
        specular: new THREE.Color(this.config.specularColor),
        emissive: new THREE.Color(0x222222),
        emissiveIntensity: this.config.emissiveIntensity,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      // Create edge material
      const edgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 10,
      });
      
      // Create hex with materials
      const materials = [
        edgeMaterial,
        material,
        material,
      ];
      
      const hex = new THREE.Mesh(hexGeometry, materials);
      hex.position.set(startX + index * spacing, 5, -10);
      hex.rotation.y = Math.PI / 6;
      
      // Label to identify element type
      this.addLabel(hex, element);
      
      // Add to scene and track
      scene.add(hex);
      this.testHexes.push(hex);
      
      console.log(`[MATERIAL TESTER] Created test hex for ${element} at position:`, hex.position);
    });
    
    // Add a header label above the test row
    const headerGeometry = new THREE.PlaneGeometry(20, 1);
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = 512;
    headerCanvas.height = 64;
    const ctx = headerCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MATERIAL TEST ROW - ADJUSTABLE SETTINGS', 256, 32);
    
    const headerTexture = new THREE.CanvasTexture(headerCanvas);
    const headerMaterial = new THREE.MeshBasicMaterial({
      map: headerTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const headerMesh = new THREE.Mesh(headerGeometry, headerMaterial);
    headerMesh.position.set(0, 8, -10);
    scene.add(headerMesh);
    this.testHexes.push(headerMesh);
    
    document.getElementById('status').textContent = 'Test hexagons created';
  },
  
  addLabel: function(hex, text) {
    // Create a canvas for the label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 16);
    
    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create a mesh for the label
    const geometry = new THREE.PlaneGeometry(2, 0.5);
    const label = new THREE.Mesh(geometry, material);
    label.position.y = 1;
    
    // Add the label to the hex
    hex.add(label);
    
    // Make label always face camera
    label.userData.isLabel = true;
    
    return label;
  },
  
  updateTestMaterials: function() {
    this.testHexes.forEach(hex => {
      if (hex.material && Array.isArray(hex.material)) {
        // Update the top/bottom materials (indices 1 and 2)
        [1, 2].forEach(idx => {
          if (hex.material[idx] && !hex.material[idx].userData?.isLabel) {
            hex.material[idx].shininess = this.config.shininess;
            hex.material[idx].emissiveIntensity = this.config.emissiveIntensity;
            hex.material[idx].needsUpdate = true;
          }
        });
      }
    });
    
    console.log('[MATERIAL TESTER] Updated test materials with config:', {
      shininess: this.config.shininess,
      emissiveIntensity: this.config.emissiveIntensity
    });
    
    document.getElementById('status').textContent = 'Materials updated';
  },
  
  updateLighting: function(type, value) {
    const scene = window.scene;
    if (!scene) return;
    
    if (type === 'ambient') {
      scene.children.forEach(child => {
        if (child.type === 'AmbientLight') {
          child.intensity = value;
          console.log('[MATERIAL TESTER] Updated ambient light intensity:', value);
        }
      });
    } else if (type === 'directional') {
      scene.children.forEach(child => {
        if (child.type === 'DirectionalLight') {
          // Only update the main directional light
          if (child.intensity >= 0.9) {
            child.intensity = value;
            console.log('[MATERIAL TESTER] Updated directional light intensity:', value);
          }
        }
      });
    }
    
    document.getElementById('status').textContent = `${type} light updated`;
  },
  
  updateBackground: function(value) {
    const scene = window.scene;
    if (!scene || !scene.background) return;
    
    // Convert value to darker/lighter background
    const colorValue = Math.round(value * 255);
    const bgColor = new THREE.Color(
      colorValue / 255, 
      colorValue / 255 * 1.1, // Slightly blue tint
      colorValue / 255 * 1.5  // Stronger blue tint
    );
    
    scene.background = bgColor;
    console.log('[MATERIAL TESTER] Updated background color:', {
      r: bgColor.r.toFixed(2),
      g: bgColor.g.toFixed(2),
      b: bgColor.b.toFixed(2)
    });
    
    document.getElementById('status').textContent = 'Background updated';
  },
  
  applyToAllHexagons: function() {
    const hexagons = window.hexagons;
    if (!hexagons || !hexagons.length) {
      console.warn('[MATERIAL TESTER] No hexagons found in the scene');
      return;
    }
    
    let updateCount = 0;
    
    hexagons.forEach(hex => {
      if (hex.material && Array.isArray(hex.material)) {
        // Update top and bottom materials (indices 1 and 2)
        [1, 2].forEach(idx => {
          if (hex.material[idx]) {
            hex.material[idx].shininess = this.config.shininess;
            hex.material[idx].emissiveIntensity = this.config.emissiveIntensity;
            hex.material[idx].needsUpdate = true;
            updateCount++;
          }
        });
      }
    });
    
    console.log(`[MATERIAL TESTER] Applied material settings to ${updateCount} materials on main map`);
    document.getElementById('status').textContent = `Applied to ${hexagons.length} hexagons`;
  },
  
  stop: function() {
    if (!this.isActive) return;
    
    // Remove test hexes
    this.testHexes.forEach(hex => {
      if (window.scene) {
        window.scene.remove(hex);
      }
    });
    this.testHexes = [];
    
    // Remove controls
    if (this.controls && this.controls.parentNode) {
      this.controls.parentNode.removeChild(this.controls);
    }
    this.controls = null;
    
    this.isActive = false;
    console.log('[MATERIAL TESTER] Stopped and cleaned up');
  }
};

// Expose to global scope
window.MaterialEnhancementTester = MaterialEnhancementTester;

console.log("MaterialEnhancementTester loaded. Type MaterialEnhancementTester.start() to run.");
