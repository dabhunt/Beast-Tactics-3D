
/**
 * TestRunner.js
 * Tool for testing and validating the core game architecture
 */

import { GameManager } from '../../core/GameManager.js';
import { DiagnosticsTool } from '../../utils/DiagnosticsTool.js';
import { Logger } from '../../utils/Logger.js';

// Global test runner instance
let testRunner = null;

/**
 * Runs a set of diagnostic tests on the game architecture
 * @param {Boolean} displayResults - Whether to display results in the DOM
 * @returns {Promise<Object>} Test results
 */
export async function runDiagnostics(displayResults = true) {
  console.log('======== BEAST TACTICS DIAGNOSTIC TESTS ========');
  console.log('Starting diagnostic tests...');
  
  try {
    // Create a fresh game manager instance for testing
    const gameManager = new GameManager({
      version: '1.0.0',
      debugMode: true,
      testing: true
    });
    
    Logger.info('TestRunner', 'Created test GameManager instance');
    
    // Initialize game manager
    await gameManager.initialize();
    
    // Create diagnostics tool
    const diagnostics = new DiagnosticsTool(gameManager);
    testRunner = diagnostics;
    
    // Run tests
    const results = await diagnostics.runArchitectureTests();
    
    // Display results in DOM if requested
    if (displayResults) {
      diagnostics.showReportInDOM();
    }
    
    console.log('======== DIAGNOSTIC TESTS COMPLETE ========');
    return results;
  } catch (error) {
    console.error('Error running diagnostics:', error);
    Logger.error('TestRunner', 'Failed to run diagnostics', error);
    
    // Show error report
    const errorReport = document.createElement('div');
    errorReport.style.position = 'fixed';
    errorReport.style.top = '0';
    errorReport.style.left = '0';
    errorReport.style.width = '100%';
    errorReport.style.padding = '20px';
    errorReport.style.backgroundColor = '#ffebee';
    errorReport.style.color = '#b71c1c';
    errorReport.style.zIndex = '9999';
    errorReport.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    errorReport.innerHTML = `
      <h2>Diagnostic Tests Failed</h2>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre>${error.stack}</pre>
      <button id="close-error-btn" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; cursor: pointer;">Close</button>
    `;
    
    document.body.appendChild(errorReport);
    
    document.getElementById('close-error-btn').addEventListener('click', () => {
      document.body.removeChild(errorReport);
    });
    
    return { error: error };
  }
}

/**
 * Get the current test runner instance
 * @returns {DiagnosticsTool} The diagnostic tool instance
 */
export function getDiagnosticsTool() {
  return testRunner;
}
