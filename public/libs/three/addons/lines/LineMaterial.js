/**
 * LineMaterial.js - Implementation of Line2 material 
 * For Beast Tactics 3D
 * 
 * Part of THREE.js addon modules
 * Supports both ES modules and traditional script loading
 */

// Use strict mode for better error catching
'use strict';

// Detailed initialization logging
console.log('[THREE-LINES] Initializing LineMaterial module');

// Handle both ES modules and direct script inclusion
// This pattern allows the file to work in both contexts
let ShaderMaterial, Vector2;

// Check if we're in module context or if THREE is globally available
if (typeof THREE !== 'undefined') {
  console.log('[THREE-LINES] Using global THREE instance for LineMaterial');
  ShaderMaterial = THREE.ShaderMaterial;
  Vector2 = THREE.Vector2;
} else {
  // In ES module context, import from three.module.js
  try {
    console.log('[THREE-LINES] Attempting ES module import for LineMaterial dependencies');
    // These imports will only work in ES module context
    // They will be ignored in traditional script context (global THREE used instead)
    const imports = {};
    if (typeof require === 'function') {
      imports.ShaderMaterial = require('../../../three.module.js').ShaderMaterial;
      imports.Vector2 = require('../../../three.module.js').Vector2;
    } else {
      // Dynamic import approach for browsers
      // Note: This won't actually execute in a synchronous context
      // It's here for ES module compatibility when this file is properly imported
      imports.ShaderMaterial = ShaderMaterial;
      imports.Vector2 = Vector2;
    }
    ShaderMaterial = imports.ShaderMaterial;
    Vector2 = imports.Vector2;
  } catch (error) {
    console.error('[THREE-LINES] Failed to import THREE dependencies for LineMaterial:', error);
  }
}

/**
 * LineMaterial implementation
 * Based on THREE.js Line2 implementation for fat lines
 */
class LineMaterial extends ShaderMaterial {
  constructor(parameters) {
    console.log('[THREE] Creating LineMaterial with parameters:', parameters);

    // Default parameter values
    const params = {
      color: parameters.color || 0xffffff,
      linewidth: parameters.linewidth || 1,
      resolution: parameters.resolution || new Vector2(1, 1),
      dashed: parameters.dashed || false,
      alphaToCoverage: parameters.alphaToCoverage || false, 
      vertexColors: parameters.vertexColors || false,
      opacity: parameters.opacity ?? 1.0,
      transparent: parameters.transparent || false,
      depthTest: parameters.depthTest ?? true,
      linecap: parameters.linecap || 'round',
      linejoin: parameters.linejoin || 'round',
    };

    // Create simple shader material with line width support
    super({
      uniforms: {
        color: { value: params.color },
        linewidth: { value: params.linewidth },
        resolution: { value: params.resolution },
        opacity: { value: params.opacity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: params.transparent,
      depthTest: params.depthTest
    });

    // Store parameters for reference
    this.type = 'LineMaterial';
    this.isLineMaterial = true;
    this.color = params.color;
    this.linewidth = params.linewidth;
    this.resolution = params.resolution;
    this.dashed = params.dashed;
    this.alphaToCoverage = params.alphaToCoverage;
    this.vertexColors = params.vertexColors;
    this.opacity = params.opacity;
    
    console.log('[THREE] LineMaterial created successfully');
  }

  /**
   * Copy all properties from another LineMaterial
   */
  copy(source) {
    super.copy(source);
    this.color = source.color;
    this.linewidth = source.linewidth;
    this.resolution = source.resolution;
    this.dashed = source.dashed;
    this.alphaToCoverage = source.alphaToCoverage;
    this.vertexColors = source.vertexColors;
    this.opacity = source.opacity;
    return this;
  }
}

// Make LineMaterial available in both module and non-module contexts
// For ES modules export
if (typeof exports !== 'undefined') {
  try {
    exports.LineMaterial = LineMaterial;
  } catch (e) {
    console.error('[THREE-LINES] Failed to set exports.LineMaterial:', e);
  }
}

// Standard ES6 export is handled at the module level through the module system
// We can't conditionally use the export keyword as it's a static declaration
// The export statement is at the end of the file to ensure it's valid in module context

// Instead of modifying THREE directly (which may be frozen), create our own namespace
// Create a global BeastTactics.THREEAddons namespace for our custom THREE.js extensions
if (typeof window !== 'undefined') {
  console.log('[THREE-LINES] Creating custom namespace for THREE extensions');
  
  // Create nested namespaces if they don't exist
  window.BeastTactics = window.BeastTactics || {};
  window.BeastTactics.THREEAddons = window.BeastTactics.THREEAddons || {};
  
  // Add our custom components to the namespace
  window.BeastTactics.THREEAddons.LineMaterial = LineMaterial;
  
  console.log('[THREE-LINES] Added LineMaterial to BeastTactics.THREEAddons namespace');
}

// Also expose on window for maximum compatibility
if (typeof window !== 'undefined') {
  console.log('[THREE-LINES] Attaching LineMaterial to window for global access');
  window.LineMaterial = LineMaterial;
}

// ES6 module export
export { LineMaterial };
