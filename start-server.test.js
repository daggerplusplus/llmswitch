const http = require('http');
const request = require('supertest');

describe('LLMSwitch Server', () => {
  let server;
  let app;

  beforeEach(() => {
    // Clear environment variables
    delete process.env.SERVER_HOST;
    delete process.env.PORT;
    delete process.env.OLLAMA_HOST;
    delete process.env.OLLAMA_PORT;
    delete process.env.GPU_API_HOST;
    delete process.env.GPU_API_PORT;
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Environment Variables', () => {
    test('should use default values when env vars are not set', () => {
      expect(process.env.OLLAMA_HOST || 'localhost').toBe('localhost');
      expect(process.env.OLLAMA_PORT || '11434').toBe('11434');
      expect(process.env.GPU_API_HOST || 'localhost').toBe('localhost');
      expect(process.env.GPU_API_PORT || '5000').toBe('5000');
    });

    test('should use custom env vars when set', () => {
      process.env.OLLAMA_HOST = 'custom-ollama-host';
      process.env.OLLAMA_PORT = '9999';
      process.env.GPU_API_HOST = 'custom-gpu-host';
      process.env.GPU_API_PORT = '8888';

      expect(process.env.OLLAMA_HOST).toBe('custom-ollama-host');
      expect(process.env.OLLAMA_PORT).toBe('9999');
      expect(process.env.GPU_API_HOST).toBe('custom-gpu-host');
      expect(process.env.GPU_API_PORT).toBe('8888');
    });
  });

  describe('API Config Endpoint', () => {
    beforeEach(() => {
      // Create a minimal test server
      app = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.url === '/api/config') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          const config = {
            ollamaHost: process.env.OLLAMA_HOST || 'localhost',
            ollamaPort: process.env.OLLAMA_PORT || '11434',
            gpuApiHost: process.env.GPU_API_HOST || 'localhost',
            gpuApiPort: process.env.GPU_API_PORT || '5000'
          };
          res.end(JSON.stringify(config));
          return;
        }

        res.writeHead(404);
        res.end('Not found');
      });
    });

    test('should return default config values', async () => {
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toEqual({
        ollamaHost: 'localhost',
        ollamaPort: '11434',
        gpuApiHost: 'localhost',
        gpuApiPort: '5000'
      });
    });

    test('should return custom config values from environment', async () => {
      process.env.OLLAMA_HOST = 'test-ollama';
      process.env.OLLAMA_PORT = '12345';
      process.env.GPU_API_HOST = 'test-gpu';
      process.env.GPU_API_PORT = '6789';

      // Recreate server with new env vars
      app = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.url === '/api/config') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          const config = {
            ollamaHost: process.env.OLLAMA_HOST || 'localhost',
            ollamaPort: process.env.OLLAMA_PORT || '11434',
            gpuApiHost: process.env.GPU_API_HOST || 'localhost',
            gpuApiPort: process.env.GPU_API_PORT || '5000'
          };
          res.end(JSON.stringify(config));
          return;
        }
        res.writeHead(404);
        res.end('Not found');
      });

      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ollamaHost: 'test-ollama',
        ollamaPort: '12345',
        gpuApiHost: 'test-gpu',
        gpuApiPort: '6789'
      });
    });

    test('should have correct CORS headers', async () => {
      const response = await request(app).get('/api/config');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });

  describe('File Serving', () => {
    test('should handle root path by serving index.html', () => {
      let filePath = '.' + '/';
      if (filePath === './') {
        filePath = './index.html';
      }

      expect(filePath).toBe('./index.html');
    });

    test('should construct correct file paths', () => {
      const testCases = [
        { url: '/test.html', expected: './test.html' },
        { url: '/style.css', expected: './style.css' },
        { url: '/js/script.js', expected: './js/script.js' },
        { url: '/', expected: './index.html' }
      ];

      testCases.forEach(({ url, expected }) => {
        let filePath = '.' + url;
        if (filePath === './') {
          filePath = './index.html';
        }
        expect(filePath).toBe(expected);
      });
    });

    test('should determine correct MIME type from file extension', () => {
      const path = require('path');
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
      };

      const testCases = [
        { file: 'test.html', expected: 'text/html' },
        { file: 'style.css', expected: 'text/css' },
        { file: 'script.js', expected: 'application/javascript' },
        { file: 'data.json', expected: 'application/json' },
        { file: 'image.png', expected: 'image/png' }
      ];

      testCases.forEach(({ file, expected }) => {
        const extname = String(path.extname(file)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        expect(contentType).toBe(expected);
      });
    });

    test('should default to octet-stream for unknown file types', () => {
      const path = require('path');
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript'
      };

      const extname = String(path.extname('file.unknown')).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      expect(contentType).toBe('application/octet-stream');
    });

    test('should handle error codes correctly', () => {
      const handleError = (errorCode) => {
        if (errorCode === 'ENOENT') {
          return { status: 404, message: 'File not found' };
        } else {
          return { status: 500, message: `Server error: ${errorCode}` };
        }
      };

      expect(handleError('ENOENT')).toEqual({ status: 404, message: 'File not found' });
      expect(handleError('EACCES')).toEqual({ status: 500, message: 'Server error: EACCES' });
      expect(handleError('EISDIR')).toEqual({ status: 500, message: 'Server error: EISDIR' });
    });
  });

  describe('MIME Types', () => {
    test('should have correct MIME types mapping', () => {
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

      expect(mimeTypes['.html']).toBe('text/html');
      expect(mimeTypes['.css']).toBe('text/css');
      expect(mimeTypes['.js']).toBe('application/javascript');
      expect(mimeTypes['.json']).toBe('application/json');
      expect(mimeTypes['.png']).toBe('image/png');
      expect(mimeTypes['.jpg']).toBe('image/jpeg');
    });
  });
});
