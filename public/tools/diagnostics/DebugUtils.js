
/**
 * Debug Utilities Module for Beast Tactics
 * Provides standardized debug logging functionality across the application
 * with per-file verbosity control.
 */

// Global debug configuration that can override individual settings
export const GlobalDebugConfig = {
  // Master switch to enable/disable all debug logging
  enabled: true,
  
  // Default level for all loggers if not specified in the file
  defaultLevel: "info",
  
  // Minimum level to display (error, warn, info, debug, verbose)
  minLevel: "info",
  
  // Show timestamps in logs
  showTimestamps: true,
  
  // Show file origin in logs
  showOrigin: true,
  
  // File-specific overrides (keys should match the 'origin' in Logger creation)
  fileOverrides: {
    // Example: "game.js": { enabled: false }
    // Example: "beast.js": { minLevel: "verbose" }
  }
};

// Log levels with numeric values for comparison
const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4
};

/**
 * Creates a logger instance for a specific file or module
 * @param {string} origin - Source file/module name (e.g., "game.js")
 * @param {boolean} fileDebugFlag - The file-specific DEBUG flag
 * @returns {Object} Logger object with methods for different log levels
 */
export function createLogger(origin, fileDebugFlag = true) {
  console.log(`[DEBUG-UTILS] Creating logger for ${origin}, fileDebugFlag=${fileDebugFlag}`);
  
  // Store initial settings for this logger
  const loggerState = {
    origin: origin,
    fileDebugFlag: fileDebugFlag,
    startTime: Date.now(),
    callCounts: {
      error: 0,
      warn: 0, 
      info: 0,
      debug: 0,
      verbose: 0
    }
  };
  
  /**
   * Determines if a log at the specified level should be displayed
   * @param {string} level - Log level (error, warn, info, debug, verbose)
   * @returns {boolean} True if the log should be displayed
   * @private
   */
  function shouldLog(level) {
    // Check global master switch
    if (!GlobalDebugConfig.enabled) return level === 'error' || level === 'warn';
    
    // Get file-specific override if available
    const fileOverride = GlobalDebugConfig.fileOverrides[origin];
    
    // Check if file has been specifically disabled
    if (fileOverride && fileOverride.enabled === false) {
      return level === 'error' || level === 'warn';
    }
    
    // If file-level DEBUG flag is false, only show errors and warnings
    if (!fileDebugFlag) {
      return level === 'error' || level === 'warn';
    }
    
    // Get appropriate minimum level
    const minLevelName = 
      (fileOverride && fileOverride.minLevel) || 
      GlobalDebugConfig.minLevel || 
      'info';
    
    const minLevel = LogLevels[minLevelName];
    const currentLevel = LogLevels[level];
    
    // Log if current level is less than or equal to the minimum level
    // (lower numbers are more severe)
    return currentLevel <= minLevel;
  }
  
  /**
   * Formats a log message with appropriate prefixes
   * @param {string} level - Log level
   * @param {string} message - The log message
   * @returns {string} Formatted log message
   * @private
   */
  function formatMessage(level, message) {
    const parts = [];
    
    // Add timestamp if enabled
    if (GlobalDebugConfig.showTimestamps) {
      const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
      parts.push(timestamp);
    }
    
    // Add log level
    parts.push(level.toUpperCase());
    
    // Add origin if enabled
    if (GlobalDebugConfig.showOrigin) {
      parts.push(origin);
    }
    
    // Combine parts into prefix
    const prefix = parts.join(' | ');
    
    return `[${prefix}] ${message}`;
  }
  
  /**
   * Creates a logging function for a specific level
   * @param {string} level - Log level
   * @returns {Function} Logging function for that level
   * @private
   */
  function createLogFn(level) {
    return function(message, data) {
      // Track call count
      loggerState.callCounts[level]++;
      
      // Check if we should log this message
      if (!shouldLog(level)) return;
      
      // Format message
      const formattedMsg = formatMessage(level, message);
      
      // Log to console with appropriate method
      if (data !== undefined) {
        console[level === 'verbose' ? 'debug' : level](formattedMsg, data);
      } else {
        console[level === 'verbose' ? 'debug' : level](formattedMsg);
      }
    };
  }
  
  // Create the logger object with methods for each log level
  const logger = {
    error: createLogFn('error'),
    warn: createLogFn('warn'),
    info: createLogFn('info'),
    debug: createLogFn('debug'),
    verbose: createLogFn('verbose'),
    
    /**
     * Gets statistics about this logger instance
     * @returns {Object} Statistics about logger usage
     */
    getStats() {
      return {
        origin: loggerState.origin,
        enabled: fileDebugFlag && GlobalDebugConfig.enabled,
        uptime: Date.now() - loggerState.startTime,
        callCounts: { ...loggerState.callCounts }
      };
    },
    
    /**
     * Creates a group in the console for related log messages
     * @param {string} groupName - Name of the log group
     * @param {Function} groupFn - Function containing grouped logs
     */
    group(groupName, groupFn) {
      if (!shouldLog('debug')) return;
      
      const groupTitle = formatMessage('debug', `GROUP: ${groupName}`);
      console.group(groupTitle);
      
      try {
        groupFn(this);
      } finally {
        console.groupEnd();
      }
    },
    
    /**
     * Times the execution of a function and logs the result
     * @param {string} label - Label for the timing
     * @param {Function} fn - Function to time
     * @returns {*} The result of the function
     */
    time(label, fn) {
      if (!shouldLog('debug')) return fn();
      
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      
      this.debug(`TIME: ${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    },
    
    /**
     * Creates a namespaced sub-logger
     * @param {string} namespace - Namespace to add to origin
     * @returns {Object} New logger with namespaced origin
     */
    namespace(namespace) {
      return createLogger(`${origin}:${namespace}`, fileDebugFlag);
    }
  };
  
  return logger;
}

/**
 * Example usage:
 * 
 * At the top of your file:
 * ```
 * import { createLogger } from './tools/diagnostics/DebugUtils.js';
 * 
 * // File-specific debug flag - controls verbosity for this file only
 * const DEBUG = true;
 * 
 * // Create a logger for this file
 * const logger = createLogger('your-file-name.js', DEBUG);
 * ```
 * 
 * Then use in your code:
 * ```
 * logger.info('Starting initialization');
 * logger.debug('Detailed information about current state', { data: 'values' });
 * 
 * try {
 *   // Code that might throw
 * } catch (err) {
 *   logger.error('Failed to initialize', err);
 * }
 * 
 * // For timing operations
 * const result = logger.time('database query', () => fetchDataFromDatabase());
 * 
 * // For grouped logs
 * logger.group('Initialization steps', (log) => {
 *   log.debug('Step 1: Loading configuration');
 *   log.debug('Step 2: Connecting to services');
 * });
 * ```
 */
