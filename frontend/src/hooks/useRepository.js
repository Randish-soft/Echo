// hooks/
import { useState, useEffect } from 'react';

export const useRepository = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      const response = await fetch('/api/repositories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch repositories');
      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRepository = async (owner, repo) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('github_token');
      const response = await fetch(`/api/repositories/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Repository not found');
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    getRepository
  };
};

