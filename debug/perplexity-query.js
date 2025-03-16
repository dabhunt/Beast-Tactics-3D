/**
 * Debug utility script to query Perplexity for information about Three.js crystal materials
 * This temporary script will be used to get information for improving the crystal shard appearance
 */

// Import the perplexity search function
const { searchPerplexity } = require('../mcp-perplexity');

// Query about improving crystal appearance in Three.js
const query = 'How to improve emission and shininess on 3D crystal objects in Three.js to make them look more realistic?';
console.log(`[DEBUG] Sending query to Perplexity: "${query}"`);

// Execute the search and log results
searchPerplexity(query)
  .then(result => {
    console.log('[DEBUG] Perplexity search results:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('[DEBUG] Error executing Perplexity search:', error);
  });
