import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;
    private isConnected = false;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(): Socket {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => this.isConnected = true);
        this.socket.on('disconnect', () => this.isConnected = false);
        this.socket.on('connect_error', () => this.isConnected = false);

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public isSocketConnected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    // Emit event
    public emit(event: SocketEvents | string, data?: any): void {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    // Listen to event
    public on(event: SocketEvents | string, callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove listener
    public off(event: SocketEvents | string, callback?: (data: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    // One-time listener
    public once(event: SocketEvents | string, callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.once(event, callback);
        }
    }
}

export const socketService = SocketService.getInstance();
