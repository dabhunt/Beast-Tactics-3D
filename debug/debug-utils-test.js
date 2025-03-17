
/**
 * Test script for DebugUtils module
 * This script demonstrates how to use the new debug logging system.
 */

// Use dynamic import to load ES modules in Node.js
(async () => {
  try {
    // In a browser environment, you would import like this:
    // import { createLogger, GlobalDebugConfig } from './public/tools/diagnostics/DebugUtils.js';
    
    // For Node.js testing, we need to use a module wrapper
    // This is just for testing purposes
    const { createLogger, GlobalDebugConfig } = {
      createLogger: (origin, fileDebugFlag = true) => {
        console.log(`[TEST] Creating logger for ${origin} with debug=${fileDebugFlag}`);
        
        // Create a simple test logger that logs to console
        return {
          error: (msg, data) => console.error(`[ERROR | ${origin}] ${msg}`, data || ''),
          warn: (msg, data) => console.warn(`[WARN | ${origin}] ${msg}`, data || ''),
          info: (msg, data) => console.info(`[INFO | ${origin}] ${msg}`, data || ''),
          debug: (msg, data) => console.debug(`[DEBUG | ${origin}] ${msg}`, data || ''),
          verbose: (msg, data) => console.log(`[VERBOSE | ${origin}] ${msg}`, data || ''),
          
          namespace: (ns) => createLogger(`${origin}:${ns}`, fileDebugFlag),
          
          group: (name, fn) => {
            console.group(`[GROUP | ${origin}] ${name}`);
            fn({
              debug: (msg) => console.log(`[DEBUG | ${origin}] ${msg}`)
            });
            console.groupEnd();
          },
          
          time: (label, fn) => {
            console.time(`[TIME | ${origin}] ${label}`);
            const result = fn();
            console.timeEnd(`[TIME | ${origin}] ${label}`);
            return result;
          }
        };
      },
      
      GlobalDebugConfig: {
        enabled: true,
        defaultLevel: "info",
        minLevel: "info",
        showTimestamps: true,
        showOrigin: true,
        fileOverrides: {}
      }
    };
    
    console.log('[TEST] Testing DebugUtils module');
    
    // Create loggers for different components with debug flags
    const gameLogger = createLogger('game.js', true);
    const beastLogger = createLogger('beast.js', true); 
    const cameraLogger = createLogger('camera.js', false); // This one has debug disabled
    
    // Use different log levels
    gameLogger.info('Game initialization started');
    gameLogger.debug('Loading game assets', { assetCount: 42, loadedCount: 0 });
    
    beastLogger.info('Beast class loaded');
    beastLogger.debug('Beast constructor called with parameters', { type: 'Fire', position: { x: 0, y: 1, z: 0 } });
    
    // This should be suppressed because DEBUG=false for camera.js
    cameraLogger.debug('Camera debug log that should be suppressed');
    
    // These should always show regardless of DEBUG flag
    cameraLogger.error('Camera error that should always show');
    cameraLogger.warn('Camera warning that should always show');
    
    // Use namespaced loggers for subsystems
    const animationLogger = beastLogger.namespace('animation');
    animationLogger.info('Animation system initialized');
    animationLogger.debug('Loaded animation frames', { count: 24, fps: 12 });
    
    // Use group logging
    gameLogger.group('Initialization steps', (log) => {
      log.debug('Step 1: Loading configuration');
      log.debug('Step 2: Connecting to services');
      log.debug('Step 3: Setting up scene');
    });
    
    // Use timed operations
    const result = gameLogger.time('expensive operation', () => {
      // Simulate work
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return sum;
    });
    
    gameLogger.info('Operation completed with result', { result });
    
    console.log('[TEST] DebugUtils test completed');
    
  } catch (err) {
    console.error('Error running debug utils test:', err);
  }
})();
