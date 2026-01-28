import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './config/database';
import { webSocketService } from './services/WebSocketService';
import { ExtendedSocket } from './types';
import {
    registerRoomHandlers,
    registerDrawHandlers,
    registerCursorHandlers,
    registerHistoryHandlers,
} from './handlers';

// load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each ip to 100 requests per windowms
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

async function bootstrap() {
    // create express app
    const app = express();

    // apply rate limiting to all routes
    app.use(apiLimiter);

    // middleware
    app.use(cors({
        origin: [CLIENT_URL, 'http://localhost:5173'],
        credentials: true,
    }));
    app.use(express.json());

    // health check endpoint
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

    // create http server
    const httpServer = createServer(app);

    // connect to mongodb
    await connectDatabase();

    // initialize websocket server
    const io = webSocketService.init(httpServer);

    // handle socket connections
    io.on('connection', (socket: ExtendedSocket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // register all handlers
        registerRoomHandlers(socket);
        registerDrawHandlers(socket);
        registerCursorHandlers(socket);
        registerHistoryHandlers(socket);

        // ping handler for latency measurement
        socket.on('ping', (data: any, callback: Function) => {
            if (typeof callback === 'function') {
                callback();
            }
        });

        socket.on('disconnect', () => {
            console.log(`⚠️ Client disconnected: ${socket.id}`);
        });
    });

    // start server
    httpServer.listen(PORT, () => {
        console.log(`🌐 Server running on http://localhost:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
