
/**
 * DiagnosticsTool.js
 * Provides testing and diagnostic capabilities for the game architecture
 */

import { Logger } from './Logger.js';

export class DiagnosticsTool {
  /**
   * Create a new diagnostics tool
   * @param {GameManager} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this._gameManager = gameManager;
    this._testResults = [];
    
    Logger.debug('DiagnosticsTool', 'Diagnostics tool created');
  }
  
  /**
   * Run a comprehensive test of the core architecture
   * @returns {Object} Test results object
   */
  async runArchitectureTests() {
    console.log('====== RUNNING ARCHITECTURE DIAGNOSTICS ======');
    this._testResults = [];
    
    try {
      // Test game manager
      await this._testGameManager();
      
      // Test state manager
      await this._testStateManager();
      
      // Test event system
      await this._testEventSystem();
      
      // Test player manager
      await this._testPlayerManager();
      
      // Test turn manager
      await this._testTurnManager();
      
      console.log('====== DIAGNOSTICS COMPLETE ======');
      console.log(`Results: ${this._testResults.filter(r => r.status === 'pass').length} passed, ${this._testResults.filter(r => r.status === 'fail').length} failed`);
      
      return {
        results: this._testResults,
        summary: {
          total: this._testResults.length,
          passed: this._testResults.filter(r => r.status === 'pass').length,
          failed: this._testResults.filter(r => r.status === 'fail').length
        }
      };
    } catch (error) {
      console.error('Diagnostics failed with error:', error);
      return {
        error: error,
        results: this._testResults
      };
    }
  }
  
  /**
   * Record a test result
   * @param {String} component - The component being tested
   * @param {String} testName - The name of the test
   * @param {Boolean} passed - Whether the test passed
   * @param {String} notes - Additional test notes
   * @private
   */
  _recordTest(component, testName, passed, notes = '') {
    const result = {
      component,
      test: testName,
      status: passed ? 'pass' : 'fail',
      notes,
      timestamp: Date.now()
    };
    
    this._testResults.push(result);
    
    // Log the result
    const icon = passed ? '✓' : '✗';
    const method = passed ? 'info' : 'error';
    Logger[method]('DiagnosticsTool', `[${icon}] ${component} - ${testName}`, notes);
    
    return result;
  }
  
  /**
   * Test the game manager
   * @private
   */
  async _testGameManager() {
    console.log('------ Testing GameManager ------');
    
    // Check core properties
    const hasGameManager = !!this._gameManager;
    this._recordTest('GameManager', 'Instance exists', 
      hasGameManager, 
      hasGameManager ? 'GameManager instance found' : 'GameManager instance not found');
    
    if (!hasGameManager) return;
    
    // Check initialization
    this._recordTest('GameManager', 'Is initialized',
      this._gameManager._isInitialized,
      `Initialization status: ${this._gameManager._isInitialized}`);
    
    // Check config
    this._recordTest('GameManager', 'Has configuration',
      !!this._gameManager._config,
      this._gameManager._config ? 'Configuration present' : 'Configuration missing');
    
    // Check subsystems
    this._recordTest('GameManager', 'Has state manager',
      !!this._gameManager._stateManager,
      this._gameManager._stateManager ? 'State manager present' : 'State manager missing');
      
    this._recordTest('GameManager', 'Has turn manager',
      !!this._gameManager._turnManager,
      this._gameManager._turnManager ? 'Turn manager present' : 'Turn manager missing');
      
    this._recordTest('GameManager', 'Has player manager',
      !!this._gameManager._playerManager,
      this._gameManager._playerManager ? 'Player manager present' : 'Player manager missing');
      
    this._recordTest('GameManager', 'Has event system',
      !!this._gameManager._eventSystem,
      this._gameManager._eventSystem ? 'Event system present' : 'Event system missing');
  }
  
  /**
   * Test the state manager
   * @private
   */
  async _testStateManager() {
    console.log('------ Testing StateManager ------');
    
    const stateManager = this._gameManager?._stateManager;
    
    // Check state manager exists
    const hasStateManager = !!stateManager;
    this._recordTest('StateManager', 'Instance exists', 
      hasStateManager, 
      hasStateManager ? 'StateManager instance found' : 'StateManager instance not found');
    
    if (!hasStateManager) return;
    
    // Check current state
    const hasCurrentState = !!stateManager._currentState;
    this._recordTest('StateManager', 'Has current state',
      hasCurrentState,
      hasCurrentState ? `Current state: ${stateManager._currentState}` : 'No current state');
    
    // Check state registry
    const hasStates = Object.keys(stateManager._states || {}).length > 0;
    this._recordTest('StateManager', 'Has registered states',
      hasStates,
      hasStates ? `Registered states: ${Object.keys(stateManager._states).join(', ')}` : 'No states registered');
    
    // Check transition rules
    const hasTransitions = Object.keys(stateManager._validTransitions || {}).length > 0;
    this._recordTest('StateManager', 'Has transition rules',
      hasTransitions,
      hasTransitions ? `Transition rules defined for ${Object.keys(stateManager._validTransitions).length} states` : 'No transition rules');
  }
  
  /**
   * Test the event system
   * @private
   */
  async _testEventSystem() {
    console.log('------ Testing EventSystem ------');
    
    const eventSystem = this._gameManager?._eventSystem;
    
    // Check event system exists
    const hasEventSystem = !!eventSystem;
    this._recordTest('EventSystem', 'Instance exists', 
      hasEventSystem, 
      hasEventSystem ? 'EventSystem instance found' : 'EventSystem instance not found');
    
    if (!hasEventSystem) return;
    
    // Test event registration
    let testPassed = false;
    let testEvent = null;
    
    try {
      // Create test event
      const testEventName = 'testEvent_' + Date.now();
      
      // Register listener
      eventSystem.registerListener(testEventName, (data) => {
        testEvent = data;
      });
      
      // Trigger event
      const testData = { test: true, timestamp: Date.now() };
      eventSystem.triggerEvent(testEventName, testData);
      
      // Check if event was received
      testPassed = testEvent && testEvent.test === true && testEvent.timestamp === testData.timestamp;
    } catch (error) {
      console.error('Event test failed:', error);
    }
    
    this._recordTest('EventSystem', 'Event trigger and receive',
      testPassed,
      testPassed ? 'Event successfully triggered and received' : 'Event system failed');
  }
  
  /**
   * Test the player manager
   * @private
   */
  async _testPlayerManager() {
    console.log('------ Testing PlayerManager ------');
    
    const playerManager = this._gameManager?._playerManager;
    
    // Check player manager exists
    const hasPlayerManager = !!playerManager;
    this._recordTest('PlayerManager', 'Instance exists', 
      hasPlayerManager, 
      hasPlayerManager ? 'PlayerManager instance found' : 'PlayerManager instance not found');
    
    if (!hasPlayerManager) return;
    
    // Check player list
    const playerCount = playerManager.playerCount || 0;
    this._recordTest('PlayerManager', 'Has players',
      playerCount > 0,
      `Player count: ${playerCount}`);
    
    // Test add player
    let addPlayerSuccess = false;
    try {
      const initialCount = playerManager.playerCount || 0;
      playerManager.addPlayer({ name: 'Test Player', color: 'Green' });
      const newCount = playerManager.playerCount || 0;
      addPlayerSuccess = newCount === initialCount + 1;
    } catch (error) {
      console.error('Add player test failed:', error);
    }
    
    this._recordTest('PlayerManager', 'Can add player',
      addPlayerSuccess,
      addPlayerSuccess ? 'Successfully added test player' : 'Failed to add test player');
    
    // Check active player
    const hasActivePlayer = !!playerManager.activePlayer;
    this._recordTest('PlayerManager', 'Has active player',
      hasActivePlayer,
      hasActivePlayer ? `Active player: ${playerManager.activePlayer.name}` : 'No active player');
  }
  
  /**
   * Test the turn manager
   * @private
   */
  async _testTurnManager() {
    console.log('------ Testing TurnManager ------');
    
    const turnManager = this._gameManager?._turnManager;
    
    // Check turn manager exists
    const hasTurnManager = !!turnManager;
    this._recordTest('TurnManager', 'Instance exists', 
      hasTurnManager, 
      hasTurnManager ? 'TurnManager instance found' : 'TurnManager instance not found');
    
    if (!hasTurnManager) return;
    
    // Check turn counter
    const hasTurnCounter = typeof turnManager.currentTurn === 'number';
    this._recordTest('TurnManager', 'Has turn counter',
      hasTurnCounter,
      hasTurnCounter ? `Current turn: ${turnManager.currentTurn}` : 'Turn counter not available');
    
    // Check phase
    const hasPhase = !!turnManager.currentPhase;
    this._recordTest('TurnManager', 'Has current phase',
      hasPhase,
      hasPhase ? `Current phase: ${turnManager.currentPhase}` : 'Current phase not available');
  }
  
  /**
   * Create an HTML report of test results
   * @returns {String} HTML test report
   */
  generateHTMLReport() {
    const reportStyle = `
      <style>
        .diagnostic-report {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .test-summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          padding: 10px;
          background: #fff;
          border-radius: 5px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-count {
          font-size: 24px;
          font-weight: bold;
        }
        .test-result {
          margin: 10px 0;
          padding: 10px;
          background: #fff;
          border-radius: 5px;
          border-left: 5px solid;
        }
        .test-pass {
          border-left-color: #4CAF50;
        }
        .test-fail {
          border-left-color: #F44336;
        }
        .test-name {
          font-weight: bold;
        }
        .result-icon {
          display: inline-block;
          width: 20px;
          height: 20px;
          text-align: center;
          line-height: 20px;
          border-radius: 50%;
          margin-right: 5px;
          color: white;
        }
        .pass-icon {
          background: #4CAF50;
        }
        .fail-icon {
          background: #F44336;
        }
        .component-section {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .component-title {
          font-size: 18px;
          font-weight: bold;
          margin: 15px 0 10px;
        }
        .error-details {
          background: #ffebee;
          padding: 10px;
          border-radius: 3px;
          margin-top: 5px;
          font-family: monospace;
          white-space: pre-wrap;
        }
      </style>
    `;
    
    // Group results by component
    const componentGroups = {};
    this._testResults.forEach(result => {
      if (!componentGroups[result.component]) {
        componentGroups[result.component] = [];
      }
      componentGroups[result.component].push(result);
    });
    
    // Generate summary stats
    const totalTests = this._testResults.length;
    const passedTests = this._testResults.filter(r => r.status === 'pass').length;
    const failedTests = this._testResults.filter(r => r.status === 'fail').length;
    
    // Build HTML content
    let html = `
      <div class="diagnostic-report">
        <div class="report-header">
          <h1>Beast Tactics Diagnostics Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="test-summary">
          <div class="summary-item">
            <div class="summary-count">${totalTests}</div>
            <div>Total Tests</div>
          </div>
          <div class="summary-item">
            <div class="summary-count" style="color: #4CAF50">${passedTests}</div>
            <div>Passed</div>
          </div>
          <div class="summary-item">
            <div class="summary-count" style="color: #F44336">${failedTests}</div>
            <div>Failed</div>
          </div>
        </div>
        
        <div class="test-results">
    `;
    
    // Add component sections
    Object.keys(componentGroups).forEach(component => {
      const results = componentGroups[component];
      
      html += `
        <div class="component-section">
          <div class="component-title">${component}</div>
      `;
      
      // Add test results
      results.forEach(result => {
        const isPass = result.status === 'pass';
        const iconClass = isPass ? 'pass-icon' : 'fail-icon';
        const resultClass = isPass ? 'test-pass' : 'test-fail';
        const icon = isPass ? '✓' : '✗';
        
        html += `
          <div class="test-result ${resultClass}">
            <span class="result-icon ${iconClass}">${icon}</span>
            <span class="test-name">${result.test}</span>
            <div>${result.notes}</div>
          </div>
        `;
      });
      
      html += `</div>`;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return reportStyle + html;
  }
  
  /**
   * Display diagnostics report in the DOM
   */
  showReportInDOM() {
    // Create report element
    const reportContainer = document.createElement('div');
    reportContainer.id = 'diagnostics-report-container';
    reportContainer.style.position = 'fixed';
    reportContainer.style.top = '0';
    reportContainer.style.left = '0';
    reportContainer.style.width = '100%';
    reportContainer.style.height = '100%';
    reportContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    reportContainer.style.zIndex = '9999';
    reportContainer.style.overflow = 'auto';
    reportContainer.style.padding = '20px';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Report';
    closeButton.style.position = 'fixed';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '10px 15px';
    closeButton.style.background = '#333';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '10000';
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(reportContainer);
    });
    
    // Add report content
    const reportContent = document.createElement('div');
    reportContent.innerHTML = this.generateHTMLReport();
    
    // Assemble and add to DOM
    reportContainer.appendChild(closeButton);
    reportContainer.appendChild(reportContent);
    document.body.appendChild(reportContainer);
  }
}
