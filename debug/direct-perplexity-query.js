/**
 * Debug utility script to query Perplexity for information
 * This script accepts a query as a command-line argument
 * 
 * Usage: node debug/direct-perplexity-query.js "your query here"
 * Example: node debug/direct-perplexity-query.js "How to improve emission and shininess on 3D crystal objects in Three.js?"
 */

const { exec } = require('child_process');

// Define the search function directly
function searchPerplexity(query) {
  console.log(`[DEBUG] Executing Perplexity query: "${query}"`);
  
  return new Promise((resolve, reject) => {
    exec(`/Users/david/Documents/GitHub/threejs-mcp/cli-tools/perplexity-cli.js "${query}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('[DEBUG] Error executing search:', error);
        return reject(error);
      }
      
      if (stderr) {
        console.warn('[DEBUG] Search stderr output:', stderr);
      }
      
      try {
        // Parse the JSON response
        console.log('[DEBUG] Raw stdout:', stdout);
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        console.error('[DEBUG] JSON parse error:', parseError);
        console.error('[DEBUG] Raw output that failed to parse:', stdout);
        reject(parseError);
      }
    });
  });
}

// Get query from command line arguments or use default
const query = process.argv[2] || 'How to improve emission and shininess on 3D crystal objects in Three.js?';
console.log('[DEBUG] Command line args:', process.argv);
console.log(`[DEBUG] Preparing to send query to Perplexity: "${query}"`);

// Execute the search and log results
searchPerplexity(query)
  .then(result => {
    console.log('[DEBUG] Perplexity search results:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('[DEBUG] Error executing Perplexity search:', error);
  });
