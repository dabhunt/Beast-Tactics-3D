/**
 * SystemCheck.js
 * Runs diagnostic tests on system capabilities and requirements
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Run basic system check diagnostics
 * @returns {Object} Test results
 */
export async function runSystemCheck() {
  Logger.info("SystemCheck", "Running system diagnostics");
  console.log("Starting system diagnostics check...");

  const results = {
    tests: []
  };

  try {
    // Check WebGL support
    await testWebGL(results);

    // Check browser features
    await testBrowserFeatures(results);

    // Check device capabilities
    await testDeviceCapabilities(results);

    // Log summary
    const passedTests = results.tests.filter(t => t.passed).length;
    const totalTests = results.tests.length;

    Logger.info("SystemCheck", `System check complete: ${passedTests}/${totalTests} tests passed`);
    console.log(`System check complete: ${passedTests}/${totalTests} tests passed`);

    return results;
  } catch (error) {
    Logger.error("SystemCheck", "Error running system check", error);
    console.error("Error running system check:", error);

    return {
      tests: [
        {
          name: "System Check",
          passed: false,
          message: `Error running diagnostics: ${error.message}`
        }
      ]
    };
  }
}

/**
 * Test WebGL support
 * @param {Object} results - Results object to update
 * @private
 */
async function testWebGL(results) {
  Logger.debug("SystemCheck", "Testing WebGL support");

  try {
    // Create temporary canvas to test WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      results.tests.push({
        name: "WebGL Support",
        passed: false,
        message: "WebGL is not supported by your browser"
      });
      return;
    }

    // Test WebGL version
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let renderer = "Unknown";
    let version = gl.getParameter(gl.VERSION);

    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    results.tests.push({
      name: "WebGL Support",
      passed: true,
      message: `WebGL supported. Renderer: ${renderer}, Version: ${version}`
    });

    Logger.debug("SystemCheck", "WebGL check passed", { renderer, version });
  } catch (error) {
    Logger.error("SystemCheck", "Error testing WebGL", error);

    results.tests.push({
      name: "WebGL Support",
      passed: false,
      message: `Error testing WebGL: ${error.message}`
    });
  }
}

/**
 * Test browser features needed by the game
 * @param {Object} results - Results object to update
 * @private
 */
async function testBrowserFeatures(results) {
  Logger.debug("SystemCheck", "Testing browser features");

  // Test for ES6 support
  try {
    // Test for ES6 features with a simple arrow function and template literal
    eval("const test = () => `ES6 support: ${true}`");

    results.tests.push({
      name: "ES6 Support",
      passed: true,
      message: "Browser supports ES6 JavaScript"
    });
  } catch (error) {
    results.tests.push({
      name: "ES6 Support",
      passed: false,
      message: "Browser does not support modern JavaScript (ES6)"
    });
  }

  // Check for local storage
  try {
    const storageAvailable = !!window.localStorage;

    results.tests.push({
      name: "Local Storage",
      passed: storageAvailable,
      message: storageAvailable ? 
        "Local storage is available" : 
        "Local storage is not available (game progress cannot be saved)"
    });
  } catch (error) {
    results.tests.push({
      name: "Local Storage",
      passed: false,
      message: "Local storage access error (private browsing mode?)"
    });
  }

  // Check for SessionStorage
  try {
    const sessionStorageAvailable = !!window.sessionStorage;

    results.tests.push({
      name: "Session Storage",
      passed: sessionStorageAvailable,
      message: sessionStorageAvailable ? 
        "Session storage is available" : 
        "Session storage is not available"
    });
  } catch (error) {
    results.tests.push({
      name: "Session Storage",
      passed: false,
      message: "Session storage access error"
    });
  }
}

/**
 * Test device capabilities
 * @param {Object} results - Results object to update
 * @private 
 */
async function testDeviceCapabilities(results) {
  Logger.debug("SystemCheck", "Testing device capabilities");

  // Test window size
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const minWidth = 800;
  const minHeight = 600;

  const adequateSize = windowWidth >= minWidth && windowHeight >= minHeight;

  results.tests.push({
    name: "Screen Size",
    passed: adequateSize,
    message: adequateSize ? 
      `Screen size adequate (${windowWidth}x${windowHeight})` : 
      `Screen size may be too small (${windowWidth}x${windowHeight}). Minimum recommended: ${minWidth}x${minHeight}`
  });

  // Test device memory if available
  if (navigator.deviceMemory) {
    const memory = navigator.deviceMemory;
    const adequateMemory = memory >= 4;

    results.tests.push({
      name: "Device Memory",
      passed: adequateMemory,
      message: adequateMemory ? 
        `Device has adequate memory (${memory}GB)` : 
        `Device memory may be low (${memory}GB). Recommended: 4GB+`
    });
  } else {
    Logger.debug("SystemCheck", "Device memory API not available");
  }

  // Test for hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    const cores = navigator.hardwareConcurrency;
    const adequateCores = cores >= 2;

    results.tests.push({
      name: "CPU Cores",
      passed: adequateCores,
      message: adequateCores ? 
        `Device has adequate CPU (${cores} cores)` : 
        `Device CPU may be limited (${cores} core). Recommended: 2+ cores`
    });
  } else {
    Logger.debug("SystemCheck", "Hardware concurrency API not available");
  }
}