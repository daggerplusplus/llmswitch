# Ollama API CORS Issue - Solution Guide

## The Problem
You're getting this error: `Access to fetch at 'http://your-ollama-server:11434/api/tags' from origin 'null' has been blocked by CORS policy`

This happens because browsers block requests from `file://` origins (when you open HTML files directly) to HTTP servers, even with CORS configured.

## Solutions (Choose One)

### Solution 1: Use Local HTTP Server (Recommended)

Instead of opening `index.html` directly in your browser, serve it through a local HTTP server:

#### Option A: Python (if you have Python installed)
```bash
# Double-click start-server.bat or run in command prompt:
start-server.bat

# Or manually:
python -m http.server 8000
```

#### Option B: Node.js (if you have Node.js installed)
```bash
# Run the Node.js server:
node start-server.js

# Or install and use http-server globally:
npm install -g http-server
http-server -p 8000 --cors
```

#### Option C: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

**Then open:** `http://localhost:8000` in your browser

### Solution 2: Fix Ollama CORS Configuration

Your Ollama server might not be properly configured for CORS. Try these steps:

1. **Stop Ollama completely:**
   ```bash
   pkill ollama
   ```

2. **Restart with explicit CORS settings:**
   ```bash
   # For all origins (less secure but works)
   OLLAMA_ORIGINS="*" OLLAMA_HOST="0.0.0.0:11434" ollama serve
   
   # Or more specific (more secure)
   OLLAMA_ORIGINS="http://localhost:8000,file://" OLLAMA_HOST="0.0.0.0:11434" ollama serve
   ```

3. **For Docker users:**
   ```bash
   docker run -d \
     -v ollama:/root/.ollama \
     -p 11434:11434 \
     -e OLLAMA_ORIGINS="*" \
     -e OLLAMA_HOST="0.0.0.0:11434" \
     --name ollama \
     ollama/ollama
   ```

### Solution 3: Browser Workaround (Temporary Testing Only)

**WARNING: Only use this for testing - don't browse the internet with these settings!**

Launch Chrome with disabled security:
```bash
chrome --disable-web-security --user-data-dir="c:/temp/chrome_dev_session"
```

## Verification Steps

1. **Test the API directly in browser:**
   - Go to: `http://localhost:11434/api/tags` (or your Ollama server URL)
   - You should see JSON data with your models

2. **Test with the application:**
   - Use one of the HTTP server solutions above
   - Configure the Ollama API URL to: `http://localhost:11434` (or your server URL)
   - Check the debug log for successful API calls

3. **Use the built-in API tester:**
   - Go to the debug page (`debug.html`)
   - Test the endpoints using the API tester

## Expected Results

After implementing the solution:
- ✅ No more CORS errors in browser console
- ✅ Models load and display in the application
- ✅ API tester shows successful responses with JSON data
- ✅ Debug log shows successful API calls

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your Ollama server is accessible: `curl http://localhost:11434/api/tags` (or your server URL)
3. Make sure you're using `http://localhost:8000` (not `file://`) to access the application
