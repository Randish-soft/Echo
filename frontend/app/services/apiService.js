// frontend/app/services/apiService.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    console.log('API Service initialized with URL:', this.baseUrl);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log(`${options.method || 'GET'} ${endpoint}:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the backend. Please ensure the server is running.');
      }
      
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await this.request('/api/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  async getRepositories() {
    return this.request('/api/repos');
  }

  async addRepository(github_url, branch = 'main') {
    return this.request('/api/repos/add', {
      method: 'POST',
      body: JSON.stringify({ github_url, branch }),
    });
  }

  async getRepositorySummary(repoId) {
    return this.request(`/api/repos/${repoId}/summary`);
  }

  async generateDocumentation(repo_id, doc_type = 'internal', audience = 'developers') {
    return this.request('/api/docs/generate', {
      method: 'POST',
      body: JSON.stringify({
        repo_id,
        doc_type,
        audience,
      }),
    });
  }
}

const apiService = new ApiService();
export default apiService;