
/**
 * ArrowDebuggerFix.js
 * Diagnostic tool to investigate ArrowDebugger loading issues
 */

console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Starting diagnostics...');

// Check for existing ArrowDebugger instances
if (window.ArrowDebugger) {
  console.log('[ARROW-DEBUGGER-DIAGNOSTICS] ArrowDebugger already exists in window scope:', {
    type: typeof window.ArrowDebugger,
    hasInit: typeof window.ArrowDebugger.init === 'function',
    hasUpdate: typeof window.ArrowDebugger.update === 'function'
  });
}

// Check for script elements to see if ArrowDebugger.js is loaded multiple times
const scriptElements = document.querySelectorAll('script');
const arrowDebuggerScripts = Array.from(scriptElements).filter(script => 
  script.src && script.src.includes('ArrowDebugger.js')
);

console.log('[ARROW-DEBUGGER-DIAGNOSTICS] ArrowDebugger script elements found:', arrowDebuggerScripts.length);
arrowDebuggerScripts.forEach((script, index) => {
  console.log(`[ARROW-DEBUGGER-DIAGNOSTICS] Script ${index + 1}:`, {
    src: script.src,
    type: script.type,
    async: script.async,
    defer: script.defer
  });
});

// List available modules in tools/diagnostics directory
console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Checking imports from diagnostics directory...');

// Attempt to import module to test if it works from diagnostics directory
import('./DebugMenu.js')
  .then(module => {
    console.log('[ARROW-DEBUGGER-DIAGNOSTICS] DebugMenu successfully imported');
    if (module.ArrowDebugger) {
      console.log('[ARROW-DEBUGGER-DIAGNOSTICS] ArrowDebugger is exported from DebugMenu.js');
    }
  })
  .catch(err => {
    console.error('[ARROW-DEBUGGER-DIAGNOSTICS] Error importing DebugMenu.js:', err);
  });

// Log suggestions based on findings
console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Potential fixes:');
console.log('1. Check if ArrowDebugger is being declared in multiple files');
console.log('2. Use an "export class ArrowDebugger" instead of "class ArrowDebugger" to avoid global scope conflicts');
console.log('3. Verify only one script is loading ArrowDebugger.js');
console.log('4. Convert ArrowDebugger to a proper ES module with export/import');

// Function to fix ArrowDebugger loading issues
window.fixArrowDebugger = function() {
  console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Attempting to fix ArrowDebugger issues...');
  
  // Remove duplicate script elements
  const duplicates = Array.from(arrowDebuggerScripts).slice(1);
  duplicates.forEach(script => {
    console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Removing duplicate script:', script.src);
    script.parentNode.removeChild(script);
  });
  
  console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Reload the page to see if this fixed the issue');
};

console.log('[ARROW-DEBUGGER-DIAGNOSTICS] Diagnostics complete. Run window.fixArrowDebugger() to attempt automatic fix.');
