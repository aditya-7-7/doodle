import { Socket } from 'socket.io';
import { SocketEvents, CreateRoomPayload, JoinRoomPayload, ExtendedSocket } from '../types';
import { roomService, webSocketService, drawService } from '../services';

// simple in memory rate limiter for room creation
const roomCreationAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ROOM_CREATIONS = 5; // max rooms per ip per window

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = roomCreationAttempts.get(ip);

    if (!record || now > record.resetAt) {
        roomCreationAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (record.count >= MAX_ROOM_CREATIONS) {
        return true;
    }

    record.count++;
    return false;
}

export const registerRoomHandlers = (socket: ExtendedSocket): void => {

    socket.on(SocketEvents.ROOM_CREATE, async (payload: CreateRoomPayload) => {
        try {
            const clientIp = socket.handshake.address || 'unknown';
            if (isRateLimited(clientIp)) {
                webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, { message: 'Too many rooms created. Please wait before creating another.' });
                return;
            }

            const { room, member } = await roomService.createRoom(payload);
            socket.sessionId = payload.sessionId;
            socket.roomCode = room.code;
            socket.displayName = payload.displayName;
            socket.join(room.code);
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_CREATED, { room, member, members: [member] });
        } catch (error) {
            console.error('Error creating room:', error);
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, { message: 'Failed to create room' });
        }
    });

    socket.on(SocketEvents.ROOM_JOIN, async (payload: JoinRoomPayload) => {
        try {
            const { room, member, members, error } = await roomService.joinRoom(payload);
            if (error || !room || !member) {
                webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, { message: error || 'Failed to join room' });
                return;
            }

            socket.sessionId = payload.sessionId;
            socket.roomCode = room.code;
            socket.displayName = payload.displayName;
            socket.join(room.code);

            const snapshot = await drawService.getLatestSnapshot(room.code);
            const operations = await drawService.getOperations(room.code, snapshot?.sequenceNumber || 0);

            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_JOINED, { room, member, members, snapshot: snapshot?.imageData || null, operations });
            webSocketService.sendToRoomExcept(socket, room.code, SocketEvents.ROOM_USER_JOINED, { member, members });
        } catch (error) {
            console.error('Error joining room:', error);
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, { message: 'Failed to join room' });
        }
    });

    socket.on('disconnect', async () => {
        if (!socket.roomCode || !socket.sessionId) return;
        await roomService.setMemberOffline(socket.roomCode, socket.sessionId);
        const members = await roomService.getRoomMembers(socket.roomCode);
        webSocketService.sendToRoom(socket.roomCode, SocketEvents.ROOM_USER_LEFT, { sessionId: socket.sessionId, displayName: socket.displayName, members });
    });

    socket.on(SocketEvents.ROOM_KICK, async (payload: { targetSessionId: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const success = await roomService.kickUser(socket.roomCode, socket.sessionId, payload.targetSessionId);
            if (success) webSocketService.sendToRoom(socket.roomCode, SocketEvents.ROOM_KICKED, { targetSessionId: payload.targetSessionId, reason: 'Kicked by admin' });
        } catch (error) { console.error('Error kicking user:', error); }
    });

    socket.on(SocketEvents.ROOM_UPDATE_PRIVACY, async (payload: { isPrivate: boolean; password?: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;
        try {
            const updatedRoom = await roomService.updateRoomPrivacy(socket.roomCode, socket.sessionId, payload.isPrivate, payload.password);
            if (updatedRoom) {
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.ROOM_SETTINGS_UPDATED, { room: updatedRoom });
            } else {
                webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, { message: 'Only admin can change room privacy' });
            }
        } catch (error) { console.error('Error updating privacy:', error); }
    });
};
