/**
 * Three.js MCP Integration Module
 * This module provides functions to query the Three.js documentation server
 * for code examples, API references, and best practices.
 */

const { exec } = require('child_process');
const https = require('https');
const http = require('http');

/**
 * Query the Three.js documentation server for information
 * @param {string} query - The search query for Three.js documentation
 * @param {Object} options - Optional parameters
 * @param {boolean} options.rawResponse - Whether to return the raw response instead of parsing
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} - The search results
 */
function queryThreeJsDocs(query, options = {}) {
  console.log('[THREE.JS MCP] Starting documentation query:', { 
    query, 
    options: JSON.stringify(options)
  });
  
  // Default options
  const opts = {
    rawResponse: false,
    timeout: 30000,
    ...options
  };

  return new Promise((resolve, reject) => {
    // Define the request options
    const requestOptions = {
      hostname: 'threejs-mcp.replit.app',
      path: '/api/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': '2d5g4g56dkdur59it59jfkmglg5'
      }
    };

    console.log('[THREE.JS MCP] Preparing request to threejs-mcp server');

    // Create request payload
    const payload = JSON.stringify({
      query: query,
      timestamp: new Date().toISOString()
    });

    // Start a timer to track query performance
    const startTime = Date.now();

    // Function to make the HTTP request
    const makeRequest = () => {
      console.log('[THREE.JS MCP] Sending query to documentation server...');
      
      // Use https or http based on hostname
      const requester = requestOptions.hostname.startsWith('localhost') ? http : https;
      
      const req = requester.request(requestOptions, (res) => {
        const chunks = [];
        
        // Log response status
        console.log(`[THREE.JS MCP] Server response status: ${res.statusCode}`);
        
        // Handle data chunks
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        // When the response is complete
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          console.log(`[THREE.JS MCP] Response received in ${responseTime}ms`);
          
          try {
            // Combine chunks and parse response
            const body = Buffer.concat(chunks).toString();
            
            // Return raw response if requested
            if (opts.rawResponse) {
              console.log('[THREE.JS MCP] Returning raw response as requested');
              return resolve(body);
            }
            
            // Otherwise parse as JSON
            const parsedResponse = JSON.parse(body);
            
            // Log response stats
            console.log('[THREE.JS MCP] Successfully parsed response:', {
              resultCount: parsedResponse.results?.length || 0,
              responseSize: body.length
            });
            
            resolve(parsedResponse);
          } catch (error) {
            console.error('[THREE.JS MCP] Error parsing response:', error);
            console.debug('[THREE.JS MCP] Response body:', chunks.toString());
            reject(new Error(`Failed to parse Three.js MCP response: ${error.message}`));
          }
        });
      });
      
      // Handle request errors
      req.on('error', (error) => {
        console.error('[THREE.JS MCP] Request error:', error);
        reject(new Error(`Three.js MCP request failed: ${error.message}`));
      });
      
      // Set timeout
      req.setTimeout(opts.timeout, () => {
        console.error(`[THREE.JS MCP] Request timed out after ${opts.timeout}ms`);
        req.destroy();
        reject(new Error('Three.js MCP request timed out'));
      });
      
      // Send the payload
      console.log(`[THREE.JS MCP] Sending payload (${payload.length} bytes)`);
      req.write(payload);
      req.end();
    };

    // Execute the request
    try {
      makeRequest();
    } catch (error) {
      console.error('[THREE.JS MCP] Critical error making request:', error);
      reject(new Error(`Failed to make Three.js MCP request: ${error.message}`));
    }
  });
}

/**
 * Execute a local CLI command to query Three.js documentation
 * This is an alternative method if the direct API call doesn't work
 * @param {string} query - The search query
 * @returns {Promise<Object>} - The search results
 */
function executeThreeJsCliQuery(query) {
  console.log('[THREE.JS MCP] Executing CLI query:', { query });
  
  return new Promise((resolve, reject) => {
    // Assuming there might be a local CLI tool similar to the perplexity one
    const command = `/Users/david/Documents/GitHub/threejs-mcp/cli-tools/threejs-cli.js "${query}"`;
    
    console.log(`[THREE.JS MCP] Executing command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('[THREE.JS MCP] Error executing CLI query:', error);
        console.error('[THREE.JS MCP] stderr:', stderr);
        return reject(error);
      }
      
      try {
        // Parse the JSON response
        console.log('[THREE.JS MCP] CLI command executed successfully, parsing result');
        const result = JSON.parse(stdout);
        console.log('[THREE.JS MCP] Result parsed successfully');
        resolve(result);
      } catch (parseError) {
        console.error('[THREE.JS MCP] Error parsing CLI result:', parseError);
        console.debug('[THREE.JS MCP] Raw stdout:', stdout);
        reject(parseError);
      }
    });
  });
}

/**
 * Main function to query Three.js documentation
 * Tries the direct API method first, falls back to CLI if available
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters 
 * @returns {Promise<Object>} - The search results
 */
async function searchThreeJs(query, options = {}) {
  console.log('[THREE.JS MCP] Starting Three.js documentation search:', { 
    query,
    options: JSON.stringify(options)
  });
  
  try {
    // Validate input
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }
    
    // First try the direct API method
    try {
      console.log('[THREE.JS MCP] Attempting to query Three.js docs via API');
      const result = await queryThreeJsDocs(query, options);
      return result;
    } catch (apiError) {
      console.warn('[THREE.JS MCP] API query failed, attempting CLI fallback:', apiError.message);
      
      // Fall back to CLI method if API fails
      try {
        const cliResult = await executeThreeJsCliQuery(query);
        return cliResult;
      } catch (cliError) {
        console.error('[THREE.JS MCP] CLI fallback also failed:', cliError);
        throw new Error(`Three.js documentation search failed: ${cliError.message}`);
      }
    }
  } catch (error) {
    console.error('[THREE.JS MCP] Fatal error in searchThreeJs:', error);
    throw error;
  }
}

// Export the main function and any utilities
module.exports = {
  searchThreeJs,
  queryThreeJsDocs,
  executeThreeJsCliQuery
};
