// hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setConnected(true);
        setSocket(ws);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessage(data);
        } catch (error) {
          setMessage({ type: 'raw', data: event.data });
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setSocket(null);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    }
  };

  return {
    connected,
    message,
    sendMessage
  };
};

