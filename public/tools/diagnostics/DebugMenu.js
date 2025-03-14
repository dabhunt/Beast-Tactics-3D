/**
 * DebugMenu.js - Create diagnostic UI for Beast Tactics
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";
import { getArrowDebugger } from './ArrowDebugger.js';

/**
 * Debug logging helper
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data = null) {
  if (data) {
    console.log(`[DEBUG] ${message}`, data);
  } else {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * DebugMenu class for Beast Tactics
 */
export class DebugMenu {
  /**
   * Create a new debug menu
   */
  constructor() {
    debugLog("Initializing debug menu");

    // Store references
    this.isVisible = false;
    this.currentBeast = null;
    this.panel = null;

    // Create UI
    this._createDebugPanel();

    // Initialize arrow debugger
    this.arrowDebugger = getArrowDebugger();
    debugLog("Arrow debugger initialized successfully");

    // Make globally available
    window.gameDebugMenu = this;
  }

  /**
   * Create the debug panel UI
   * @private
   */
  _createDebugPanel() {
    // Create main panel
    this.panel = document.createElement('div');
    this.panel.id = 'game-debug-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 300px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      max-height: 500px;
      overflow-y: auto;
      display: none;
    `;

    // Create header
    const header = document.createElement('div');
    header.innerHTML = '<h3 style="margin-top: 0">Beast Tactics Debug</h3>';
    this.panel.appendChild(header);

    // Create tools section
    const toolsSection = document.createElement('div');
    toolsSection.innerHTML = '<h4>Debug Tools</h4>';

    // Add arrow debugger button
    const arrowDebugBtn = document.createElement('button');
    arrowDebugBtn.textContent = 'Arrow Debugger';
    arrowDebugBtn.style.margin = '5px';
    arrowDebugBtn.addEventListener('click', () => {
      this.arrowDebugger.show();
    });
    toolsSection.appendChild(arrowDebugBtn);

    // Add GIF tester button
    const gifTesterBtn = document.createElement('button');
    gifTesterBtn.textContent = 'GIF Tester';
    gifTesterBtn.style.margin = '5px';
    gifTesterBtn.addEventListener('click', () => {
      if (window.gifTester) {
        window.gifTester.show();
      } else {
        alert('GIF Tester not available');
      }
    });
    toolsSection.appendChild(gifTesterBtn);

    this.panel.appendChild(toolsSection);

    // Add to document
    document.body.appendChild(this.panel);

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Debug';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1001;
      padding: 5px 10px;
      background-color: #333;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    `;
    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });
    document.body.appendChild(toggleBtn);
  }

  /**
   * Toggle debug menu visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.panel.style.display = this.isVisible ? 'block' : 'none';
  }

  /**
   * Connect a beast to the arrow debugger
   * @param {Object} beast - Beast instance to debug
   */
  updateArrowDebuggerBeast(beast) {
    debugLog(`Connecting ${beast.type} Beast to Debug Menu Arrow Debugger`);
    this.currentBeast = beast;
    this.arrowDebugger.setBeast(beast);
  }

  /**
   * Get the current beast being debugged
   * @returns {Object} Current beast instance
   */
  getCurrentBeast() {
    return this.currentBeast;
  }
}

// Initialize debug menu
document.addEventListener('DOMContentLoaded', () => {
  new DebugMenu();
});