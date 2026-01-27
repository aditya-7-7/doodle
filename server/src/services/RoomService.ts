import bcrypt from 'bcrypt';
import { Room, RoomMember, USER_COLORS } from '../models';
import { CreateRoomPayload, JoinRoomPayload, RoomSettings } from '../types';

const SALT_ROUNDS = 10;

class RoomService {
    private static instance: RoomService;

    private constructor() { }

    public static getInstance(): RoomService {
        if (!RoomService.instance) {
            RoomService.instance = new RoomService();
        }
        return RoomService.instance;
    }

    // Generate unique room code
    private generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Get random color not already used in room
    private async getAvailableColor(roomId: string): Promise<string> {
        const members = await RoomMember.find({ roomId });
        const usedColors = members.map(m => m.color);
        const available = USER_COLORS.filter(c => !usedColors.includes(c));

        if (available.length === 0) {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    // Create a new room
    public async createRoom(payload: CreateRoomPayload): Promise<{ room: any; member: any }> {
        // Generate unique code
        let code = this.generateCode();
        let existingRoom = await Room.findOne({ code });
        while (existingRoom) {
            code = this.generateCode();
            existingRoom = await Room.findOne({ code });
        }

        // Hash password if provided, but also store plain for admin display
        const plainPassword = payload.settings?.password || null;
        const hashedPassword = plainPassword
            ? await bcrypt.hash(plainPassword, SALT_ROUNDS)
            : null;

        // Create room
        const room = await Room.create({
            code,
            name: payload.roomName || 'Untitled Canvas',
            creatorSessionId: payload.sessionId,
            settings: {
                isPrivate: payload.settings?.isPrivate || false,
                password: hashedPassword,
                passwordPlain: plainPassword,  // Store plain for admin
                canvasWidth: payload.settings?.canvasWidth || 8000,
                canvasHeight: payload.settings?.canvasHeight || 8000,
                maxUsers: payload.settings?.maxUsers || 10,
            },
        });

        // Add creator as first member (admin)
        const color = USER_COLORS[0];
        const member = await RoomMember.create({
            roomId: room.code,
            sessionId: payload.sessionId,
            displayName: payload.displayName,
            color,
            isAdmin: true,
            isOnline: true,
        });

        return { room: room.toObject(), member: member.toObject() };
    }

    // Join an existing room
    public async joinRoom(payload: JoinRoomPayload): Promise<{ room: any; member: any; members: any[]; error?: string }> {
        const room = await Room.findOne({ code: payload.roomCode });

        if (!room) {
            return { room: null, member: null, members: [], error: 'Room not found' };
        }

        // Check if private room needs password (except for creator and existing members)
        const isCreator = room.creatorSessionId === payload.sessionId;
        const existingMember = await RoomMember.findOne({ roomId: room.code, sessionId: payload.sessionId });

        if (room.settings.isPrivate && room.settings.password) {
            // Allow creator and existing members to rejoin without password
            if (!isCreator && !existingMember) {
                const isValidPassword = payload.password
                    ? await bcrypt.compare(payload.password, room.settings.password)
                    : false;
                if (!isValidPassword) {
                    return { room: null, member: null, members: [], error: 'Invalid password' };
                }
            }
        }

        // Check if user is kicked
        const kickedMember = await RoomMember.findOne({
            roomId: room.code,
            sessionId: payload.sessionId,
            isKicked: true,
        });
        if (kickedMember) {
            // Allow rejoin by resetting kicked status
            kickedMember.isKicked = false;
            kickedMember.displayName = payload.displayName;
            kickedMember.lastSeenAt = new Date();
            await kickedMember.save();

            const members = await RoomMember.find({ roomId: room.code, isKicked: false });
            return { room: room.toObject(), member: kickedMember.toObject(), members: members.map(m => m.toObject()) };
        }

        // Check if already a member
        let member = await RoomMember.findOne({
            roomId: room.code,
            sessionId: payload.sessionId,
        });

        if (member) {
            // Update existing member - mark as online
            member.displayName = payload.displayName;
            member.lastSeenAt = new Date();
            member.isOnline = true;
            await member.save();
        } else {
            // Check max users
            const memberCount = await RoomMember.countDocuments({ roomId: room.code, isKicked: false });
            if (memberCount >= room.settings.maxUsers) {
                return { room: null, member: null, members: [], error: 'Room is full' };
            }

            // Create new member
            const color = await this.getAvailableColor(room.code);
            member = await RoomMember.create({
                roomId: room.code,
                sessionId: payload.sessionId,
                displayName: payload.displayName,
                color,
                isAdmin: false,
                isOnline: true,
            });
        }
        // Return only ONLINE members, sorted by lastSeenAt (newest at end)
        const members = await RoomMember.find({ roomId: room.code, isKicked: false, isOnline: true })
            .sort({ lastSeenAt: 1 });
        return { room: room.toObject(), member: member.toObject(), members: members.map(m => m.toObject()) };
    }

    // Leave room
    public async leaveRoom(roomCode: string, sessionId: string): Promise<void> {
        await RoomMember.deleteOne({ roomId: roomCode, sessionId });

        // Check if room is empty
        const memberCount = await RoomMember.countDocuments({ roomId: roomCode });
        if (memberCount === 0) {
            // Could optionally delete room or keep for persistence
            console.log(`Room ${roomCode} is now empty`);
        }
    }

    // Kick a user (admin only)
    public async kickUser(roomCode: string, adminSessionId: string, targetSessionId: string): Promise<boolean> {
        // Verify admin
        const admin = await RoomMember.findOne({ roomId: roomCode, sessionId: adminSessionId, isAdmin: true });
        if (!admin) {
            return false;
        }

        // Cannot kick yourself
        if (adminSessionId === targetSessionId) {
            return false;
        }

        // Mark user as kicked
        await RoomMember.updateOne(
            { roomId: roomCode, sessionId: targetSessionId },
            { isKicked: true }
        );
        return true;
    }

    // Get room by code
    public async getRoom(roomCode: string): Promise<any> {
        return Room.findOne({ code: roomCode });
    }

    // Get ONLINE room members only, sorted by lastSeenAt (newest at end)
    public async getRoomMembers(roomCode: string): Promise<any[]> {
        const members = await RoomMember.find({ roomId: roomCode, isKicked: false, isOnline: true })
            .sort({ lastSeenAt: 1 });  // Ascending: oldest first, newest/rejoined at end
        return members.map(m => m.toObject());
    }

    // Set member offline when they disconnect
    public async setMemberOffline(roomCode: string, sessionId: string): Promise<void> {
        await RoomMember.updateOne(
            { roomId: roomCode, sessionId: sessionId },
            { isOnline: false, lastSeenAt: new Date() }
        );
    }

    // Update room privacy settings (admin only)
    public async updateRoomPrivacy(roomCode: string, sessionId: string, isPrivate: boolean, password?: string): Promise<any> {
        // Check if user is admin
        const member = await RoomMember.findOne({ roomId: roomCode, sessionId });
        if (!member?.isAdmin) return null;

        const updateData: any = { 'settings.isPrivate': isPrivate };

        if (isPrivate && password) {
            // Hash new password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            updateData['settings.password'] = hashedPassword;
            updateData['settings.passwordPlain'] = password;
        } else if (!isPrivate) {
            // Clear password when making public
            updateData['settings.password'] = null;
            updateData['settings.passwordPlain'] = null;
        }

        const room = await Room.findOneAndUpdate(
            { code: roomCode },
            { $set: updateData },
            { new: true }
        );
        return room?.toObject();
    }
}

export const roomService = RoomService.getInstance();
