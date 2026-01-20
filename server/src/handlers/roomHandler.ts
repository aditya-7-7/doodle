import { Socket } from 'socket.io';
import { SocketEvents, CreateRoomPayload, JoinRoomPayload, ExtendedSocket } from '../types';
import { roomService, webSocketService, drawService } from '../services';

export const registerRoomHandlers = (socket: ExtendedSocket): void => {

    // Create Room
    socket.on(SocketEvents.ROOM_CREATE, async (payload: CreateRoomPayload) => {
        try {
            console.log(`🏠 Creating room for ${payload.displayName}`);

            const { room, member } = await roomService.createRoom(payload);

            // Store session info on socket
            socket.sessionId = payload.sessionId;
            socket.roomCode = room.code;
            socket.displayName = payload.displayName;

            // Join socket to room
            socket.join(room.code);

            // Send response to creator
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_CREATED, {
                room,
                member,
                members: [member],
            });

            console.log(`✅ Room ${room.code} created by ${payload.displayName}`);
        } catch (error) {
            console.error('❌ Error creating room:', error);
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, {
                message: 'Failed to create room',
            });
        }
    });

    // Join Room
    socket.on(SocketEvents.ROOM_JOIN, async (payload: JoinRoomPayload) => {
        try {
            console.log(`🚪 ${payload.displayName} joining room ${payload.roomCode}`);
            console.log(`   📋 Payload: sessionId=${payload.sessionId?.substring(0, 8)}..., password=${payload.password ? 'provided' : 'none'}`);

            const { room, member, members, error } = await roomService.joinRoom(payload);
            console.log(`   📦 joinRoom result: room=${!!room}, member=${!!member}, members=${members?.length}, error=${error || 'none'}`);

            if (error || !room || !member) {
                console.log(`   ❌ Join failed: ${error || 'room/member null'}`);
                webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, {
                    message: error || 'Failed to join room',
                });
                return;
            }

            // Store session info on socket
            socket.sessionId = payload.sessionId;
            socket.roomCode = room.code;
            socket.displayName = payload.displayName;
            console.log(`   ✓ Socket properties set`);

            // Join socket to room
            socket.join(room.code);
            console.log(`📍 Socket ${socket.id} joined room ${room.code}, members: ${members.length}`);

            // Get canvas state for new joiner
            const snapshot = await drawService.getLatestSnapshot(room.code);
            const operations = snapshot
                ? await drawService.getOperations(room.code, snapshot.sequenceNumber)
                : await drawService.getOperations(room.code, 0);
            console.log(`   🎨 Canvas state: snapshot=${!!snapshot}, ops=${operations?.length || 0}`);

            // Send room state to joiner
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_JOINED, {
                room,
                member,
                members,
                snapshot: snapshot?.imageData || null,
                operations,
            });
            console.log(`   📤 Sent ROOM_JOINED to ${socket.id}`);

            // Notify others in room with FULL members list for consistency
            webSocketService.sendToRoomExcept(socket, room.code, SocketEvents.ROOM_USER_JOINED, {
                member,
                members,
            });

            console.log(`✅ ${payload.displayName} joined room ${room.code}`);
        } catch (error) {
            console.error('❌ Error joining room:', error);
            webSocketService.sendToSocket(socket.id, SocketEvents.ROOM_ERROR, {
                message: 'Failed to join room',
            });
        }
    });

    // Leave Room (disconnect)
    socket.on('disconnect', async () => {
        if (socket.roomCode && socket.sessionId) {
            console.log(`👋 ${socket.displayName} disconnecting from ${socket.roomCode}`);

            // Mark this user as offline FIRST
            await roomService.setMemberOffline(socket.roomCode, socket.sessionId);

            // Get remaining online members (this now excludes the user we just set offline)
            const members = await roomService.getRoomMembers(socket.roomCode);

            // Notify others with updated members list
            webSocketService.sendToRoom(socket.roomCode, SocketEvents.ROOM_USER_LEFT, {
                sessionId: socket.sessionId,
                displayName: socket.displayName,
                members,
            });

            console.log(`📤 Sent ROOM_USER_LEFT to ${socket.roomCode}, remaining: ${members.length}`);
        }
    });

    // Kick User
    socket.on(SocketEvents.ROOM_KICK, async (payload: { targetSessionId: string }) => {
        if (!socket.roomCode || !socket.sessionId) return;

        try {
            const success = await roomService.kickUser(
                socket.roomCode,
                socket.sessionId,
                payload.targetSessionId
            );

            if (success) {
                webSocketService.sendToRoom(socket.roomCode, SocketEvents.ROOM_KICKED, {
                    targetSessionId: payload.targetSessionId,
                    reason: 'Kicked by admin',
                });
                console.log(`🔨 User ${payload.targetSessionId} kicked from ${socket.roomCode}`);
            }
        } catch (error) {
            console.error('❌ Error kicking user:', error);
        }
    });
};
