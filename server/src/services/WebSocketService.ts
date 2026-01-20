import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SocketEvents, ExtendedSocket } from '../types';

class WebSocketService {
    private static instance: WebSocketService;
    private io: Server | null = null;

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public init(server: HttpServer): Server {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        this.io = new Server(server, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: [clientUrl, 'http://localhost:5173'],  // Vite dev server
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        console.log(`✅ WebSocket server initialized (CORS: ${clientUrl})`);
        return this.io;
    }

    public getIO(): Server {
        if (!this.io) {
            throw new Error('WebSocket server not initialized');
        }
        return this.io;
    }

    // Send to specific socket
    public sendToSocket(socketId: string, event: SocketEvents, data: any): void {
        this.io?.to(socketId).emit(event, data);
    }

    // Send to all sockets in a room
    public sendToRoom(roomCode: string, event: SocketEvents, data: any): void {
        this.io?.to(roomCode).emit(event, data);
    }

    // Send to all sockets in room except sender
    public sendToRoomExcept(socket: Socket, roomCode: string, event: SocketEvents, data: any): void {
        socket.to(roomCode).emit(event, data);
    }

    // Broadcast to all connected sockets
    public broadcast(socket: Socket, event: SocketEvents, data: any): void {
        socket.broadcast.emit(event, data);
    }
}

export const webSocketService = WebSocketService.getInstance();
