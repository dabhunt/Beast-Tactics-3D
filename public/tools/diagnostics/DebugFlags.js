/**
 * DebugFlags.js
 * Central manager for debug flags across the application
 * Allows for module-specific debug logging without performance impact
 */

// Default debug flags - all logs disabled by default to ensure good performance
const debugFlags = {
  // Core systems
  MAP: false,
  CAMERA: false,
  PHYSICS: false,
  
  // Input and interaction
  MOUSE: false,
  HOVER: false,
  RAYCASTER: false,
  KEYBOARD: false,
  
  // Game elements
  BEAST: false,
  CRYSTAL: false,
  BATTLE: false,
  
  // Effects and rendering
  EFFECTS: false,
  MATERIALS: false,
  ANIMATION: false,
  
  // Performance
  PERFORMANCE: false,
  
  // Debug systems
  DEBUG: true, // Debug system's own logs are on by default
  LOG_VIEWER: true
};

/**
 * Debug logging utility that only logs if the flag for the specified module is enabled
 * @param {string} module - Module name (should match key in debugFlags)
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to include with the log
 */
export function debugLog(module, message, data = null) {
  // Only log if debugging is enabled for this module
  if (!debugFlags[module]) return;
  
  // Format the log with module prefix
  const formattedMessage = `[${module}] ${message}`;
  
  // Log with or without data
  if (data) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * Warning-level debug logging
 * @param {string} module - Module name
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to include with the log
 */
export function debugWarn(module, message, data = null) {
  if (!debugFlags[module]) return;
  
  const formattedMessage = `[${module}] ${message}`;
  if (data) {
    console.warn(formattedMessage, data);
  } else {
    console.warn(formattedMessage);
  }
}

/**
 * Error-level debug logging
 * @param {string} module - Module name
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to include with the log
 */
export function debugError(module, message, data = null) {
  if (!debugFlags[module]) return;
  
  const formattedMessage = `[${module}] ${message}`;
  if (data) {
    console.error(formattedMessage, data);
  } else {
    console.error(formattedMessage);
  }
}

/**
 * Enable debug output for a specific module
 * @param {string} module - Module name to enable
 */
export function enableDebug(module) {
  if (debugFlags.hasOwnProperty(module)) {
    debugFlags[module] = true;
    console.log(`[DEBUG] Enabled debug logging for ${module}`);
  } else {
    console.warn(`[DEBUG] Unknown module requested for debug: ${module}`);
  }
}

/**
 * Disable debug output for a specific module
 * @param {string} module - Module name to disable
 */
export function disableDebug(module) {
  if (debugFlags.hasOwnProperty(module)) {
    debugFlags[module] = false;
    console.log(`[DEBUG] Disabled debug logging for ${module}`);
  } else {
    console.warn(`[DEBUG] Unknown module requested for debug: ${module}`);
  }
}

/**
 * Toggle debug output for a specific module
 * @param {string} module - Module name to toggle
 * @returns {boolean} New state of the debug flag
 */
export function toggleDebug(module) {
  if (debugFlags.hasOwnProperty(module)) {
    debugFlags[module] = !debugFlags[module];
    console.log(`[DEBUG] ${debugFlags[module] ? 'Enabled' : 'Disabled'} debug logging for ${module}`);
    return debugFlags[module];
  } else {
    console.warn(`[DEBUG] Unknown module requested for debug toggle: ${module}`);
    return false;
  }
}

/**
 * Get current state of a debug flag
 * @param {string} module - Module to check
 * @returns {boolean} Current state (true if debugging enabled)
 */
export function isDebugEnabled(module) {
  return debugFlags.hasOwnProperty(module) ? debugFlags[module] : false;
}

/**
 * Get all debug flags and their states
 * @returns {Object} Copy of current debug flags object
 */
export function getAllDebugFlags() {
  return {...debugFlags};
}

/**
 * Set multiple debug flags at once
 * @param {Object} flags - Object with module names as keys and boolean states as values
 */
export function setDebugFlags(flags) {
  if (!flags || typeof flags !== 'object') {
    console.error('[DEBUG] Invalid flags object provided to setDebugFlags');
    return;
  }
  
  Object.entries(flags).forEach(([module, state]) => {
    if (debugFlags.hasOwnProperty(module)) {
      debugFlags[module] = !!state; // Convert to boolean
    }
  });
  
  console.log('[DEBUG] Updated debug flags:', {...debugFlags});
}

// Export default flags
export default debugFlags;
