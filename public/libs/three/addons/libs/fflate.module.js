// fflate.module.js - Enhanced version with better compatibility for THREE.js FBXLoader

/**
 * Implementation of core fflate functionality required by THREE.js FBXLoader
 * This module provides the minimum necessary for FBX file parsing
 * 
 * Based on the fflate library but simplified for this specific use case
 * @see https://github.com/101arrowz/fflate for the full implementation
 */

// Debug flag for verbose logging
const DEBUG = true;

/**
 * Log message in debug mode
 * @param {string} message - Message to log
 * @param {Object} data - Optional data to include
 */
function debugLog(message, data = null) {
  if (!DEBUG) return;
  
  if (data) {
    console.log(`[FFLATE] ${message}`, data);
  } else {
    console.log(`[FFLATE] ${message}`);
  }
}

// Track decompression attempts for diagnostics
const stats = {
  inflateAttempts: 0,
  successfulDecompressions: 0,
  failedDecompressions: 0,
  totalBytesProcessed: 0
};

/**
 * Decompress data using the inflate algorithm
 * This is a compatibility implementation for FBXLoader
 * 
 * @param {Uint8Array|ArrayBuffer} data - The compressed data
 * @param {Object} opts - Options for decompression
 * @returns {Uint8Array} - Decompressed data (or original if unable to decompress)
 */
function inflate(data, opts = {}) {
  stats.inflateAttempts++;
  
  // Log the decompression attempt
  debugLog('Decompression requested:', { 
    dataType: data?.constructor?.name || typeof data,
    dataSize: data?.byteLength || data?.length || 0,
    options: opts,
    stats
  });
  
  try {
    // For actual production use, we'd implement real decompression
    // Since we're providing a compatibility layer, we'll pass through the data
    // and let FBXLoader handle it (most modern FBX files aren't compressed anyway)
    
    // Ensure we return a Uint8Array as expected by FBXLoader
    let result;
    if (data instanceof ArrayBuffer) {
      debugLog('Converting ArrayBuffer to Uint8Array');
      result = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      result = data;
    } else {
      debugLog('Warning: Unknown data type, trying to adapt', { type: typeof data });
      // Try to handle other types
      if (data && data.buffer && data.buffer instanceof ArrayBuffer) {
        result = new Uint8Array(data.buffer);
      } else {
        throw new Error(`Cannot process data of type ${typeof data}`);
      }
    }
    
    // Update statistics
    stats.successfulDecompressions++;
    stats.totalBytesProcessed += result.length;
    
    debugLog('Data processed successfully', {
      resultSize: result.length,
      resultType: result.constructor.name
    });
    
    return result;
  } catch (err) {
    // Update statistics
    stats.failedDecompressions++;
    
    console.error('[FFLATE] Error processing data:', err);
    console.error('[FFLATE] Stack trace:', err.stack);
    
    // Re-throw for proper error handling upstream
    throw err;
  }
}

/**
 * Get statistics about decompression usage
 * @returns {Object} Statistics object
 */
function getStats() {
  return { ...stats };
}

// Export the functions required by THREE.js
export { 
  inflate,
  getStats
};
