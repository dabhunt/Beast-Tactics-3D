
/**
 * RunDiagnostics.js
 * A script to run diagnostics on the game system
 */

import { Logger } from "../../public/js/utils/Logger.js";
import { GameManager } from "../../public/js/core/GameManager.js";
import { diagnoseStateTransitions, fixCommonStateIssues } from "./StateTransitionDebugger.js";
import { validatePlayerInputState } from "./StateDebugger.js";
import { GameStates } from "../../public/js/models/GameStates.js";

/**
 * Run full diagnostic suite
 */
export async function runFullDiagnostics() {
  Logger.info('RunDiagnostics', 'Starting full diagnostic suite');
  console.log('========== GAME DIAGNOSTICS ==========');
  console.log('Running full diagnostic suite...');
  
  try {
    // Initialize a game manager for testing
    console.log('\n[1] Initializing test game manager...');
    const gameManager = new GameManager({
      debugMode: true,
      diagnosticsMode: true
    });
    
    await gameManager.initialize();
    console.log('Game manager initialized successfully.');
    
    // Diagnose state transitions
    console.log('\n[2] Running state transition diagnostics...');
    const stateResults = diagnoseStateTransitions(gameManager.stateManager, gameManager);
    
    console.log(`State diagnostics complete. Found ${stateResults.issues.length} issues.`);
    
    if (stateResults.issues.length > 0) {
      console.log('Issues:');
      stateResults.issues.forEach((issue, i) => {
        console.log(`  ${i+1}. ${issue}`);
      });
    }
    
    // Try to fix any state issues
    if (stateResults.issues.length > 0) {
      console.log('\n[3] Attempting to fix state issues...');
      const fixResults = fixCommonStateIssues(gameManager.stateManager, gameManager);
      
      console.log(`Fix attempts complete. ${fixResults.fixesSucceeded.length} succeeded, ${fixResults.remainingIssues.length} issues remain.`);
      
      if (fixResults.fixesSucceeded.length > 0) {
        console.log('Fixed:');
        fixResults.fixesSucceeded.forEach((fix, i) => {
          console.log(`  ${i+1}. ${fix}`);
        });
      }
      
      if (fixResults.remainingIssues.length > 0) {
        console.log('Remaining issues:');
        fixResults.remainingIssues.forEach((issue, i) => {
          console.log(`  ${i+1}. ${issue}`);
        });
      }
    }
    
    // Validate PlayerInputState specifically
    console.log('\n[4] Validating PlayerInputState...');
    const playerInputResults = validatePlayerInputState(gameManager.stateManager);
    
    console.log(`PlayerInputState validation complete.`);
    console.log(`- State exists: ${playerInputResults.stateExists ? 'Yes' : 'No'}`);
    console.log(`- Has incoming transitions: ${playerInputResults.inTransitions ? 'Yes' : 'No'}`);
    console.log(`- Transition sources: ${playerInputResults.transitionSources.join(', ') || 'None'}`);
    console.log(`- Transition targets: ${playerInputResults.transitionTargets.join(', ') || 'None'}`);
    console.log(`- Issues found: ${playerInputResults.issues.length}`);
    
    if (playerInputResults.issues.length > 0) {
      console.log('Issues:');
      playerInputResults.issues.forEach((issue, i) => {
        console.log(`  ${i+1}. ${issue}`);
      });
    }
    
    // Test state transitions
    console.log('\n[5] Testing state transitions...');
    await testStateTransitions(gameManager);
    
    // Summarize
    console.log('\n========== DIAGNOSTICS SUMMARY ==========');
    console.log(`State system issues: ${stateResults.issues.length}`);
    console.log(`PlayerInputState issues: ${playerInputResults.issues.length}`);
    console.log('=======================================');
    
    // Return results
    return {
      stateResults,
      playerInputResults
    };
  } catch (error) {
    Logger.error('RunDiagnostics', 'Error running diagnostics', error);
    console.error('Error running diagnostics:', error);
    
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test the state transitions
 * @param {GameManager} gameManager - The game manager to test
 */
async function testStateTransitions(gameManager) {
  const stateManager = gameManager.stateManager;
  const allStates = Object.values(GameStates);
  
  console.log(`Testing transitions between ${allStates.length} states...`);
  
  // Always start from GAME_SETUP
  try {
    await gameManager.stateManager.changeState(GameStates.GAME_SETUP);
    console.log(`Set initial state to ${GameStates.GAME_SETUP}`);
  } catch (error) {
    console.error(`Could not set initial state: ${error.message}`);
    return;
  }
  
  // Try normal game flow
  const normalFlow = [
    GameStates.GAME_SETUP,
    GameStates.TURN_START,
    GameStates.PLAYER_INPUT,
    GameStates.HAZARD_ROLLS,
    GameStates.TURN_ORDER,
    GameStates.TURN_EXECUTION,
    GameStates.TURN_END,
    GameStates.TURN_START
  ];
  
  console.log('\nTesting normal game flow transitions...');
  let lastSuccessfulState = GameStates.GAME_SETUP;
  
  for (let i = 1; i < normalFlow.length; i++) {
    const fromState = normalFlow[i-1];
    const toState = normalFlow[i];
    
    // Skip states we already passed
    if (i > 1 && fromState !== lastSuccessfulState) continue;
    
    console.log(`Testing transition: ${fromState} -> ${toState}`);
    
    if (stateManager.canTransitionTo(toState)) {
      try {
        const success = await stateManager.changeState(toState);
        
        if (success) {
          console.log(`✓ Successfully transitioned to ${toState}`);
          lastSuccessfulState = toState;
        } else {
          console.log(`✗ Transition to ${toState} failed despite being valid`);
        }
      } catch (error) {
        console.error(`✗ Error during transition to ${toState}: ${error.message}`);
      }
    } else {
      console.log(`✗ Transition from ${fromState} to ${toState} is not allowed`);
    }
  }
  
  console.log('\nTest complete. Last successful state:', lastSuccessfulState);
}

// Run diagnostics if this is executed directly
if (typeof window !== 'undefined' && window.document) {
  // In browser with DOM
  const runButton = document.getElementById('run-diagnostics');
  
  if (runButton) {
    runButton.addEventListener('click', async () => {
      console.log('Running diagnostics...');
      await runFullDiagnostics();
    });
  } else {
    console.log('Diagnostics ready. Click "Run Diagnostics" to start.');
  }
} else {
  // In Node.js or direct module execution
  runFullDiagnostics()
    .then(results => {
      console.log('Diagnostics complete!');
    })
    .catch(error => {
      console.error('Fatal error running diagnostics:', error);
    });
}
