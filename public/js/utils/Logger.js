/**
 * Logger.js
 * Centralized logging utility with different levels and formatting
 */

// Internal log levels
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  NONE: 4
};

// Default to DEBUG level in development
let currentLogLevel = LogLevel.DEBUG;

// Whether to include timestamps in logs
let includeTimestamp = true;

/**
 * Get a formatted timestamp for logging
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
  // Log level constants for external use
  LEVELS: {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARNING: LogLevel.WARNING,
    ERROR: LogLevel.ERROR,
    NONE: LogLevel.NONE
  },

  /**
   * Set the current log level
   * @param {String|Number} level - Log level to set (debug, info, warning, error, none) or numeric level
   */
  setLogLevel(level) {
    // Handle string level names
    if (typeof level === 'string') {
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
    }
    // Handle numeric levels directly
    else if (typeof level === 'number' && level >= 0 && level <= 4) {
      currentLogLevel = level;
      console.log(`Logger: Log level set to ${this.getCurrentLevel()}`);
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
        console.info(`${timestamp}[INFO] [${source}] ${message}`, data);
      } else {
        console.info(`${timestamp}[INFO] [${source}] ${message}`);
      }
    }
  },

  /**
   * Log a warning message
   * @param {String} source - Source component of the log
   * @param {String} message - Log message
   * @param {Object} data - Optional data to include
   */
  warn(source, message, data) {
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
   * @param {Object} data - Optional data to include
   */
  error(source, message, data) {
    if (currentLogLevel <= LogLevel.ERROR) {
      const timestamp = getTimestamp();
      if (data) {
        console.error(`${timestamp}[ERROR] [${source}] ${message}`, data);
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