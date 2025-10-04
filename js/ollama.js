// Load configuration from localStorage or use default
let OLLAMA_API_URL =
  localStorage.getItem("ollamaApiUrl") || null;
// Load saved refresh interval from localStorage or use default
const DEFAULT_REFRESH_INTERVAL = 30;
let REFRESH_INTERVAL =
  parseInt(localStorage.getItem("refreshInterval")) ||
  DEFAULT_REFRESH_INTERVAL;

// Fetch Ollama configuration from server environment variables
async function loadOllamaConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      const ollamaUrl = `http://${config.ollamaHost}:${config.ollamaPort}`;
      // Only use env config if no localStorage value exists
      if (!OLLAMA_API_URL) {
        OLLAMA_API_URL = ollamaUrl;
      }
    }
  } catch (error) {
    console.error('Failed to load config from server:', error);
    // Fallback to default if both env config and localStorage fail
    if (!OLLAMA_API_URL) {
      OLLAMA_API_URL = "http://localhost:11434";
    }
  }
}

// Variables to track refresh state
let countdownValue = REFRESH_INTERVAL;
let countdownInterval;

// Debug logging function
function debugLog(message, data = null) {
  const logElement = document.getElementById("debug-content");
  if (!logElement) return; // Safety check - only log if debug element exists

  const timestamp = new Date().toLocaleTimeString();

  let logMessage = `[${timestamp}] ${message}`;

  if (data) {
    if (typeof data === "object") {
      logMessage += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } else {
      logMessage += ` ${data}`;
    }
  }

  logElement.innerHTML = logMessage + "<hr>" + logElement.innerHTML;
}

// Make fetchGpuData globally accessible
window.fetchGpuData = null;

// Main app logic
document.addEventListener("DOMContentLoaded", async function () {
  // Load configuration from server environment variables
  await loadOllamaConfig();

  // Initialize API URL input
  document.getElementById("api-url").value = OLLAMA_API_URL;

  // Setup config button
  document
    .getElementById("config-btn")
    .addEventListener("click", function () {
      document.getElementById("api-config").classList.toggle("visible");
    });

  // Setup save config button
  document.getElementById("save-config").addEventListener("click", function () {
    const newApiUrl = document.getElementById("api-url").value.trim();
    const newGpuApiUrl = document.getElementById("gpu-api-url").value.trim();

    let updated = false;

    if (newApiUrl) {
      OLLAMA_API_URL = newApiUrl;
      localStorage.setItem("ollamaApiUrl", newApiUrl);
      debugLog(`Ollama API URL updated to: ${newApiUrl}`);
      updated = true;
    }

    // Update GPU API URL if available (using function from gpu.js)
    if (typeof updateGpuApiUrl === 'function' && newGpuApiUrl) {
      const gpuUpdated = updateGpuApiUrl(newGpuApiUrl);
      updated = updated || gpuUpdated;
    }

    if (updated) {
      document.getElementById("api-config").classList.remove("visible");
      fetchRunningModels();
      if (window.fetchGpuData && typeof window.fetchGpuData === 'function') {
        window.fetchGpuData();
      }
    }
  });

  // Add toggle functionality for models section
  document.getElementById("toggle-models-section").addEventListener("click", function () {
    document.getElementById("models-container").classList.toggle("hidden");
  });
  // Setup refresh button
  document.getElementById("refresh-btn").addEventListener("click", function () {
    fetchRunningModels();
    if (window.fetchGpuData && typeof window.fetchGpuData === 'function') {
      window.fetchGpuData();
    }
    resetCountdown();
  });

  // Setup cancel config button
  document.getElementById("cancel-config").addEventListener("click", function () {
    document.getElementById("api-url").value = OLLAMA_API_URL;
    if (typeof GPU_API_URL !== 'undefined') {
      document.getElementById("gpu-api-url").value = GPU_API_URL;
    }
    document.getElementById("api-config").classList.remove("visible");
  });
  // Initial load
  fetchRunningModels();

  // Setup auto-refresh countdown
  startCountdown();

  // Initialize refresh interval input
  document.getElementById("refresh-interval").value = REFRESH_INTERVAL;

  // Setup save refresh interval button
  document
    .getElementById("save-refresh-btn")
    .addEventListener("click", function () {
      const newInterval = parseInt(
        document.getElementById("refresh-interval").value
      );
      if (newInterval && newInterval >= 5 && newInterval <= 300) {
        REFRESH_INTERVAL = newInterval;
        localStorage.setItem("refreshInterval", newInterval);
        resetCountdown();
        debugLog(
          `Auto-refresh interval updated to ${newInterval} seconds`
        );
      } else {
        alert("Please enter a value between 5 and 300 seconds");
        document.getElementById("refresh-interval").value =
          REFRESH_INTERVAL;
      }
    });
});

function startCountdown() {
  countdownValue = REFRESH_INTERVAL;
  document.getElementById("countdown").textContent = countdownValue;

  clearInterval(countdownInterval);
  countdownInterval = setInterval(function () {
    countdownValue--;
    document.getElementById("countdown").textContent = countdownValue;

    if (countdownValue <= 0) {
      fetchRunningModels();
      if (window.fetchGpuData && typeof window.fetchGpuData === 'function') {
        window.fetchGpuData();
      }
      resetCountdown();
    }
  }, 1000);
}

function resetCountdown() {
  countdownValue = REFRESH_INTERVAL;
  document.getElementById("countdown").textContent = countdownValue;
}

async function fetchRunningModels() {
  const modelsContainer = document.getElementById("models-container");
  if (!modelsContainer) {
    debugLog("Models container not found in DOM", null, 'error');
    return;
  }

  // Show loading state
  modelsContainer.innerHTML = '<div class="loading">Loading models...</div>';
  
  let runningModels = [];
  let allModels = [];

  try {
    debugLog(`Fetching data from ${OLLAMA_API_URL}`);

    // First try to get all available models
    try {
      debugLog(`Attempting to fetch available models from: ${OLLAMA_API_URL}/api/tags`);
      const tagsResponse = await fetch(`${OLLAMA_API_URL}/api/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      });

      if (!tagsResponse.ok) {
        throw new Error(
          `Tags endpoint failed: ${tagsResponse.status} ${tagsResponse.statusText}`
        );
      }

      const tagsData = await tagsResponse.json();
      debugLog("Available models:", tagsData);
      allModels = tagsData.models || [];
    } catch (error) {
      debugLog(`Error fetching available models: ${error.message}`);
    }

    // Get running models using the correct structure
    try {
      debugLog(`Attempting to fetch running models from: ${OLLAMA_API_URL}/api/ps`);
      const psResponse = await fetch(`${OLLAMA_API_URL}/api/ps`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      });

      if (psResponse.ok) {
        const psData = await psResponse.json();
        debugLog("Raw PS response data:", psData);

        // Check if the response has the models array instead of processes
        if (psData.models && Array.isArray(psData.models)) {
          // Format the running models to match our expected structure
          runningModels = psData.models.map((model) => ({
            model: model.name || model.model, // Use either name or model property
            id: model.digest || `model-${Date.now()}`, // Use digest as ID or generate one
            created: Math.floor(Date.now() / 1000 - 300), // Estimate start time (5 min ago)
            status: "running",
            size: model.size,
            details: model.details,
          }));

          debugLog("Found running models:", runningModels);
        } else {
          debugLog(
            "No models found in /api/ps response, response format may be unexpected",
            psData
          );
        }
      } else {
        debugLog(`PS endpoint failed with status: ${psResponse.status}`);
      }
    } catch (error) {
      debugLog(`Error detecting running models: ${error.message}`);
    }

    // Update last refresh time
    document.getElementById("last-updated").textContent =
      new Date().toLocaleTimeString();

    // Determine if we should use mobile view based on screen width
    const isMobile = window.innerWidth < 768;

    // Always render the models view, even if arrays are empty
    debugLog(`Rendering models view: ${runningModels.length} running, ${allModels.length} available`);
    
    // Render either mobile cards or desktop table
    if (isMobile) {
      renderMobileCards(runningModels, allModels);
    } else {
      renderModelTable(runningModels, allModels);
    }

    // If no models at all, show helpful message
    if (runningModels.length === 0 && allModels.length === 0) {
      modelsContainer.innerHTML = `
        <div class="no-models">
            <p>No models found. This could mean:</p>
            <ul>
              <li>Ollama is not running</li>
              <li>No models are installed (try: <code>ollama pull llama2</code>)</li>
              <li>API URL is incorrect: ${OLLAMA_API_URL}</li>
            </ul>
            <p>Click "Configure APIs" to update the API URL.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    debugLog(`Error: ${error.message}`, error, 'error');
    modelsContainer.innerHTML = `
      <div class="no-models">
          <p>Error connecting to Ollama API. Make sure your Ollama container is running and the API URL is correct.</p>
          <p>Error: ${error.message}</p>
          <p>Current API URL: ${OLLAMA_API_URL}</p>
          <p>Click the "Configure APIs" button to update the API URL.</p>
      </div>
  `;
  }
}

function renderMobileCards(runningModels, allModels) {
  const modelsContainer = document.getElementById("models-container");
  
  // Ensure arrays exist and are arrays
  runningModels = runningModels || [];
  allModels = allModels || [];

  // Debug the incoming data
  debugLog(
    `Rendering mobile cards with ${runningModels.length} running models`,
    runningModels
  );

  // Create a set of running model names for quick lookup
  const runningModelNames = new Set(runningModels.map((m) => m.model));

  // Build the mobile cards HTML
  let cardsHTML = '<div class="mobile-card-view">';

  // Running models
  runningModels.forEach((model) => {
    const paramInfo = model.details?.parameter_size || "Unknown";
    const quantInfo = model.details?.quantization_level || "";
    const paramDisplay = quantInfo
      ? `${paramInfo} (${quantInfo})`
      : paramInfo;

    cardsHTML += `
      <div class="model-card">
        <div class="model-header">
          <div class="model-name">${model.model || "(unnamed)"}</div>
          <span class="model-status status-running"><span class="status-indicator status-active"></span> Running</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">ID:</span>
          <span class="model-value">${model.id ? model.id.substring(0, 12) : "N/A"
      }</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Running since:</span>
          <span class="model-value">${formatRunTime(model.created)}</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Size:</span>
          <span class="model-value">${formatSize(model.size || 0)}</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Parameters:</span>
          <span class="model-value">${paramDisplay}</span>
        </div>
        
        <div class="model-info-row" style="justify-content: center;">
          <button class="stop-btn" data-model="${model.model || ""
      }" data-id="${model.id || ""}">Stop Model</button>
        </div>
      </div>
    `;
  });

  // Stopped models
  allModels
    .filter((model) => !runningModelNames.has(model.name))
    .forEach((model) => {
      cardsHTML += `
        <div class="model-card">
          <div class="model-header">
            <div class="model-name">${model.name}</div>
            <span class="model-status status-stopped">Stopped</span>
          </div>
          
          <div class="model-info-row">
            <span class="model-label">Size:</span>
            <span class="model-value">${formatSize(model.size)}</span>
          </div>
          
          <div class="model-info-row" style="justify-content: center;">
            <button class="load-btn" data-model="${model.name
        }">Load Model</button>
          </div>
        </div>
      `;
    });

  cardsHTML += "</div>";

  modelsContainer.innerHTML = cardsHTML;

  // Add event listeners to buttons
  document.querySelectorAll(".stop-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const modelId = this.getAttribute("data-id");
      const modelName = this.getAttribute("data-model");
      debugLog(
        `Stop button clicked for model: ${modelName}, id: ${modelId}`
      );
      await stopModel(modelName, modelId);
      fetchRunningModels(); // Refresh the view
    });
  });

  document.querySelectorAll(".load-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const modelName = this.getAttribute("data-model");
      debugLog(`Load button clicked for model: ${modelName}`);
      await loadModel(modelName);
      fetchRunningModels(); // Refresh the view
    });
  });
}

function renderModelTable(runningModels, allModels) {
  const modelsContainer = document.getElementById("models-container");
  
  // Ensure arrays exist and are arrays
  runningModels = runningModels || [];
  allModels = allModels || [];

  // Debug the incoming data
  debugLog(
    `Rendering table with ${runningModels.length} running models:`,
    runningModels
  );
  debugLog(`And ${allModels.length} total models:`, allModels);

  // Create a set of running model names for quick lookup
  const runningModelNames = new Set(runningModels.map((m) => m.model));
  debugLog(`Running model set:`, Array.from(runningModelNames));

  // Build the table HTML
  const tableHTML = `
  <div class="table-responsive">
  <table>
      <thead>
          <tr>
              <th>Status</th>
              <th>Model</th>
              <th>ID</th>
              <th>Running since</th>
              <th>Size</th>
              <th>Parameters</th>
              <th>Actions</th>
          </tr>
      </thead>
      <tbody>
          ${runningModels
      .map((model) => {
        const paramInfo =
          model.details?.parameter_size || "Unknown";
        const quantInfo = model.details?.quantization_level || "";
        const paramDisplay = quantInfo
          ? `${paramInfo} (${quantInfo})`
          : paramInfo;

        return `
              <tr>
                  <td><span class="status-indicator status-active"></span> Running</td>
                  <td>${model.model || "(unnamed)"}</td>
                  <td>${model.id ? model.id.substring(0, 12) : "N/A"}</td>
                  <td>${formatRunTime(model.created)}</td>
                  <td>${formatSize(model.size || 0)}</td>
                  <td>${paramDisplay}</td>
                  <td>
                      <button class="stop-btn" data-model="${model.model || ""
          }" data-id="${model.id || ""}">Stop</button>
                  </td>
              </tr>
              `;
      })
      .join("")}
          
          ${allModels
      .filter((model) => !runningModelNames.has(model.name))
      .map(
        (model) => `
                  <tr>
                      <td>Stopped</td>
                      <td>${model.name}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>${formatSize(model.size)}</td>
                      <td>-</td>
                      <td>
                        <button class="load-btn" data-model="${model.name
          }">Load</button>
                      </td>
                  </tr>
              `
      )
      .join("")}
      </tbody>
      </table>
  </div>
`;

  modelsContainer.innerHTML = tableHTML;

  // Add event listeners to stop buttons
  document.querySelectorAll(".stop-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const modelId = this.getAttribute("data-id");
      const modelName = this.getAttribute("data-model");
      debugLog(
        `Stop button clicked for model: ${modelName}, id: ${modelId}`
      );
      await stopModel(modelName, modelId);
      fetchRunningModels(); // Refresh the view
    });
  });
  // Add event listeners to load buttons
  document.querySelectorAll(".load-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const modelName = this.getAttribute("data-model");
      debugLog(`Load button clicked for model: ${modelName}`);
      await loadModel(modelName);
      fetchRunningModels(); // Refresh the view
    });
  });
}

// Listen for window resize to switch between mobile and desktop views
window.addEventListener("resize", function () {
  fetchRunningModels();
});

function findModelSize(modelName, allModels) {
  if (!allModels) return "Unknown";

  const model = allModels.find((m) => m.name === modelName);
  return model ? formatSize(model.size) : "Unknown";
}

function formatRunTime(createdTimestamp) {
  if (!createdTimestamp) return "Unknown";

  const created = new Date(createdTimestamp * 1000);
  const now = new Date();
  const diffSeconds = Math.floor((now - created) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} minutes`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)} hours`;
  } else {
    return `${Math.floor(diffSeconds / 86400)} days`;
  }
}

async function stopModel(modelName, modelId) {
  debugLog(`Attempting to stop model ${modelName} with ID ${modelId}`);

  try {
    // The Ollama API doesn't have a specific "stop" endpoint for loaded models
    // Instead, we'll use a strategy that unloads the model

    // Try using a special request to unload the model
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        keep_alive: 0,
      }),
    });

    // Check if the unload was successful
    if (response.ok) {
      debugLog(`Model ${modelName} unloaded successfully!`);
      alert(`Model ${modelName} unloaded successfully!`);
      return true;
    }

    // If the standard approach fails, try an alternative
    debugLog(`Standard unload failed. Trying alternative approach...`);

    // Make a generate request with a different unload option
    const altResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        prompt: "unload model",
        options: {
          num_gpu: 0, // Try to move model off GPU
          num_keep: 0, // Don't keep any layers
        },
      }),
    });

    if (altResponse.ok) {
      debugLog(`Alternative unload approach completed`);
      alert(
        `Attempted to unload model ${modelName}. Please refresh to verify.`
      );
      return true;
    }

    throw new Error("Failed to unload model using available methods");
  } catch (error) {
    debugLog(`Error stopping model ${modelName}: ${error.message}`);
    console.error(`Error stopping model ${modelName}:`, error);
    alert(
      `Note: Models stay loaded until Ollama is restarted or they expire. The UI will update after refresh.`
    );
    return false;
  }
}

async function loadModel(modelName) {
  debugLog(`Attempting to load model ${modelName}`);

  try {
    // Show loading message
    alert(`Loading model ${modelName}. This may take a moment...`);

    // Make a simple generate request to load the model
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
      }),
    });

    // Check if the load was successful
    if (response.ok) {
      debugLog(`Model ${modelName} loaded successfully!`);
      alert(`Model ${modelName} loaded successfully!`);
      return true;
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `HTTP error ${response.status}`
      );
    }
  } catch (error) {
    debugLog(`Error loading model ${modelName}: ${error.message}`);
    console.error(`Error loading model ${modelName}:`, error);
    alert(`Error loading model ${modelName}: ${error.message}`);
    return false;
  }
}

function formatSize(bytes) {
  if (!bytes) return "Unknown";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (
    parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i]
  );
}
