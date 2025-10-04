require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');

const host = process.env.SERVER_HOST || 'localhost';
const port = process.env.PORT || 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Add CORS headers to allow cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle API config endpoint
    if (req.url === '/api/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const config = {
            ollamaHost: process.env.OLLAMA_HOST || 'localhost',
            ollamaPort: process.env.OLLAMA_PORT || '11434'
        };
        res.end(JSON.stringify(config));
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, host, () => {
    console.log(`LLMSwitch HTTP Server running at http://${host}:${port}`);
    console.log(`Open your browser and go to: http://${host}:${port}`);
    console.log('Press Ctrl+C to stop the server');
});
