import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  repositories: [],
  selectedRepo: null,
  documentationTypes: [
    { id: 'api', name: 'API Documentation', description: 'Generate comprehensive API documentation' },
    { id: 'user', name: 'User Guide', description: 'Create user-friendly guides and tutorials' },
    { id: 'developer', name: 'Developer Documentation', description: 'Technical documentation for developers' },
    { id: 'readme', name: 'README Enhancement', description: 'Improve and enhance README files' },
    { id: 'changelog', name: 'Changelog', description: 'Generate detailed changelogs' },
    { id: 'architecture', name: 'Architecture Documentation', description: 'System architecture and design docs' }
  ],
  selectedDocType: null,
  generationProgress: {
    isGenerating: false,
    currentStep: '',
    progress: 0,
    steps: [
      'Fetching repository',
      'Analyzing code structure', 
      'Fragmenting files',
      'Analyzing chunks',
      'Generating documentation',
      'Saving documentation'
    ]
  },
  generatedDocumentation: null,
  analysisResults: null,
  error: null,
  isLoading: false
};

// Action types
const DOC_ACTIONS = {
  SET_REPOSITORIES: 'SET_REPOSITORIES',
  SET_SELECTED_REPO: 'SET_SELECTED_REPO',
  SET_SELECTED_DOC_TYPE: 'SET_SELECTED_DOC_TYPE',
  START_GENERATION: 'START_GENERATION',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  GENERATION_SUCCESS: 'GENERATION_SUCCESS',
  GENERATION_FAILURE: 'GENERATION_FAILURE',
  SET_ANALYSIS_RESULTS: 'SET_ANALYSIS_RESULTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_GENERATION: 'RESET_GENERATION'
};

// Reducer
const documentationReducer = (state, action) => {
  switch (action.type) {
    case DOC_ACTIONS.SET_REPOSITORIES:
      return {
        ...state,
        repositories: action.payload,
        error: null
      };
    case DOC_ACTIONS.SET_SELECTED_REPO:
      return {
        ...state,
        selectedRepo: action.payload,
        generatedDocumentation: null,
        analysisResults: null
      };
    case DOC_ACTIONS.SET_SELECTED_DOC_TYPE:
      return {
        ...state,
        selectedDocType: action.payload
      };
    case DOC_ACTIONS.START_GENERATION:
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: true,
          progress: 0,
          currentStep: state.generationProgress.steps[0]
        },
        error: null
      };
    case DOC_ACTIONS.UPDATE_PROGRESS:
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          progress: action.payload.progress,
          currentStep: action.payload.currentStep
        }
      };
    case DOC_ACTIONS.GENERATION_SUCCESS:
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: false,
          progress: 100,
          currentStep: 'Completed'
        },
        generatedDocumentation: action.payload,
        error: null
      };
    case DOC_ACTIONS.GENERATION_FAILURE:
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: false,
          progress: 0,
          currentStep: ''
        },
        error: action.payload
      };
    case DOC_ACTIONS.SET_ANALYSIS_RESULTS:
      return {
        ...state,
        analysisResults: action.payload
      };
    case DOC_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case DOC_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    case DOC_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case DOC_ACTIONS.RESET_GENERATION:
      return {
        ...state,
        generationProgress: {
          ...initialState.generationProgress
        },
        generatedDocumentation: null,
        analysisResults: null,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const DocumentationContext = createContext();

// Provider component
export const DocumentationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(documentationReducer, initialState);
  const { githubToken } = useAuth();

  // Fetch user repositories
  const fetchRepositories = useCallback(async () => {
    if (!githubToken) return;

    dispatch({ type: DOC_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${githubToken}`
        }
      });

      if (response.ok) {
        const repos = await response.json();
        dispatch({ type: DOC_ACTIONS.SET_REPOSITORIES, payload: repos });
      } else {
        throw new Error('Failed to fetch repositories');
      }
    } catch (error) {
      dispatch({ type: DOC_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: DOC_ACTIONS.SET_LOADING, payload: false });
    }
  }, [githubToken]);

  // Select repository
  const selectRepository = (repo) => {
    dispatch({ type: DOC_ACTIONS.SET_SELECTED_REPO, payload: repo });
  };

  // Select documentation type
  const selectDocumentationType = (docType) => {
    dispatch({ type: DOC_ACTIONS.SET_SELECTED_DOC_TYPE, payload: docType });
  };

  // Generate documentation following Echo pipeline
  const generateDocumentation = useCallback(async () => {
    if (!state.selectedRepo || !state.selectedDocType || !githubToken) {
      dispatch({ type: DOC_ACTIONS.SET_ERROR, payload: 'Please select a repository and documentation type' });
      return;
    }

    dispatch({ type: DOC_ACTIONS.START_GENERATION });

    try {
      // Step 1: Fetch GitHub Repo
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 10, currentStep: 'Fetching repository' }
      });

      const repoResponse = await fetch('/api/documentation/fetch-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${githubToken}`
        },
        body: JSON.stringify({
          repository: state.selectedRepo,
          documentationType: state.selectedDocType
        })
      });

      if (!repoResponse.ok) {
        throw new Error('Failed to fetch repository');
      }

      // Step 2: Clone and analyze structure
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 25, currentStep: 'Analyzing code structure' }
      });

      // Step 3: Fragment files
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 40, currentStep: 'Fragmenting files' }
      });

      // Step 4: Analyze chunks
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 60, currentStep: 'Analyzing chunks' }
      });

      const analysisResponse = await fetch('/api/documentation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repository: state.selectedRepo,
          documentationType: state.selectedDocType
        })
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        dispatch({
          type: DOC_ACTIONS.SET_ANALYSIS_RESULTS,
          payload: analysisData
        });
      }

      // Step 5: Generate documentation
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 80, currentStep: 'Generating documentation' }
      });

      const generateResponse = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repository: state.selectedRepo,
          documentationType: state.selectedDocType,
          analysis: state.analysisResults
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate documentation');
      }

      const documentationData = await generateResponse.json();

      // Step 6: Save documentation
      dispatch({
        type: DOC_ACTIONS.UPDATE_PROGRESS,
        payload: { progress: 95, currentStep: 'Saving documentation' }
      });

      dispatch({
        type: DOC_ACTIONS.GENERATION_SUCCESS,
        payload: documentationData
      });

    } catch (error) {
      dispatch({
        type: DOC_ACTIONS.GENERATION_FAILURE,
        payload: error.message
      });
    }
  }, [state.selectedRepo, state.selectedDocType, githubToken, state.analysisResults]);

  // Download documentation
  const downloadDocumentation = (format = 'markdown') => {
    if (!state.generatedDocumentation) return;

    const content = state.generatedDocumentation.content;
    const filename = `${state.selectedRepo.name}-documentation.${format === 'pdf' ? 'pdf' : 'md'}`;
    
    if (format === 'pdf') {
      // Create PDF download
      fetch('/api/documentation/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, filename })
      })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    } else {
      // Download as markdown
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // Reset generation state
  const resetGeneration = () => {
    dispatch({ type: DOC_ACTIONS.RESET_GENERATION });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: DOC_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    fetchRepositories,
    selectRepository,
    selectDocumentationType,
    generateDocumentation,
    downloadDocumentation,
    resetGeneration,
    clearError
  };

  return (
    <DocumentationContext.Provider value={value}>
      {children}
    </DocumentationContext.Provider>
  );
};

// Custom hook to use documentation context
export const useDocumentation = () => {
  const context = useContext(DocumentationContext);
  if (!context) {
    throw new Error('useDocumentation must be used within a DocumentationProvider');
  }
  return context;
};

export default DocumentationContext;