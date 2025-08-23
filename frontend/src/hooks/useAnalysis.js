// hooks/useAnalysis.js
import { useState, useCallback } from 'react';

export const useAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeRepository = useCallback(async (repoData) => {
    setAnalyzing(true);
    setError(null);

    try {
      const token = localStorage.getItem('github_token');
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ repository: repoData })
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getAnalysis = useCallback(async (repoId) => {
    try {
      const token = localStorage.getItem('github_token');
      const response = await fetch(`/api/analysis/${repoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        return data;
      }
    } catch (err) {
      setError(err.message);
    }
    return null;
  }, []);

  return {
    analyzing,
    analysis,
    error,
    analyzeRepository,
    getAnalysis
  };
};

