import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

class NotificationService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  constructor() {
    this.socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
    });

    this.socket.on('emergency_assigned', (data) => {
      toast.success(`New emergency case assigned: ${data.description}`);
    });

    this.socket.on('status_update', (data) => {
      toast.info(`Status update: ${data.message}`);
    });

    this.socket.on('resource_update', (data) => {
      toast.info(`Resource update: ${data.message}`);
    });

    this.socket.on('medical_record_update', (data) => {
      toast.success(`Medical record updated: ${data.type}`);
    });
  }

  connect(userId: string) {
    this.userId = userId;
    if (this.socket) {
      this.socket.auth = { userId };
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  subscribeToEmergencies(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('emergency_update', callback);
    }
  }

  unsubscribeFromEmergencies(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('emergency_update', callback);
    }
  }

  async sendNotification(type: string, data: any) {
    if (!this.socket) return;

    this.socket.emit('notification', {
      type,
      data,
      userId: this.userId,
    });
  }
}

export const notificationService = new NotificationService();