// This is a simple production server script specifically for Replit deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerRoutes } from './server/routes.js';

// Force production mode for the database
process.env.FORCE_PRODUCTION = 'true';
process.env.NODE_ENV = 'production';
process.env.USE_SERVER_IP = 'true';

console.log('⚠️ RUNNING IN PRODUCTION MODE - Using production database at 165.22.50.101');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Simple error handler
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Serve static files from the dist directory
  let clientPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(clientPath)) {
    // Fallback to client directory if dist doesn't exist
    clientPath = path.join(__dirname, 'client');
    console.log(`No build directory found at ${path.join(__dirname, 'dist')}, falling back to: ${clientPath}`);
  }

  console.log(`Serving static files from: ${clientPath}`);
  app.use(express.static(clientPath));

  // For any other request, serve the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });

  // Use the PORT environment variable provided by Replit, fallback to 5000
  const port = process.env.PORT || 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
})();