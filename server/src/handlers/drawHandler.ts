import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { drawService, webSocketService } from '../services';

// Helper to request snapshot from one client in the room when needed
const requestSnapshotIfNeeded = (socket: ExtendedSocket, needsSnapshot: boolean) => {
    if (needsSnapshot && socket.roomCode) {
        // Send request to the socket that triggered the operation
        webSocketService.sendToSocket(socket.id, SocketEvents.CANVAS_SNAPSHOT_REQUEST, {});
    }
};

export const registerDrawHandlers = (socket: ExtendedSocket): void => {

    // Handle cursor movement - relay to others
    socket.on(SocketEvents.CURSOR_MOVE, (payload: { x: number, y: number, color: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;

        webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.CURSOR_UPDATE, {
            sessionId: socket.sessionId,
            displayName: socket.displayName,
            x: payload.x,
            y: payload.y,
            color: payload.color,
        });
    });

    socket.on(SocketEvents.DRAW_STROKE, async (payload: { commands: number[][] }) => {
        if (!socket.roomCode || !socket.sessionId) return;
        webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_STROKE, { sessionId: socket.sessionId, commands: payload.commands });
    });

    socket.on('draw:stroke-end', async (payload: { points: number[][], colorIndex: number, width: number, tool: string }) => {
        if (!socket.roomCode || !socket.sessionId || payload.points.length === 0) return;
        try {
            const type = payload.tool === 'brush' ? 'stroke' : payload.tool === 'eraser' ? 'erase' : null;
            if (!type) return;
            const data = type === 'stroke' ? { points: payload.points, colorIndex: payload.colorIndex, width: payload.width } : { points: payload.points, size: payload.width * 3 };
            const { needsSnapshot } = await drawService.saveOperation(socket.roomCode, socket.sessionId, type, data);
            requestSnapshotIfNeeded(socket, needsSnapshot);
        } catch (error) { console.error('Error saving stroke:', error); }
    });

    socket.on(SocketEvents.DRAW_CLEAR, async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            await drawService.clearOperations(socket.roomCode, socket.sessionId);
            webSocketService.sendToRoom(socket.roomCode, SocketEvents.DRAW_CLEAR, { sessionId: socket.sessionId });
        } catch (error) { console.error('Error clearing canvas:', error); }
    });

    socket.on(SocketEvents.DRAW_SHAPE, async (payload: any) => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const { needsSnapshot } = await drawService.saveOperation(socket.roomCode, socket.sessionId, 'shape', payload);
            webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_SHAPE, { sessionId: socket.sessionId, ...payload });
            requestSnapshotIfNeeded(socket, needsSnapshot);
        } catch (error) { console.error('Error processing shape:', error); }
    });

    socket.on(SocketEvents.DRAW_TEXT, async (payload: any) => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const { needsSnapshot } = await drawService.saveOperation(socket.roomCode, socket.sessionId, 'text', payload);
            webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_TEXT, { sessionId: socket.sessionId, ...payload });
            requestSnapshotIfNeeded(socket, needsSnapshot);
        } catch (error) { console.error('Error processing text:', error); }
    });

    socket.on(SocketEvents.CANVAS_SNAPSHOT, async (payload: { imageData: string }) => {
        if (!socket.roomCode) return;
        try { await drawService.saveSnapshot(socket.roomCode, payload.imageData); }
        catch (error) { console.error('Error saving snapshot:', error); }
    });
};
