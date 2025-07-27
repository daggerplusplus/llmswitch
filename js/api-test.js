// API Tester Script - Include this for debugging only
document.addEventListener("DOMContentLoaded", function () {
    // Add a test button to the debug section
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
          <input id="test-api-url" type="text" placeholder="/api/gpu-data or full URL" 
                 style="width: 70%; padding: 5px; margin-right: 10px;" value="http://localhost:5000/api/gpu-data">
          <select id="endpoint-type" style="padding: 5px;">
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </select>
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
        gpuDebugLog("Please enter an API URL to test");
        return;
    }

    gpuDebugLog(`Testing API endpoint: ${apiUrl}`);

    try {
        // Attempt to fetch from the API
        const response = await fetch(apiUrl);

        // Log response status
        gpuDebugLog(`Response status: ${response.status} ${response.statusText}`);

        // Log response headers
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        gpuDebugLog("Response headers:", headers);

        // Get the response content based on selected type
        let content;
        if (endpointType === 'json') {
            try {
                content = await response.json();
                gpuDebugLog("Response JSON:", content);
            } catch (jsonError) {
                // If JSON parsing fails, try getting text instead
                const textContent = await response.clone().text();
                gpuDebugLog(`JSON parsing failed. Raw response (first 300 chars):`);
                gpuDebugLog(textContent.substring(0, 300) + '...');
            }
        } else {
            // Get text content
            const textContent = await response.text();
            gpuDebugLog(`Response text (first 300 chars):`);
            gpuDebugLog(textContent.substring(0, 300) + '...');
        }

        // Check if response has the expected GPU data structure
        if (content && content.gpus) {
            gpuDebugLog("✅ Response contains GPU data structure!");
            if (content.gpus.length > 0) {
                gpuDebugLog("✅ Found GPU data:", content.gpus[0]);
            } else {
                gpuDebugLog("⚠️ GPU array is empty.");
            }
        } else if (content) {
            gpuDebugLog("⚠️ Response doesn't contain expected 'gpus' property");
        }

    } catch (error) {
        gpuDebugLog(`❌ API test failed: ${error.message}`);
    }
}