import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

export const connectSocket = (userId: string) => {
  socket.auth = { userId };
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const subscribeToEvents = (eventName: string, callback: (data: any) => void) => {
  socket.on(eventName, callback);
};

export const unsubscribeFromEvents = (eventName: string, callback: (data: any) => void) => {
  socket.off(eventName, callback);
};