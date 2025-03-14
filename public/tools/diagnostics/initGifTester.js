
/**
 * initGifTester.js - Initialize the GIF animation tester
 */

import { GifAnimationTester } from './GifAnimationTester.js';

// Create GIF tester instance
const gifTester = new GifAnimationTester();

// Make it available globally
window.gifTester = gifTester;

console.log("[GIF-TESTER] GIF animation tester initialized and available as window.gifTester");
console.log("[GIF-TESTER] Use window.gifTester.show() to open the tester");

// Add tester button to debug menu if it exists
function addTesterButtonToDebugMenu() {
  // Check if debug menu exists
  if (window.gameDebugMenu && window.gameDebugMenu.addToolButton) {
    window.gameDebugMenu.addToolButton(
      "Test GIF Animations", 
      () => window.gifTester.show()
    );
    console.log("[GIF-TESTER] Button added to debug menu");
  } else {
    console.log("[GIF-TESTER] Debug menu not found, button not added");
    
    // Try again in 2 seconds
    setTimeout(addTesterButtonToDebugMenu, 2000);
  }
}

// Try to add button to debug menu
addTesterButtonToDebugMenu();
