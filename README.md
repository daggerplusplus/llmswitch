# LLMSwitch

A web-based monitoring and management dashboard for **Ollama LLM models** with optional **GPU monitoring** capabilities. Monitor running models, load/unload models on demand, and track GPU performance metrics in real-time.

![LLMSwitch Dashboard](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-Vanilla_JS-blue) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- > **Ollama Model Management**: View, load, and unload AI models
- =� **Real-time Monitoring**: Auto-refresh with customizable intervals (5-300 seconds)
- =� **GPU Monitoring**: Track temperature, utilization, memory usage, and power draw
- =� **Responsive Design**: Mobile-friendly interface with card/table views
- =' **Configurable APIs**: Easy setup for different server configurations
- = **Debug Interface**: Comprehensive logging for troubleshooting
- = **Cross-Origin Support**: Built-in CORS handling for API integration

## Prerequisites

- **Node.js** (any recent version)
- **Ollama** running and accessible via API
- **GPU Monitoring API** (optional, for GPU metrics)

## Quick Start

### 1. Clone & Start Server

```bash
git clone https://github.com/daggerplusplus/llmswitch
cd llmswitch
node start-server.js
```

The server will start on `http://localhost:8000`

### 2. Configure Ollama API

1. Open your browser to `http://localhost:8000`
2. Click **"Configure APIs"**
3. Set your Ollama API URL (default: `http://localhost:11434`)
4. Click **"Save"**

### 3. Optional: GPU Monitoring Setup

For GPU monitoring, you need a separate GPU data collection API running.

**Recommended GPU Monitor**: [nvidia-gpu-monitor](https://github.com/daggerplusplus/nvidia-gpu-monitor)

This repository provides **Nvidia GPU monitoring**. AMD and Intel GPU monitoring may be added in the future.

#### Setting up nvidia-gpu-monitor:

1. Clone and setup the GPU monitor:
   ```bash
   git clone https://github.com/daggerplusplus/nvidia-gpu-monitor.git
   cd nvidia-gpu-monitor
   # Follow setup instructions in that repository
   ```

2. Start the GPU monitoring service (typically on port 5000)

3. In LLMSwitch, configure the GPU API:
   - Click **"Configure APIs"**
   - Set GPU API URL: `http://localhost:5000/api/gpu-data`
   - Click **"Save"**

## Configuration

### API Endpoints

| Service | Default URL | Purpose |
|---------|-------------|---------|
| Ollama API | `http://localhost:11434` | Model management & status |
| GPU Monitor API | `http://localhost:5000/api/gpu-data` | GPU metrics (optional) |

### Settings Storage

All settings are stored in browser localStorage:
- `ollamaApiUrl`: Ollama API endpoint
- `gpuApiUrl`: GPU monitoring API endpoint  
- `refreshInterval`: Auto-refresh interval (seconds)

## Usage

### Model Management

- **View Models**: See all available and currently running models
- **Load Model**: Click "Load" to start a stopped model
- **Stop Model**: Click "Stop" to unload a running model
- **Model Details**: View size, parameters, and runtime information

### GPU Monitoring

When configured with a GPU monitoring API:
- **Temperature**: Current GPU temperature
- **Utilization**: GPU and memory usage percentages
- **Memory**: Used/total GPU memory
- **Power Draw**: Current power consumption
- **Process List**: Running GPU processes (if available)

### Auto-Refresh

- Default: 30-second intervals
- Configurable: 5-300 seconds
- Manual refresh available
- Countdown timer shows next refresh

## API Integration

### Ollama API Endpoints Used

- `GET /api/tags` - List available models
- `GET /api/ps` - List running models
- `POST /api/generate` - Load/unload models

### GPU Monitor API Format

Expected JSON response from GPU API:
```json
{
  "gpus": [
    {
      "index": 0,
      "name": "NVIDIA GeForce RTX 4090",
      "temperature": 65,
      "gpu_utilization": 45,
      "memory_utilization": 60,
      "memory_used": 8192,
      "memory_total": 24576,
      "power_draw": 250
    }
  ],
  "processes": [
    {
      "pid": 1234,
      "process_name": "python.exe",
      "gpu_name": "NVIDIA GeForce RTX 4090",
      "used_memory": "2048 MB"
    }
  ]
}
```

## File Structure

```
llmswitch/
   index.html          # Main dashboard
   debug.html          # Debug interface
   start-server.js     # HTTP server
   css/
      styles.css      # Styling
   js/
      ollama.js       # Ollama API integration
      gpu.js          # GPU monitoring
      debug.js        # Debug logging
      api-test.js     # API testing utilities
   README.md
```

## Troubleshooting

### Common Issues

**Models not loading:**
1. Verify Ollama is running: `ollama list`
2. Check API URL in configuration
3. Review debug logs at `/debug.html`
4. Ensure CORS is properly configured

**GPU monitoring not working:**
1. Confirm GPU monitor API is running
2. Test GPU API endpoint directly in browser
3. Check GPU API URL configuration
4. Verify JSON response format matches expected structure

**Port conflicts:**
```bash
# Kill process using port 8000
netstat -ano | findstr :8000
taskkill /F /PID <process_id>
```

**CORS errors:**
- The built-in server includes CORS headers
- For external hosting, ensure proper CORS configuration

### Debug Interface

Access detailed logging at `http://localhost:8000/debug.html`:
- View all API calls and responses
- Filter logs by level (Error, Warning, Info)
- Export logs for troubleshooting
- Test API endpoints directly

### Network Configuration

For remote access, update API URLs to use actual IP addresses:
- Ollama: `http://192.168.1.100:11434`
- GPU Monitor: `http://192.168.1.100:5000/api/gpu-data`

## Development

### Adding New GPU Providers

To support AMD or Intel GPUs:
1. Implement GPU monitoring API following the expected JSON format
2. Update GPU API URL in configuration
3. No code changes needed in LLMSwitch

### Customization

- **Styling**: Modify `css/styles.css`
- **Refresh Intervals**: Update min/max values in `js/ollama.js`
- **API Endpoints**: Extend URL configuration in respective JS files

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and feature requests:
1. Check the debug logs first
2. Review this README
3. Search existing issues
4. Create a new issue with debug information

---

**Note**: This application provides a web interface for monitoring and managing Ollama models and GPU metrics. It does not include the actual GPU monitoring service - you must set up a compatible GPU monitoring API separately.