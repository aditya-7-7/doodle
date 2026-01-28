import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { webSocketService } from '../services';

// store cursor positions in memory no need for db
const cursorPositions: Map<string, { x: number; y: number; sessionId: string; displayName: string; color: string }> = new Map();

export const registerCursorHandlers = (socket: ExtendedSocket): void => {

    // handle cursor move
    socket.on(SocketEvents.CURSOR_MOVE, (payload: { x: number; y: number; color?: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;

        // update cursor position
        cursorPositions.set(socket.sessionId, {
            x: payload.x,
            y: payload.y,
            sessionId: socket.sessionId,
            displayName: socket.displayName || 'User',
            color: payload.color || '#FF6B6B',
        });

        // broadcast to others in room throttled by client
        webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.CURSOR_UPDATE, {
            sessionId: socket.sessionId,
            displayName: socket.displayName,
            x: payload.x,
            y: payload.y,
            color: payload.color,
        });
    });

    // clean up on disconnect
    socket.on('disconnect', () => {
        if (socket.sessionId) {
            cursorPositions.delete(socket.sessionId);
        }
    });
};
