/**
 * GitHub API Service
 * Handles all GitHub-related API calls
 */

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get user repositories
   */
  async getRepositories(options = {}) {
    const {
      type = 'owner',
      sort = 'updated',
      direction = 'desc',
      per_page = 100,
      page = 1
    } = options;

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/user/repos?type=${type}&sort=${sort}&direction=${direction}&per_page=${per_page}&page=${page}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(owner, repo, path = '') {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      throw error;
    }
  }

  /**
   * Get file content (for text files)
   */
  async getFileContent(owner, repo, path) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.type === 'file' && data.content) {
        // Decode base64 content
        return atob(data.content);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  /**
   * Get repository tree (recursive file listing)
   */
  async getRepositoryTree(owner, repo, sha = 'HEAD', recursive = true) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${sha}?recursive=${recursive}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository tree:', error);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner, repo) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getCurrentUser() {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/user`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(owner, repo) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository languages:', error);
      throw error;
    }
  }

  /**
   * Get repository README
   */
  async getRepositoryReadme(owner, repo) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        content: atob(data.content)
      };
    } catch (error) {
      console.error('Error fetching repository README:', error);
      throw error;
    }
  }

  /**
   * Search repositories
   */
  async searchRepositories(query, options = {}) {
    const {
      sort = 'updated',
      order = 'desc',
      per_page = 30,
      page = 1
    } = options;

    try {
      const searchQuery = encodeURIComponent(query);
      const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=${searchQuery}&sort=${sort}&order=${order}&per_page=${per_page}&page=${page}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  /**
   * Check rate limit status
   */
  async getRateLimit() {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/rate_limit`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      throw error;
    }
  }
}

export default GitHubService;