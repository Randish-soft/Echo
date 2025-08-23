// Export all context providers and hooks
export { AuthProvider, useAuth } from './AuthContext';
export { DocumentationProvider, useDocumentation } from './DocumentationContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { NotificationProvider, useNotification, NOTIFICATION_TYPES } from './NotificationContext';
export { AppProvider, useApp } from './AppContext';

// Combined provider component for easier setup
import React from 'react';
import { AuthProvider } from './AuthContext';
import { DocumentationProvider } from './DocumentationContext';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import { AppProvider } from './AppContext';

export const CombinedProvider = ({ children }) => {
  return (
    <AppProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <DocumentationProvider>
              {children}
            </DocumentationProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AppProvider>
  );
};

// HOC for components that need multiple contexts
export const withContexts = (...contexts) => (WrappedComponent) => {
  return (props) => {
    const contextValues = contexts.map(context => {
      const hook = context.hook;
      if (!hook) {
        throw new Error('Context must have a hook property');
      }
      return hook();
    });

    const combinedProps = {
      ...props,
      ...contextValues.reduce((acc, contextValue, index) => {
        const contextName = contexts[index].name || `context${index}`;
        acc[contextName] = contextValue;
        return acc;
      }, {})
    };

    return <WrappedComponent {...combinedProps} />;
  };
};

// Context hooks configuration for HOC
export const contextConfigs = {
  auth: { hook: useAuth, name: 'auth' },
  documentation: { hook: useDocumentation, name: 'documentation' },
  theme: { hook: useTheme, name: 'theme' },
  notification: { hook: useNotification, name: 'notification' },
  app: { hook: useApp, name: 'app' }
};