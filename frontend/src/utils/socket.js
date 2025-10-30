import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let socketInstance;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_BASE_URL, { withCredentials: true });
  }
  return socketInstance;
}


