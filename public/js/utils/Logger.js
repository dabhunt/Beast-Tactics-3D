
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
/**
 * Logger.js
 * Centralized logging utility with different levels and formatting
 */

export class Logger {
  // Log levels
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4  // Use to disable logging
  };
  
  // Current log level - can be changed at runtime
  static currentLevel = Logger.LEVELS.DEBUG;
  
  /**
   * Log a debug message
   * @param {String} source - Source component/module name
   * @param {String} message - Message to log
   * @param {Object} [data=null] - Optional data to include
   */
  static debug(source, message, data = null) {
    if (Logger.currentLevel <= Logger.LEVELS.DEBUG) {
      if (data) {
        console.log(`[DEBUG][${source}] ${message}`, data);
      } else {
        console.log(`[DEBUG][${source}] ${message}`);
      }
    }
  }
  
  /**
   * Log an info message
   * @param {String} source - Source component/module name
   * @param {String} message - Message to log
   * @param {Object} [data=null] - Optional data to include
   */
  static info(source, message, data = null) {
    if (Logger.currentLevel <= Logger.LEVELS.INFO) {
      if (data) {
        console.info(`[INFO][${source}] ${message}`, data);
      } else {
        console.info(`[INFO][${source}] ${message}`);
      }
    }
  }
  
  /**
   * Log a warning message
   * @param {String} source - Source component/module name
   * @param {String} message - Message to log
   * @param {Object} [data=null] - Optional data to include
   */
  static warn(source, message, data = null) {
    if (Logger.currentLevel <= Logger.LEVELS.WARN) {
      if (data) {
        console.warn(`[WARN][${source}] ${message}`, data);
      } else {
        console.warn(`[WARN][${source}] ${message}`);
      }
    }
  }
  
  /**
   * Log an error message
   * @param {String} source - Source component/module name
   * @param {String} message - Message to log
   * @param {Object} [data=null] - Optional data to include
   */
  static error(source, message, data = null) {
    if (Logger.currentLevel <= Logger.LEVELS.ERROR) {
      if (data instanceof Error) {
        console.error(`[ERROR][${source}] ${message}`, {
          name: data.name,
          message: data.message,
          stack: data.stack
        });
      } else if (data) {
        console.error(`[ERROR][${source}] ${message}`, data);
      } else {
        console.error(`[ERROR][${source}] ${message}`);
      }
    }
  }
  
  /**
   * Set the current log level
   * @param {Number} level - Log level from Logger.LEVELS
   */
  static setLevel(level) {
    Logger.currentLevel = level;
    console.log(`Log level set to: ${Object.keys(Logger.LEVELS).find(key => Logger.LEVELS[key] === level)}`);
  }
  
  /**
   * Group related log messages together
   * @param {String} source - Source component/module name
   * @param {String} label - Group label
   * @param {Function} callback - Function containing logs to group
   * @param {Boolean} [collapsed=false] - Whether group should start collapsed
   */
  static group(source, label, callback, collapsed = false) {
    if (Logger.currentLevel <= Logger.LEVELS.DEBUG) {
      const groupLabel = `[${source}] ${label}`;
      
      if (collapsed) {
        console.groupCollapsed(groupLabel);
      } else {
        console.group(groupLabel);
      }
      
      callback();
      console.groupEnd();
    } else {
      // Just call the callback without grouping if logging is disabled
      callback();
    }
  }
}
