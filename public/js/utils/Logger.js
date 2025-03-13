
/**
 * Logger.js
 * Centralized logging system with different levels and component tagging
 */

/**
 * Log levels enum
 * @enum {Number}
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  NONE: 4
};

/**
 * Logger class for consistent logging throughout the application
 */
export class Logger {
  static _currentLevel = LogLevel.DEBUG;
  static _logHistory = [];
  static _maxHistorySize = 1000;
  static _logToConsole = true;
  
  /**
   * Log a debug message
   * @param {String} component - Component/module name
   * @param {String} message - Message to log
   * @param {Object} [data] - Optional data to include
   */
  static debug(component, message, data = undefined) {
    Logger._log(LogLevel.DEBUG, component, message, data);
  }
  
  /**
   * Log an info message
   * @param {String} component - Component/module name
   * @param {String} message - Message to log
   * @param {Object} [data] - Optional data to include
   */
  static info(component, message, data = undefined) {
    Logger._log(LogLevel.INFO, component, message, data);
  }
  
  /**
   * Log a warning message
   * @param {String} component - Component/module name
   * @param {String} message - Message to log
   * @param {Object} [data] - Optional data to include
   */
  static warning(component, message, data = undefined) {
    Logger._log(LogLevel.WARNING, component, message, data);
  }
  
  /**
   * Log an error message
   * @param {String} component - Component/module name
   * @param {String} message - Message to log
   * @param {Error|Object} [error] - Error object or data
   */
  static error(component, message, error = undefined) {
    Logger._log(LogLevel.ERROR, component, message, error);
  }
  
  /**
   * Internal logging method
   * @param {LogLevel} level - Log level
   * @param {String} component - Component/module name
   * @param {String} message - Message to log
   * @param {*} [data] - Optional data to include
   * @private
   */
  static _log(level, component, message, data) {
    // Skip if below current log level
    if (level < Logger._currentLevel) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: Logger._getLevelName(level),
      component,
      message,
      data
    };
    
    // Add to history (with limit)
    Logger._logHistory.unshift(entry);
    if (Logger._logHistory.length > Logger._maxHistorySize) {
      Logger._logHistory.pop();
    }
    
    // Output to console if enabled
    if (Logger._logToConsole) {
      const consoleMethod = Logger._getConsoleMethod(level);
      const formattedMessage = `[${timestamp}] [${entry.level}] [${component}] ${message}`;
      
      if (data !== undefined) {
        consoleMethod(formattedMessage, data);
      } else {
        consoleMethod(formattedMessage);
      }
    }
  }
  
  /**
   * Get the console method based on log level
   * @param {LogLevel} level - Log level
   * @returns {Function} Console method
   * @private
   */
  static _getConsoleMethod(level) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.log;
      case LogLevel.WARNING:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }
  
  /**
   * Get the string name of a log level
   * @param {LogLevel} level - Log level
   * @returns {String} Level name
   * @private
   */
  static _getLevelName(level) {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARNING:
        return 'WARNING';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }
  
  /**
   * Set the minimum log level to display
   * @param {LogLevel} level - Minimum log level
   */
  static setLevel(level) {
    Logger._currentLevel = level;
    
    // Log this change at the new level if possible
    if (level <= LogLevel.INFO) {
      Logger.info('Logger', `Log level set to ${Logger._getLevelName(level)}`);
    }
  }
  
  /**
   * Enable or disable console logging
   * @param {Boolean} enabled - Whether to log to console
   */
  static enableConsoleOutput(enabled) {
    Logger._logToConsole = enabled;
    
    // Log this change if enabling
    if (enabled) {
      Logger.info('Logger', 'Console logging enabled');
    }
  }
  
  /**
   * Get recent log history
   * @param {Number} [count=100] - Number of entries to retrieve
   * @param {LogLevel} [minLevel=DEBUG] - Minimum log level to include
   * @returns {Array} Array of log entries
   */
  static getHistory(count = 100, minLevel = LogLevel.DEBUG) {
    return Logger._logHistory
      .filter(entry => Logger._getLevelValue(entry.level) >= minLevel)
      .slice(0, count);
  }
  
  /**
   * Clear the log history
   */
  static clearHistory() {
    Logger._logHistory = [];
    Logger.info('Logger', 'Log history cleared');
  }
  
  /**
   * Get the numeric value of a level name
   * @param {String} levelName - Level name
   * @returns {LogLevel} Level value
   * @private
   */
  static _getLevelValue(levelName) {
    switch (levelName) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARNING':
        return LogLevel.WARNING;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.DEBUG;
    }
  }
  
  /**
   * Save the log to a file (browser only)
   * @returns {Boolean} Success status
   */
  static exportLogs() {
    try {
      const logText = Logger._logHistory.map(entry => {
        let line = `[${entry.timestamp}] [${entry.level}] [${entry.component}] ${entry.message}`;
        if (entry.data) {
          line += '\n' + JSON.stringify(entry.data, null, 2);
        }
        return line;
      }).join('\n');
      
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-logs-${new Date().toISOString().slice(0, 19).replace('T', '-')}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return false;
    }
  }
}
