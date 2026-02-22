import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-docs',
      configureServer(server) {
        // Use pre middleware to run before other middlewares
        server.middlewares.use('/docs', (req, res, next) => {
          try {
            // Remove /docs prefix and get the file path
            let urlPath = req.url.split('?')[0]; // Remove query params
            
            // Construct full file path
            let filePath = path.join(__dirname, 'docs/build', urlPath === '/' ? 'index.html' : urlPath);
            
            // Console log for debugging
            console.log(`[DOCS] Requested: ${req.url}, File: ${filePath}`);
            
            // Check if it's a directory, then serve index.html
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
              filePath = path.join(filePath, 'index.html');
              console.log(`[DOCS] Directory detected, serving: ${filePath}`);
            }
            
            // Serve the file if it exists
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath);
              res.setHeader('Content-Type', getContentType(filePath));
              console.log(`[DOCS] ✓ Serving: ${filePath}`);
              return res.end(content);
            }
            
            // For SPA routing, serve index.html if file not found
            const indexPath = path.join(__dirname, 'docs/build', 'index.html');
            if (fs.existsSync(indexPath)) {
              const content = fs.readFileSync(indexPath);
              res.setHeader('Content-Type', 'text/html');
              console.log(`[DOCS] ✓ Serving index.html for SPA routing`);
              return res.end(content);
            }
            
            console.log(`[DOCS] ✗ Not found: ${filePath}`);
          } catch (error) {
            console.error('[DOCS] Error:', error.message);
          }
          
          next();
        });
      }
    }
  ],
  server: {
    port: 22000,
    host: true, // Listen on all addresses (0.0.0.0)
    proxy: {
      '/api': {
        target: 'http://localhost:21000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 22000,
    host: true,
  },
})

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}
