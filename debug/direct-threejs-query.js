/**
 * Debug script for testing the Three.js MCP integration
 * This script allows direct queries to the Three.js documentation without going through Windsurf
 * 
 * Usage: node debug/direct-threejs-query.js "your query about Three.js"
 * Example: node debug/direct-threejs-query.js "how to create a shiny material with reflections"
 */

// Import the Three.js MCP module
const { searchThreeJs } = require('../mcp-threejs');

/**
 * Main function to run the debug query
 * @param {string[]} args - Command line arguments
 */
async function main(args) {
  console.log('=== Three.js Documentation Query Debug Tool ===');
  console.log('Args received:', args);
  
  try {
    // Get the query from command line arguments
    const query = args[2] || 'How to create shiny materials in Three.js';
    
    if (!query) {
      throw new Error('No query provided. Usage: node debug/direct-threejs-query.js "your query"');
    }
    
    console.log(`Executing query: "${query}"`);
    console.log('Sending request to Three.js documentation service...');
    
    // Start timing the request
    const startTime = Date.now();
    
    // Execute the query
    const result = await searchThreeJs(query);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    console.log(`Query completed in ${responseTime}ms`);
    
    // Print the result
    console.log('\n=== QUERY RESULTS ===');
    
    if (result?.results?.length > 0) {
      console.log(`Found ${result.results.length} results from Three.js documentation:`);
      
      // Display each result
      result.results.forEach((item, index) => {
        console.log(`\n[Result ${index + 1}]`);
        console.log(`Title: ${item.title || 'N/A'}`);
        console.log(`Source: ${item.source || 'N/A'}`);
        console.log(`Relevance: ${item.relevance || 'N/A'}`);
        
        // Limit content display to avoid overwhelming console
        const content = item.content || 'No content';
        const trimmedContent = content.length > 500 
          ? content.substring(0, 500) + '... (truncated)'
          : content;
        
        console.log('Content:');
        console.log(trimmedContent);
        
        // Display code samples if available
        if (item.codeExamples && item.codeExamples.length > 0) {
          console.log(`\nCode Examples (${item.codeExamples.length}):`);
          item.codeExamples.forEach((example, i) => {
            console.log(`\n--- Example ${i + 1} ---`);
            console.log(example);
          });
        }
        
        console.log('------------------------');
      });
    } else {
      console.log('No results found or invalid response structure.');
      console.log('Raw response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error executing Three.js documentation query:');
    console.error(error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute the main function with process arguments
main(process.argv).catch(error => {
  console.error('Unhandled exception in main:', error);
  process.exit(1);
});
