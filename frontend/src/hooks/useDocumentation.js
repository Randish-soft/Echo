// hooks/useDocumentation.js
import { useState, useCallback } from 'react';

export const useDocumentation = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [documentation, setDocumentation] = useState(null);
  const [error, setError] = useState(null);

  const generateDocumentation = useCallback(async (repoData, docType = 'external') => {
    setGenerating(true);
    setProgress(0);
    setError(null);
    setCurrentStep('Initializing...');

    try {
      const token = localStorage.getItem('github_token');
      const response = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          repository: repoData,
          documentationType: docType
        })
      });

      if (!response.ok) throw new Error('Documentation generation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data.progress || 0);
              setCurrentStep(data.step || '');
              
              if (data.completed) {
                setDocumentation(data.documentation);
                setGenerating(false);
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  }, []);

  const resetDocumentation = useCallback(() => {
    setDocumentation(null);
    setProgress(0);
    setCurrentStep('');
    setError(null);
  }, []);

  return {
    generating,
    progress,
    currentStep,
    documentation,
    error,
    generateDocumentation,
    resetDocumentation
  };
};

