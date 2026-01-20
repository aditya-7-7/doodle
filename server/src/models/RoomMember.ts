import mongoose, { Schema, Document } from 'mongoose';
import { RoomMember as IRoomMember } from '../types';

export interface RoomMemberDocument extends Omit<IRoomMember, '_id'>, Document { }

// Predefined colors for users
const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FFD700',
];

const RoomMemberSchema = new Schema<RoomMemberDocument>({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        default: null  // For future OAuth
    },
    displayName: {
        type: String,
        required: true,
        maxlength: 50
    },
    color: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastSeenAt: {
        type: Date,
        default: Date.now
    },
    isKicked: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
});

// Compound index for unique member per room
RoomMemberSchema.index({ roomId: 1, sessionId: 1 }, { unique: true });

// Static method to get random color
RoomMemberSchema.statics.getRandomColor = function (existingColors: string[]): string {
    const availableColors = USER_COLORS.filter(c => !existingColors.includes(c));
    if (availableColors.length === 0) {
        // If all colors used, generate random
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    return availableColors[Math.floor(Math.random() * availableColors.length)];
};

export const RoomMember = mongoose.model<RoomMemberDocument>('RoomMember', RoomMemberSchema);
export { USER_COLORS };
