/**
 * initGifTester.js - GIF animation testing tool
 * 
 * This module provides a UI for testing GIF animations by loading
 * and displaying them in a custom UI with frame controls.
 */

console.log('[GIF-TESTER] Initializing GIF animation test tool');

// Create a UI for testing GIF animations
class GIFTester {
  constructor() {
    // Track initialization state
    this.initialized = false;
    this.visible = false;

    // Create UI elements
    this._createUI();

    // Set as initialized
    this.initialized = true;
    console.log('[GIF-TESTER] GIF animation tester initialized and available as window.gifTester');
    console.log('[GIF-TESTER] Use window.gifTester.show() to open the tester');
  }

  /**
   * Create the UI for the GIF tester
   * @private
   */
  _createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 9999;
      display: none;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    // Header
    const header = document.createElement('div');
    header.textContent = 'GIF Animation Tester';
    header.style.cssText = `
      font-weight: bold;
      text-align: center;
      border-bottom: 1px solid #444;
      padding-bottom: 5px;
    `;
    this.container.appendChild(header);

    // Input section
    const inputSection = document.createElement('div');
    inputSection.style.display = 'flex';
    inputSection.style.gap = '5px';

    // URL input
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'text';
    this.urlInput.placeholder = 'Enter GIF URL';
    this.urlInput.style.cssText = `
      flex: 1;
      padding: 5px;
      border-radius: 3px;
      border: none;
      background: #333;
      color: white;
    `;
    inputSection.appendChild(this.urlInput);

    // Load button
    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load GIF';
    loadButton.style.cssText = `
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      background: #2980b9;
      color: white;
      cursor: pointer;
    `;
    loadButton.addEventListener('click', () => this._loadGIF());
    inputSection.appendChild(loadButton);

    this.container.appendChild(inputSection);

    // Display section
    this.displaySection = document.createElement('div');
    this.displaySection.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;

    // Canvas for displaying the GIF
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 256;
    this.canvas.style.cssText = `
      background: #222;
      border: 1px solid #444;
      max-width: 100%;
      height: auto;
    `;
    this.displaySection.appendChild(this.canvas);

    // Info display
    this.infoDisplay = document.createElement('div');
    this.infoDisplay.style.cssText = `
      font-size: 12px;
      color: #aaa;
      width: 100%;
    `;
    this.displaySection.appendChild(this.infoDisplay);

    // Controls section
    this.controlsSection = document.createElement('div');
    this.controlsSection.style.cssText = `
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      justify-content: center;
    `;

    // Play/Pause button
    this.playButton = document.createElement('button');
    this.playButton.textContent = 'Play';
    this.playButton.style.cssText = `
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      background: #27ae60;
      color: white;
      cursor: pointer;
    `;
    this.controlsSection.appendChild(this.playButton);

    // Next frame button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Frame';
    nextButton.style.cssText = `
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      background: #f39c12;
      color: white;
      cursor: pointer;
    `;
    this.controlsSection.appendChild(nextButton);

    // Prev frame button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev Frame';
    prevButton.style.cssText = `
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      background: #f39c12;
      color: white;
      cursor: pointer;
    `;
    this.controlsSection.appendChild(prevButton);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      background: #c0392b;
      color: white;
      cursor: pointer;
      margin-left: auto;
    `;
    closeButton.addEventListener('click', () => this.hide());
    this.controlsSection.appendChild(closeButton);

    this.displaySection.appendChild(this.controlsSection);
    this.container.appendChild(this.displaySection);

    // Add container to document
    document.body.appendChild(this.container);

    console.log('[GIF-TESTER] Test UI created');

    // Attempt to add button to debug menu
    this._addButtonToDebugMenu();
  }

  /**
   * Add a button to the debug menu if it exists
   * @private
   */
  _addButtonToDebugMenu() {
    // Check if debug menu exists
    if (window.gameDebugMenu) {
      const button = window.gameDebugMenu.createButton('GIF Tester', () => {
        this.toggle();
      }, '#e67e22');

      // Add the button to a new section
      const section = window.gameDebugMenu.createSection('GIF Tools');
      section.appendChild(button);

      console.log('[GIF-TESTER] Added button to debug menu');
    } else {
      console.log('[GIF-TESTER] Debug menu not found, button not added');
    }
  }

  /**
   * Load a GIF from the URL in the input
   * @private
   */
  _loadGIF() {
    const url = this.urlInput.value.trim();
    if (!url) {
      alert('Please enter a GIF URL');
      return;
    }

    this.infoDisplay.textContent = `Loading ${url}...`;

    // TODO: Actually load and display the GIF
    // This would use the AnimatedGIFLoader

    console.log(`[GIF-TESTER] Loading GIF from URL: ${url}`);
  }

  /**
   * Show the GIF tester UI
   */
  show() {
    this.container.style.display = 'flex';
    this.visible = true;
  }

  /**
   * Hide the GIF tester UI
   */
  hide() {
    this.container.style.display = 'none';
    this.visible = false;
  }

  /**
   * Toggle the visibility of the GIF tester UI
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Create and expose a single instance
const tester = new GIFTester();

// Add to window object for debugging
window.gifTester = tester;