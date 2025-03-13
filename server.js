
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Enable more verbose logging for development
console.log('=== Beast Tactics Server Initializing ===');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Serve static files from public directory
app.use(express.static('public', {
  setHeaders: (res, path) => {
    // Disable caching during development to ensure fresh assets
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Start server
const server = app.listen(port, () => {
  console.log(`=== Server running at http://0.0.0.0:${port} ===`);
  console.log('Hot reload enabled - changes to server.js or public/ will restart server');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});
