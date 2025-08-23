import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Theme definitions
const themes = {
  light: {
    name: 'light',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHover: '#f1f5f9',
      text: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderHover: '#cbd5e1',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#0ea5e9'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      border: '#334155',
      borderHover: '#475569',
      error: '#f87171',
      warning: '#fbbf24',
      success: '#34d399',
      info: '#38bdf8'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)'
    }
  },
  system: {
    name: 'system'
  }
};

// Initial state
const initialState = {
  currentTheme: 'system',
  resolvedTheme: 'light',
  availableThemes: Object.keys(themes),
  theme: themes.light,
  isLoading: true
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_RESOLVED_THEME: 'SET_RESOLVED_THEME',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        currentTheme: action.payload,
        theme: action.payload === 'system' ? 
          themes[state.resolvedTheme] : 
          themes[action.payload]
      };
    case THEME_ACTIONS.SET_RESOLVED_THEME:
      return {
        ...state,
        resolvedTheme: action.payload,
        theme: themes[action.payload]
      };
    case THEME_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Detect system theme preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Update resolved theme
  const updateResolvedTheme = (theme) => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    dispatch({ type: THEME_ACTIONS.SET_RESOLVED_THEME, payload: resolvedTheme });
    
    // Update document class and CSS variables
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolvedTheme);
      
      // Set CSS custom properties for the theme
      const themeColors = themes[resolvedTheme].colors;
      Object.entries(themeColors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--color-${key}`, value);
      });
    }
  };

  // Set theme
  const setTheme = (theme) => {
    if (!themes[theme] && theme !== 'system') {
      console.warn(`Theme "${theme}" not found. Available themes:`, Object.keys(themes));
      return;
    }

    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: theme });
    updateResolvedTheme(theme);
    
    // Persist theme preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('echo-theme', theme);
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    let savedTheme = 'system';
    
    // Get saved theme from localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('echo-theme');
      if (stored && (themes[stored] || stored === 'system')) {
        savedTheme = stored;
      }
    }

    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: savedTheme });
    updateResolvedTheme(savedTheme);
    dispatch({ type: THEME_ACTIONS.SET_LOADING, payload: false });

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (savedTheme === 'system') {
          updateResolvedTheme('system');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = state.resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Get theme-aware styles for components
  const getThemedStyles = (baseStyles = {}) => {
    return {
      ...baseStyles,
      backgroundColor: state.theme.colors.background,
      color: state.theme.colors.text,
      borderColor: state.theme.colors.border
    };
  };

  // Generate CSS variables object for inline styles
  const getCSSVariables = () => {
    const variables = {};
    Object.entries(state.theme.colors).forEach(([key, value]) => {
      variables[`--color-${key}`] = value;
    });
    Object.entries(state.theme.shadows).forEach(([key, value]) => {
      variables[`--shadow-${key}`] = value;
    });
    return variables;
  };

  const value = {
    ...state,
    setTheme,
    toggleTheme,
    getThemedStyles,
    getCSSVariables,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={getCSSVariables()}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;