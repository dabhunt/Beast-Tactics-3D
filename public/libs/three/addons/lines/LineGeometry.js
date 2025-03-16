/**
 * LineGeometry.js - Implementation of LineGeometry for Line2
 * For Beast Tactics 3D
 * 
 * Part of THREE.js addon modules
 * Supports both ES modules and traditional script loading
 */

// Use strict mode for better error catching
'use strict';

// Detailed initialization logging
console.log('[THREE-LINES] Initializing LineGeometry module');

// Handle both ES modules and direct script inclusion
let BufferGeometry, Float32BufferAttribute;

// Check if we're in module context or if THREE is globally available
if (typeof THREE !== 'undefined') {
  console.log('[THREE-LINES] Using global THREE instance for LineGeometry');
  BufferGeometry = THREE.BufferGeometry;
  Float32BufferAttribute = THREE.Float32BufferAttribute;
} else {
  // In ES module context, import from three.module.js
  try {
    console.log('[THREE-LINES] Attempting ES module import for LineGeometry dependencies');
    const imports = {};
    if (typeof require === 'function') {
      imports.BufferGeometry = require('../../../three.module.js').BufferGeometry;
      imports.Float32BufferAttribute = require('../../../three.module.js').Float32BufferAttribute;
    } else {
      // Dynamic import approach for browsers
      imports.BufferGeometry = BufferGeometry;
      imports.Float32BufferAttribute = Float32BufferAttribute;
    }
    BufferGeometry = imports.BufferGeometry;
    Float32BufferAttribute = imports.Float32BufferAttribute;
  } catch (error) {
    console.error('[THREE-LINES] Failed to import THREE dependencies for LineGeometry:', error);
  }
}

/**
 * LineGeometry - Custom implementation for Beast Tactics
 * Simplified version of the THREE.js LineGeometry for fat lines
 */
class LineGeometry extends BufferGeometry {
  constructor() {
    console.log('[THREE] Creating LineGeometry');
    super();
    
    this.type = 'LineGeometry';
    this.isLineGeometry = true;
    
    // Initialize as empty geometry
    this.positions = [];
    this.colors = [];
    
    console.log('[THREE] LineGeometry created successfully');
  }
  
  /**
   * Set positions for line segments
   * @param {Array<number>} array - Flat array of positions [x1,y1,z1, x2,y2,z2, ...]
   */
  setPositions(array) {
    console.log(`[THREE] Setting LineGeometry positions, count=${array.length/3} vertices`);
    
    // Store original positions for reference
    this.positions = array;
    
    // Convert to attribute
    this.setAttribute('position', new Float32BufferAttribute(array, 3));
    
    return this;
  }
  
  /**
   * Set colors for line segments
   * @param {Array<number>} array - Flat array of colors [r1,g1,b1, r2,g2,b2, ...]
   */
  setColors(array) {
    console.log(`[THREE] Setting LineGeometry colors, count=${array.length/3} colors`);
    
    // Store original colors for reference
    this.colors = array;
    
    // Convert to attribute
    this.setAttribute('color', new Float32BufferAttribute(array, 3));
    
    return this;
  }
  
  /**
   * Create a copy of this geometry
   */
  copy(source) {
    super.copy(source);
    
    this.positions = source.positions.slice();
    this.colors = source.colors.slice();
    
    return this;
  }
}

// Make LineGeometry available in both module and non-module contexts
// For ES modules export
if (typeof exports !== 'undefined') {
  try {
    exports.LineGeometry = LineGeometry;
  } catch (e) {
    console.error('[THREE-LINES] Failed to set exports.LineGeometry:', e);
  }
}

// Instead of modifying THREE directly (which may be frozen), create our own namespace
// Use the BeastTactics.THREEAddons namespace for our custom THREE.js extensions
if (typeof window !== 'undefined') {
  console.log('[THREE-LINES] Creating custom namespace for THREE extensions');
  
  // Create nested namespaces if they don't exist
  window.BeastTactics = window.BeastTactics || {};
  window.BeastTactics.THREEAddons = window.BeastTactics.THREEAddons || {};
  
  // Add our custom components to the namespace
  window.BeastTactics.THREEAddons.LineGeometry = LineGeometry;
  
  console.log('[THREE-LINES] Added LineGeometry to BeastTactics.THREEAddons namespace');
}

// Also expose on window for maximum compatibility
if (typeof window !== 'undefined') {
  console.log('[THREE-LINES] Attaching LineGeometry to window for global access');
  window.LineGeometry = LineGeometry;
}

// ES6 module export
export { LineGeometry };
