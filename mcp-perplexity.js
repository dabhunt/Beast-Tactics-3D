const { exec } = require('child_process');

function searchPerplexity(query) {
  return new Promise((resolve, reject) => {
    exec(`/Users/david/Documents/GitHub/threejs-mcp/cli-tools/perplexity-cli.js "${query}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing search:', error);
        return reject(error);
      }
      
      try {
        // Parse the JSON response
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}