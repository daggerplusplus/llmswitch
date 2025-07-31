// Debug logging functionality for the separate debug page
let debugMessages = [];
let maxLogEntries = 1000; // Limit to prevent memory issues

// Enhanced debug logging function with levels
function debugLog(message, data = null, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp,
        message,
        data,
        level,
        id: Date.now() + Math.random()
    };

    // Add to messages array
    debugMessages.unshift(logEntry);

    // Limit array size
    if (debugMessages.length > maxLogEntries) {
        debugMessages = debugMessages.slice(0, maxLogEntries);
    }

    // Store in localStorage for persistence across pages
    try {
        localStorage.setItem('debugMessages', JSON.stringify(debugMessages.slice(0, 100))); // Store only last 100
    } catch (e) {
        console.warn('Could not save debug messages to localStorage:', e);
    }

    // Update display if we're on the debug page
    updateDebugDisplay();
}

// GPU debug log function (alias for compatibility)
function gpuDebugLog(message, data = null) {
    debugLog(`[GPU] ${message}`, data, 'info');
}

// Error logging function
function debugError(message, data = null) {
    debugLog(message, data, 'error');
}

// Warning logging function
function debugWarning(message, data = null) {
    debugLog(message, data, 'warning');
}

// Load debug messages from localStorage on page load
function loadStoredDebugMessages() {
    try {
        const stored = localStorage.getItem('debugMessages');
        if (stored) {
            debugMessages = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Could not load debug messages from localStorage:', e);
    }
}

// Update the debug display
function updateDebugDisplay() {
    const logElement = document.getElementById("debug-content");
    if (!logElement) return; // Not on debug page

    const levelFilter = document.getElementById("log-level")?.value || 'all';
    const autoScroll = document.getElementById("auto-scroll")?.checked !== false;

    // Filter messages based on level
    let filteredMessages = debugMessages;
    if (levelFilter !== 'all') {
        const levelPriority = { error: 3, warning: 2, info: 1 };
        const minLevel = levelPriority[levelFilter] || 1;
        filteredMessages = debugMessages.filter(msg =>
            (levelPriority[msg.level] || 1) >= minLevel
        );
    }

    // Build HTML
    let html = '';
    filteredMessages.forEach(entry => {
        const levelClass = `log-${entry.level}`;
        let logMessage = `<span class="log-timestamp">[${entry.timestamp}]</span> <span class="${levelClass}">${entry.message}</span>`;

        if (entry.data) {
            if (typeof entry.data === "object") {
                logMessage += `<pre class="log-data">${JSON.stringify(entry.data, null, 2)}</pre>`;
            } else {
                logMessage += ` <span class="log-data">${entry.data}</span>`;
            }
        }

        html += `<div class="log-entry ${levelClass}">${logMessage}</div><hr class="log-separator">`;
    });

    logElement.innerHTML = html || '<div class="no-logs">No debug messages yet.</div>';

    // Auto-scroll to top (newest messages)
    if (autoScroll && filteredMessages.length > 0) {
        logElement.scrollTop = 0;
    }
}

// Clear all debug messages
function clearDebugLog() {
    debugMessages = [];
    localStorage.removeItem('debugMessages');
    updateDebugDisplay();
    debugLog('Debug log cleared', null, 'info');
}

// Export debug log as text file
function exportDebugLog() {
    const logText = debugMessages.map(entry => {
        let line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
        if (entry.data) {
            if (typeof entry.data === "object") {
                line += `\n${JSON.stringify(entry.data, null, 2)}`;
            } else {
                line += ` ${entry.data}`;
            }
        }
        return line;
    }).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    debugLog('Debug log exported', null, 'info');
}

// Initialize debug page functionality
document.addEventListener("DOMContentLoaded", function () {
    // Load stored messages
    loadStoredDebugMessages();

    // Set up event listeners if we're on the debug page
    const clearBtn = document.getElementById("clear-log-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearDebugLog);
    }

    const exportBtn = document.getElementById("export-log-btn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportDebugLog);
    }

    const levelFilter = document.getElementById("log-level");
    if (levelFilter) {
        levelFilter.addEventListener("change", updateDebugDisplay);
    }

    const autoScrollCheckbox = document.getElementById("auto-scroll");
    if (autoScrollCheckbox) {
        autoScrollCheckbox.addEventListener("change", updateDebugDisplay);
    }

    // Initial display update
    updateDebugDisplay();

    // Add welcome message if we're on debug page
    if (document.getElementById("debug-content")) {
        debugLog('Debug page loaded', null, 'info');
    }
});

// Make functions globally available
window.debugLog = debugLog;
window.gpuDebugLog = gpuDebugLog;
window.debugError = debugError;
window.debugWarning = debugWarning;
