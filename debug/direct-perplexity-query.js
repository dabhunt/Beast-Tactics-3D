/**
 * Debug utility script to query Perplexity for information about Three.js crystal materials
 * This temporary script directly includes the searchPerplexity function logic
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

// Query about improving crystal appearance in Three.js
const query = 'How to improve emission and shininess on 3D crystal objects in Three.js to make them look more realistic?';
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
