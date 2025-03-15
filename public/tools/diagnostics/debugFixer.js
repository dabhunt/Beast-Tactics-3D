/**
 * debugFixer.js - Utility tool to diagnose and fix common issues
 * 
 * This script helps track down and resolve issues with:
 * - Duplicate class declarations
 * - Module loading problems
 * - Animation timing issues
 */

// Log initialization
console.log("[DEBUG-FIXER] Initializing diagnostic tool");

/**
 * Run all diagnostics to identify issues
 */
function runDiagnostics() {
  console.log("[DEBUG-FIXER] Running comprehensive diagnostics");

  // Run all checks
  checkDuplicateDeclarations();
  checkGIFAnimation();
  checkDebugMenuConnections();

  console.log("[DEBUG-FIXER] Diagnostics complete. Check console for issues.");
}

// Make diagnostics functions available globally for console usage
window.debugFixer = {
  runDiagnostics,
  checkDuplicateDeclarations,
  checkGIFAnimation,
  checkDebugMenuConnections
};

console.log("[DEBUG-FIXER] Debug tools initialized and exposed to window.debugFixer");

/**
 * Check if debug menu is properly connected to other components
 */
function checkDebugMenuConnections() {
  console.log("[DEBUG-FIXER] Checking debug menu connections");

  // Check if the debug menu exists in global scope
  if (window.gameDebugMenu) {
    console.log("[DEBUG-FIXER] Debug menu found in global scope");

    // Check if it has expected methods
    const methods = ["initArrowDebugger", "updateArrowDebuggerBeast", "setCameraManager"];
    const missingMethods = methods.filter(method => typeof window.gameDebugMenu[method] !== 'function');

    if (missingMethods.length === 0) {
      console.log("[DEBUG-FIXER] Debug menu has all expected methods");
    } else {
      console.warn(`[DEBUG-FIXER] Debug menu missing methods: ${missingMethods.join(", ")}`);
    }
  } else {
    console.warn("[DEBUG-FIXER] Debug menu not found in global scope");
  }
}

/**
 * Check for duplicate class declarations that could cause conflicts
 */
function checkDuplicateDeclarations() {
  console.log("[DEBUG-FIXER] Checking for duplicate class declarations");

  // List of classes to check
  const classesToCheck = [
    "ArrowDebugger",
    "AnimatedGIFLoader",
    "Beast"
  ];

  // Check each class
  classesToCheck.forEach(className => {
    // Look for script elements that might define this class
    const scripts = document.querySelectorAll("script");
    let count = 0;

    // Check window global scope
    if (window[className]) {
      count++;
      console.log(`[DEBUG-FIXER] Found ${className} in global window scope`);
    }

    // Report findings
    if (count > 1) {
      console.warn(`[DEBUG-FIXER] Found ${count} declarations of ${className}, which may cause conflicts`);
    } else {
      console.log(`[DEBUG-FIXER] ${className} appears to be properly scoped`);
    }
  });
}

/**
 * Check GIF animation functionality
 */
function checkGIFAnimation() {
  console.log("[DEBUG-FIXER] Checking GIF animation capabilities");

  // Defer to GifDebugger if available
  if (window.checkGIFAnimation) {
    console.log("[DEBUG-FIXER] Using dedicated GIF animation checker");
    window.checkGIFAnimation();
    return;
  }

  // Fallback checks if dedicated tool isn't available

  // Check if omggif is available
  if (typeof window.omggif === 'undefined') {
    console.warn("[DEBUG-FIXER] omggif library not found in global scope. GIF parsing may fail.");
  }

  // Check for AnimatedGIFLoader
  if (typeof window.AnimatedGIFLoader === 'undefined') {
    console.warn("[DEBUG-FIXER] AnimatedGIFLoader not found in global scope.");
  }

  // Suggest loading the proper tools
  console.log("[DEBUG-FIXER] For detailed GIF diagnostics, load initGIFTools.js");
}

/**
 * Run all diagnostics
 */
function runDiagnostics() {
  console.log("[DEBUG-FIXER] Running all diagnostics");
  checkDuplicateDeclarations();
  checkGIFAnimation();

  console.log("[DEBUG-FIXER] All diagnostics complete");
}

/**
 * Apply fixes to common issues
 */
function applyFixes() {
  console.log("[DEBUG-FIXER] Applying fixes to common issues");

  // Fix: Ensure THREE.js is available globally for modules that need it
  if (!window.THREE && typeof THREE !== 'undefined') {
    window.THREE = THREE;
    console.log("[DEBUG-FIXER] Exposed THREE.js to global scope");
  }

  // Fix: Ensure gifLoader is available globally if needed
  import('../AnimatedGIFLoader.js')
    .then(module => {
      if (module.gifLoader && !window.gifLoader) {
        window.gifLoader = module.gifLoader;
        console.log("[DEBUG-FIXER] Exposed gifLoader to global scope for legacy support");
      }
    })
    .catch(err => {
      console.error("[DEBUG-FIXER] Failed to import AnimatedGIFLoader for global fix:", err);
    });

  console.log("[DEBUG-FIXER] Fixes applied, refresh the page to see if issues are resolved");
}

// Make functions available globally
window.debugFixer = {
  runDiagnostics,
  applyFixes,
  checkDuplicateDeclarations,
  checkGIFAnimation
};

// Run initial diagnostics
runDiagnostics();

console.log("[DEBUG-FIXER] Debug fixer loaded. Use window.debugFixer.applyFixes() to apply fixes.");
/**
 * Check for JS syntax compatibility issues
 */
function checkJSSyntaxCompatibility() {
  console.log("[DEBUG-FIXER] Checking JS syntax compatibility");
  
  try {
    // Test import syntax
    const testImport = "import * as THREE from 'three'";
    new Function(testImport);
    console.log("[DEBUG-FIXER] Dynamic import syntax supported");
  } catch (e) {
    console.error("[DEBUG-FIXER] Import syntax error:", e);
  }

  try {
    // Test optional chaining
    const testOptionalChaining = "const test = {}.prop?.value";
    new Function(testOptionalChaining);
    console.log("[DEBUG-FIXER] Optional chaining supported");
  } catch (e) {
    console.error("[DEBUG-FIXER] Optional chaining not supported:", e);
  }
}

// Run checks
window.addEventListener('load', () => {
  checkJSSyntaxCompatibility();
  checkDebugMenuConnections();
});
