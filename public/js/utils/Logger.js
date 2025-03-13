
/**
 * Logger.js
 * Centralized logging utility for consistent output formatting and control
 */

// Log levels
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  NONE: 4
};

// Current log level (can be changed at runtime)
let currentLogLevel = LogLevel.DEBUG;

// Whether to include timestamps in logs
let includeTimestamp = true;

/**
 * Format the timestamp for log messages
 * @returns {String} Formatted timestamp
 */
function getTimestamp() {
  if (!includeTimestamp) return '';
  
  const now = new Date();
  return `[${now.toISOString()}] `;
}

/**
 * Centralized logger to manage all game logging
 */
export const Logger = {
  /**
   * Set the current log level
   * @param {String} level - Log level to set (debug, info, warning, error, none)
   */
  setLogLevel(level) {
    const levelMap = {
      'debug': LogLevel.DEBUG,
      'info': LogLevel.INFO,
      'warning': LogLevel.WARNING,
      'error': LogLevel.ERROR,
      'none': LogLevel.NONE
    };
    
    if (levelMap[level.toLowerCase()] !== undefined) {
      currentLogLevel = levelMap[level.toLowerCase()];
      console.log(`Logger: Log level set to ${level.toUpperCase()}`);
    } else {
      console.warn(`Logger: Invalid log level: ${level}`);
    }
  },
  
  /**
   * Enable or disable timestamps in logs
   * @param {Boolean} enabled - Whether to include timestamps
   */
  enableTimestamps(enabled) {
    includeTimestamp = !!enabled;
  },
  
  /**
   * Log a debug message
   * @param {String} source - Source component of the log
   * @param {String} message - Log message
   * @param {Object} data - Optional data to include
   */
  debug(source, message, data) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const timestamp = getTimestamp();
      if (data) {
        console.debug(`${timestamp}[DEBUG] [${source}] ${message}`, data);
      } else {
        console.debug(`${timestamp}[DEBUG] [${source}] ${message}`);
      }
    }
  },
  
  /**
   * Log an info message
   * @param {String} source - Source component of the log
   * @param {String} message - Log message
   * @param {Object} data - Optional data to include
   */
  info(source, message, data) {
    if (currentLogLevel <= LogLevel.INFO) {
      const timestamp = getTimestamp();
      if (data) {
        console.log(`${timestamp}[INFO] [${source}] ${message}`, data);
      } else {
        console.log(`${timestamp}[INFO] [${source}] ${message}`);
      }
    }
  },
  
  /**
   * Log a warning message
   * @param {String} source - Source component of the log
   * @param {String} message - Log message
   * @param {Object} data - Optional data to include
   */
  warning(source, message, data) {
    if (currentLogLevel <= LogLevel.WARNING) {
      const timestamp = getTimestamp();
      if (data) {
        console.warn(`${timestamp}[WARNING] [${source}] ${message}`, data);
      } else {
        console.warn(`${timestamp}[WARNING] [${source}] ${message}`);
      }
    }
  },
  
  /**
   * Log an error message
   * @param {String} source - Source component of the log
   * @param {String} message - Log message
   * @param {Object} error - Error object or data
   */
  error(source, message, error) {
    if (currentLogLevel <= LogLevel.ERROR) {
      const timestamp = getTimestamp();
      if (error) {
        console.error(`${timestamp}[ERROR] [${source}] ${message}`, error);
        
        // Log additional error details if available
        if (error.stack) {
          console.debug(`${timestamp}[ERROR] [${source}] Stack trace:`, error.stack);
        }
      } else {
        console.error(`${timestamp}[ERROR] [${source}] ${message}`);
      }
    }
  },
  
  /**
   * Get the current log level name
   * @returns {String} Current log level name
   */
  getCurrentLevel() {
    const levelNames = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'NONE'];
    return levelNames[currentLogLevel];
  }
};
