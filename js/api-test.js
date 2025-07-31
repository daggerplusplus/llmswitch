// API Tester Script - Include this for debugging only
document.addEventListener("DOMContentLoaded", function () {
    // Add a test button to the debug section only if we're on the debug page
    const debugLog = document.getElementById("debug-log");
    if (debugLog) {
        const testAPIBtn = document.createElement("button");
        testAPIBtn.id = "test-api-btn";
        testAPIBtn.textContent = "Test API Endpoints";
        testAPIBtn.style.marginBottom = "10px";
        debugLog.insertBefore(testAPIBtn, debugLog.firstChild);

        // Add API URL input for testing
        const testInput = document.createElement("div");
        testInput.innerHTML = `
        <div style="margin-bottom: 10px;">
          <input id="test-api-url" type="text" placeholder="Enter API endpoint URL" 
                 style="width: 70%; padding: 5px; margin-right: 10px;" value="http://localhost:11434/api/tags">
          <select id="endpoint-type" style="padding: 5px;">
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
          <strong>Common Ollama endpoints:</strong><br>
          • <a href="#" onclick="document.getElementById('test-api-url').value='http://localhost:11434/api/tags'; return false;">http://localhost:11434/api/tags</a> (Available models)<br>
          • <a href="#" onclick="document.getElementById('test-api-url').value='http://localhost:11434/api/ps'; return false;">http://localhost:11434/api/ps</a> (Running models)<br>
          • <a href="#" onclick="document.getElementById('test-api-url').value='http://localhost:11434'; return false;">http://localhost:11434</a> (Base URL - returns text)
        </div>
      `;
        debugLog.insertBefore(testInput, debugLog.firstChild);

        // Test button click handler
        testAPIBtn.addEventListener("click", testAPIEndpoint);
    }
});

async function testAPIEndpoint() {
    const apiUrl = document.getElementById("test-api-url").value;
    const endpointType = document.getElementById("endpoint-type").value;

    if (!apiUrl) {
        debugLog("Please enter an API URL to test");
        return;
    }

    debugLog(`Testing API endpoint: ${apiUrl}`);

    try {
        // Attempt to fetch from the API
        const response = await fetch(apiUrl);

        // Log response status
        debugLog(`Response status: ${response.status} ${response.statusText}`);

        // Log response headers
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        debugLog("Response headers:", headers);

        // Clone the response before consuming it, so we can try both JSON and text if needed
        const responseClone = response.clone();

        // Get the response content based on selected type
        let content;
        if (endpointType === 'json') {
            try {
                content = await response.json();
                debugLog("Response JSON:", content);
            } catch (jsonError) {
                // If JSON parsing fails, try getting text instead using the cloned response
                const textContent = await responseClone.text();
                debugLog(`JSON parsing failed. Raw response (first 300 chars):`);
                debugLog(textContent.substring(0, 300) + '...');
            }
        } else {
            // Get text content
            const textContent = await response.text();
            debugLog(`Response text (first 300 chars):`);
            debugLog(textContent.substring(0, 300) + '...');
        }

        // Check if response has the expected Ollama data structure
        if (content && content.models) {
            debugLog("✅ Response contains Ollama models data!");
            if (content.models.length > 0) {
                debugLog("✅ Found models:", content.models);
            } else {
                debugLog("⚠️ Models array is empty.");
            }
        } else if (content && content.gpus) {
            debugLog("✅ Response contains GPU data structure!");
            if (content.gpus.length > 0) {
                debugLog("✅ Found GPU data:", content.gpus[0]);
            } else {
                debugLog("⚠️ GPU array is empty.");
            }
        } else if (content) {
            debugLog("ℹ️ Response structure:", Object.keys(content));
        }

    } catch (error) {
        debugLog(`❌ API test failed: ${error.message}`);
    }
}
