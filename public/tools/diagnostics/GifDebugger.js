/**
 * GifDebugger.js - Debugging tool for GIF animations in THREE.js
 * 
 * This tool helps diagnose and visualize GIF animation issues
 * by providing a debug panel with preview capabilities.
 */

class GifDebugger {
  constructor() {
    this.debugContainer = null;
    this.previewCanvas = null;
    this.debugLog = [];

    console.log("[GIF-DEBUGGER] GifDebugger instance created");
  }

  /**
   * Create and show the debug UI
   */
  showDebugUI() {
    if (this.debugContainer) return;

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

    // Add to document
    document.body.appendChild(this.debugContainer);

    this.addLogEntry('GIF Debugger UI initialized');
  }

  /**
   * Log a message to the debug UI
   * @param {string} message - Message to log
   */
  addLogEntry(message) {
    this.debugLog.push({
      time: new Date(),
      message
    });

    // Update UI if visible
    if (this.debugContainer) {
      const logElement = document.getElementById('gif-debug-log');
      if (logElement) {
        const entry = document.createElement('div');
        entry.textContent = `${new Date().toISOString().substr(11, 8)}: ${message}`;
        logElement.appendChild(entry);

        // Auto-scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
      }
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
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    try {
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
    if (this.debugContainer && this.debugContainer.parentNode) {
      this.debugContainer.parentNode.removeChild(this.debugContainer);
      this.debugContainer = null;
      console.log("[GIF-DEBUGGER] Debug UI hidden");
    }
  }

  /**
   * Clear all logs from the debug panel
   */
  clearLogs() {
    this.debugLog = [];

    if (this.debugContainer) {
      const logElement = document.getElementById('gif-debug-log');
      if (logElement) {
        logElement.innerHTML = '';
      }
    }

    console.log("[GIF-DEBUGGER] Logs cleared");
  }

  /**
   * Load and test a GIF file
   * @param {string} url - URL of the GIF file to test
   */
  testGifFile(url) {
    this.addLogEntry(`Testing GIF file: ${url}`);

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

      // Check if the omggif library is available
      if (window.GifReader) {
        this.addLogEntry('GIF parser available, analyzing frames...');
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
          // Parse the GIF using omggif
          if (!window.GifReader) {
            throw new Error('GifReader not available');
          }

          const gif = new window.GifReader(data);

          // Log GIF info
          this.addLogEntry(`GIF parsed successfully: ${gif.numFrames()} frames`);
          this.addLogEntry(`GIF dimensions: ${gif.width}x${gif.height}`);

          // Display frame info
          for (let i = 0; i < gif.numFrames(); i++) {
            const frameInfo = gif.frameInfo(i);
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
}

// Create and export singleton instance
const gifDebugger = new GifDebugger();

// Make it globally available
window.gifDebugger = gifDebugger;

console.log("[GIF-DEBUGGER] GIF Debugger initialized and available as window.gifDebugger");