import { Socket } from 'socket.io';
import { SocketEvents, ExtendedSocket } from '../types';
import { drawService, webSocketService } from '../services';

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

    // Handle stroke drawing - just broadcast, don't save individual segments
    socket.on(SocketEvents.DRAW_STROKE, async (payload: { commands: number[][] }) => {
        if (!socket.roomCode || !socket.sessionId) {
            console.log(`⚠️ DRAW_STROKE ignored - no roomCode or sessionId`);
            return;
        }

        try {
            console.log(`🎨 Broadcasting ${payload.commands?.length || 0} commands to room ${socket.roomCode}`);
            // Only broadcast to others - don't save each segment
            webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_STROKE, {
                sessionId: socket.sessionId,
                commands: payload.commands,
            });
        } catch (error) {
            console.error('❌ Error processing draw:', error);
        }
    });

    // Handle stroke end - save complete stroke as ONE operation
    socket.on('draw:stroke-end', async (payload: { points: number[][], colorIndex: number, width: number, tool: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            if (payload.tool === 'brush' && payload.points.length > 0) {
                // Save entire stroke as ONE operation
                await drawService.saveOperation(socket.roomCode, socket.sessionId, 'stroke', {
                    points: payload.points,
                    colorIndex: payload.colorIndex,
                    width: payload.width,
                });
                console.log(`✏️ Stroke saved with ${payload.points.length} points`);
            } else if (payload.tool === 'eraser' && payload.points.length > 0) {
                // Save erase as ONE operation
                await drawService.saveOperation(socket.roomCode, socket.sessionId, 'erase', {
                    points: payload.points,
                    size: payload.width,
                });
                console.log(`🧽 Erase saved with ${payload.points.length} points`);
            }
        } catch (error) {
            console.error('❌ Error saving stroke:', error);
        }
    });

    // Handle clear canvas
    socket.on(SocketEvents.DRAW_CLEAR, async () => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            await drawService.clearOperations(socket.roomCode, socket.sessionId);

            // Broadcast clear to all in room
            webSocketService.sendToRoom(socket.roomCode, SocketEvents.DRAW_CLEAR, {
                sessionId: socket.sessionId,
            });

            console.log(`🧹 Canvas cleared in room ${socket.roomCode}`);
        } catch (error) {
            console.error('❌ Error clearing canvas:', error);
        }
    });

    // Handle shape drawing
    socket.on(SocketEvents.DRAW_SHAPE, async (payload: any) => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            await drawService.saveOperation(socket.roomCode, socket.sessionId, 'shape', payload);

            webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_SHAPE, {
                sessionId: socket.sessionId,
                ...payload,
            });
        } catch (error) {
            console.error('❌ Error processing shape:', error);
        }
    });

    // Handle text
    socket.on(SocketEvents.DRAW_TEXT, async (payload: any) => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            await drawService.saveOperation(socket.roomCode, socket.sessionId, 'text', payload);

            webSocketService.sendToRoomExcept(socket, socket.roomCode, SocketEvents.DRAW_TEXT, {
                sessionId: socket.sessionId,
                ...payload,
            });
        } catch (error) {
            console.error('❌ Error processing text:', error);
        }
    });

    // Handle canvas snapshot (sent periodically by clients)
    socket.on(SocketEvents.CANVAS_SNAPSHOT, async (payload: { imageData: string }) => {
        if (!socket.roomCode) return;

        try {
            await drawService.saveSnapshot(socket.roomCode, payload.imageData);
            console.log(`📸 Snapshot saved for room ${socket.roomCode}`);
        } catch (error) {
            console.error('❌ Error saving snapshot:', error);
        }
    });
};
