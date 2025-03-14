
/**
 * debugLoader.js - Centralized loader for all debug tools
 * 
 * This module handles loading all debug-related tools in the correct order
 * with proper dependency management to avoid conflicts.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug flag
const DEBUG = true;

/**
 * Debug logging helper
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  
  if (data) {
    console.log(`[DEBUG-LOADER] ${message}`, data);
  } else {
    console.log(`[DEBUG-LOADER] ${message}`);
  }
}

/**
 * Load all debug tools in the proper order
 */
export async function loadDebugTools() {
  try {
    debugLog('Starting debug tools initialization');
    
    // Load dependencies first
    debugLog('Loading DebugMenu...');
    const DebugMenuModule = await import('./DebugMenu.js');
    const DebugMenu = DebugMenuModule.DebugMenu;
    
    // Create debug menu instance if not already created
    if (!window.gameDebugMenu) {
      window.gameDebugMenu = new DebugMenu();
      debugLog('Debug menu created');
    } else {
      debugLog('Using existing debug menu');
    }
    
    // GIF animation tools (load before other GIF-dependent tools)
    debugLog('Loading GIF animation tools...');
    await import('./initGIFTools.js')
      .catch(err => {
        console.error('[DEBUG-LOADER] Failed to load GIF tools:', err);
      });
    
    // Arrow debugger
    debugLog('Loading arrow debugger...');
    const ArrowDebuggerModule = await import('./ArrowDebugger.js')
      .catch(err => {
        console.error('[DEBUG-LOADER] Failed to load arrow debugger:', err);
        return { ArrowDebugger: null };
      });
    
    if (ArrowDebuggerModule.ArrowDebugger) {
      // Initialize arrow debugger and attach to debug menu
      const arrowDebugger = new ArrowDebuggerModule.ArrowDebugger(window.gameDebugMenu);
      window.arrowDebugger = arrowDebugger;
      
      // Add arrow debugger initialization function to debug menu
      window.gameDebugMenu.initArrowDebugger = function(beast) {
        if (window.arrowDebugger) {
          window.arrowDebugger.setBeast(beast);
          debugLog('Arrow debugger connected to beast');
        }
      };
      
      // Add arrow debugger to camera
      window.gameDebugMenu.setCameraManager = function(camera) {
        if (window.arrowDebugger) {
          window.arrowDebugger.setCamera(camera);
          debugLog('Arrow debugger connected to camera');
        }
      };
      
      debugLog('Arrow debugger initialized');
    }
    
    // GIF tester (after GIF tools are loaded)
    debugLog('Loading GIF animation tester...');
    await import('./initGifTester.js')
      .catch(err => {
        console.error('[DEBUG-LOADER] Failed to load GIF tester:', err);
      });
    
    debugLog('All debug tools loaded successfully');
    
    return window.gameDebugMenu;
  } catch (err) {
    console.error('[DEBUG-LOADER] Error loading debug tools:', err);
    throw err;
  }
}

// Auto-initialize when imported if in debug mode
if (DEBUG) {
  loadDebugTools().catch(err => {
    console.error('[DEBUG-LOADER] Failed to auto-initialize debug tools:', err);
  });
}

// Make available globally
window.loadDebugTools = loadDebugTools;
