// Load configuration from localStorage or use explicit default
let GPU_API_URL = localStorage.getItem("gpuApiUrl") || "http://your-server-ip:5000/api/gpu-data";

// Debug logging function (reusing from ollama.js)
function gpuDebugLog(message, data = null) {
  const logElement = document.getElementById("debug-content");
  if (!logElement) return; // Safety check

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

// Main GPU monitoring logic
document.addEventListener("DOMContentLoaded", function () {
  // Initialize GPU API URL input
  const apiUrlInput = document.getElementById("gpu-api-url");
  if (apiUrlInput) {
    apiUrlInput.value = GPU_API_URL;
  }

  // Add toggle functionality for GPU section
  const toggleBtn = document.getElementById("toggle-gpu-section");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const container = document.getElementById("gpu-container");
      if (container) {
        container.classList.toggle("hidden");
      }
    });
  }

  // Add refresh button functionality
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      fetchGpuData();
      // Update the refresh button to show it's working
      refreshBtn.textContent = "Refreshing...";
      setTimeout(() => {
        refreshBtn.textContent = "Refresh Now";
      }, 500);
    });
  }

  // Configuration panel functionality
  const configBtn = document.getElementById("config-btn");
  const apiConfig = document.getElementById("api-config");
  const saveConfigBtn = document.getElementById("save-config");
  const cancelConfigBtn = document.getElementById("cancel-config");

  // Show/hide config panel
  if (configBtn && apiConfig) {
    configBtn.addEventListener("click", function () {
      apiConfig.style.display = "block";
    });
  }

  // Save configuration
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", function () {
      const newGpuUrl = document.getElementById("gpu-api-url").value;
      if (updateGpuApiUrl(newGpuUrl)) {
        apiConfig.style.display = "none";
        gpuDebugLog("Configuration saved, fetching new data...");
        fetchGpuData();
      }
    });
  }

  // Cancel configuration
  if (cancelConfigBtn && apiConfig) {
    cancelConfigBtn.addEventListener("click", function () {
      // Reset values to current stored values
      document.getElementById("gpu-api-url").value = GPU_API_URL;
      apiConfig.style.display = "none";
    });
  }

  // Set up auto-refresh functionality
  let countdownInterval;
  let refreshInterval = localStorage.getItem("refreshInterval") || 30;
  let countdown = refreshInterval;

  // Initialize refresh interval input and countdown
  const refreshIntervalInput = document.getElementById("refresh-interval");
  const countdownDisplay = document.getElementById("countdown");

  if (refreshIntervalInput) refreshIntervalInput.value = refreshInterval;
  if (countdownDisplay) countdownDisplay.textContent = countdown;

  // Save refresh interval button
  const saveRefreshBtn = document.getElementById("save-refresh-btn");
  if (saveRefreshBtn && refreshIntervalInput && countdownDisplay) {
    saveRefreshBtn.addEventListener("click", function () {
      const newInterval = parseInt(refreshIntervalInput.value);
      if (newInterval >= 5 && newInterval <= 300) {
        refreshInterval = newInterval;
        countdown = newInterval;
        countdownDisplay.textContent = countdown;
        localStorage.setItem("refreshInterval", refreshInterval);

        // Reset the countdown timer
        clearInterval(countdownInterval);
        startCountdown();
        gpuDebugLog(`Auto-refresh interval set to ${refreshInterval} seconds`);
      }
    });
  }

  // Function to start countdown timer
  function startCountdown() {
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdownDisplay) countdownDisplay.textContent = countdown;

      if (countdown <= 0) {
        // Refresh data
        fetchGpuData();
        countdown = refreshInterval;
        if (countdownDisplay) countdownDisplay.textContent = countdown;
      }
    }, 1000);
  }

  // Start the countdown and data fetching
  startCountdown();

  // Initial GPU data load
  fetchGpuData();

  async function fetchGpuData() {
    const gpuContainer = document.getElementById("gpu-container");
    if (!gpuContainer) return; // Safety check

    try {
      // Ensure URL is absolute and not using relative paths
      const apiUrl = ensureAbsoluteUrl(GPU_API_URL);
      gpuDebugLog(`Fetching GPU data from ${apiUrl}`);
      console.log("API URL:", apiUrl); // Additional console logging

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // For cross-origin requests
        mode: 'cors',
        credentials: 'omit',
        // Add a cache-busting parameter to avoid caching issues
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`GPU API error: ${response.status} ${response.statusText}`);
      }

      // Get the content type to check if we're receiving JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Try to get a sample of the response to show what we're receiving
        const textSample = await response.text();
        const samplePreview = textSample.substring(0, 100) + '...';
        throw new Error(`Expected JSON but got ${contentType || 'unknown'} content. Response starts with: ${samplePreview}`);
      }

      const data = await response.json();
      gpuDebugLog("GPU data received:", data);

      if (data.error) {
        throw new Error(`API returned error: ${data.error}`);
      }

      // Update the basic GPU data elements in the current HTML
      if (data.gpus && data.gpus.length > 0) {
        const gpu = data.gpus[0]; // Using the first GPU for now

        // Update all the GPU stats we have in our HTML
        const tempElement = document.getElementById('gpu-temperature');
        if (tempElement) tempElement.textContent = `${gpu.temperature}°C`;

        const utilizationElement = document.getElementById('gpu-utilization');
        if (utilizationElement) utilizationElement.textContent = `${gpu.gpu_utilization}%`;

        const memUtilizationElement = document.getElementById('gpu-memory-utilization');
        if (memUtilizationElement) memUtilizationElement.textContent = `${gpu.memory_utilization}%`;

        const memUsedElement = document.getElementById('gpu-memory-used');
        if (memUsedElement) memUsedElement.textContent = `${gpu.memory_used} / ${gpu.memory_total} MB`;

        const powerDrawElement = document.getElementById('gpu-power-draw');
        if (powerDrawElement) powerDrawElement.textContent = `${gpu.power_draw} W`;

        // Update the last updated timestamp
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
          lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }

        // If you want to display more detailed information with tables or cards, uncomment this
        // renderGpuData(data);
      }
    } catch (error) {
      console.error("Error fetching GPU data:", error);
      gpuDebugLog(`GPU Error: ${error.message}`);

      if (gpuContainer) {
        gpuContainer.innerHTML = `
        <div class="no-models">
          <p>Error connecting to GPU Monitoring API: ${error.message}</p>
          <p>Make sure your GPU monitoring service is running and the API URL is correct.</p>
          <p>Current endpoint: ${GPU_API_URL}</p>
        </div>
      `;
      }
    }
  }

  function renderGpuData(data) {
    const gpuContainer = document.getElementById("gpu-container");
    if (!gpuContainer) return;

    // Check if we have GPU data
    if (!data.gpus || data.gpus.length === 0) {
      gpuContainer.innerHTML = '<div class="no-models">No GPUs detected</div>';
      return;
    }

    // Determine if we should use mobile view based on screen width
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      renderGpuMobileCards(data);
    } else {
      renderGpuTable(data);
    }
  }

  function renderGpuMobileCards(data) {
    const gpuContainer = document.getElementById("gpu-container");
    let cardsHTML = '<div class="mobile-card-view">';

    // GPU Cards
    data.gpus.forEach(gpu => {
      cardsHTML += `
      <div class="model-card">
        <div class="model-header">
          <div class="model-name">${gpu.name}</div>
          <span class="model-status status-running">GPU ${gpu.index}</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Temperature:</span>
          <span class="model-value">${gpu.temperature}°C</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">GPU Usage:</span>
          <span class="model-value">${gpu.gpu_utilization}%</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Memory Usage:</span>
          <span class="model-value">${gpu.memory_utilization}%</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Memory:</span>
          <span class="model-value">${gpu.memory_used} / ${gpu.memory_total} MB</span>
        </div>
        
        <div class="model-info-row">
          <span class="model-label">Power Draw:</span>
          <span class="model-value">${gpu.power_draw} W</span>
        </div>
      </div>
    `;
    });

    // Process Cards
    if (data.processes && data.processes.length > 0) {
      cardsHTML += `
      <div class="model-card">
        <div class="model-header">
          <div class="model-name">GPU Processes</div>
        </div>
    `;

      data.processes.forEach(process => {
        cardsHTML += `
        <div class="model-info-row">
          <span class="model-label">PID ${process.pid}:</span>
          <span class="model-value">${process.process_name}</span>
        </div>
        <div class="model-info-row">
          <span class="model-label">Memory:</span>
          <span class="model-value">${process.used_memory}</span>
        </div>
        <div style="border-bottom: 1px dashed var(--border-color); margin: 5px 0;"></div>
      `;
      });

      cardsHTML += `</div>`;
    }

    cardsHTML += "</div>";
    gpuContainer.innerHTML = cardsHTML;
  }

  function renderGpuTable(data) {
    const gpuContainer = document.getElementById("gpu-container");

    // Build the GPU info table
    let tableHTML = `
    <div class="table-responsive">
      <h3>GPUs</h3>
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Name</th>
            <th>Temperature</th>
            <th>GPU Usage</th>
            <th>Memory Usage</th>
            <th>Memory</th>
            <th>Power Draw</th>
          </tr>
        </thead>
        <tbody>
  `;

    data.gpus.forEach(gpu => {
      tableHTML += `
      <tr>
        <td>${gpu.index}</td>
        <td>${gpu.name}</td>
        <td>${gpu.temperature}°C</td>
        <td>${gpu.gpu_utilization}%</td>
        <td>${gpu.memory_utilization}%</td>
        <td>${gpu.memory_used} / ${gpu.memory_total} MB</td>
        <td>${gpu.power_draw} W</td>
      </tr>
    `;
    });

    tableHTML += `
        </tbody>
      </table>
    </div>
  `;

    // Build the process table if we have processes
    if (data.processes && data.processes.length > 0) {
      tableHTML += `
      <div class="table-responsive" style="margin-top: 20px;">
        <h3>GPU Processes</h3>
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Process Name</th>
              <th>GPU</th>
              <th>Memory Usage</th>
            </tr>
          </thead>
          <tbody>
    `;

      data.processes.forEach(process => {
        tableHTML += `
        <tr>
          <td>${process.pid}</td>
          <td>${process.process_name}</td>
          <td>${process.gpu_name}</td>
          <td>${process.used_memory}</td>
        </tr>
      `;
      });

      tableHTML += `
          </tbody>
        </table>
      </div>
    `;
    }

    gpuContainer.innerHTML = tableHTML;
  }

  // Ensures URL is absolute
  function ensureAbsoluteUrl(url) {
    if (!url) return "";

    // Check if URL has protocol
    if (!/^https?:\/\//i.test(url)) {
      // If it starts with "/", it's a relative path
      if (url.startsWith('/')) {
        return window.location.origin + url;
      }
      // Otherwise, assume it's a domain or IP without protocol
      return "http://" + url;
    }
    return url;
  }

  // Function to update GPU URL from the configuration panel
  function updateGpuApiUrl(newUrl) {
    if (newUrl && newUrl.trim() !== "") {
      // Make sure to use the absolute URL
      GPU_API_URL = newUrl.trim();
      localStorage.setItem("gpuApiUrl", GPU_API_URL);
      gpuDebugLog(`GPU API URL updated to: ${GPU_API_URL}`);
      fetchGpuData();
      return true;
    }
    return false;
  }

  // Listen for window resize to switch between mobile and desktop views
  window.addEventListener("resize", function () {
    // Only re-render if we're actually displaying the full GPU data
    const gpuContainer = document.getElementById("gpu-container");
    if (gpuContainer && !gpuContainer.classList.contains("hidden")) {
      fetchGpuData();
    }
  });

  // Hide the API configuration panel by default when page loads
  if (apiConfig) {
    apiConfig.style.display = "none";
  }

  // Clean up intervals when page is being unloaded to prevent memory leaks
  window.addEventListener("beforeunload", function () {
    // Clear all active intervals
    clearInterval(countdownInterval);
  });
});