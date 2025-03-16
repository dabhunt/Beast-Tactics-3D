/**
 * Line2.js - Implementation of Line2 for thick line rendering
 * For Beast Tactics 3D
 * 
 * Part of THREE.js addon modules
 * Supports both ES modules and traditional script loading
 */

// Use strict mode for better error catching
'use strict';

// Detailed initialization logging
console.log('[THREE-LINES] Initializing Line2 module');

// Handle both ES modules and direct script inclusion
let Mesh, Vector3;

// Check if we're in module context or if THREE is globally available
if (typeof THREE !== 'undefined') {
  console.log('[THREE-LINES] Using global THREE instance for Line2');
  Mesh = THREE.Mesh;
  Vector3 = THREE.Vector3;
} else {
  // In ES module context, import from three.module.js
  try {
    console.log('[THREE-LINES] Attempting ES module import for Line2 dependencies');
    const imports = {};
    if (typeof require === 'function') {
      imports.Mesh = require('../../../three.module.js').Mesh;
      imports.Vector3 = require('../../../three.module.js').Vector3;
    } else {
      // Dynamic import approach for browsers
      imports.Mesh = Mesh;
      imports.Vector3 = Vector3;
    }
    Mesh = imports.Mesh;
    Vector3 = imports.Vector3;
  } catch (error) {
    console.error('[THREE-LINES] Failed to import THREE dependencies for Line2:', error);
  }
}

/**
 * Line2 - Simplified implementation for Beast Tactics
 * This provides a compatibility layer for the original THREE.js Line2
 */
class Line2 extends Mesh {
  constructor(geometry, material) {
    console.log('[THREE] Creating Line2 with:', {
      geometryType: geometry.type,
      materialType: material.type
    });
    
    super(geometry, material);
    
    this.type = 'Line2';
    this.isLine2 = true;
    
    // Line2 specific properties
    this.geometry = geometry;
    this.material = material;
    
    // For compatibility with original Line2
    this._lineDistances = null;
    
    console.log('[THREE] Line2 created successfully');
  }
  
  /**
   * Compute line distances - required for dashed lines
   * In this simplified version, we just set a flag since we don't support actual dashed lines
   */
  computeLineDistances() {
    console.log('[THREE] Computing line distances for Line2');
    
    // In real Line2, this would compute distances for each segment
    // In our simplified version, we just set a flag
    this._lineDistances = true;
    
    return this;
  }
  
  /**
   * Create a ray for picking - not fully implemented in this version
   */
  raycast(raycaster, intersects) {
    // Basic implementation that doesn't actually do line-specific raycasting
    // but allows the object to be detected
    super.raycast(raycaster, intersects);
  }
  
  /**
   * Copy properties from another Line2
   */
  copy(source) {
    super.copy(source);
    
    this.geometry.copy(source.geometry);
    this.material.copy(source.material);
    
    this._lineDistances = source._lineDistances;
    
    return this;
  }
}

// Make Line2 available in both module and non-module contexts
// For ES modules export
if (typeof exports !== 'undefined') {
  try {
    exports.Line2 = Line2;
  } catch (e) {
    console.error('[THREE-LINES] Failed to set exports.Line2:', e);
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
  window.BeastTactics.THREEAddons.Line2 = Line2;
  
  console.log('[THREE-LINES] Added Line2 to BeastTactics.THREEAddons namespace');
}

// Also expose on window for maximum compatibility
if (typeof window !== 'undefined') {
  console.log('[THREE-LINES] Attaching Line2 to window for global access');
  window.Line2 = Line2;
}

// ES6 module export
export { Line2 };
