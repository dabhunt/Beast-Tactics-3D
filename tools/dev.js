
/**
 * Development helper script for Beast Tactics
 * Runs the server with hot reloading enabled
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Beast Tactics Development Server ===');
console.log('Starting server with hot reload enabled...');

// Run the development server using nodemon
const nodemon = spawn('npx', ['nodemon', 'server.js', '--watch', 'server.js', '--watch', 'public/'], {
  stdio: 'inherit',
  shell: true
});

nodemon.on('error', (error) => {
  console.error('Failed to start development server:', error);
});

console.log('\nServer logs will appear below:');
console.log('-------------------------------------');
