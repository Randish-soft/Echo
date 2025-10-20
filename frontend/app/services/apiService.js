// frontend/app/services/apiService.js

/**
 * Echo API Service
 * Handles communication with the Echo backend API
 */

const isBrowser = typeof window !== "undefined";

// Use localhost for browser, environment variable for SSR
const BASE = isBrowser 
  ? "http://localhost:8000" 
  : (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000");

const DEFAULT_TIMEOUT = 60000;

console.log(`🔧 API Base URL configured: ${BASE}`);

/**
 * Internal fetch wrapper with timeout and error handling
 */
async function request(path, { method = "GET", body, headers = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    signal: controller.signal,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🔄 Making ${method} request to: ${url}`);
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const error = new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.details = errorData;
      throw error;
    }

    // Parse successful response
    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend server at ${BASE}. Please ensure the backend is running.`);
    }
    
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function getHealth() {
  return request('/api/health');
}

/**
 * List all repositories
 */
export async function listRepositories() {
  return request('/api/repos');
}

/**
 * Add a new repository
 * @param {string} github_url - GitHub repository URL
 * @param {string} branch - Branch name (default: "main")
 */
export async function addRepository(github_url, branch = "main") {
  if (!github_url) {
    throw new Error('GitHub URL is required');
  }

  // Clean the URL
  const cleanUrl = github_url.trim().replace(/\.git$/, '');
  
  return request('/api/repos/add', {
    method: 'POST',
    body: {
      github_url: cleanUrl,
      branch: branch || "main"
    },
    timeout: 120000 // 2 minutes for cloning
  });
}

/**
 * Generate documentation for a repository
 * @param {string} repo_id - Repository ID
 * @param {string} doc_type - Documentation type ("internal" or "external")
 * @param {string} audience - Target audience ("developers", "users", etc.)
 */
export async function generateDocumentation(repo_id, doc_type = "internal", audience = "developers") {
  if (!repo_id) {
    throw new Error('Repository ID is required');
  }

  return request('/api/docs/generate', {
    method: 'POST',
    body: {
      repo_id,
      doc_type,
      audience
    },
    timeout: 180000 // 3 minutes for doc generation
  });
}

/**
 * Get repository summary
 * @param {string} repo_id - Repository ID
 */
export async function getRepositorySummary(repo_id) {
  if (!repo_id) {
    throw new Error('Repository ID is required');
  }

  return request(`/api/repos/${repo_id}/summary`);
}

// Default export with all methods
const apiService = {
  BASE,
  getHealth,
  listRepositories,
  addRepository,
  generateDocumentation,
  getRepositorySummary
};

export default apiService;