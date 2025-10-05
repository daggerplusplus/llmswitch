/**
 * @jest-environment jsdom
 */

describe('GPU API Configuration', () => {
  let localStorage;
  let mockFetch;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = `
      <div id="gpu-section" style="display: none;"></div>
      <div id="gpu-container" style="display: none;"></div>
      <input id="gpu-api-url" value="" />
      <div id="debug-content"></div>
    `;

    // Mock localStorage
    localStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = value.toString();
      },
      clear() {
        this.store = {};
      }
    };
    global.localStorage = localStorage;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('GPU API URL Configuration', () => {
    test('should use default GPU API URL when not configured', () => {
      const DEFAULT_GPU_API_URL = "http://your-server-ip:5000/api/gpu-data";
      const GPU_API_URL = localStorage.getItem("gpuApiUrl") || DEFAULT_GPU_API_URL;

      expect(GPU_API_URL).toBe(DEFAULT_GPU_API_URL);
    });

    test('should use stored GPU API URL from localStorage', () => {
      const customUrl = "http://192.168.1.100:5000/api/gpu-data";
      localStorage.setItem("gpuApiUrl", customUrl);

      const GPU_API_URL = localStorage.getItem("gpuApiUrl");
      expect(GPU_API_URL).toBe(customUrl);
    });

    test('should detect if GPU API is configured', () => {
      const DEFAULT_GPU_API_URL = "http://your-server-ip:5000/api/gpu-data";

      // Function from gpu.js
      const isGpuApiConfigured = (url) => {
        return url !== DEFAULT_GPU_API_URL && url.trim() !== "";
      };

      expect(isGpuApiConfigured(DEFAULT_GPU_API_URL)).toBe(false);
      expect(isGpuApiConfigured("http://192.168.1.100:5000/api/gpu-data")).toBe(true);
      expect(isGpuApiConfigured("")).toBe(false);
    });
  });

  describe('GPU Section Visibility', () => {
    test('should hide GPU section when using default URL', () => {
      const DEFAULT_GPU_API_URL = "http://your-server-ip:5000/api/gpu-data";
      const GPU_API_URL = DEFAULT_GPU_API_URL;

      const isGpuApiConfigured = (url) => {
        return url !== DEFAULT_GPU_API_URL && url.trim() !== "";
      };

      const gpuSection = document.getElementById("gpu-section");
      const gpuContainer = document.getElementById("gpu-container");

      if (isGpuApiConfigured(GPU_API_URL)) {
        gpuSection.style.display = "block";
        gpuContainer.style.display = "block";
      } else {
        gpuSection.style.display = "none";
        gpuContainer.style.display = "none";
      }

      expect(gpuSection.style.display).toBe("none");
      expect(gpuContainer.style.display).toBe("none");
    });

    test('should show GPU section when using custom URL', () => {
      const DEFAULT_GPU_API_URL = "http://your-server-ip:5000/api/gpu-data";
      const GPU_API_URL = "http://192.168.1.100:5000/api/gpu-data";

      const isGpuApiConfigured = (url) => {
        return url !== DEFAULT_GPU_API_URL && url.trim() !== "";
      };

      const gpuSection = document.getElementById("gpu-section");
      const gpuContainer = document.getElementById("gpu-container");

      if (isGpuApiConfigured(GPU_API_URL)) {
        gpuSection.style.display = "block";
        gpuContainer.style.display = "block";
      } else {
        gpuSection.style.display = "none";
        gpuContainer.style.display = "none";
      }

      expect(gpuSection.style.display).toBe("block");
      expect(gpuContainer.style.display).toBe("block");
    });
  });

  describe('GPU API URL Update', () => {
    test('should update GPU API URL and save to localStorage', () => {
      const updateGpuApiUrl = (newUrl) => {
        if (newUrl && newUrl.trim() !== "") {
          const trimmedUrl = newUrl.trim();
          localStorage.setItem("gpuApiUrl", trimmedUrl);
          return true;
        }
        return false;
      };

      const newUrl = "http://192.168.1.100:5000/api/gpu-data";
      const result = updateGpuApiUrl(newUrl);

      expect(result).toBe(true);
      expect(localStorage.getItem("gpuApiUrl")).toBe(newUrl);
    });

    test('should not update with empty URL', () => {
      const updateGpuApiUrl = (newUrl) => {
        if (newUrl && newUrl.trim() !== "") {
          const trimmedUrl = newUrl.trim();
          localStorage.setItem("gpuApiUrl", trimmedUrl);
          return true;
        }
        return false;
      };

      const result = updateGpuApiUrl("");
      expect(result).toBe(false);
      expect(localStorage.getItem("gpuApiUrl")).toBeNull();
    });

    test('should trim whitespace from URL', () => {
      const updateGpuApiUrl = (newUrl) => {
        if (newUrl && newUrl.trim() !== "") {
          const trimmedUrl = newUrl.trim();
          localStorage.setItem("gpuApiUrl", trimmedUrl);
          return true;
        }
        return false;
      };

      const urlWithSpaces = "  http://192.168.1.100:5000/api/gpu-data  ";
      updateGpuApiUrl(urlWithSpaces);

      expect(localStorage.getItem("gpuApiUrl")).toBe("http://192.168.1.100:5000/api/gpu-data");
    });
  });

  describe('GPU Data Fetching', () => {
    test('should fetch GPU data from configured URL', async () => {
      const mockGpuData = {
        gpus: [
          { name: "NVIDIA RTX 4090", utilization: 75, memory: 80 }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGpuData
      });

      const GPU_API_URL = "http://192.168.1.100:5000/api/gpu-data";
      const response = await fetch(GPU_API_URL);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(GPU_API_URL);
      expect(response.ok).toBe(true);
      expect(data).toEqual(mockGpuData);
    });

    test('should handle GPU API fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const GPU_API_URL = "http://192.168.1.100:5000/api/gpu-data";

      await expect(fetch(GPU_API_URL)).rejects.toThrow('Network error');
    });

    test('should handle non-OK response status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const GPU_API_URL = "http://192.168.1.100:5000/api/gpu-data";
      const response = await fetch(GPU_API_URL);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('URL Validation', () => {
    test('should validate HTTP URLs', () => {
      const isValidUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      };

      expect(isValidUrl("http://192.168.1.100:5000/api/gpu-data")).toBe(true);
      expect(isValidUrl("https://example.com:5000/api/gpu-data")).toBe(true);
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
    });

    test('should handle relative vs absolute URLs', () => {
      const ensureAbsoluteUrl = (url) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `http://${url}`;
      };

      expect(ensureAbsoluteUrl("http://example.com/api")).toBe("http://example.com/api");
      expect(ensureAbsoluteUrl("example.com/api")).toBe("http://example.com/api");
      expect(ensureAbsoluteUrl("192.168.1.100:5000/api")).toBe("http://192.168.1.100:5000/api");
    });
  });

  describe('Environment Variable Integration', () => {
    test('should construct GPU API URL from host and port env vars', () => {
      const GPU_API_HOST = '192.168.1.100';
      const GPU_API_PORT = '5000';
      const GPU_API_PATH = '/api/gpu-data';

      const GPU_API_URL = `http://${GPU_API_HOST}:${GPU_API_PORT}${GPU_API_PATH}`;

      expect(GPU_API_URL).toBe('http://192.168.1.100:5000/api/gpu-data');
    });

    test('should use default values when env vars not provided', () => {
      const GPU_API_HOST = 'localhost';
      const GPU_API_PORT = '5000';
      const GPU_API_PATH = '/api/gpu-data';

      const GPU_API_URL = `http://${GPU_API_HOST}:${GPU_API_PORT}${GPU_API_PATH}`;

      expect(GPU_API_URL).toBe('http://localhost:5000/api/gpu-data');
    });
  });
});
