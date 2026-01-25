import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { drawService, webSocketService } from '../services';

export const registerHistoryHandlers = (socket: ExtendedSocket): void => {

    socket.on(SocketEvents.HISTORY_UNDO, async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const undoneOp = await drawService.undo(socket.roomCode);
            if (undoneOp) {
                const operations = await drawService.getOperations(socket.roomCode, 0);
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, { action: 'undo', isPersonal: false, operation: undoneOp, operations, triggeredBy: socket.sessionId });
            }
        } catch (error) { console.error('Error performing global undo:', error); }
    });

    socket.on(SocketEvents.HISTORY_REDO, async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const redoneOp = await drawService.redo(socket.roomCode);
            if (redoneOp) {
                const operations = await drawService.getOperations(socket.roomCode, 0);
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, { action: 'redo', isPersonal: false, operation: redoneOp, operations, triggeredBy: socket.sessionId });
            }
        } catch (error) { console.error('Error performing global redo:', error); }
    });

    socket.on(SocketEvents.HISTORY_UNDO_PERSONAL, async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const undoneOp = await drawService.undoPersonal(socket.roomCode, socket.sessionId);
            if (undoneOp) {
                const operations = await drawService.getOperations(socket.roomCode, 0);
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, { action: 'undo', isPersonal: true, operation: undoneOp, operations, triggeredBy: socket.sessionId });
            }
        } catch (error) { console.error('Error performing personal undo:', error); }
    });

    socket.on(SocketEvents.HISTORY_REDO_PERSONAL, async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const redoneOp = await drawService.redoPersonal(socket.roomCode, socket.sessionId);
            if (redoneOp) {
                const operations = await drawService.getOperations(socket.roomCode, 0);
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.HISTORY_SYNC, { action: 'redo', isPersonal: true, operation: redoneOp, operations, triggeredBy: socket.sessionId });
            }
        } catch (error) { console.error('Error performing personal redo:', error); }
    });
};
