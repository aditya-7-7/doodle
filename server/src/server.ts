import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { webSocketService } from './services/WebSocketService';
import { ExtendedSocket } from './types';
import {
    registerRoomHandlers,
    registerDrawHandlers,
    registerCursorHandlers,
    registerHistoryHandlers,
} from './handlers';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function bootstrap() {
    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({
        origin: [CLIENT_URL, 'http://localhost:5173'],
        credentials: true,
    }));
    app.use(express.json());

    // Health check endpoint
    app.get('/', (req, res) => {
        res.json({
            status: 'ok',
            message: 'Collaborative Canvas Server',
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'healthy' });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Connect to MongoDB
    await connectDatabase();

    // Initialize WebSocket server
    const io = webSocketService.init(httpServer);

    // Handle socket connections
    io.on('connection', (socket: ExtendedSocket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Register all handlers
        registerRoomHandlers(socket);
        registerDrawHandlers(socket);
        registerCursorHandlers(socket);
        registerHistoryHandlers(socket);

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    // Start server
    httpServer.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║     🎨 Collaborative Canvas Server                        ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${PORT}              ║
║  🔌 WebSocket ready for connections                       ║
║  📦 MongoDB connected                                      ║
╚═══════════════════════════════════════════════════════════╝
    `);
    });
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
