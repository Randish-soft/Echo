import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  notifications: []
};

// Action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    case NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Add notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: generateId(),
      type: NOTIFICATION_TYPES.INFO,
      autoClose: true,
      duration: 5000,
      timestamp: new Date().toISOString(),
      ...notification
    };

    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: newNotification
    });

    // Auto remove notification after duration
    if (newNotification.autoClose && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS
    });
  }, []);

  // Update notification
  const updateNotification = useCallback((id, updates) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION,
      payload: { id, updates }
    });
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: 'Success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: 'Error',
      message,
      autoClose: false, // Errors should be manually dismissed
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Warning',
      message,
      duration: 7000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Info',
      message,
      ...options
    });
  }, [addNotification]);

  // Show loading notification (useful for long operations)
  const showLoading = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Loading',
      message,
      autoClose: false,
      showSpinner: true,
      ...options
    });
  }, [addNotification]);

  const value = {
    ...state,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;