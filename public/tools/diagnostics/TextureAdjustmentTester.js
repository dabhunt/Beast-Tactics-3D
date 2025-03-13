
/**
 * Texture Adjustment Tester
 * 
 * This diagnostic tool helps optimize the texture mapping for hexagon tiles
 * by visualizing different margin and offset values.
 * 
 * Usage:
 * 1. Run this script from the console by executing TextureAdjustmentTester.start()
 * 2. Use the UI sliders to fine-tune the vertical margins
 * 3. Apply the found values to game.js
 */

const TextureAdjustmentTester = {
  isActive: false,
  testHex: null,
  testTexture: null,
  controls: null,
  
  config: {
    verticalMarginRatio: 0.17,
    brightness: 1.0,
    shininess: 60
  },
  
  start: function() {
    console.log("[TEXTURE TESTER] Starting texture adjustment tester...");
    
    if (this.isActive) {
      console.warn("[TEXTURE TESTER] Already running!");
      return;
    }
    
    this.isActive = true;
    this.createControls();
    this.createTestHexagon();
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
      <h3>Texture Adjustment Tester</h3>
      
      <div>
        <label>Vertical Margin: <span id="margin-value">0.17</span></label>
        <input type="range" id="margin-slider" min="0" max="0.4" step="0.01" value="0.17">
      </div>
      
      <div>
        <label>Brightness: <span id="brightness-value">1.0</span></label>
        <input type="range" id="brightness-slider" min="0.2" max="2" step="0.1" value="1.0">
      </div>
      
      <div>
        <label>Shininess: <span id="shininess-value">60</span></label>
        <input type="range" id="shininess-slider" min="0" max="200" step="10" value="60">
      </div>
      
      <div>
        <button id="test-next-element">Test Next Element</button>
        <span id="current-element">Combat</span>
      </div>
      
      <div>
        <button id="close-tester">Close Tester</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.controls = panel;
    
    // Set up event listeners
    document.getElementById('margin-slider').addEventListener('input', (e) => {
      this.config.verticalMarginRatio = parseFloat(e.target.value);
      document.getElementById('margin-value').textContent = this.config.verticalMarginRatio;
      this.updateTestTexture();
    });
    
    document.getElementById('brightness-slider').addEventListener('input', (e) => {
      this.config.brightness = parseFloat(e.target.value);
      document.getElementById('brightness-value').textContent = this.config.brightness;
      this.updateTestTexture();
    });
    
    document.getElementById('shininess-slider').addEventListener('input', (e) => {
      this.config.shininess = parseFloat(e.target.value);
      document.getElementById('shininess-value').textContent = this.config.shininess;
      this.updateTestTexture();
    });
    
    document.getElementById('test-next-element').addEventListener('click', () => {
      this.cycleNextElement();
    });
    
    document.getElementById('close-tester').addEventListener('click', () => {
      this.stop();
    });
  },
  
  currentElementIndex: 0,
  
  cycleNextElement: function() {
    // Access the main game's element types and load next one
    if (typeof elementTypes !== 'undefined' && elementTypes.length > 0) {
      this.currentElementIndex = (this.currentElementIndex + 1) % elementTypes.length;
      const nextElement = elementTypes[this.currentElementIndex];
      document.getElementById('current-element').textContent = nextElement;
      
      // Load the texture for this element
      if (typeof elemUrls !== 'undefined' && elemUrls[nextElement]) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(elemUrls[nextElement], (texture) => {
          console.log(`[TEXTURE TESTER] Loaded ${nextElement} texture`);
          this.testTexture = texture;
          this.updateTestTexture();
        });
      }
    } else {
      console.error("[TEXTURE TESTER] Cannot access elementTypes array from main game");
    }
  },
  
  createTestHexagon: function() {
    if (!this.testHex && typeof scene !== 'undefined') {
      console.log("[TEXTURE TESTER] Creating test hexagon...");
      
      // Create large test hexagon
      const testGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 6);
      
      // Default texture
      this.testTexture = textureLoadingTracker.textures['Combat'] || 
                         textureLoadingTracker.textures[elementTypes[0]];
      
      if (!this.testTexture) {
        console.warn("[TEXTURE TESTER] No textures loaded yet! Loading Combat texture...");
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(elemUrls['Combat'], (texture) => {
          this.testTexture = texture;
          this.updateTestTexture();
        });
      }
      
      // Create initial material
      const testMaterial = [
        new THREE.MeshPhongMaterial({ color: 0x555555 }), // Side
        new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Top/bottom placeholder
        new THREE.MeshPhongMaterial({ color: 0xff0000 })  // Top/bottom placeholder
      ];
      
      this.testHex = new THREE.Mesh(testGeometry, testMaterial);
      this.testHex.position.set(0, 10, 0); // Position above the map
      this.testHex.rotation.y = Math.PI / 6; // 30 degrees rotation
      
      scene.add(this.testHex);
      console.log("[TEXTURE TESTER] Test hexagon created");
      
      if (this.testTexture) {
        this.updateTestTexture();
      }
    } else {
      console.error("[TEXTURE TESTER] Cannot create test hexagon - scene not available");
    }
  },
  
  updateTestTexture: function() {
    if (!this.testHex || !this.testTexture) return;
    
    // Clone the texture so we don't modify the original
    const texture = this.testTexture.clone();
    
    // Apply adjustments
    texture.repeat.set(1, 1 - (this.config.verticalMarginRatio * 2));
    texture.offset.set(0, this.config.verticalMarginRatio);
    
    // Create new material with the adjusted texture
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: this.config.shininess,
      specular: 0x555555,
      emissive: 0x222222,
      emissiveIntensity: 0.2 * this.config.brightness,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    // Update the hex materials
    this.testHex.material[1] = material; // Top
    this.testHex.material[2] = material; // Bottom
    
    console.log("[TEXTURE TESTER] Updated texture with:", {
      margin: this.config.verticalMarginRatio,
      brightness: this.config.brightness,
      shininess: this.config.shininess
    });
  },
  
  stop: function() {
    if (!this.isActive) return;
    
    console.log("[TEXTURE TESTER] Stopping texture adjustment tester...");
    
    // Remove the test hex
    if (this.testHex && typeof scene !== 'undefined') {
      scene.remove(this.testHex);
      this.testHex = null;
    }
    
    // Remove the controls
    if (this.controls) {
      document.body.removeChild(this.controls);
      this.controls = null;
    }
    
    this.isActive = false;
    console.log("[TEXTURE TESTER] Final settings:", {
      verticalMarginRatio: this.config.verticalMarginRatio,
      brightness: this.config.brightness,
      shininess: this.config.shininess
    });
    console.log("[TEXTURE TESTER] Add these values to your game.js to apply these changes permanently.");
  }
};

console.log("TextureAdjustmentTester loaded. Type TextureAdjustmentTester.start() to run.");

// Automatically export to global scope
window.TextureAdjustmentTester = TextureAdjustmentTester;
