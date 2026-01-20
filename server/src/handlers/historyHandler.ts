import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { drawService, webSocketService } from '../services';

export const registerHistoryHandlers = (socket: ExtendedSocket): void => {

    // Handle Undo
    socket.on(SocketEvents.HISTORY_UNDO, async () => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            const undoneOp = await drawService.undo(socket.roomCode);

            if (undoneOp) {
                // Broadcast to all in room (including sender)
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, {
                    action: 'undo',
                    operation: undoneOp,
                    triggeredBy: socket.sessionId,
                });

                console.log(`↩️ Undo in room ${socket.roomCode} by ${socket.displayName}`);
            }
        } catch (error) {
            console.error('❌ Error performing undo:', error);
        }
    });

    // Handle Redo
    socket.on(SocketEvents.HISTORY_REDO, async () => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            const redoneOp = await drawService.redo(socket.roomCode);

            if (redoneOp) {
                // Broadcast to all in room (including sender)
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, {
                    action: 'redo',
                    operation: redoneOp,
                    triggeredBy: socket.sessionId,
                });

                console.log(`↪️ Redo in room ${socket.roomCode} by ${socket.displayName}`);
            }
        } catch (error) {
            console.error('❌ Error performing redo:', error);
        }
    });
};
