
/**
 * GifDebugger - Diagnostic tool for analyzing and debugging GIF animations
 * 
 * This tool helps debug GIF animation loading and display issues within the THREE.js renderer.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

export class GifDebugger {
  constructor() {
    console.log("[GIF-DEBUGGER] Initializing GIF debugger tool");
    
    this.debugContainer = null;
    this.previewCanvas = null;
    this.debugLog = [];

    // Create debug UI automatically at startup
    this._createDebugUI();
    
    console.log("[GIF-DEBUGGER] GifDebugger instance created");
  }

  /**
   * Create the debug UI container but don't show it yet
   * @private
   */
  _createDebugUI() {
    // Create container
    this.debugContainer = document.createElement('div');
    this.debugContainer.id = 'gif-debugger';
    this.debugContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 10000;
      max-height: 400px;
      overflow: auto;
      display: none;
    `;

    // Create header
    const header = document.createElement('div');
    header.textContent = 'GIF Animation Debugger';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    this.debugContainer.appendChild(header);

    // Create preview canvas
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 150;
    this.previewCanvas.height = 150;
    this.previewCanvas.style.border = '1px solid #444';
    this.previewCanvas.style.display = 'block';
    this.previewCanvas.style.margin = '0 auto 10px auto';
    this.debugContainer.appendChild(this.previewCanvas);

    // Create log container
    const logContainer = document.createElement('div');
    logContainer.id = 'gif-debug-log';
    logContainer.style.cssText = `
      height: 150px;
      overflow-y: auto;
      font-size: 12px;
      border-top: 1px solid #444;
      padding-top: 5px;
    `;
    this.debugContainer.appendChild(logContainer);
    
    // Create control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    // Clear logs button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Logs';
    clearBtn.onclick = () => this.clearLogs();
    clearBtn.style.padding = '5px';
    buttonContainer.appendChild(clearBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => this.hideDebugUI();
    closeBtn.style.padding = '5px';
    buttonContainer.appendChild(closeBtn);
    
    this.debugContainer.appendChild(buttonContainer);

    // Add to document but keep hidden
    document.body.appendChild(this.debugContainer);
    
    this.addLogEntry('GIF Debugger UI initialized (hidden)');
  }

  /**
   * Show the debug UI
   */
  showDebugUI() {
    if (this.debugContainer) {
      this.debugContainer.style.display = 'block';
      console.log("[GIF-DEBUGGER] Debug UI shown");
      this.addLogEntry('Debug UI shown');
    }
  }

  /**
   * Log a message to the debug UI
   * @param {string} message - Message to log
   */
  addLogEntry(message) {
    // Add timestamp
    const time = new Date().toLocaleTimeString();
    const entry = {
      time: time,
      message: message
    };
    
    this.debugLog.push(entry);

    // Update UI if visible
    const logElement = document.getElementById('gif-debug-log');
    if (logElement) {
      const entryDiv = document.createElement('div');
      entryDiv.textContent = `${time}: ${message}`;
      logElement.appendChild(entryDiv);

      // Auto-scroll to bottom
      logElement.scrollTop = logElement.scrollHeight;
    }

    // Also log to console
    console.log(`[GIF-DEBUGGER] ${message}`);
  }

  /**
   * Preview a GIF frame on the debug canvas
   * @param {HTMLCanvasElement|HTMLImageElement} frame - Frame to preview
   */
  previewFrame(frame) {
    if (!this.previewCanvas) {
      console.warn("[GIF-DEBUGGER] Preview canvas not available yet");
      return;
    }

    const ctx = this.previewCanvas.getContext('2d');
    if (!ctx) {
      console.error("[GIF-DEBUGGER] Could not get 2D context from canvas");
      return;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    try {
      // Check if frame is valid
      if (!frame || !frame.width || !frame.height) {
        this.addLogEntry(`Invalid frame: ${frame ? 'Missing dimensions' : 'Null frame'}`);
        return;
      }
      
      // Draw and scale the frame to fit
      const scale = Math.min(
        this.previewCanvas.width / frame.width,
        this.previewCanvas.height / frame.height
      );

      const width = frame.width * scale;
      const height = frame.height * scale;
      const x = (this.previewCanvas.width - width) / 2;
      const y = (this.previewCanvas.height - height) / 2;

      ctx.drawImage(frame, x, y, width, height);
      this.addLogEntry(`Previewing frame: ${frame.width}x${frame.height}`);
    } catch (err) {
      this.addLogEntry(`Error previewing frame: ${err.message}`);
      console.error("[GIF-DEBUGGER] Frame preview error:", err);
    }
  }

  /**
   * Hide the debug UI
   */
  hideDebugUI() {
    if (this.debugContainer) {
      this.debugContainer.style.display = 'none';
      console.log("[GIF-DEBUGGER] Debug UI hidden");
    }
  }

  /**
   * Clear all logs from the debug panel
   */
  clearLogs() {
    this.debugLog = [];

    const logElement = document.getElementById('gif-debug-log');
    if (logElement) {
      logElement.innerHTML = '';
    }

    console.log("[GIF-DEBUGGER] Logs cleared");
  }

  /**
   * Load and test a GIF file
   * @param {string} url - URL of the GIF file to test
   */
  testGifFile(url) {
    this.addLogEntry(`Testing GIF file: ${url}`);
    this.showDebugUI(); // Make sure UI is visible

    // Create an Image element to load the GIF
    const img = new Image();

    img.onload = () => {
      this.addLogEntry(`GIF loaded: ${img.width}x${img.height}`);

      // Display the loaded image
      if (this.previewCanvas) {
        const ctx = this.previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        // Scale to fit
        const scale = Math.min(
          this.previewCanvas.width / img.width,
          this.previewCanvas.height / img.height
        );

        const width = img.width * scale;
        const height = img.height * scale;
        const x = (this.previewCanvas.width - width) / 2;
        const y = (this.previewCanvas.height - height) / 2;

        ctx.drawImage(img, x, y, width, height);
      }

      // Check if GIF parser is available
      if (typeof window.GifReader !== 'undefined') {
        this.addLogEntry('GIF parser available, analyzing frames...');
        this.analyzeGifWithFetch(url);
      } else if (typeof window.omggif !== 'undefined') {
        this.addLogEntry('omggif library available, analyzing frames...');
        this.analyzeGifWithFetch(url);
      } else {
        this.addLogEntry('GIF parser not available, only static preview shown');
      }
    };

    img.onerror = (err) => {
      this.addLogEntry(`Error loading GIF: ${err.message || 'Unknown error'}`);
      console.error('[GIF-DEBUGGER] Error loading GIF:', err);
    };

    // Start loading
    img.src = url;
  }

  /**
   * Analyze a GIF file using the omggif library via fetch
   * @param {string} url - URL of the GIF to analyze
   */
  analyzeGifWithFetch(url) {
    this.addLogEntry(`Fetching GIF binary data from: ${url}`);

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        const data = new Uint8Array(buffer);

        try {
          // Try different known GIF reader implementations
          let gifReader = null;
          
          if (typeof window.GifReader !== 'undefined') {
            this.addLogEntry('Using GifReader implementation');
            gifReader = new window.GifReader(data);
          } else if (typeof window.omggif !== 'undefined' && typeof window.omggif.GifReader !== 'undefined') {
            this.addLogEntry('Using omggif.GifReader implementation');
            gifReader = new window.omggif.GifReader(data);
          } else {
            throw new Error('No compatible GIF parser found');
          }

          // Log GIF info
          this.addLogEntry(`GIF parsed successfully: ${gifReader.numFrames()} frames`);
          this.addLogEntry(`GIF dimensions: ${gifReader.width}x${gifReader.height}`);

          // Display frame info
          for (let i = 0; i < gifReader.numFrames(); i++) {
            const frameInfo = gifReader.frameInfo(i);
            this.addLogEntry(`Frame ${i+1}: Delay ${frameInfo.delay * 10}ms, Disposal: ${frameInfo.disposal}`);
          }
        } catch (err) {
          this.addLogEntry(`Error parsing GIF: ${err.message}`);
          console.error('[GIF-DEBUGGER] GIF parsing error:', err);
        }
      })
      .catch(err => {
        this.addLogEntry(`Error fetching GIF: ${err.message}`);
        console.error('[GIF-DEBUGGER] Fetch error:', err);
      });
  }

  /**
   * Set up a button to connect with an existing debug menu
   * @param {HTMLElement} debugMenu - The debug menu element to integrate with
   */
  connectToDebugMenu(debugMenu) {
    if (!debugMenu) {
      console.warn('[GIF-DEBUGGER] No debug menu provided to connect with');
      return;
    }
    
    // Create a button for the debug menu
    const button = document.createElement('button');
    button.textContent = 'GIF Debugger';
    button.onclick = () => this.showDebugUI();
    button.className = 'debug-button';
    
    // Add to debug menu
    debugMenu.appendChild(button);
    
    this.addLogEntry('Connected to debug menu');
  }
}

// Create global instance for backward compatibility
window.gifDebugger = new GifDebugger();
console.log("[GIF-DEBUGGER] GifDebugger initialized and available as window.gifDebugger");
