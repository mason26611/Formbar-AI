import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    // Only connect if user is authenticated
    if (user) {
      // Create socket connection
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Save socket instance to state
      setSocket(socketInstance);
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]); // Reconnect when user changes

  // Helper function to join a class room
  const joinClassRoom = (classId) => {
    if (socket && connected) {
      socket.emit('joinClassRoom', classId);
      console.log(`Joined class room: ${classId}`);
    }
  };

  // Helper function to leave a class room
  const leaveClassRoom = (classId) => {
    if (socket && connected) {
      socket.emit('leaveClassRoom', classId);
      console.log(`Left class room: ${classId}`);
    }
  };

  // Helper function to subscribe to events
  const subscribe = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  // Value object to be provided by the context
  const value = {
    socket,
    connected,
    joinClassRoom,
    leaveClassRoom,
    subscribe
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 