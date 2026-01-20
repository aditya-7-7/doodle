import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { webSocketService } from '../services';

// Store cursor positions in memory (no need for DB)
const cursorPositions: Map<string, { x: number; y: number; sessionId: string; displayName: string; color: string }> = new Map();

export const registerCursorHandlers = (socket: ExtendedSocket): void => {

    // Handle cursor move
    socket.on(SocketEvents.CURSOR_MOVE, (payload: { x: number; y: number; color?: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;

        // Update cursor position
        cursorPositions.set(socket.sessionId, {
            x: payload.x,
            y: payload.y,
            sessionId: socket.sessionId,
            displayName: socket.displayName || 'User',
            color: payload.color || '#FF6B6B',
        });

        // Broadcast to others in room (throttled by client)
        webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.CURSOR_UPDATE, {
            sessionId: socket.sessionId,
            displayName: socket.displayName,
            x: payload.x,
            y: payload.y,
            color: payload.color,
        });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        if (socket.sessionId) {
            cursorPositions.delete(socket.sessionId);
        }
    });
};
