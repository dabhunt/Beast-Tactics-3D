
/**
 * LogViewer component for Beast Tactics Debug Menu
 * Displays logs from the DebugUtils module and provides filtering options
 */

import { GlobalDebugConfig } from './DebugUtils.js';

export class LogViewer {
  /**
   * Creates a new LogViewer instance
   * @param {HTMLElement} container - The container element to render the viewer in
   */
  constructor(container) {
    console.log("[LOG-VIEWER] Initializing LogViewer component");
    
    this.container = container;
    this.activeLoggers = new Map();
    this.logBuffer = [];
    this.maxBufferSize = 500; // Maximum number of log entries to keep
    
    // Create and render the UI
    this._createUI();
    
    // Hook into console methods to capture logs
    this._hookConsole();
    
    console.log("[LOG-VIEWER] LogViewer component initialized");
  }
  
  /**
   * Create the LogViewer UI
   * @private
   */
  _createUI() {
    // Clear container
    this.container.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.style.marginBottom = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    
    const title = document.createElement('h3');
    title.textContent = 'Log Viewer';
    title.style.margin = '0';
    header.appendChild(title);
    
    // Create controls
    const controls = document.createElement('div');
    
    // Create filter dropdown
    const levelFilter = document.createElement('select');
    const levels = ['All', 'Error', 'Warn', 'Info', 'Debug', 'Verbose'];
    levels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.toLowerCase();
      option.textContent = level;
      levelFilter.appendChild(option);
    });
    
    levelFilter.addEventListener('change', () => {
      this._updateLogDisplay();
    });
    
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Level: ';
    filterLabel.appendChild(levelFilter);
    filterLabel.style.marginRight = '10px';
    controls.appendChild(filterLabel);
    
    // Create clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.padding = '2px 6px';
    clearBtn.addEventListener('click', () => {
      this.clearLogs();
    });
    controls.appendChild(clearBtn);
    
    // Add auto-scroll toggle
    const autoScrollLabel = document.createElement('label');
    autoScrollLabel.style.marginLeft = '10px';
    
    const autoScrollCheckbox = document.createElement('input');
    autoScrollCheckbox.type = 'checkbox';
    autoScrollCheckbox.checked = true;
    autoScrollCheckbox.id = 'auto-scroll-toggle';
    
    autoScrollLabel.appendChild(autoScrollCheckbox);
    autoScrollLabel.appendChild(document.createTextNode(' Auto-scroll'));
    controls.appendChild(autoScrollLabel);
    
    header.appendChild(controls);
    this.container.appendChild(header);
    
    // Create log display area
    this.logDisplay = document.createElement('div');
    this.logDisplay.style.height = '300px';
    this.logDisplay.style.overflow = 'auto';
    this.logDisplay.style.backgroundColor = '#111';
    this.logDisplay.style.color = '#eee';
    this.logDisplay.style.fontFamily = 'monospace';
    this.logDisplay.style.fontSize = '12px';
    this.logDisplay.style.padding = '5px';
    this.logDisplay.style.borderRadius = '3px';
    this.container.appendChild(this.logDisplay);
    
    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.style.marginTop = '10px';
    filterContainer.style.display = 'flex';
    filterContainer.style.alignItems = 'center';
    
    const fileFilterLabel = document.createElement('label');
    fileFilterLabel.textContent = 'File filter: ';
    fileFilterLabel.style.marginRight = '5px';
    filterContainer.appendChild(fileFilterLabel);
    
    this.fileFilter = document.createElement('input');
    this.fileFilter.type = 'text';
    this.fileFilter.placeholder = 'Filter by file name...';
    this.fileFilter.style.flex = '1';
    this.fileFilter.addEventListener('input', () => {
      this._updateLogDisplay();
    });
    filterContainer.appendChild(this.fileFilter);
    
    this.container.appendChild(filterContainer);
    
    // Create logger list
    this.loggerListContainer = document.createElement('div');
    this.loggerListContainer.style.marginTop = '10px';
    this.loggerListContainer.style.maxHeight = '150px';
    this.loggerListContainer.style.overflow = 'auto';
    this.container.appendChild(this.loggerListContainer);
    
    // Store references
    this.levelFilter = levelFilter;
    this.autoScrollCheckbox = autoScrollCheckbox;
    
    // Initialize empty logger list
    this._updateLoggerList();
  }
  
  /**
   * Hook into console methods to capture logs
   * @private
   */
  _hookConsole() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };
    
    // For each console method
    Object.keys(originalConsole).forEach(method => {
      console[method] = (...args) => {
        // Call original method
        originalConsole[method](...args);
        
        // Process the log for our viewer
        this._processLog(method, args);
      };
    });
    
    console.log("[LOG-VIEWER] Console methods hooked for log capture");
  }
  
  /**
   * Process a captured log entry
   * @param {string} level - Log level
   * @param {Array} args - Console arguments
   * @private
   */
  _processLog(level, args) {
    // Only process string messages that look like they're from our logger
    const firstArg = args[0];
    if (typeof firstArg !== 'string' || !firstArg.startsWith('[')) {
      return;
    }
    
    try {
      // Extract log information
      const messageText = firstArg;
      
      // Try to parse the origin from the message format [LEVEL | origin] message
      let origin = 'unknown';
      const originMatch = messageText.match(/\[\w+\s+\|\s+([^\]]+)\]/);
      
      if (originMatch && originMatch[1]) {
        origin = originMatch[1].trim();
      }
      
      // Parse timestamp if present
      let timestamp = new Date();
      const timeMatch = messageText.match(/\[([0-9:.]+)\s+\|/);
      
      if (timeMatch && timeMatch[1]) {
        // Convert time string to Date object
        const timeStr = timeMatch[1].trim();
        const today = new Date().toISOString().split('T')[0];
        timestamp = new Date(`${today}T${timeStr}Z`);
      }
      
      // Extract the actual message content
      let content = messageText;
      const contentMatch = messageText.match(/\](.+)$/);
      
      if (contentMatch && contentMatch[1]) {
        content = contentMatch[1].trim();
      }
      
      // Data object (second argument)
      const data = args.length > 1 ? args[1] : null;
      
      // Create log entry
      const logEntry = {
        timestamp,
        level: level === 'log' ? 'info' : level,
        origin,
        message: content,
        data,
        raw: messageText
      };
      
      // Add to buffer, respecting size limit
      this.logBuffer.push(logEntry);
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer.shift();
      }
      
      // Track active loggers
      if (!this.activeLoggers.has(origin)) {
        this.activeLoggers.set(origin, {
          name: origin,
          enabled: true,
          count: 0
        });
        
        // Need to update the logger list
        this._updateLoggerList();
      }
      
      // Increment count for this logger
      const loggerInfo = this.activeLoggers.get(origin);
      loggerInfo.count++;
      this.activeLoggers.set(origin, loggerInfo);
      
      // Update the display
      this._updateLogDisplay();
    } catch (err) {
      // Don't use console.error here to avoid infinite loop
      const originalError = console.error;
      originalError("[LOG-VIEWER] Error processing log:", err);
    }
  }
  
  /**
   * Update the log display based on current filters
   * @private
   */
  _updateLogDisplay() {
    // Get current filter values
    const levelFilter = this.levelFilter.value;
    const fileFilter = this.fileFilter.value.toLowerCase();
    
    // Filter logs
    const filteredLogs = this.logBuffer.filter(log => {
      // Check level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }
      
      // Check file filter
      if (fileFilter && !log.origin.toLowerCase().includes(fileFilter)) {
        return false;
      }
      
      // Check if logger is enabled
      const loggerInfo = this.activeLoggers.get(log.origin);
      if (loggerInfo && !loggerInfo.enabled) {
        return false;
      }
      
      return true;
    });
    
    // Clear display
    this.logDisplay.innerHTML = '';
    
    // Add filtered logs
    filteredLogs.forEach(log => {
      const logElement = document.createElement('div');
      logElement.className = `log-entry log-${log.level}`;
      
      // Set background color based on log level
      switch (log.level) {
        case 'error':
          logElement.style.color = '#ff5555';
          break;
        case 'warn':
          logElement.style.color = '#ffaa00';
          break;
        case 'info':
          logElement.style.color = '#aaaaff';
          break;
        case 'debug':
          logElement.style.color = '#55ff55';
          break;
        default:
          logElement.style.color = '#aaaaaa';
      }
      
      // Format time
      const timeStr = log.timestamp.toTimeString().split(' ')[0];
      
      // Create log text content
      logElement.textContent = `${timeStr} [${log.level.toUpperCase()}] ${log.origin}: ${log.message}`;
      
      // Add data tooltip if present
      if (log.data) {
        try {
          // Custom replacer function to handle circular references and THREE.js objects
          const safeReplacer = (key, value) => {
            // Catch null/undefined early
            if (value === null || value === undefined) {
              return value;
            }
            
            // Handle functions directly, regardless of parent
            if (typeof value === 'function') {
              return '[Function]';
            }
            
            // Handle primitive values directly
            if (typeof value !== 'object' || value === null) {
              return value;
            }
            
            // Begin handling objects
            try {
              // Handle Beast objects which have complex nesting
              if (value.type && ['Fire', 'Water', 'Earth', 'Wind', 'Electric', 'Plant', 'Metal', 'Dark', 'Light', 'Combat', 'Spirit', 'Corrosion'].includes(value.type)) {
                if (value.scene || value.camera || value.position) {
                  return `[Beast: ${value.type || 'Unknown'}]`;
                }
              }
              
              // Explicitly detect Scene objects which have known serialization issues
              if (value.isScene || (value.type === 'Scene' && value.uuid)) {
                return '[THREE.Scene]';
              }
              
              // Handle all cameras
              if (value.isCamera || (value.fov && value.aspect)) {
                return `[THREE.${value.type || 'Camera'}]`;
              }
              
              // Check for known THREE.js classes by properties
              if (
                value.isObject3D || value.isGeometry || value.isMaterial || value.isBufferGeometry ||
                (value.uuid && value.type && (value.matrix || value.color || value.layers)) ||
                (value.geometry && value.material) ||
                (value.intensity && value.shadow)
              ) {
                return `[THREE.${value.type || 'Object'}]`;
              }
              
              // Handle collections of THREE.js objects (like children arrays)
              if (Array.isArray(value)) {
                if (value.length > 0 && value[0] && value[0].isObject3D) {
                  return `[Array of ${value.length} THREE objects]`;
                }
                
                // Keep arrays but with safely replaced contents
                return value;
              }
              
              // Handle HTML elements
              if (value instanceof Element) {
                return `[HTML ${value.tagName} Element]`;
              }
              
              // Handle various special object types that cannot be stringified
              if (value instanceof Map) {
                return `[Map with ${value.size} entries]`;
              }
              
              if (value instanceof Set) {
                return `[Set with ${value.size} entries]`;
              }
              
              if (value instanceof WeakMap || value instanceof WeakSet) {
                return `[${value.constructor.name}]`;
              }
            } catch (error) {
              // If any error occurs during property access, return a safe string
              return `[Complex Object: ${typeof value}]`;
            }
            
            // For regular objects, continue normal JSON traversal
            return value;
          };
          
          // Try to stringify the data with our custom replacer
          let safeJsonString;
          try {
            // First attempt: Try to stringify with a depth limit to avoid deep recursion
            let processedData = log.data;
            
            // If data is an object, create a safe copy with limited depth
            if (typeof log.data === 'object' && log.data !== null) {
              // Helper function to clone with depth limit
              const cloneWithDepthLimit = (obj, depth = 3) => {
                if (depth <= 0) return '[Nested Object]';
                if (typeof obj !== 'object' || obj === null) return obj;
                
                if (Array.isArray(obj)) {
                  return obj.map(item => cloneWithDepthLimit(item, depth - 1));
                }
                
                const result = {};
                for (const key in obj) {
                  try {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                      result[key] = cloneWithDepthLimit(obj[key], depth - 1);
                    }
                  } catch (e) {
                    result[key] = '[Inaccessible Property]';
                  }
                }
                return result;
              };
              
              processedData = cloneWithDepthLimit(log.data);
            }
            
            safeJsonString = JSON.stringify(processedData, safeReplacer, 2);
          } catch (err) {
            console.warn('[LOG-VIEWER] Failed to stringify log data:', err);
            // Log the name of the object constructor to help with debugging
            const constructorName = log.data && log.data.constructor ? log.data.constructor.name : 'Unknown';
            // Fallback to a simpler representation with more details
            safeJsonString = JSON.stringify({
              stringifyError: err.message,
              dataType: typeof log.data,
              constructorName: constructorName,
              dataPreview: 'Cannot serialize object - may contain circular references or complex properties'
            }, null, 2);
          }
          logElement.title = safeJsonString;
          logElement.style.cursor = 'pointer';
          logElement.style.textDecoration = 'underline dotted';
          
          // Add click handler to show full data
          logElement.addEventListener('click', () => {
            console.log('[LOG-VIEWER] Log data details:', log.data);
            try {
              alert(safeJsonString);
            } catch (error) {
              console.error('[LOG-VIEWER] Failed to show data in alert:', error);
              alert('Data contains circular references or complex objects that cannot be displayed. See console for details.');
            }
          });
        } catch (jsonError) {
          console.warn('[LOG-VIEWER] Failed to stringify log data:', jsonError);
          logElement.title = 'Data contains circular references or complex objects that cannot be displayed';
          logElement.style.cursor = 'pointer';
          logElement.style.textDecoration = 'underline dotted';
          
          // Add click handler to show limited data
          logElement.addEventListener('click', () => {
            console.log('[LOG-VIEWER] Log data details (cannot be stringified):', log.data);
            alert('Data contains circular references or complex objects. Check the console for the raw data.');
          });
        }
      }
      
      // Add to display
      this.logDisplay.appendChild(logElement);
    });
    
    // Auto-scroll to bottom if enabled
    if (this.autoScrollCheckbox.checked) {
      this.logDisplay.scrollTop = this.logDisplay.scrollHeight;
    }
  }
  
  /**
   * Update the logger list UI
   * @private
   */
  _updateLoggerList() {
    // Clear list
    this.loggerListContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.textContent = 'Active Loggers:';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '5px';
    this.loggerListContainer.appendChild(header);
    
    // Create logger toggle elements
    const loggerList = document.createElement('div');
    loggerList.style.display = 'flex';
    loggerList.style.flexWrap = 'wrap';
    
    // Sort loggers by name
    const sortedLoggers = Array.from(this.activeLoggers.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Add each logger as a toggle button
    sortedLoggers.forEach(logger => {
      const loggerToggle = document.createElement('div');
      loggerToggle.style.margin = '2px';
      loggerToggle.style.padding = '2px 5px';
      loggerToggle.style.borderRadius = '3px';
      loggerToggle.style.cursor = 'pointer';
      loggerToggle.style.backgroundColor = logger.enabled ? '#444' : '#222';
      loggerToggle.textContent = `${logger.name} (${logger.count})`;
      
      loggerToggle.addEventListener('click', () => {
        // Toggle logger state
        logger.enabled = !logger.enabled;
        this.activeLoggers.set(logger.name, logger);
        
        // Update toggle appearance
        loggerToggle.style.backgroundColor = logger.enabled ? '#444' : '#222';
        
        // Update log display
        this._updateLogDisplay();
      });
      
      loggerList.appendChild(loggerToggle);
    });
    
    this.loggerListContainer.appendChild(loggerList);
    
    // Add global controls
    const globalControls = document.createElement('div');
    globalControls.style.marginTop = '5px';
    
    // Enable all button
    const enableAllBtn = document.createElement('button');
    enableAllBtn.textContent = 'Enable All';
    enableAllBtn.style.marginRight = '5px';
    enableAllBtn.addEventListener('click', () => {
      this.activeLoggers.forEach((logger, name) => {
        logger.enabled = true;
        this.activeLoggers.set(name, logger);
      });
      this._updateLoggerList();
      this._updateLogDisplay();
    });
    globalControls.appendChild(enableAllBtn);
    
    // Disable all button
    const disableAllBtn = document.createElement('button');
    disableAllBtn.textContent = 'Disable All';
    disableAllBtn.addEventListener('click', () => {
      this.activeLoggers.forEach((logger, name) => {
        logger.enabled = false;
        this.activeLoggers.set(name, logger);
      });
      this._updateLoggerList();
      this._updateLogDisplay();
    });
    globalControls.appendChild(disableAllBtn);
    
    this.loggerListContainer.appendChild(globalControls);
  }
  
  /**
   * Clear all logs from the display and buffer
   */
  clearLogs() {
    console.log("[LOG-VIEWER] Clearing log buffer");
    this.logBuffer = [];
    this._updateLogDisplay();
  }
  
  /**
   * Configure the global debug settings
   * @param {Object} config - Debug configuration object
   */
  setGlobalConfig(config) {
    // Merge with existing config
    Object.assign(GlobalDebugConfig, config);
    console.log("[LOG-VIEWER] Updated global debug configuration:", GlobalDebugConfig);
  }
}
