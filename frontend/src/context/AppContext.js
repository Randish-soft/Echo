import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  isOnline: true,
  isMobile: false,
  sidebarOpen: false,
  modalStack: [],
  appSettings: {
    autoSave: true,
    showTutorials: true,
    compactMode: false,
    soundEnabled: true,
    language: 'en',
    timezone: 'auto'
  },
  systemInfo: {
    version: '1.0.0',
    buildDate: null,
    environment: 'production'
  },
  featureFlags: {
    betaFeatures: false,
    advancedAnalysis: true,
    exportToPDF: true,
    customTemplates: false,
    realTimeCollaboration: false
  }
};

// Action types
const APP_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_MOBILE_VIEW: 'SET_MOBILE_VIEW',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  PUSH_MODAL: 'PUSH_MODAL',
  POP_MODAL: 'POP_MODAL',
  CLEAR_MODAL_STACK: 'CLEAR_MODAL_STACK',
  UPDATE_APP_SETTINGS: 'UPDATE_APP_SETTINGS',
  SET_SYSTEM_INFO: 'SET_SYSTEM_INFO',
  UPDATE_FEATURE_FLAGS: 'UPDATE_FEATURE_FLAGS'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload
      };
    case APP_ACTIONS.SET_MOBILE_VIEW:
      return {
        ...state,
        isMobile: action.payload
      };
    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    case APP_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload
      };
    case APP_ACTIONS.PUSH_MODAL:
      return {
        ...state,
        modalStack: [...state.modalStack, action.payload]
      };
    case APP_ACTIONS.POP_MODAL:
      return {
        ...state,
        modalStack: state.modalStack.slice(0, -1)
      };
    case APP_ACTIONS.CLEAR_MODAL_STACK:
      return {
        ...state,
        modalStack: []
      };
    case APP_ACTIONS.UPDATE_APP_SETTINGS:
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          ...action.payload
        }
      };
    case APP_ACTIONS.SET_SYSTEM_INFO:
      return {
        ...state,
        systemInfo: {
          ...state.systemInfo,
          ...action.payload
        }
      };
    case APP_ACTIONS.UPDATE_FEATURE_FLAGS:
      return {
        ...state,
        featureFlags: {
          ...state.featureFlags,
          ...action.payload
        }
      };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  useEffect(() => {
    // Load app settings from localStorage
    const savedSettings = localStorage.getItem('echo-app-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({
          type: APP_ACTIONS.UPDATE_APP_SETTINGS,
          payload: settings
        });
      } catch (error) {
        console.warn('Failed to parse saved app settings:', error);
      }
    }

    // Set system info
    dispatch({
      type: APP_ACTIONS.SET_SYSTEM_INFO,
      payload: {
        buildDate: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });

    // Load feature flags
    const loadFeatureFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        if (response.ok) {
          const flags = await response.json();
          dispatch({
            type: APP_ACTIONS.UPDATE_FEATURE_FLAGS,
            payload: flags
          });
        }
      } catch (error) {
        console.warn('Failed to load feature flags:', error);
      }
    };

    loadFeatureFlags();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: APP_ACTIONS.SET_ONLINE_STATUS, payload: true });
    const handleOffline = () => dispatch({ type: APP_ACTIONS.SET_ONLINE_STATUS, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor screen size for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      dispatch({ type: APP_ACTIONS.SET_MOBILE_VIEW, payload: isMobile });
      
      // Auto-close sidebar on mobile
      if (isMobile && state.sidebarOpen) {
        dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: false });
      }
    };

    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [state.sidebarOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event) => {
      // Ctrl/Cmd + K: Toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR });
      }

      // Escape: Close modals
      if (event.key === 'Escape' && state.modalStack.length > 0) {
        event.preventDefault();
        dispatch({ type: APP_ACTIONS.POP_MODAL });
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [state.modalStack.length]);

  // Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR });
  };

  // Set sidebar state
  const setSidebar = (open) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: open });
  };

  // Modal management
  const pushModal = (modalConfig) => {
    dispatch({
      type: APP_ACTIONS.PUSH_MODAL,
      payload: {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...modalConfig
      }
    });
  };

  const popModal = () => {
    dispatch({ type: APP_ACTIONS.POP_MODAL });
  };

  const clearModalStack = () => {
    dispatch({ type: APP_ACTIONS.CLEAR_MODAL_STACK });
  };

  // Update app settings
  const updateAppSettings = (settings) => {
    const newSettings = { ...state.appSettings, ...settings };
    
    dispatch({
      type: APP_ACTIONS.UPDATE_APP_SETTINGS,
      payload: settings
    });

    // Persist to localStorage
    localStorage.setItem('echo-app-settings', JSON.stringify(newSettings));
  };

  // Check if feature is enabled
  const isFeatureEnabled = (featureName) => {
    return state.featureFlags[featureName] || false;
  };

  // Get current modal
  const getCurrentModal = () => {
    return state.modalStack.length > 0 
      ? state.modalStack[state.modalStack.length - 1] 
      : null;
  };

  // Check if app is in compact mode
  const isCompactMode = () => {
    return state.appSettings.compactMode || state.isMobile;
  };

  const value = {
    ...state,
    toggleSidebar,
    setSidebar,
    pushModal,
    popModal,
    clearModalStack,
    updateAppSettings,
    isFeatureEnabled,
    getCurrentModal,
    isCompactMode
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;